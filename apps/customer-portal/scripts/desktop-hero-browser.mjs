import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const liquid=new Liquid();
const locale=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
liquid.registerFilter('t',key=>key.split('.').reduce((v,k)=>v?.[k],locale)||key);
liquid.registerFilter('asset_url',key=>'/assets/'+key);
liquid.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);
liquid.registerFilter('image_url',()=>'/custom.svg');
const current=await fs.readFile(path.join(root,'sections/hero.liquid'),'utf8');
const baseline=execFileSync('git',['show','44ed008:sections/hero.liquid'],{cwd:root,encoding:'utf8'});
const render=source=>liquid.parseAndRender(source.replace(/{% schema %}[\s\S]*?{% endschema %}/g,''),{section:{settings:{}},routes:{all_products_collection_url:'/collections/all'},shop:{name:'iSelectStore'}});
const pages={current:await render(current),baseline:await render(baseline)};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
await fs.mkdir(path.join(root,'artifacts/desktop-hero'),{recursive:true});
try{
 for(const width of [320,390,768,980,981,1024,1440,1766,1920]){
  const page=await browser.newPage({viewport:{width,height:960}});
  const requests=[]; const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://hero.example.invalid/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/assets/')){
    if(url.pathname.endsWith('hero-iphone-desktop.webp'))requests.push(url.pathname);
    const ext=path.extname(url.pathname);
    return route.fulfill({body:await fs.readFile(path.join(root,url.pathname.slice(1))),contentType:({'.css':'text/css','.woff2':'font/woff2','.webp':'image/webp'})[ext]||'application/octet-stream'});
   }
   return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"></head><body>${pages[url.pathname.slice(1)]||pages.current}</body></html>`});
  });
  const dimensions=()=>page.evaluate(()=>Object.fromEntries(['.hero','.hero h1','.hero .lead','.hero .ctas','.hero .rating'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height].map(Math.round)];})));
  await page.goto('https://hero.example.invalid/current'); await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+width);
  assert.equal(await page.locator('.hero .primary').evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');
  const currentGeometry=await dimensions();
  await fs.writeFile(path.join(root,`artifacts/desktop-hero/${width}.json`),JSON.stringify(currentGeometry));
  if(width<=980){
   assert.equal(await page.locator('.heroDesktopMedia').isVisible(),false);
   assert.equal(requests.length,0,'Desktop visual must not download on mobile');
   await page.goto('https://hero.example.invalid/baseline');await page.evaluate(()=>document.fonts.ready);
   assert.deepEqual(await dimensions(),currentGeometry,'Existing mobile layout '+width);
  }else{
   await page.waitForFunction(()=>document.querySelector('.heroDesktopMedia img').naturalWidth>1);
   const copy=await page.locator('.heroCopy').boundingBox(),media=await page.locator('.heroDesktopMedia').boundingBox();
   assert.ok(copy.x+copy.width<=media.x,'Separate desktop columns '+width);
   assert.ok(requests.length>0);
   await page.screenshot({path:path.join(root,`artifacts/desktop-hero/${width}.png`)});
  }
  assert.deepEqual(errors,[]); await page.close();
 }
 console.log('PASS: desktop hero 981–1920px; mobile 320–980px matches previous layout and does not fetch desktop image; white CTA text; no overflow/JS errors.');
}finally{await browser.close();}

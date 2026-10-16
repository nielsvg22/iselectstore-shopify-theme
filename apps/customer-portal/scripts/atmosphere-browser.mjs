import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
import {chromium} from 'playwright';
import {configureThemeLiquid} from './theme-liquid-fixture.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const engine=new Liquid({root:path.join(root,'snippets'),extname:'.liquid'});configureThemeLiquid(engine);
const lang=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
engine.registerFilter('t',key=>key.split('.').reduce((v,k)=>v?.[k],lang)||key);
engine.registerFilter('asset_url',key=>'/assets/'+key);
engine.registerFilter('image_url',img=>'/photo/'+img.name);
const image=name=>({name,alt:'',width:1000,height:1000});
const images={
 'iselectstore-unboxing-navy.jpg':image('iselectstore-unboxing-navy.jpg'),
 'IMG_9281-scaled_05a5f166-f8a5-474a-9af6-a1631fe05699.jpg':image('IMG_9281-scaled_05a5f166-f8a5-474a-9af6-a1631fe05699.jpg')};
const context={images,pages:{'over-ons':{url:'/pages/over-ons'}},section:{settings:{device_image:image('device.jpg'),battery_image:image('battery.jpg')},blocks:[]}};
const clean=s=>s.replace(/{% schema %}[\s\S]*?{% endschema %}/g,'');
let now='',old='';
for(const name of ['home-proof','home-story-cta']){
 now+=await engine.parseAndRender(clean(await fs.readFile(path.join(root,`sections/${name}.liquid`),'utf8')),context);
 old+=await engine.parseAndRender(clean(execFileSync('git',['show',`960cd63:sections/${name}.liquid`],{cwd:root,encoding:'utf8'})),context);
}
const card='<a class="card" href="#"><h3>Testkaart</h3></a>';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
await fs.mkdir(path.join(root,'artifacts/atmosphere'),{recursive:true});
try{
 for(const width of [320,390,768,980,1024,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:1000}});const requests=[];const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://atmosphere.example.invalid/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/assets/'))return route.fulfill({body:await fs.readFile(path.join(root,url.pathname.slice(1))),contentType:url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.woff2')?'font/woff2':'image/svg+xml'});
   if(url.pathname.startsWith('/photo/')){
    const name=path.basename(url.pathname);requests.push(name);
    try{return await route.fulfill({body:await fs.readFile(path.join(root,'artifacts/atmosphere',name)),contentType:'image/jpeg'});}catch{}
    return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#e4ecf4"/></svg>'});
   }
   return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"><link rel="stylesheet" href="/assets/desktop-atmosphere.css"></head><body data-store-page="index"><main>${url.pathname==='/old'?old:now}${card}</main><script>document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'))</script></body></html>`});
  });
  const geometry=()=>page.evaluate(()=>Object.fromEntries(['.proofSection','.proofBody','.stHomeCtaSection','.stHomeCta h2','.stHomeCta .sub','.stHomeCtaBtn'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height].map(Math.round)];})));
  await page.goto('https://atmosphere.example.invalid/current');await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(600);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow '+width);
  assert.equal(await page.locator('.stHomeCtaBtn').getAttribute('href'),'/pages/over-ons');
  assert.equal(await page.locator('.stHomeCtaBtn').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  const currentGeometry=await geometry();
  if(width<=980){
   assert.equal(await page.locator('.proofWorkshot').isVisible(),false);assert.equal(await page.locator('.stHomeStoryMedia').isVisible(),false);
   assert.ok(!requests.includes('iselectstore-unboxing-navy.jpg')&&!requests.some(n=>n.startsWith('IMG_9281')),'No desktop photos on mobile');
   await page.goto('https://atmosphere.example.invalid/old');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
   assert.deepEqual(await geometry(),currentGeometry,'Existing mobile geometry '+width);
  }else{
   for(const sel of ['.proofWorkshot img','.stHomeStoryMedia img']){await page.locator(sel).scrollIntoViewIfNeeded();await page.waitForFunction(s=>document.querySelector(s).naturalWidth>1,sel);}
   const photo=await page.locator('.stHomeStoryMedia').boundingBox(),copy=await page.locator('.stHomeStoryCopy').boundingBox();
   assert.ok(photo.x+photo.width<=copy.x+1,'Photo left / story right');
   assert.ok(photo.height<750,'No intrinsic image height expansion');
   await page.locator('.card').hover();await page.waitForTimeout(300);
   assert.equal(await page.locator('.card').evaluate(el=>getComputedStyle(el).transform),'matrix(1, 0, 0, 1, 0, -3)');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);
   assert.equal(await page.locator('.card').evaluate(el=>getComputedStyle(el).transform),'none');
   await page.locator('.reveal').first().evaluate(el=>el.classList.remove('in'));
   assert.equal(await page.locator('.reveal').first().evaluate(el=>getComputedStyle(el).opacity),'1');
   if(width===1440){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(root,'artifacts/atmosphere/desktop-1440.png'),fullPage:true});}
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: 320–1920px; unchanged mobile geometry; no mobile desktop-image requests; story link; photo grid; white CTA; hover and reduced motion.');
}finally{await browser.close();}

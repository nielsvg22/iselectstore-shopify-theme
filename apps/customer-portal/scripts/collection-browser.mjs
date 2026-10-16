// Local fixtures only: exercise the actual Liquid, Shopify GET forms, CSS and JS.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const temp=await fs.mkdtemp('/tmp/iselect-collection-test-');
const prepare=s=>s.replace(/{% schema %}[\s\S]*?{% endschema %}/g,'').replace(/{% paginate [^%]+%}/g,'{% if true %}').replace(/{% endpaginate %}/g,'{% endif %}')
 .replace(/{% form [^%]+%}/g,'<form action="/contact" method="post">').replace(/{% endform %}/g,'</form>');
for(const name of await fs.readdir(path.join(root,'snippets')))if(name.endsWith('.liquid'))await fs.writeFile(path.join(temp,name),prepare(await fs.readFile(path.join(root,'snippets',name),'utf8')));
const engine=new Liquid({root:temp,extname:'.liquid'});
const translations=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
engine.registerFilter('t',key=>key.split('.').reduce((a,k)=>a?.[k],translations)||key);
engine.registerFilter('asset_url',name=>'/assets/'+name);engine.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);
engine.registerFilter('image_url',()=>'/test-product.svg');
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n)/100);
engine.registerFilter('money',money);
const routes={root_url:'/',search_url:'/search',cart_url:'/cart',account_url:'/account',storefront_login_url:'/customer_authentication/login',all_products_collection_url:'/collections/all'};
const pool=Array.from({length:28},(_,i)=>({id:i+1,title:i===1?'iPhone 16 Pro Max 512 GB titanium — een uitzonderlijk lange individuele productnaam':'iPhone 16 Pro '+(i+1),type:'iPhone',url:'/products/individual-'+(i+1),price:40000+i*1500,compare_at_price:i===0?50000:0,available:i!==3,featured_image:{alt:'Echte afbeeldingsverhouding test'},options_with_values:[{name:'Kleur',values:[i%2?'Wit':'Zwart']}],metafields:{custom:i===5?{}:{storage_gb:{value:256},condition:'Zo goed als nieuw',battery_percentage:95}}}));
const sectionSource=prepare(await fs.readFile(path.join(root,'sections/main-collection.liquid'),'utf8'));
const errors=[];
function urlWith(url,mutate){const next=new URL(url);next.searchParams.delete('page');mutate(next.searchParams);return next.pathname+next.search;}
async function render(url){
 const p=url.searchParams;const active=p.get('filter.p.m.custom.condition')==='Zo goed als nieuw';const min=p.get('filter.v.price.gte'),max=p.get('filter.v.price.lte');
 let matches=pool.filter(n=>(!active||n.metafields.custom.condition==='Zo goed als nieuw')&&(!min||n.price>=Number(min)*100)&&(!max||n.price<=Number(max)*100));
 if(p.get('sort_by')==='price-descending')matches.sort((a,b)=>b.price-a.price);
 if(p.get('sort_by')==='price-ascending')matches.sort((a,b)=>a.price-b.price);
 if(p.has('limit'))matches=matches.slice(0,Number(p.get('limit')));
 const page=Number(p.get('page')||1),pages=Math.ceil(matches.length/24);
 const value={label:'Zo goed als nieuw',value:'Zo goed als nieuw',param_name:'filter.p.m.custom.condition',count:27,active,url_to_remove:urlWith(url,s=>s.delete('filter.p.m.custom.condition'))};
 const filters=[{label:'Conditie',type:'list',values:[value,{label:'Niet beschikbaar',value:'None',param_name:value.param_name,count:0}],active_values:active?[value]:[]},{label:'Prijs',type:'price_range',min_value:{param_name:'filter.v.price.gte',value:min?Number(min)*100:null},max_value:{param_name:'filter.v.price.lte',value:max?Number(max)*100:null},range_max:100000,url_to_remove:urlWith(url,s=>{s.delete('filter.v.price.gte');s.delete('filter.v.price.lte');})}];
 const collection={title:'Alle iPhones',description:'<p>Elk toestel heeft een eigen productpagina, prijs en voorraad.</p>',url:'/collections/all',products:matches.slice((page-1)*24,page*24),products_count:matches.length,all_products_count:pool.length,filters:p.has('no_filters')?[]:filters,sort_by:p.get('sort_by')||'manual',default_sort_by:'manual',sort_options:[{name:'Aanbevolen',value:'manual'},{name:'Prijs laag naar hoog',value:'price-ascending'},{name:'Prijs hoog naar laag',value:'price-descending'}]};
 const context={collection,routes,section:{id:'collection-main',settings:{trade_enabled:p.get('banner')!=='off',trade_url:p.get('destination')?'/pages/existing-trade':null}},cart:{item_count:0,currency:{iso_code:'EUR'}},shop:{name:'iSelectStore',url:'https://collection.test',currency:'EUR'},settings:{},pages:{contact:{url:'/pages/contact'}},paginate:{pages,current_page:page,current_offset:(page-1)*24,parts:Array.from({length:pages},(_,i)=>({title:String(i+1),is_link:i+1!==page,url:urlWith(url,s=>s.set('page',i+1))})),next:page<pages?{url:urlWith(url,s=>s.set('page',page+1))}:null}};
 const section=await engine.parseAndRender(sectionSource,context);
 const header=await engine.parseAndRender(prepare(await fs.readFile(path.join(root,'sections/header.liquid'),'utf8')),context);
 return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"><style>.reveal{opacity:1!important;transform:none!important;transition:none!important}</style></head><body>'+header+section+'<script src="/assets/theme.js" defer></script></body></html>';
}
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
await fs.mkdir(path.join(root,'artifacts/collection-preview'),{recursive:true});
async function fixture(page){page.on('pageerror',e=>errors.push(e.message));await page.route('https://collection.test/**',async r=>{const url=new URL(r.request().url());if(url.pathname.startsWith('/assets/')){const name=url.pathname.slice(1);return r.fulfill({body:await fs.readFile(path.join(root,name)),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.woff2')?'font/woff2':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webp')?'image/webp':'text/css'});}if(url.pathname==='/test-product.svg')return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="900"><rect width="500" height="900" fill="#f7f7f7"/><rect x="100" y="50" width="300" height="800" rx="55" fill="#1f3049"/><rect x="120" y="70" width="260" height="760" rx="35" fill="#e4ecf4"/></svg>'});return r.fulfill({contentType:'text/html; charset=utf-8',body:await render(url)});});}
try{
 const page=await b.newPage({viewport:{width:1920,height:1300}});await fixture(page);
 await page.goto('https://collection.test/collections/all');await page.evaluate(()=>document.fonts.ready);
 for(const [width,columns] of [[1920,3],[1536,3],[1440,3],[1280,3],[1024,2],[768,2],[390,2]]){
  await page.setViewportSize({width,height:1300});await page.waitForTimeout(150);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow ${width}`);
  const cards=page.locator('.collectionCard');assert.equal(await cards.count(),24);
  assert.equal(await page.locator('.collectionTrade').count(),1);
  const positions=await cards.evaluateAll(ns=>ns.map(n=>({top:n.offsetTop,left:n.offsetLeft,width:n.clientWidth})));
  assert.equal(positions.filter(n=>n.top===positions[0].top).length,columns);
  const banner=page.locator('.collectionTrade');
  if(width>900){
   assert.ok(await banner.isVisible());assert.ok((await cards.first().boundingBox()).height<=540,'Desktop cards stay compact');assert.ok((await page.locator('.collectionHero').boundingBox()).height<=230,'Collection intro stays compact');const box=await banner.boundingBox(),grid=await page.locator('.collectionGrid').boundingBox(),last=await cards.nth(columns-1).boundingBox();
   assert.ok(Math.abs(box.width-grid.width)<2);assert.ok(box.y>=last.y+last.height);assert.ok((await cards.nth(columns).boundingBox()).y>=box.y+box.height);
   assert.ok(await banner.evaluate(n=>n.previousElementSibling.matches('.collectionCard')&&[...n.parentNode.children].filter(el=>el.classList.contains('collectionCard')).indexOf(n.previousElementSibling)===Number(getComputedStyle(n.parentNode).gridTemplateColumns.split(' ').length)-1));
   assert.equal(await cards.first().locator('img').evaluate(n=>getComputedStyle(n).objectFit),'contain');
   assert.ok((await cards.nth(3).locator('.collectionStock').innerText()).includes('Uitverkocht'));
   assert.ok((await cards.nth(3).locator('.price').innerText()).includes('445'));
   assert.equal(await cards.nth(3).locator('.old').count(),0);
  }else{assert.equal(await banner.isVisible(),false);assert.equal(await page.locator('.collectionStock').first().isVisible(),false);}
  await page.screenshot({path:path.join(root,`artifacts/collection-preview/collection-${width}.png`)});
  console.log(`${width}px: ${columns} columns, banner placement/DOM order, no overflow, product data intact`);
 }
 await page.locator('#filterToggle').click();assert.equal(await page.locator('#filterToggle').getAttribute('aria-expanded'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'filterClose');await page.keyboard.press('Escape');assert.equal(await page.locator('#filterToggle').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.id),'filterToggle');
 await page.setViewportSize({width:1440,height:1300});
 await page.goto('https://collection.test/collections/all?filter.p.m.custom.condition=Zo+goed+als+nieuw&filter.v.price.gte=425&filter.v.price.lte=700&sort_by=price-ascending');
 assert.equal(await page.locator('input[name="filter.v.price.gte"]').first().inputValue(),'425');
 assert.equal(await page.locator('.activeFilters .filterChip').count(),2);
 await page.locator('#CollectionSort').selectOption('price-descending');await page.waitForURL('**sort_by=price-descending');
 assert.equal(new URL(page.url()).searchParams.get('filter.v.price.gte'),'425');assert.equal(new URL(page.url()).searchParams.get('filter.p.m.custom.condition'),'Zo goed als nieuw');
 assert.equal(await page.locator('.collectionCard').first().locator('h3 a').getAttribute('href'),'/products/individual-21');
 await page.locator('input[type="checkbox"]:not(:disabled)').uncheck();await page.locator('input[name="filter.v.price.gte"]').first().fill('500');await page.locator('.collectionApply').click();await page.waitForURL(u=>u.searchParams.get('filter.v.price.gte')==='500');assert.equal(new URL(page.url()).searchParams.get('sort_by'),'price-descending');assert.equal(new URL(page.url()).searchParams.has('filter.p.m.custom.condition'),false);
 console.log('Native GET forms: price conversion, list filters, sort preservation and active removal links passed');
 await page.goto('https://collection.test/collections/all');await page.locator('.collectionTrade .js-tradein-trigger').click();assert.ok(await page.locator('#tiOverlay').evaluate(n=>n.classList.contains('open')));await page.locator('#tiClose').click();
 await page.locator('.collectionPagination a[aria-label="Volgende pagina"]').click();await page.waitForURL('**page=2');assert.equal(await page.locator('.collectionCard').count(),4);assert.equal(await page.locator('.collectionCard').first().locator('h3 a').getAttribute('href'),'/products/individual-25');
 assert.equal(await page.locator('.collectionPagination [aria-current=page]').innerText(),'2');
 const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').last().textContent());assert.equal(schema.itemListElement.length,4);assert.equal(schema.itemListElement[0].position,25);assert.ok(!schema.itemListElement.some(n=>n.url.includes('trade')));
 for(const count of [0,1,2,3,4]){await page.goto('https://collection.test/collections/all?limit='+count);assert.equal(await page.locator('.collectionCard').count(),count);if(count<3)assert.equal(await page.locator('.collectionTrade:visible').count(),0);else assert.equal(await page.locator('.collectionTrade:visible').count(),1);}
 await page.goto('https://collection.test/collections/all?banner=off');assert.equal(await page.locator('.collectionTrade').count(),0);
 await page.goto('https://collection.test/collections/all?destination=1');assert.equal(await page.locator('.collectionTrade .primary').getAttribute('href'),'/pages/existing-trade');
 await page.goto('https://collection.test/collections/all?no_filters=1');assert.ok(await page.locator('.collectionFilterEmpty').isVisible());
 console.log('Pagination, real existing estimator trigger, configurable destination/off, short/empty collections and no filters passed');
 const nojs=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await fixture(nojs);await nojs.goto('https://collection.test/collections/all');assert.ok(await nojs.locator('.collectionApply').isVisible());assert.ok(await nojs.locator('.collectionSortSubmit').isVisible());await nojs.close();
 assert.deepEqual(errors,[]);console.log('No JavaScript errors; filter and sort forms remain usable without JavaScript');
 await page.close();
}finally{await b.close();await fs.rm(temp,{recursive:true,force:true});}

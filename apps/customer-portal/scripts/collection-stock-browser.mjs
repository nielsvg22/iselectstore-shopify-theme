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
const pool=Array.from({length:90},(_,i)=>({id:i+1,title:i===1?'iPhone 16 Pro Max 512 GB titanium — een uitzonderlijk lange individuele productnaam':'iPhone 16 Pro '+(i+1),type:'iPhone',url:'/products/individual-'+(i+1),price:40000+i*1500,compare_at_price:i===0?50000:0,available:i>=37,created_at:new Date(Date.UTC(2026,0,90-i)).toISOString(),featured_image:{alt:'Echte afbeeldingsverhouding test'},options_with_values:[{name:'Kleur',values:[i%2?'Wit':'Zwart']}],metafields:{custom:i===5?{}:{storage_gb:{value:256},condition:'Zo goed als nieuw',battery_percentage:95}}}));
const sectionSource=prepare(await fs.readFile(path.join(root,'sections/main-collection.liquid'),'utf8'));
const errors=[];
function urlWith(url,mutate){const next=new URL(url);next.searchParams.delete('page');mutate(next.searchParams);return next.pathname+next.search;}
async function render(url){
 const p=url.searchParams;const active=p.get('filter.p.m.custom.condition')==='Zo goed als nieuw';const min=p.get('filter.v.price.gte'),max=p.get('filter.v.price.lte');
 let matches=pool.filter(n=>(!active||n.metafields.custom.condition==='Zo goed als nieuw')&&(!min||n.price>=Number(min)*100)&&(!max||n.price<=Number(max)*100));
 if(p.has('stock'))matches=matches.map(n=>({...n,available:p.get('stock')==='all'||(p.get('stock')==='one'&&n.id===1)}));
 if(p.has('limit'))matches=matches.slice(0,Number(p.get('limit')));
 if(p.has('filter.v.availability')){const chosen=p.getAll('filter.v.availability').flatMap(x=>x.split(','));matches=matches.filter(n=>chosen.includes(n.available?'1':'0'));}
 if(p.get('sort_by')==='created-descending')matches.sort((a,b)=>b.created_at.localeCompare(a.created_at));
 if(p.get('sort_by')==='price-descending')matches.sort((a,b)=>b.price-a.price);
 if(p.get('sort_by')==='price-ascending')matches.sort((a,b)=>a.price-b.price);
 const page=Number(p.get('page')||1),pages=Math.ceil(matches.length/24);
 const value={label:'Zo goed als nieuw',value:'Zo goed als nieuw',param_name:'filter.p.m.custom.condition',count:27,active,url_to_remove:urlWith(url,s=>s.delete('filter.p.m.custom.condition'))};
 const filters=[{label:'Conditie',type:'list',values:[value,{label:'Niet beschikbaar',value:'None',param_name:value.param_name,count:0}],active_values:active?[value]:[]},{label:'Prijs',type:'price_range',min_value:{param_name:'filter.v.price.gte',value:min?Number(min)*100:null},max_value:{param_name:'filter.v.price.lte',value:max?Number(max)*100:null},range_max:100000,url_to_remove:urlWith(url,s=>{s.delete('filter.v.price.gte');s.delete('filter.v.price.lte');})}];
 const collection={title:'Alle iPhones',description:'<p>Elk toestel heeft een eigen productpagina, prijs en voorraad.</p>',url:'/collections/all',products:matches.slice((page-1)*24,page*24),products_count:matches.length,all_products_count:pool.length,filters:p.has('no_filters')?[]:filters,sort_by:p.get('sort_by'),default_sort_by:'manual',sort_options:[{name:'Nieuwste',value:'created-descending'},{name:'Aanbevolen',value:'manual'},{name:'Prijs laag naar hoog',value:'price-ascending'},{name:'Prijs hoog naar laag',value:'price-descending'}]};
 const context={collection,routes,section:{id:'collection-main',settings:{trade_enabled:p.get('banner')!=='off',trade_url:p.get('destination')?'/pages/existing-trade':null}},cart:{item_count:0,currency:{iso_code:'EUR'}},shop:{name:'iSelectStore',url:'https://collection.test',currency:'EUR'},settings:{},pages:{contact:{url:'/pages/contact'}},paginate:{pages,current_page:page,current_offset:(page-1)*24,parts:Array.from({length:pages},(_,i)=>({title:String(i+1),is_link:i+1!==page,url:urlWith(url,s=>s.set('page',i+1))})),next:page<pages?{url:urlWith(url,s=>s.set('page',page+1))}:null}};
 const section=await engine.parseAndRender(sectionSource,context);
 const header=await engine.parseAndRender(prepare(await fs.readFile(path.join(root,'sections/header.liquid'),'utf8')),context);
 return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"><style>.reveal{opacity:1!important;transform:none!important;transition:none!important}</style></head><body>'+header+section+'<script src="/assets/theme.js" defer></script></body></html>';
}
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
await fs.mkdir(path.join(root,'artifacts/collection-preview'),{recursive:true});
async function fixture(page){page.on('pageerror',e=>errors.push(e.message));await page.route('https://collection.test/**',async r=>{const url=new URL(r.request().url());if(url.searchParams.has('section_id')&&url.searchParams.has('fail'))return r.fulfill({status:500,body:'failed'});if(url.searchParams.has('section_id')&&url.searchParams.has('ignore_filter'))url.searchParams.delete('filter.v.availability');if(url.pathname.startsWith('/assets/')){const name=url.pathname.slice(1);return r.fulfill({body:await fs.readFile(path.join(root,name)),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.woff2')?'font/woff2':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webp')?'image/webp':'text/css'});}if(url.pathname==='/test-product.svg')return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="900"><rect width="500" height="900" fill="#f7f7f7"/><rect x="100" y="50" width="300" height="800" rx="55" fill="#1f3049"/><rect x="120" y="70" width="260" height="760" rx="35" fill="#e4ecf4"/></svg>'});return r.fulfill({contentType:'text/html; charset=utf-8',body:await render(url)});});}
try {
 const page=await b.newPage({viewport:{width:1440,height:1000}});await fixture(page);
 const ids=()=>page.locator('.collectionCard').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.productId)));
 async function load(query='',state='ready'){
  await page.goto('https://collection.test/collections/all'+query);
  await page.waitForFunction(expected=>document.querySelector('[data-stock-results]').dataset.stockEnhanced===expected,state);
 }
 const expected=[...pool.filter(n=>n.available),...pool.filter(n=>!n.available)].map(n=>n.id);
 const all=[];
 for(let i=1;i<=4;i++){
  await load('?page='+i);const actual=await ids();assert.deepEqual(actual,expected.slice((i-1)*24,i*24));all.push(...actual);
  const positions=await page.locator('[data-stock-results] script[type="application/ld+json"]').textContent();
  assert.deepEqual(JSON.parse(positions).itemListElement.map(n=>n.position),actual.map((_,j)=>(i-1)*24+j+1));
 }
 assert.equal(all.length,90);assert.equal(new Set(all).size,90);
 console.log('90 products over four pages: all 53 available first, then all 37 sold; newest first in both groups; no duplicates or omissions');
 pool[37].available=false;
 await load();assert.equal((await ids())[0],39);assert.ok(!(await ids()).includes(38));
 pool[37].available=true;
 pool.push({...pool[37],id:999,url:'/products/newly-published',created_at:'2027-01-01T00:00:00.000Z'});
 await load();assert.equal((await ids())[0],999);pool.pop();
 console.log('A newly published device appears first and a newly sold device moves out of the available group on reload');
 await load();assert.equal(await page.locator('.collectionTrade').count(),1);
 assert.equal(await page.locator('.collectionTrade').evaluate(n=>[...n.parentNode.children].indexOf(n)),3);
 await page.setViewportSize({width:1024,height:1000});await page.waitForTimeout(100);
 assert.equal(await page.locator('.collectionTrade').evaluate(n=>[...n.parentNode.children].indexOf(n)),2);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
 assert.ok(!(await page.locator('.collectionTrade').isVisible()));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await load('?filter.p.m.custom.condition=Zo+goed+als+nieuw&filter.v.price.gte=500');
 const filtered=pool.filter(n=>n.metafields.custom.condition==='Zo goed als nieuw'&&n.price>=50000);
 assert.deepEqual(await ids(),[...filtered.filter(n=>n.available),...filtered.filter(n=>!n.available)].slice(0,24).map(n=>n.id));
 for(const stock of ['0','1']){
  await load('?filter.v.availability='+stock+'&page=2');assert.deepEqual(await ids(),pool.filter(n=>n.available===(stock==='1')).slice(24,48).map(n=>n.id));
 }
 await load('?filter.v.availability=1&filter.v.availability=0');assert.deepEqual(await ids(),expected.slice(0,24));
 await load('?stock=all&page=2');assert.deepEqual(await ids(),pool.slice(24,48).map(n=>n.id));
 await load('?stock=none&page=2');assert.deepEqual(await ids(),pool.slice(24,48).map(n=>n.id));
 await load('?stock=one');assert.deepEqual(await ids(),[1,...pool.slice(1,24).map(n=>n.id)]);
 await load('?limit=1');assert.deepEqual(await ids(),[1]);assert.equal(await page.locator('.collectionTrade').count(),0);
 await load('?limit=0');assert.equal(await page.locator('.noResults').count(),1);
 for(const query of ['?fail=1','?ignore_filter=1']){
  await load(query,'error');assert.ok(await page.locator('[data-stock-status]').isVisible());assert.ok(await page.locator('.collectionCard').first().isVisible());assert.ok(!(await page.locator('[data-stock-results]').getAttribute('aria-busy')));
 }
 await page.goto('https://collection.test/collections/all?sort_by=price-descending');
 assert.equal(await page.locator('[data-stock-results]').getAttribute('data-stock-enhanced'),null);
 assert.deepEqual(await ids(),[...pool].sort((a,b)=>b.price-a.price).slice(0,24).map(n=>n.id));
 console.log('Filter combinations, availability-only filters, all/zero/one stock, single/empty results, network failures, disabled native availability filter, explicit price sort and responsive banner passed');
 const nojs=await b.newPage({javaScriptEnabled:false});await fixture(nojs);await nojs.goto('https://collection.test/collections/all');assert.equal(await nojs.locator('.collectionCard').count(),24);assert.ok(await nojs.locator('.collectionSortSubmit').isVisible());await nojs.close();
 assert.deepEqual(errors,[]);console.log('No JavaScript errors; native catalog remains accessible without JavaScript');
} finally {await b.close();await fs.rm(temp,{recursive:true,force:true});}

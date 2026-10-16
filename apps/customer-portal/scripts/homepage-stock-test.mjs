import {configureThemeLiquid} from './theme-liquid-fixture.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const engine=new Liquid({root:path.join(root,'snippets'),extname:'.liquid'});configureThemeLiquid(engine);
engine.registerFilter('t',k=>k);engine.registerFilter('money',n=>String(n/100));
const sources=Object.fromEntries(await Promise.all(['featured-products','fresh-stock'].map(async n=>[n,(await fs.readFile(path.join(root,'sections',n+'.liquid'),'utf8')).replace(/{% schema %}[\s\S]*?{% endschema %}/g,'')])));
function product(id,type,available,created_at='2026-10-01'){return {id,title:'Test '+id,type,available,created_at,url:'/products/'+id,price:10000,metafields:{custom:{}}};}
async function render(name,products,count=8){return engine.parseAndRender(sources[name],{section:{settings:{collection:products===null?null:{products,url:'/collections/test'},count}},routes:{all_products_collection_url:'/collections/all'}});}
function urls(html,kind){return [...html.matchAll(new RegExp('<a class="'+(kind==='featured-products'?'productCardVisual':'freshStockLink')+'" href="([^"]+)"','g'))].map(m=>m[1]);}
const phones=Array.from({length:9},(_,i)=>product('phone-'+i,'iPhone',true));
const mixed=[product('sold-watch','Apple Watch',false,'2026-12-01'),...phones,product('sold-ipad','iPad',false),product('available-accessory','Accessoire',true),product('available-ipad','iPad',true),product('available-watch','Apple Watch',true)];
for(const name of ['featured-products','fresh-stock']){
 const shown=urls(await render(name,mixed,8),name);assert.equal(shown.length,8);assert.equal(new Set(shown).size,8);assert.ok(shown.every(url=>mixed.some(p=>p.url===url&&p.available&&p.type!=='Accessoire')));
 const singleHtml=await render(name,[...phones,product('sold-other','iPad',false)],8);const singleType=urls(singleHtml,name);if(name==='featured-products'){assert.ok(singleHtml.includes('data-cat="iPhone"'));assert.ok(!singleHtml.includes('data-cat="iPad"'));}assert.equal(singleType.length,8);assert.ok(singleType.every(u=>u.startsWith('/products/phone-')));
 for(const pool of [[],[product('sold','iPhone',false)],[product('accessory','Accessoire',true)],null]){const html=await render(name,pool,8);assert.equal(urls(html,name).length,0);assert.ok(!html.includes('<section'),'No empty promo block when nothing is available');}
 const few=urls(await render(name,[product('sold-first','iPhone',false),product('one','iPhone',true)],8),name);assert.deepEqual(few,['/products/one']);
 console.log(name+': only available devices; no sold fallback; fills count; handles low/zero stock and missing collection');
}
const newest=urls(await render('fresh-stock',[product('latest-sold','iPhone',false,'2026-12-01'),product('older','iPhone',true,'2026-09-01'),product('newer','iPhone',true,'2026-10-01')],2),'fresh-stock');assert.deepEqual(newest,['/products/newer','/products/older']);
console.log('Fresh stock keeps newest available devices first, excluding a newer sold item');

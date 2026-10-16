import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';
import {chromium} from 'playwright';
import {configureThemeLiquid} from './theme-liquid-fixture.mjs';
import {prepareCleanup} from '../catalog/prepare-cleanup.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=name=>fs.readFile(path.join(root,name),'utf8');
const locales={};
for(const [language,name] of [['nl','nl.default.json'],['en','en.json']])locales[language]=JSON.parse((await read('locales/'+name)).replace(/\/\*[\s\S]*?\*\//g,''));
let language='en';
const engine=configureThemeLiquid(new Liquid({root:path.join(root,'snippets'),extname:'.liquid'}));
engine.registerFilter('t',(key,...args)=>{
 let value=key.split('.').reduce((o,k)=>o?.[k],locales[language]);assert.notEqual(value,undefined,'Missing '+language+' key '+key);
 const params=Object.fromEntries(args.filter(Array.isArray));
 if(typeof value==='object')value=value[Number(params.count)===1?'one':'other'];
 return value.replace(/{{\s*(\w+)\s*}}/g,(_,name)=>params[name]??'');
});
engine.registerFilter('asset_url',name=>'/assets/'+name);engine.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);engine.registerFilter('money',n=>'€ '+Number(n/100).toFixed(2));
const field=value=>({value});
const product={id:1,title:'MacBook Air M2',type:'MacBook',url:'/products/device',price:49900,available:true,metafields:{custom:{model:field('MacBook Air'),chip:field('M2'),ram_gb:field(16),storage_gb:field(256),battery_percentage:field(92),condition:field('Krasvrij'),color:field('Zwart'),box_included:field(false)}}};
const specSource=await read('sections/main-product.liquid');
const specBlock=specSource.slice(specSource.indexOf('{% capture device_rows %}'),specSource.indexOf('{% capture condition_display %}'))+'{{ device_rows }}{{ general_rows }}';
const html=await engine.parseAndRender(specBlock,{product});
for(const expected of ['MacBook Air','M2','16GB','256GB','92%','Scratch-free','Black','No'])assert.ok(html.includes(expected),expected);
const missing={...product,metafields:{custom:{model:field('MacBook Air')}}};
const empty=await engine.parseAndRender(specBlock,{product:missing});assert.ok(!empty.includes('RAM'));assert.ok(!empty.includes('SIM'));assert.ok(!empty.includes('16GB'));
const inherited={...product,metafields:{custom:{},'app--428689915905--mkt':{model:field('MacBook Pro')}}};assert.ok((await engine.parseAndRender(specBlock,{product:inherited})).includes('MacBook Pro'));
const unknown=await engine.parseAndRender("{% render 'product-spec-text', value: label %}",{label:'<unrecognised>'});assert.equal(unknown,'&lt;unrecognised&gt;');
const sample={id:'fixture',title:'MacBook Air M2 512GB zwart',productType:'MacBook',descriptionHtml:'<p>MacBook Air M2.</p>',updatedAt:'2026-01-01',seo:{},metafields:{nodes:[]}};
const proposal=prepareCleanup([sample]);assert.ok(!proposal.metafields.some(f=>['ram_gb','sim_type','warranty_months'].includes(f.key)));assert.equal(proposal.metafields.find(f=>f.key==='chip').value,'M2');assert.ok(proposal.unresolved.some(f=>f.key==='ram_gb'));
assert.throws(()=>prepareCleanup([{...sample,productType:undefined}]));
console.log('Typed metadata, explicit false, numeric units, inherited fields, unknown-value escaping and missing-spec handling passed; no inferred RAM/SIM/warranty');

const collectionSource=(await read('sections/main-collection.liquid')).replace(/{% schema %}[\s\S]*?{% endschema %}/g,'').replace(/{% paginate [^%]+%}/g,'{% if true %}').replace(/{% endpaginate %}/g,'{% endif %}');
const active={label:'Krasvrij',value:'Krasvrij',param_name:'filter.p.m.custom.condition',count:1,active:true,url_to_remove:'/collections/all'};
const collection={title:'Apple',url:'/collections/all',products:[product,{...product,id:2,available:false}],products_count:2,sort_by:'manual',filters:[{label:'Conditie',param_name:active.param_name,type:'list',values:[active],active_values:[active]},{label:'Beschikbaarheid',param_name:'filter.v.availability',type:'list',values:[{label:'Op voorraad',param_name:'filter.v.availability',value:'1',count:1},{label:'Niet op voorraad',param_name:'filter.v.availability',value:'0',count:1}],active_values:[]}],sort_options:[{name:'Manual',value:'manual'},{name:'Newest',value:'created-descending'}]};
const context={product,collection,section:{id:'main',settings:{trade_enabled:true,trade_title:'Ruil je oude iPhone in. Bespaar op je volgende.',trade_description:'Geef je huidige iPhone een tweede leven en ontdek de mogelijkheden om voordeliger te upgraden.',trade_cta:'Ontdek de inruilmogelijkheden'}},request:{locale:{iso_code:'en'}},routes:{root_url:'/',search_url:'/search'},shop:{currency:'EUR',url:'https://specs.test'},cart:{currency:{iso_code:'EUR'}},paginate:{current_page:1,pages:1}};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://specs.test/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.startsWith('/assets/'))return route.fulfill({body:await fs.readFile(path.join(root,url.pathname.slice(1))),contentType:url.pathname.endsWith('.js')?'application/javascript':'text/css'});
  return route.fulfill({body:'',contentType:'text/html'});
 });
 for(language of ['nl','en']){
  const rendered=await engine.parseAndRender(collectionSource,context);
  if(language==='en')for(const expected of ['Refine your choice','Sort products','Active filters','Scratch-free','Availability','Sold out','SOLD','Trade in your old iPhone. Save on your next one.','2 products'])assert.ok(rendered.includes(expected),expected);
  if(language==='nl')for(const expected of ['Verfijn je keuze','Sorteren','Krasvrij','Uitverkocht','VERKOCHT','2 producten'])assert.ok(rendered.includes(expected),expected);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:1100});
   await page.setContent('<html lang="'+language+'"><head><base href="https://specs.test"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand.css"><style>.reveal{opacity:1;transform:none}</style></head><body>'+rendered+'</body></html>');
   await page.waitForLoadState('networkidle');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),language+' '+width+' overflow');
  }
 }
 assert.deepEqual(errors,[]);
 console.log('NL/EN collection filters, counts, active chips, stock/ribbon labels and saved default banner text passed at 320/390/1440px');
}finally{await browser.close();}

const theme=await read('layout/theme.liquid');const title=theme.match(/<title>[\s\S]*?<\/title>/)[0];
for(const [pageTitle,type,expected] of [['Mijn winkel','index','<title>iSelectStore</title>'],['iPhone 16 Pro','product','<title>iPhone 16 Pro &ndash; iSelectStore</title>'],['iPhone kopen | iSelectStore','product','<title>iPhone kopen | iSelectStore</title>']])assert.equal(await engine.parseAndRender(title,{page_title:pageTitle,shop:{name:'Mijn winkel'},request:{page_type:type}}),expected);
assert.ok((await read('layout/password.liquid')).includes('<title>iSelectStore</title>'));
console.log('Home, product, existing branded SEO and password-page browser titles passed');

// Synthetic commerce fixtures are test-only. Render the actual theme components.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const tmp=await fs.mkdtemp('/tmp/iselect-brand-test-');
function prepare(s){return s.replace(/{% schema %}[\s\S]*?{% endschema %}/g,'')
 .replace(/{% paginate [^%]+%}/g,'{% if true %}').replace(/{% endpaginate %}/g,'{% endif %}')
 .replace(/{% form '([^']+)'[^%]*%}/g,(tag,type)=>`<form method="post" action="${type==='product'?'/cart/add':type==='cart'?'/cart':'/contact'}" id="${tag.match(/id: '([^']+)'/)?.[1]||'test-form'}">`)
 .replace(/{% endform %}/g,'</form>');}
for(const name of await fs.readdir(path.join(root,'snippets')))if(name.endsWith('.liquid'))await fs.writeFile(path.join(tmp,name),prepare(await fs.readFile(path.join(root,'snippets',name),'utf8')));
const engine=new Liquid({root:tmp,extname:'.liquid'});
const translations=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
engine.registerFilter('t',(key,...args)=>{let text=key.split('.').reduce((v,k)=>v?.[k],translations)||key;if(typeof text==='object')text=text.other||text.one||key;for(const pair of args)if(Array.isArray(pair))text=text.replaceAll('{{ '+pair[0]+' }}',pair[1]);return text;});
engine.registerFilter('asset_url',n=>'/assets/'+n);engine.registerFilter('stylesheet_tag',s=>`<link rel="stylesheet" href="${s}">`);
engine.registerFilter('image_url',()=>'/fixture.svg');
engine.registerFilter('image_tag',s=>`<img src="${s}" width="600" height="600" alt="Testproduct">`);
for(const name of ['money','money_with_currency','money_without_currency'])engine.registerFilter(name,n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format((Number(n)||0)/100));
engine.registerFilter('payment_type_svg_tag',()=>'<svg viewBox="0 0 24 24" width="24" height="24" aria-label="Testbetaling"></svg>');
const image={src:'/fixture.svg',alt:'Testproduct'};
const variant={id:10001,title:'128 GB',price:49900,compare_at_price:54900,available:true,sku:'TEST',featured_image:image,options:['128 GB'],option1:'128 GB',inventory_quantity:1};
const product={id:1000,title:'iPhone 16 Pro',type:'iPhone',description:'<p>Dit product bestaat uitsluitend in de browsertest.</p>',url:'/products/test',featured_image:image,images:[image],media:[],price:49900,compare_at_price:54900,available:true,variants:[variant],selected_or_first_available_variant:variant,
 options:['Opslag'],options_with_values:[{name:'Opslag',position:1,values:['128 GB'],selected_value:'128 GB'}],tags:[],metafields:{custom:{battery_percentage:95,condition:'Zo goed als nieuw',warranty_months:12},specs:{},specifications:{}}};
const collection={title:'Alle iPhones',description:'Testcollectie',url:'/collections/all',products:[product],products_count:1,all_products_count:1,filters:[],sort_options:[{name:'Nieuwste',value:'created-descending'}],sort_by:'created-descending'};
const cart={item_count:1,total_price:49900,items_subtotal_price:49900,currency:{iso_code:'EUR'},items:[{id:variant.id,key:'test-line',url:product.url,title:product.title,product,variant,image,quantity:1,final_line_price:49900,url_to_remove:'/cart/change?line=1&quantity=0'}]};
const base={shop:{name:'iSelectStore',url:'https://brand.example.invalid',email:'test@example.invalid',policies:[],enabled_payment_types:[]},settings:{},routes:{root_url:'/',search_url:'/search',cart_url:'/cart',cart_add_url:'/cart/add',cart_change_url:'/cart/change',account_url:'/account',storefront_login_url:'/customer_authentication/login',all_products_collection_url:'/collections/all'},cart,product,collection,collections:{all:collection},search:{terms:'',results:[product],results_count:1,performed:false},request:{host:'brand.example.invalid',path:'/'},page:{title:'Informatie',url:'/pages/test',content:''},pages:{contact:{url:'/pages/contact'},garantie:{url:'/pages/garantie'},faq:{url:'/pages/faq'},'over-ons':{url:'/pages/over-ons'}},paginate:{pages:1,current_page:1},form:{},section:{settings:{},blocks:[]}};
async function section(name,custom={}){return engine.parseAndRender(prepare(await fs.readFile(path.join(root,'sections',name+'.liquid'),'utf8')),{...base,...custom});}
const index=JSON.parse((await fs.readFile(path.join(root,'templates/index.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
const trust=index.sections.trust;const trustContext={section:{settings:trust.settings,blocks:trust.block_order.map(id=>trust.blocks[id])}};
const pages={
 '/':await section('hero')+await section('trust-bar',trustContext)+await section('featured-products',{section:{settings:{collection},blocks:[]}}),
 '/products/test':await section('main-product'),'/collections/all':await section('main-collection'),'/cart':await section('main-cart-items'),
 '/pages/contact':await section('contact'),'/pages/garantie':await section('guarantee-info'),
 '/pages/over-ons':await section('story-intro')+await section('story-trust'),'/search':await section('storefront-portal'),'/password':await section('main-password-header')};
const header=await section('header'),footer=await section('footer');
const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"><style>.reveal{opacity:1!important;transform:none!important;transition:none!important}</style>';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
await fs.mkdir(path.join(root,'artifacts/brand-preview'),{recursive:true});
try{
 for(const width of [320,390,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://brand.example.invalid/**',async route=>{const u=new URL(route.request().url());
   if(u.pathname.startsWith('/assets/'))return route.fulfill({body:await fs.readFile(path.join(root,u.pathname.slice(1))),contentType:u.pathname.endsWith('.js')?'application/javascript':u.pathname.endsWith('.svg')?'image/svg+xml':u.pathname.endsWith('.woff2')?'font/woff2':'text/css'});
   if(u.pathname==='/fixture.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#f7f7f7"/><rect x="195" y="65" width="210" height="470" rx="32" fill="#1f3049"/><rect x="207" y="78" width="186" height="444" rx="24" fill="#e4ecf4"/></svg>'});
   return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="nl"><head>'+head+'</head><body>'+ (u.pathname==='/password'?'':header)+'<main>'+ (pages[u.pathname]||pages['/'])+'</main>'+ (u.pathname==='/password'?'':footer)+'<script src="/assets/theme.js"></script></body></html>'});
  });
  for(const [routeName] of Object.entries(pages)){
   await page.goto('https://brand.example.invalid'+routeName);await page.evaluate(()=>{document.querySelectorAll('.reveal').forEach(n=>n.classList.add('in'));document.querySelectorAll('img').forEach(i=>i.loading='eager');});
   await page.waitForFunction(()=>[...document.images].filter(i=>i.classList.contains('brandLogo')||i.classList.contains('brandUspIcon')).every(i=>i.complete&&i.naturalWidth>0));
   await page.evaluate(()=>document.fonts.ready);
   assert.ok(await page.evaluate(()=>[...document.fonts].some(f=>f.family==='Poppins'&&f.status==='loaded')),'Poppins is loaded from local assets');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${routeName} overflow at ${width}`);
   if(routeName!='/password'){
    const logo=await page.locator('#siteHeader .brandLogo').boundingBox(),icons=await page.locator('#siteHeader .icons').boundingBox();
    assert.ok(logo.x+logo.width<=icons.x+1,`Header overlaps at ${width}`);
    assert.ok(icons.x+icons.width<=width,`Header actions clipped at ${width}`);
   }
   if(routeName==='/'){
    assert.equal(await page.locator('.trustitem .brandUspIcon').count(),6);
    if(width===390||width===1440)await page.screenshot({path:path.join(root,`artifacts/brand-preview/home-${width}.png`),fullPage:true});
    if(width<=1100){await page.locator('#burger').click();assert.ok(await page.locator('#mnav').evaluate(n=>n.classList.contains('open')));await page.locator('#burger').click();}
    await page.locator('#searchIcon').click();assert.ok(await page.locator('#searchOverlay').evaluate(n=>n.classList.contains('open')));await page.locator('#searchClose').click();
   }
   if(routeName==='/products/test'){
    assert.equal(await page.locator('#productForm input[name=id]').getAttribute('value'),'10001');assert.equal(await page.locator('#productForm').getAttribute('action'),'/cart/add');
    assert.ok(await page.locator('.pdpFeature .brandUspIcon').count()>=1);
    if(width===390||width===1440)await page.screenshot({path:path.join(root,`artifacts/brand-preview/product-${width}.png`),fullPage:true});
   }
   if(routeName==='/cart')assert.equal(await page.locator('#cartForm').getAttribute('action'),'/cart');
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`${width}px: 9 theme pages, original logo/SVG assets, USP icons, header bounds, navigation/search and commerce forms passed`);
 }
}finally{await browser.close();await fs.rm(tmp,{recursive:true,force:true});}

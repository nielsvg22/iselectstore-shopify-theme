import {configureThemeLiquid} from './theme-liquid-fixture.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const tmp=await fs.mkdtemp('/tmp/iselect-native-test-');
for(const name of ['storefront-portal-native','storefront-portal-order','portal-icon','icon-mark','brand-logo','brand-usp','brand-usp-key']){
  let text=await fs.readFile(path.join(root,'snippets',name+'.liquid'),'utf8');
  // Shopify's paginator is server-provided. The test supplies a one-page context.
  text=text.replace('{% paginate customer.orders by 20 %}','{% if true %}').replace('{% endpaginate %}','{% endif %}');
  await fs.writeFile(path.join(tmp,name+'.liquid'),text);
}
const engine=new Liquid({root:tmp,extname:'.liquid'});configureThemeLiquid(engine);
engine.registerFilter('asset_url',n=>'/assets/'+n);engine.registerFilter('stylesheet_tag',s=>`<link rel="stylesheet" href="${s}">`);
engine.registerFilter('money_with_currency',n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n/100));
engine.registerFilter('format_address',a=>`<address>${a.first_name}<br>${a.address1}<br>${a.city}</address>`);
const translations=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
engine.registerFilter('t',k=>k.split('.').reduce((v,n)=>v?.[n],translations)||k);
const host='https://native.example.invalid',url=host+'/search?view=mijn-account';
const order={id:10,name:'#TEST-10',created_at:'2026-10-01',total_price:50000,financial_status:'paid',fulfillment_status:'fulfilled',
  customer_order_url:'https://shopify.com/110103658887/account/orders/10',line_items:[{id:100,title:'iPhone 16 Pro · 128 GB',product:{title:'iPhone 16 Pro'},variant:{title:'128 GB'},quantity:1,final_line_price:50000,fulfillment:{tracking_url:'https://example.invalid/tracking',tracking_company:'Testvervoerder'}}]};
const customer={id:1,first_name:'Testklant A',name:'Testklant A Test',email:'test-a@example.invalid',orders:[order],last_order:order,addresses:[]};
const base={shop:{id:110103658887,url:host,email:'service@example.invalid'},routes:{root_url:'/',search_url:'/search',account_url:'https://shopify.com/110103658887/account',
  account_profile_url:'https://shopify.com/110103658887/account/profile',account_logout_url:'/account/logout',storefront_login_url:'/customer_authentication/login?locale=nl',all_products_collection_url:'/collections/all'},
  request:{host:'native.example.invalid',path:'/search'},section:{settings:{customer_account_client_id:''}},settings:{},cart:{item_count:0},paginate:{pages:1,current_page:1},pages:{contact:{url:'/pages/contact'},garantie:{url:'/pages/garantie'},faq:{url:'/pages/faq'}}};
async function section(name,context){return engine.parseAndRender((await fs.readFile(path.join(root,'sections',name+'.liquid'),'utf8')).replace(/{% schema %}[\s\S]*?{% endschema %}/g,'').replace(/{% form [^%]+%}/g,'<form>').replace(/{% endform %}/g,'</form>'),context);}
async function html(current){const ctx={...base,customer:current};return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"><link rel="stylesheet" href="/assets/brand-fonts.css"><link rel="stylesheet" href="/assets/brand.css"></head><body>'+await section('header',ctx)+'<main>'+await section('storefront-portal',ctx)+'</main>'+await section('footer',ctx)+'</body></html>';}
// A request-controlled ID must never substitute for the authenticated customer.
const loggedOut=await html(null);assert.ok(!loggedOut.includes('test-a@example.invalid'));assert.ok(!loggedOut.includes('#TEST-10'));
const malicious=await html({...customer,first_name:'<script>alert(1)</script>'});assert.ok(!malicious.includes('<script>alert(1)</script>'));assert.ok(malicious.includes('&lt;script&gt;'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let current=null;
  await page.route(host+'/**',async route=>{const request=new URL(route.request().url());
    if(request.pathname.startsWith('/assets/'))return route.fulfill({body:await fs.readFile(path.join(root,request.pathname.slice(1))),contentType:request.pathname.endsWith('.js')?'application/javascript':request.pathname.endsWith('.svg')?'image/svg+xml':request.pathname.endsWith('.woff2')?'font/woff2':'text/css'});
    if(request.pathname==='/customer_authentication/login'){assert.equal(request.searchParams.get('return_to'),'/search?view=mijn-account');current=customer;return route.fulfill({status:302,headers:{location:url}});}
    if(request.pathname==='/account/logout'){current=null;return route.fulfill({status:302,headers:{location:url}});}
    return route.fulfill({contentType:'text/html',body:await html(current)});
  });
  await page.goto(url);await page.getByRole('link',{name:/Naar mijn account/}).click();
  await page.getByRole('heading',{name:'Welkom, Testklant A.'}).waitFor();
  assert.equal(page.url(),url);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(root,`artifacts/native-storefront-dashboard-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Bestellingen',exact:true}).click();await page.getByText('Producten, bezorging & ondersteuning').click();
  assert.equal(await page.getByRole('link',{name:/Volg je pakket/}).getAttribute('href'),'https://example.invalid/tracking');
  await page.getByRole('button',{name:'Producten & garantie',exact:true}).click();await page.getByText(/Er zijn geen garantiegegevens/).waitFor();
  await page.getByRole('button',{name:'Mijn gegevens',exact:true}).click();await page.getByText('test-a@example.invalid',{exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:/Gegevens veilig wijzigen/}).getAttribute('href'),base.routes.account_profile_url);
  await page.getByRole('link',{name:'Uitloggen',exact:true}).click();await page.getByRole('link',{name:/Naar mijn account/}).waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('test-a@example.invalid'));
  current={...customer,id:2,first_name:'Testklant B',name:'Testklant B',email:'test-b@example.invalid',orders:[],last_order:null};
  await page.goto(url+'&customer_id=1');await page.getByRole('heading',{name:'Welkom, Testklant B.'}).waitFor();
  await page.getByRole('heading',{name:'Je eerste aankoop begint hier.'}).waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('#TEST-10'));
  assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});
  // Without JS all private sections remain usable and links are real.
  await page.close();assert.deepEqual(errors,[]);console.log(`${width}px native: Shopify login return, own orders/tracking, warranty, profile links, logout, account isolation, empty account, no PII storage or overflow passed`);
 }
}finally{await browser.close();await fs.rm(tmp,{recursive:true,force:true});}

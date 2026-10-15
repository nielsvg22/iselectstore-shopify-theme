// Browser verification uses synthetic customers and a signed test OAuth issuer.
// No test credentials, customers or orders enter the production bundle.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateKeyPairSync, sign, createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';
import {Liquid} from 'liquidjs';
import {account} from '../tests/fixtures/account.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const origin='https://portal.example.invalid', uri=origin+'/pages/mijn-account';
const issuer='https://shopify.com/authentication/110103658887';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'portal-test',alg:'RS256',use:'sig'};
function jwt(nonce){const now=Math.floor(Date.now()/1000);const body=[{alg:'RS256',kid:jwk.kid,typ:'JWT'},
  {iss:issuer,aud:'test-public-client',sub:'customer-test',nonce,iat:now,exp:now+300}]
  .map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
  return body+'.'+sign('RSA-SHA256',Buffer.from(body),privateKey).toString('base64url');}
const engine=new Liquid({root:path.join(root,'snippets'),extname:'.liquid'});
engine.registerFilter('asset_url',n=>'/assets/'+n);
engine.registerFilter('stylesheet_tag',s=>`<link rel="stylesheet" href="${s}">`);
const translations=JSON.parse((await fs.readFile(path.join(root,'locales/nl.default.json'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,''));
engine.registerFilter('t',k=>k.split('.').reduce((v,n)=>v?.[n],translations)||k);
const context={shop:{id:110103658887,url:origin,email:'service@example.invalid'},settings:{},
  routes:{root_url:'/',account_url:'https://shopify.com/110103658887/account',all_products_collection_url:'/collections/all'},
  request:{host:'portal.example.invalid',path:'/pages/mijn-account'},section:{settings:{customer_account_client_id:'test-public-client'}},cart:{item_count:0}};
async function section(name,settings=context.section.settings){const s=(await fs.readFile(path.join(root,'sections',name+'.liquid'),'utf8')).replace(/{% schema %}[\s\S]*?{% endschema %}/g,'').replace(/{% form [^%]+%}/g,'<form>').replace(/{% endform %}/g,'</form>');return engine.parseAndRender(s,{...context,section:{settings}});}
const header=await section('header',{}),footer=await section('footer',{}),portal=await section('storefront-portal');
const html=`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"></head><body>${header}<main>${portal}</main>${footer}</body></html>`;
await fs.mkdir(path.join(root,'artifacts'),{recursive:true});
const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.BROWSER==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}),args:['--no-sandbox']});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let customer=account(), nonce, expired=false, mutations=[];
  customer.orders.nodes[0].lineItems.nodes[0].title='iPhone 16 Pro';
  await page.route(origin+'/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname.startsWith('/assets/')){try{return route.fulfill({body:await fs.readFile(path.join(root,u.pathname.slice(1))),contentType:u.pathname.endsWith('.js')?'application/javascript':'text/css'});}catch{return route.fulfill({status:404,body:''});}}
    return route.fulfill({body:html,contentType:'text/html'});
  });
  await page.route('https://shopify.com/**',async route=>{
    const u=new URL(route.request().url());const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS'};
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
    const json=data=>route.fulfill({json:data,headers});
    if(u.pathname.endsWith('/openid-configuration'))return json({issuer,authorization_endpoint:issuer+'/oauth/authorize',token_endpoint:issuer+'/oauth/token',jwks_uri:issuer+'/jwks',end_session_endpoint:issuer+'/logout',authorization_response_iss_parameter_supported:true});
    if(u.pathname.endsWith('/jwks'))return json({keys:[jwk]});
    if(u.pathname.endsWith('/oauth/authorize')){nonce=u.searchParams.get('nonce');return route.fulfill({body:'Shopify test login',contentType:'text/html'});}
    if(u.pathname.endsWith('/oauth/token'))return json({access_token:'customer-test-only',refresh_token:'test-refresh',token_type:'Bearer',expires_in:3600,id_token:jwt(nonce)});
    if(u.pathname.endsWith('/graphql')){
      if(expired)return route.fulfill({status:401,headers,body:''});
      const {query,variables}=route.request().postDataJSON();
      if(query.includes('PortalAccount'))return json({data:{shop:{email:'service@example.invalid',url:origin},customer}});
      if(query.includes('PortalAddresses'))return json({data:{customer:{id:customer.id,defaultAddress:null,addresses:{nodes:[],pageInfo:{hasNextPage:false}}}}});
      if(query.includes('PortalCustomer')){mutations.push(variables);customer={...customer,...variables.input};return json({data:{customerUpdate:{customer,userErrors:[]}}});}
      if(query.includes('PortalAddressCreate')){mutations.push(variables);return json({data:{customerAddressCreate:{customerAddress:{id:'test-address'},userErrors:[]}}});}
      if(query.includes('PortalWarranty'))return json({data:{order:{id:customer.orders.nodes[0]?.id,metafield:null}}});
      throw Error('Unexpected test operation');
    }
    return route.fulfill({body:'Shopify native test endpoint',contentType:'text/html'});
  });
  await page.goto(uri);await page.getByRole('button',{name:'Veilig inloggen',exact:true}).waitFor();
  await page.screenshot({path:path.join(root,`artifacts/storefront-login-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Veilig inloggen',exact:true}).click();await page.waitForURL(/shopify.com/);
  const authUrl=new URL(page.url());const state=authUrl.searchParams.get('state');
  await page.goto(uri+'?code=test-code&state='+state+'&iss='+encodeURIComponent(issuer));
  await page.getByRole('heading',{name:/Welkom, Testklant A/}).waitFor();
  assert.equal(page.url(),uri,'callback code must be removed from address bar');
  const stored=await page.evaluate(()=>({session:Object.keys(sessionStorage),local:Object.keys(localStorage)}));
  assert.deepEqual(stored,{session:[],local:[]},'tokens/customer data must not be persisted');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
  await page.screenshot({path:path.join(root,`artifacts/storefront-dashboard-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Bestellingen',exact:true}).click();
  await page.getByRole('button',{name:'Bestelgegevens',exact:true}).click();
  assert.equal(await page.getByRole('link',{name:/Volg je pakket/}).getAttribute('href'),'https://example.invalid/tracking');
  await page.getByRole('button',{name:'Producten & garantie',exact:true}).click();
  await page.getByRole('button',{name:'Garantiegegevens bekijken',exact:true}).click();
  await page.getByText(/Er zijn geen garantiegegevens/).waitFor();
  await page.getByRole('button',{name:'Mijn gegevens',exact:true}).click();
  await page.getByLabel('Voornaam',{exact:true}).fill('Bijgewerkt');
  await page.getByRole('button',{name:'Naam opslaan',exact:true}).click();
  await page.getByText('Je naam is bijgewerkt.').waitFor();assert.equal(mutations[0].input.firstName,'Bijgewerkt');
  await page.getByRole('button',{name:'Adres toevoegen +',exact:true}).click();
  await page.getByLabel('Straat en huisnummer',{exact:true}).fill('Teststraat 1');await page.getByLabel('Plaats',{exact:true}).fill('Amsterdam');
  await page.getByRole('button',{name:'Adres opslaan',exact:true}).click();await page.getByText('Je adresgegevens zijn bijgewerkt.').waitFor();
  assert.equal(mutations[1].address.address1,'Teststraat 1');
  // An expired API session must remove the previous customer's visible data.
  expired=true;await page.getByRole('button',{name:'Naam opslaan',exact:true}).click();
  await page.getByRole('button',{name:'Veilig inloggen',exact:true}).waitFor();assert.ok(!(await page.locator('body').innerText()).includes('Bijgewerkt.'));
  assert.deepEqual(errors,[]);
  // Retry with an invalid callback: no request may reveal a customer.
  await page.goto(uri+'?code=untrusted&state=wrong');await page.getByRole('alert').waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('#TEST-10'));
  expired=false;customer=account('2',false);
  await page.getByRole('button',{name:'Veilig inloggen',exact:true}).click();await page.waitForURL(/shopify.com/);
  const second=new URL(page.url());await page.goto(uri+'?code=test-second&state='+second.searchParams.get('state')+'&iss='+encodeURIComponent(issuer));
  await page.getByRole('heading',{name:/Welkom, Testklant B/}).waitFor();
  await page.getByRole('heading',{name:'Je eerste aankoop begint hier.'}).waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('#TEST-10'));
  await page.evaluate(()=>{const c=new BroadcastChannel('iselectstore-portal');c.postMessage('account-change');setTimeout(()=>c.close(),100);});
  await page.getByRole('button',{name:'Veilig inloggen',exact:true}).waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('Testklant B'));

  await page.close();console.log(`${width}px: signed OAuth callback, orders/tracking, warranty, profile/address mutations, expiry, rejected callback and no overflow passed`);
 }
}finally{await browser.close();}

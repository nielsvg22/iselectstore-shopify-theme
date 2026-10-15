import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {account} from '../tests/fixtures/account.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(appRoot, '../..');
const output = path.join(root, 'artifacts');
await fs.mkdir(output, {recursive: true});
const engine = new Liquid({root: path.join(root, 'snippets'), extname: '.liquid'});
const translations = JSON.parse((await fs.readFile(path.join(root, 'locales/nl.default.json'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, ''));
engine.registerFilter('t', key => key.split('.').reduce((v, k) => v?.[k], translations) || key);
engine.registerFilter('asset_url', name => `/assets/${name}`);
engine.registerFilter('stylesheet_tag', url => `<link rel="stylesheet" href="${url}">`);
const context = {routes: {root_url: '/', account_url: '/account', cart_url: '/cart', search_url: '/search'},
  shop: {email: 'test@example.invalid'}, section: {settings: {}}, cart: {item_count: 0}, form: {}};
const read = async file => fs.readFile(path.join(root, file), 'utf8');
async function section(file) {
  const source = (await read(file)).replace(/{% schema %}[\s\S]*?{% endschema %}/g, '')
    .replace(/{% form 'contact', id: 'portalSupportForm' %}/g, '<form id="portalSupportForm" method="post">')
    .replace(/{% endform %}/g, '</form>');
  return engine.parseAndRender(source, context);
}
const header = await section('sections/header.liquid');
const pages = {};
for (const [url, file] of [['/preview', 'sections/account-entrance.liquid'], ['/support', 'sections/portal-support.liquid']]) {
  pages[url] = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/theme.css"></head><body>${header}<main>${await section(file)}</main></body></html>`;
}
const runtime = `<!doctype html><html lang="nl"><body><script>
function signal(value) {const callbacks = new Set(); return {value, subscribe(cb) {callbacks.add(cb);return ()=>callbacks.delete(cb)}, change(next) {this.value=next;callbacks.forEach(cb=>cb(next))}}}
window.testCustomer = ${JSON.stringify(account())};
window.testMode = 'normal';
window.shopify = {extension:{target:'customer-account.page.render'},
 settings:signal({storefront_url:'https://example.invalid',support_url:'https://example.invalid/support',wishlist_enabled:true}),
 authenticatedAccount:{customer:signal({id:window.testCustomer.id})},
 query:async()=>({data:{nodes:[],products:{nodes:[]}}})};
const listeners = new Set();
window.navigation={currentEntry:{url:'extension://overview'},navigate(url){this.currentEntry.url=url;listeners.forEach(cb=>cb())},addEventListener(_,cb){listeners.add(cb)},removeEventListener(_,cb){listeners.delete(cb)}};
window.fetch=async (_url, options)=>{
 const body=JSON.parse(options.body);
 if(window.testMode==='error') return {ok:false,status:500};
 if(body.query.includes('PortalWarranty'))return {ok:true,json:async()=>({data:{order:{id:body.variables.id,metafield:null}}})};
 if(body.query.includes('PortalWishlist'))return {ok:true,json:async()=>({data:{customer:{id:window.testCustomer.id,metafield:null}}})};
 const captured=window.testCustomer;
 if(window.testMode==='delay') await new Promise(resolve=>setTimeout(resolve,500));
 return {ok:true,json:async()=>({data:{customer:captured,shop:{email:'service@example.invalid',url:'https://example.invalid'}}})};
};
</script><script type="module">import start from '/bundle.js';start();</script></body></html>`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (pages[url.pathname]) {res.setHeader('Content-Type', 'text/html'); return res.end(pages[url.pathname]);}
    if (url.pathname === '/runtime') {res.setHeader('Content-Type', 'text/html'); return res.end(runtime);}
    if (url.pathname === '/entry-runtime') {res.setHeader('Content-Type', 'text/html'); return res.end(runtime.replace("'/bundle.js'", "'/entry.js'"));}
    let file;
    if (url.pathname === '/bundle.js') file = path.join(appRoot, 'dist/portal.js');
    else if (url.pathname === '/entry.js') file = path.join(appRoot, 'dist/entry.js');
    else if (/^\/assets\/[a-z0-9.-]+$/i.test(url.pathname)) file = path.join(root, url.pathname);
    else {res.statusCode = 404; return res.end();}
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/javascript');
    res.end(await fs.readFile(file));
  } catch {res.statusCode = 500; res.end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 1000});
    for (const pathname of ['/preview', '/support']) {
      await page.goto(origin + pathname);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.portal *')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => el.tagName));
      assert.deepEqual(overflow, [], `${pathname} overflow at ${width}px`);
      assert.equal(await page.locator('h1').count(), 1);
      await page.screenshot({path: path.join(output, `${pathname.slice(1)}-${width}.png`), fullPage: true});
    }
  }
  await page.goto(origin + '/support?order=%23TEST-10&topic=Garantie&product=%3Cimg%20src=x%3E');
  assert.equal(await page.locator('#portal-order').inputValue(), '#TEST-10');
  assert.equal(await page.locator('#portal-topic').inputValue(), 'Garantie');
  assert.equal(await page.locator('#portal-product').inputValue(), '<img src=x>');
  assert.equal(await page.locator('#portalSupportForm img').count(), 0);
  assert.equal(await page.locator('#portalSupportForm').evaluate(form => form.checkValidity()), false);

  await page.goto(origin + '/runtime');
  await page.waitForFunction(() => document.querySelector('s-page')?.getAttribute('heading')?.includes('Testklant A'));
  assert.ok((await page.locator('body').innerText()).includes('#TEST-10'));
  await page.evaluate(() => navigation.navigate('extension://orders'));
  await page.waitForFunction(() => document.body.textContent.includes('Track & Trace'));
  await page.evaluate(() => navigation.navigate('extension://products'));
  await page.waitForFunction(() => document.body.textContent.includes('nog geen specifieke garantiegegevens'));
  await page.evaluate(() => navigation.navigate('extension://favorites'));
  await page.waitForFunction(() => document.body.textContent.includes('Ruimte voor jouw volgende favoriet'));
  await page.evaluate(() => {shopify.settings.change({}); navigation.navigate('extension://support');});
  await page.waitForFunction(() => document.body.textContent.includes('Mail onze klantenservice'));
  assert.equal(await page.locator('s-button').filter({hasText:'Mail onze klantenservice'}).getAttribute('href'), 'mailto:service%40example.invalid');
  const b = account('2', false);
  await page.evaluate(b => {window.testCustomer = b; shopify.authenticatedAccount.customer.change({id:b.id}); navigation.navigate('extension://overview');}, b);
  await page.waitForFunction(() => document.querySelector('s-page')?.getAttribute('heading')?.includes('Testklant B'), null, {timeout:5000}).catch(async error => {console.log(await page.locator('body').innerText()); console.log(errors); throw error;});
  assert.ok(!(await page.locator('body').innerText()).includes('Testklant A'));
  assert.ok(!(await page.locator('body').innerText()).includes('#TEST-10'));
  await page.evaluate(() => {window.testMode='error'; shopify.authenticatedAccount.customer.change({id:'gid://shopify/Customer/3'});});
  await page.waitForFunction(() => document.querySelector('s-banner')?.getAttribute('heading') === 'Ophalen is niet gelukt');
  assert.ok(!(await page.locator('body').innerText()).includes('Testklant B'));
  // Start A, switch while its response is delayed, and ensure A cannot overwrite B.
  await page.evaluate(a => {window.testMode='delay';window.testCustomer=a;shopify.authenticatedAccount.customer.change({id:a.id});}, account());
  await page.waitForTimeout(100);
  await page.evaluate(b => {window.testCustomer=b;shopify.authenticatedAccount.customer.change({id:b.id});}, b);
  await page.waitForFunction(() => document.querySelector('s-page')?.getAttribute('heading')?.includes('Testklant B'), null, {timeout:5000}).catch(async error => {console.log(await page.locator('body').innerText()); console.log(errors); throw error;});
  assert.ok(!(await page.locator('body').innerText()).includes('#TEST-10'));
  await page.evaluate(() => shopify.authenticatedAccount.customer.change(undefined));
  await page.waitForFunction(() => document.querySelector('s-banner')?.getAttribute('heading') === 'Open je Shopify-account');
  assert.ok(!(await page.locator('body').innerText()).includes('Testklant B'));
  await page.goto(origin + '/entry-runtime');
  await page.waitForFunction(() => document.body.textContent.includes('Open mijn iSelectStore'));
  assert.equal(await page.locator('s-button').getAttribute('href'), 'extension:iselectstore-portal/');
  assert.deepEqual(errors, []);
  console.log('Browser smoke geslaagd: thema 320/390/768/1440px, formulierhints, portaalroutes, lege account, fout, accountwissel, late response en uitgelogde staat.');
  console.log('Let op: Shopify-hostcomponenten, authenticatie en verzending zijn hier gesimuleerd; live acceptatie blijft nodig.');
} finally {await browser.close(); server.close();}

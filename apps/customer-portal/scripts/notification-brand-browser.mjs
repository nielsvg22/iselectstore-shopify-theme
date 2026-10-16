import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {brandNotification} from './brand-notification.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const output=path.join(root,'artifacts/notification-brand-preview');
await fs.mkdir(output,{recursive:true});
await fs.copyFile(path.join(root,'docs/notifications/email-logo.png'),path.join(output,'email-logo.png'));
const original=`<!doctype html><html><head><meta charset="utf-8"><style>.button__cell{background:blue}.button__text{color:black}</style></head><body>{% if financial_status == 'pending' %}{{ payment_terms.next_payment.due_at }}{% endif %}<a href="{{ order_status_url }}">{{ order_name }}</a>{% for line in subtotal_line_items %}{{ line.title }}{{ line.final_line_price | money }}{% endfor %}{{ total_price | money }}{{ tax_price | money }}{{ fulfillment.tracking_url }}{{ unsubscribe_url }}</body></html>`;
const branded=await brandNotification(original);
assert.deepEqual(branded.match(/{{[\s\S]*?}}|{%[\s\S]*?%}/g),original.match(/{{[\s\S]*?}}|{%[\s\S]*?%}/g));
assert.equal(branded.replace(/<style type="text\/css" id="iselectstore-notification-brand">[\s\S]*?<\/style>\n/,''),original);
assert.equal(await brandNotification(branded),branded);
await assert.rejects(()=>brandNotification('<p>Alleen een fragment</p>'));
await assert.rejects(()=>brandNotification('<html><head></head><head></head></html>'));
console.log('Original Liquid, payment/tracking links and all content preserved; applying twice is idempotent; incomplete HTML refused');

function fixture(kind){
 const invoice=kind==='factuurmail';
 return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>iSelectStore — ontwerpvoorbeeld</title><style>body{margin:0}table{border-collapse:collapse;border-spacing:0}td{vertical-align:top}.container{width:560px;max-width:100%;margin:auto}.header .container td{padding:0}.content .container>tbody>tr>td,.section .container>tbody>tr>td,.footer .container>tbody>tr>td{padding:20px 0}.section,.footer{border-top:1px solid #ddd}.order-list__item td{padding:16px 0}.button{border-collapse:separate}.button__text{display:block;padding:18px 28px}.subtotal-line td{padding:6px 0}.subtotal-line__value{text-align:right}.fixtureNotice{padding:12px;text-align:center;background:#f7f7f7;font:11px Arial;color:#25292d}.fixtureNav{padding:12px;text-align:center;font:12px Arial}@media(max-width:600px){.container{width:calc(100% - 40px)}.header .container td{display:block}.order-number__cell{padding-top:12px!important}h2{overflow-wrap:anywhere}}</style></head><body><div class="fixtureNotice">ONTWERPVOORBEELD · fictieve gegevens · geen verzonden Shopify-mail</div><div class="fixtureNav"><a href="bestelbevestiging.html">Bestelbevestiging</a> &nbsp; / &nbsp; <a href="factuurmail.html">Factuurmail</a></div><table class="body" role="presentation" width="100%"><tr><td><table class="header" role="presentation" width="100%"><tr><td><table class="container" role="presentation"><tr><td class="shop-name__cell"><img src="email-logo.png" alt="iSelectStore" width="240" height="45"></td><td class="order-number__cell"><span class="order-number__text">VOORBEELD #TEST</span></td></tr></table></td></tr></table><table class="content" role="presentation" width="100%"><tr><td><table class="container" role="presentation"><tr><td><h2>${invoice?'Je betaalverzoek staat klaar.':'Bedankt voor je bestelling.'}</h2><p>${invoice?'Dit is een ontwerpvoorbeeld van de Shopify-factuurmail.':'Dit is een ontwerpvoorbeeld van de Shopify-bestelbevestiging.'} In de echte mail blijven Shopify’s bestaande teksten, bedragen en bestelgegevens behouden.</p><table class="button" role="presentation"><tr><td class="button__cell"><a class="button__text" href="#voorbeeld">${invoice?'Bekijk en betaal je bestelling':'Bekijk je bestelling'}</a></td></tr></table></td></tr></table></td></tr></table><table class="section" role="presentation" width="100%"><tr><td><table class="container" role="presentation"><tr><td><h3>Besteloverzicht</h3><table class="order-list" role="presentation" width="100%"><tr class="order-list__item"><td><strong class="order-list__item-title">Voorbeeldtoestel</strong><br><span class="order-list__item-variant">Fictieve variant · aantal 1</span></td><td class="subtotal-line__value"><strong>€ 499,00</strong></td></tr></table><table role="presentation" width="100%"><tr class="subtotal-line"><td>Totaal voorbeeld</td><td class="subtotal-line__value"><strong>€ 499,00</strong></td></tr></table></td></tr></table></td></tr></table><table class="footer" role="presentation" width="100%"><tr><td><table class="container" role="presentation"><tr><td><p class="disclaimer__subtext">Dit voorbeeld toont alleen de vormgeving. In je Shopify-mail blijven de oorspronkelijke contactgegevens, belastingen, kortingen en links staan.</p></td></tr></table></td></tr></table></td></tr></table></body></html>`;
}

for(const kind of ['bestelbevestiging','factuurmail'])await fs.writeFile(path.join(output,kind+'.html'),await brandNotification(fixture(kind)));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://notification.example.invalid/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1);
  if(!['email-logo.png','bestelbevestiging.html','factuurmail.html'].includes(name))return route.abort();
  await route.fulfill({body:await fs.readFile(path.join(output,name)),contentType:name.endsWith('.png')?'image/png':'text/html; charset=utf-8'});
 });
 for(const kind of ['bestelbevestiging','factuurmail'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1100});await page.goto('https://notification.example.invalid/'+kind+'.html');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('.button__text').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.button__cell').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(249, 133, 139)');
  assert.equal(await page.locator('.shop-name__cell img').evaluate(el=>el.naturalWidth),960);
  if(width===390||width===1440)await page.screenshot({path:path.join(output,kind+'-'+width+'.png'),fullPage:true});
  console.log(kind+' '+width+'px: original logo, coral CTA with white text, no horizontal overflow');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}

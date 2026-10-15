import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accountQuery, ACCOUNT_ENDPOINT, ACCOUNT_QUERY, httpsUrl, warrantyFor,
  wishlistIds, wishlistInput, tracking, money, productSearch, supportDestination, serviceLink} from '../extensions/portal/src/api.mjs';

test('account requests use Shopify automatic authentication, not caller IDs or tokens', async () => {
  let request;
  const data = await accountQuery(ACCOUNT_QUERY, {after: 'cursor-A'}, {fetcher: async (url, options) => {
    request = {url, options}; return {ok: true, json: async () => ({data: {customer: null}})};
  }});
  assert.equal(request.url, ACCOUNT_ENDPOINT);
  assert.deepEqual(request.options.headers, {'Content-Type': 'application/json'});
  assert.deepEqual(JSON.parse(request.options.body).variables, {after: 'cursor-A'});
  assert.equal(data.customer, null);
});
test('partial GraphQL responses, denied access and network errors fail closed', async () => {
  for (const response of [
    {ok: true, json: async () => ({data: {customer: {id: 'private'}}, errors: [{message: 'private error'}]})},
    {ok: false, status: 401}, {ok: false, status: 403}, {ok: false, status: 500},
  ]) await assert.rejects(accountQuery('query { customer { id } }', {}, {fetcher: async () => response}));
});
test('unmount cancellation reaches the request', async () => {
  const abort = new AbortController();
  const request = accountQuery('query { customer { id } }', {}, {signal: abort.signal,
    fetcher: async (_url, {signal}) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })});
  abort.abort();
  await assert.rejects(request, {name: 'AbortError'});
});
test('tracking accepts successful fulfillments and HTTPS URLs only', () => {
  const order = {fulfillments: {nodes: [
    {status: 'CANCELLED', trackingInformation: [{url: 'https://carrier.example/cancelled'}]},
    {status: 'SUCCESS', trackingInformation: [{url: 'javascript:alert(1)'}, {url: 'https://carrier.example/valid'}]},
  ]}};
  assert.deepEqual(tracking(order).map(x => x.url), ['https://carrier.example/valid']);
  for (const url of ['javascript:alert(1)', '//evil.example', 'https://user:pass@evil.example', 'http://example.com']) assert.equal(httpsUrl(url), undefined);
});
test('warranty is matched to the immutable order line; nothing is inferred', () => {
  const raw = JSON.stringify({version: 1, items: [{lineItemId: 'line-A', description: 'Afspraak bij aankoop', expiresOn: '2027-01-01'}]});
  assert.equal(warrantyFor(raw, 'line-A').description, 'Afspraak bij aankoop');
  assert.equal(warrantyFor(raw, 'line-B'), null);
  assert.equal(warrantyFor(JSON.stringify({version: 1, items: [{lineItemId: 'line-A', description: 'Afspraak', expiresOn: '2027-02-31'}]}), 'line-A').expiresOn, null);
  for (const value of [null, '{}', '{broken', '{"version":2,"items":[]}', '{"version":1,"items":[null]}']) assert.equal(warrantyFor(value, 'line-A'), null);
});
test('wishlist rejects malformed IDs and excessive lists; saves with optimistic concurrency', () => {
  const id = 'gid://shopify/Product/7';
  assert.deepEqual(wishlistIds(JSON.stringify([id, id])), [id]);
  for (const raw of ['{}', '["<script>"]', '["gid://shopify/Customer/1"]', JSON.stringify(Array(101).fill(id))]) assert.throws(() => wishlistIds(raw));
  assert.throws(() => wishlistInput('gid://shopify/Product/7', [], 'digest'));
  const input = wishlistInput('gid://shopify/Customer/1', [id], 'digest-A')[0];
  assert.equal(input.compareDigest, 'digest-A');
  assert.equal(input.ownerId, 'gid://shopify/Customer/1');
  assert.equal(wishlistInput('gid://shopify/Customer/1', [], undefined)[0].compareDigest, null);
});
test('amounts are formatted in order currency and search cannot inject operators', () => {
  assert.match(money({amount: '19.95', currencyCode: 'EUR'}), /19,95/);
  assert.equal(money({amount: 'NaN', currencyCode: 'EUR'}), 'Bedrag niet beschikbaar');
  assert.equal(productSearch('iPhone" OR vendor:*'), 'title:"iPhone  OR vendor*"');
});
test('support uses the configured page or the actual shop contact, with safe mail hints', () => {
  assert.equal(supportDestination('https://shop.example/pages/service', 'shop@example.com'), 'https://shop.example/pages/service');
  assert.equal(supportDestination(undefined, 'shop@example.com'), 'mailto:shop%40example.com');
  assert.equal(supportDestination(undefined, 'shop@example.com?bcc=evil@example.com'), undefined);
  const mail = new URL(serviceLink('mailto:shop%40example.com', '#10', 'Garantie', 'Toestel'));
  assert.equal(mail.searchParams.get('subject'), 'iSelectStore · Garantie · #10');
  assert.match(mail.searchParams.get('body'), /Product: Toestel/);
});

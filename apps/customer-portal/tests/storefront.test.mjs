import test from 'node:test';
import assert from 'node:assert/strict';
import {consumeTransaction, MAX_TRANSACTION_AGE, createSession} from '../storefront/auth.mjs';
import {createApi, catalogQuery, WEB_ACCOUNT_QUERY, ADDRESSES_QUERY, UPDATE_CUSTOMER, CREATE_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS} from '../storefront/api.mjs';
import {PRODUCTS_QUERY, SEARCH_QUERY} from '../extensions/portal/src/api.mjs';
import fs from 'node:fs';
import {buildClientSchema, parse, validate} from 'graphql';

function storage(initial) {let value=initial;return {getItem:()=>value,removeItem:()=>{value=null;},setItem:(_,v)=>{value=v;}};}
const tx={clientId:'public-id',redirectUri:'https://shop.invalid/pages/mijn-account',createdAt:1000000,
  state:'a'.repeat(43),nonce:'b'.repeat(43),verifier:'c'.repeat(43)};
test('PKCE transaction is bound to client and callback, expires, and is consumed once',()=>{
  const s=storage(JSON.stringify(tx));assert.equal(consumeTransaction(s,tx.clientId,tx.redirectUri,1000100).nonce,tx.nonce);
  assert.throws(()=>consumeTransaction(s,tx.clientId,tx.redirectUri,1000100));
  for(const [client,uri,now] of [['other',tx.redirectUri,1000100],[tx.clientId,'https://other.invalid',1000100],
    [tx.clientId,tx.redirectUri,tx.createdAt+MAX_TRANSACTION_AGE+1],[tx.clientId,tx.redirectUri,tx.createdAt-1]]) {
    const item=storage(JSON.stringify(tx));assert.throws(()=>consumeTransaction(item,client,uri,now));assert.equal(item.getItem(),null);
  }
});
test('public OAuth login uses PKCE S256, nonce, state and no secret',async()=>{
  const s=storage(null);const issuer='https://shopify.com/authentication/110103658887';
  const session=createSession({shopId:'110103658887',clientId:tx.clientId,redirectUri:tx.redirectUri},{storage:s,
    fetcher:async()=>Response.json({issuer,authorization_endpoint:issuer+'/oauth/authorize',token_endpoint:issuer+'/oauth/token',jwks_uri:issuer+'/jwks'})});
  const url=new URL(await session.login());const stored=JSON.parse(s.getItem());
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('state'),stored.state);assert.equal(url.searchParams.get('nonce'),stored.nonce);
  assert.equal(url.searchParams.get('redirect_uri'),tx.redirectUri);assert.ok(!url.href.includes(stored.verifier));
  assert.ok(!s.getItem().includes('access_token'));assert.ok(!url.searchParams.has('client_secret'));
});
test('API requests use only the current customer token and do not send cookies',async()=>{
  let seen;const api=createApi('110103658887',{accessToken:async()=>'customer-test-token'},async(url,options)=>{
    seen={url,options};return Response.json({data:{customer:{id:'own-account'}}});});
  assert.equal((await api.query('query {customer{id}}')).customer.id,'own-account');
  assert.equal(seen.options.headers.Authorization,'customer-test-token');assert.equal(seen.options.credentials,'omit');
  assert.equal(seen.options.cache,'no-store');assert.match(seen.url,/2026-07\/graphql$/);
});
test('logout discards an in-flight customer response',async()=>{
  let finish;const api=createApi('110103658887',{accessToken:async()=>'test'},()=>new Promise(resolve=>{finish=resolve;}));
  const request=api.query('query {customer{id}}');await new Promise(resolve=>setTimeout(resolve,0));api.clear();
  finish(Response.json({data:{customer:{id:'previous-account'}}}));await assert.rejects(request,{code:'access'});
});
test('API fails closed on partial errors and clears expired sessions',async()=>{
  let cleared=0;const api=createApi('110103658887',{accessToken:async()=>'test',clear:()=>cleared++},async()=>new Response('',{status:401}));
  await assert.rejects(api.query('query{x}'),{code:'access'});assert.equal(cleared,1);
  const partial=createApi('110103658887',{accessToken:async()=>'test'},async()=>Response.json({data:{customer:{}},errors:[{message:'private'}]}));
  await assert.rejects(partial.query('query{x}'),{code:'api'});
});
test('public catalog queries never forward customer authorization',async()=>{
  let request;await catalogQuery(SEARCH_QUERY,{query:'title:iPhone*'},async(url,options)=>{
    request={url,options};return Response.json({data:{products:{nodes:[]}}});});
  assert.equal(request.url,'/api/2026-07/graphql.json');
  assert.equal(request.options.headers.Authorization,undefined);assert.equal(request.options.credentials,'omit');
});
test('catalog operations match the official Storefront schema',{skip:!process.env.STOREFRONT_SCHEMA},()=>{
  const raw=JSON.parse(fs.readFileSync(process.env.STOREFRONT_SCHEMA,'utf8'));const schema=buildClientSchema(raw.data||raw);
  for(const query of [PRODUCTS_QUERY,SEARCH_QUERY])assert.deepEqual(validate(schema,parse(query)).map(e=>e.message),[]);
});
test('storefront operations match the official Customer Account schema', {skip:!process.env.CUSTOMER_SCHEMA},()=>{
  const raw=JSON.parse(fs.readFileSync(process.env.CUSTOMER_SCHEMA,'utf8'));const schema=buildClientSchema(raw.data||raw);
  for(const query of [WEB_ACCOUNT_QUERY,ADDRESSES_QUERY,UPDATE_CUSTOMER,CREATE_ADDRESS,UPDATE_ADDRESS,DELETE_ADDRESS]) {
    assert.deepEqual(validate(schema,parse(query)).map(e=>e.message),[]);
  }
});

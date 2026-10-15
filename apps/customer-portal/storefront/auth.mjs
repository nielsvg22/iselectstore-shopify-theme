import * as oauth from 'oauth4webapi';

const TRANSACTION = 'iselectstore.portal.oauth.v1';
export const MAX_TRANSACTION_AGE = 10 * 60 * 1000;

export function consumeTransaction(storage, clientId, redirectUri, now = Date.now()) {
  const raw = storage.getItem(TRANSACTION);
  storage.removeItem(TRANSACTION);
  const tx = JSON.parse(raw || 'null');
  if (!tx || tx.clientId !== clientId || tx.redirectUri !== redirectUri ||
      !Number.isFinite(tx.createdAt) || now - tx.createdAt > MAX_TRANSACTION_AGE ||
      tx.createdAt > now || ![tx.state, tx.nonce, tx.verifier].every(v => typeof v === 'string' && v.length >= 32)) {
    throw new Error('login-expired');
  }
  return tx;
}

// Public OAuth client: no app secret, customer data, access token or refresh
// token is written to web storage. Only the short-lived PKCE transaction is.
export function createSession(config, dependencies = {}) {
  const fetcher = dependencies.fetcher || fetch;
  const storage = dependencies.storage || sessionStorage;
  const issuer = new URL(`https://shopify.com/authentication/${config.shopId}`);
  const client = {client_id: config.clientId, id_token_signed_response_alg: 'RS256'};
  const options = {[oauth.customFetch]: fetcher};
  let server, tokens, expires = 0, generation = 0, renewal;
  async function metadata() {
    if (!server) server = await oauth.processDiscoveryResponse(issuer,
      await oauth.discoveryRequest(issuer, options));
    return server;
  }
  function clear() { tokens = undefined; expires = 0; generation++; }
  async function login() {
    clear();
    const as = await metadata();
    const verifier = oauth.generateRandomCodeVerifier();
    const state = oauth.generateRandomState(), nonce = oauth.generateRandomNonce();
    const tx = {clientId: config.clientId, redirectUri: config.redirectUri,
      verifier, state, nonce, createdAt: Date.now()};
    storage.setItem(TRANSACTION, JSON.stringify(tx));
    const url = new URL(as.authorization_endpoint);
    url.search = new URLSearchParams({client_id: config.clientId, response_type: 'code',
      redirect_uri: config.redirectUri, scope: 'openid email customer-account-api:full',
      state, nonce, code_challenge: await oauth.calculatePKCECodeChallenge(verifier),
      code_challenge_method: 'S256', locale: 'nl', ui_locales: 'nl'}).toString();
    return url.href;
  }
  async function callback(url) {
    const tx = consumeTransaction(storage, config.clientId, config.redirectUri);
    const current = ++generation;
    const as = await metadata();
    const params = oauth.validateAuthResponse(as, client, url, tx.state);
    const response = await oauth.authorizationCodeGrantRequest(as, client, oauth.None(),
      params, config.redirectUri, tx.verifier, options);
    const result = await oauth.processAuthorizationCodeResponse(as, client, response,
      {expectedNonce: tx.nonce, requireIdToken: true});
    await oauth.validateApplicationLevelSignature(as, response, options);
    if (current !== generation) throw new Error('session-changed');
    tokens = result; expires = Date.now() + Number(result.expires_in || 0) * 1000;
  }
  async function accessToken() {
    if (!tokens) throw new Error('login-required');
    if (expires > Date.now() + 30000) return tokens.access_token;
    if (!tokens.refresh_token) { clear(); throw new Error('login-required'); }
    if (!renewal) renewal = (async () => {
      const current = generation;
      const as = await metadata();
      const response = await oauth.refreshTokenGrantRequest(as, client, oauth.None(), tokens.refresh_token, options);
      const result = await oauth.processRefreshTokenResponse(as, client, response);
      if (current !== generation) throw new Error('session-changed');
      tokens = {...result, refresh_token: result.refresh_token || tokens.refresh_token};
      expires = Date.now() + Number(result.expires_in || 0) * 1000;
      return tokens.access_token;
    })().catch(() => { clear(); throw new Error('login-required'); }).finally(() => { renewal = undefined; });
    return renewal;
  }
  async function logout() {
    const idToken = tokens?.id_token;
    clear(); storage.removeItem(TRANSACTION);
    const as = await metadata();
    const url = new URL(as.end_session_endpoint);
    url.searchParams.set('post_logout_redirect_uri', config.redirectUri);
    url.searchParams.set('client_id', config.clientId);
    if (idToken) url.searchParams.set('id_token_hint', idToken);
    return url.href;
  }
  return {login, callback, accessToken, logout, clear};
}

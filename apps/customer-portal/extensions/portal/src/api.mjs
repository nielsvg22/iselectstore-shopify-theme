export const API_VERSION = '2026-07';
export const ACCOUNT_ENDPOINT = `shopify://customer-account/api/${API_VERSION}/graphql.json`;

const ORDER_FIELDS = `
  id name createdAt cancelledAt financialStatus fulfillmentStatus statusPageUrl
  totalPrice { amount currencyCode }
  totalRefunded { amount currencyCode }
  lineItems(first: 50) {
    nodes { id name title variantTitle quantity productId productType
      image { url altText } }
    pageInfo { hasNextPage }
  }
  fulfillments(first: 10) {
    nodes { status trackingInformation { company number url } }
    pageInfo { hasNextPage }
  }`;

export const ACCOUNT_QUERY = `query PortalAccount($after: String) {
  shop { email url }
  customer {
    id firstName lastName emailAddress { emailAddress } phoneNumber { phoneNumber }
    defaultAddress { formatted(withName: true) }
    orders(first: 10, after: $after, sortKey: CREATED_AT, reverse: true) {
      nodes { ${ORDER_FIELDS} }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

// Optional data is fetched separately: missing metafield permissions must never
// prevent a customer from seeing their orders or opening Shopify's profile.
export const WARRANTY_QUERY = `query PortalWarranty($id: ID!) {
  order(id: $id) {
    id metafield(namespace: "custom", key: "portal_warranty") { value }
  }
}`;
export const WISHLIST_QUERY = `query PortalWishlist {
  customer { id metafield(namespace: "custom", key: "portal_wishlist") {
    value compareDigest
  } }
}`;
export const WISHLIST_MUTATION = `mutation PortalSaveWishlist($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { value compareDigest }
    userErrors { code message }
  }
}`;
export const PRODUCTS_QUERY = `query PortalProducts($ids: [ID!]!) {
  nodes(ids: $ids) { ... on Product {
    id title onlineStoreUrl availableForSale featuredImage { url altText }
  } }
}`;
export const SEARCH_QUERY = `query PortalProductSearch($query: String!) {
  products(first: 8, query: $query) { nodes {
    id title onlineStoreUrl availableForSale featuredImage { url altText }
  } }
}`;

export class PortalError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export async function accountQuery(query, variables = {}, options = {}) {
  const {fetcher = fetch, signal} = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, {once: true});
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetcher(ACCOUNT_ENDPOINT, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query, variables}), signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) throw new PortalError('access');
    if (!response.ok) throw new PortalError('network');
    const payload = await response.json();
    // Fail closed on partial GraphQL responses. Never log customer data/errors.
    if (payload.errors?.length || !payload.data) throw new PortalError('api');
    return payload.data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function httpsUrl(value) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function supportDestination(configuredUrl, shopEmail) {
  const configured = httpsUrl(configuredUrl);
  if (configured) return configured;
  // Store contact details come from Shopify, never a URL parameter/customer.
  return typeof shopEmail === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(shopEmail)
    ? `mailto:${encodeURIComponent(shopEmail)}` : undefined;
}

export function serviceLink(base, order, topic, product = '') {
  const url = new URL(base);
  if (url.protocol === 'mailto:') {
    url.searchParams.set('subject', `iSelectStore · ${topic}${order ? ` · ${order}` : ''}`);
    url.searchParams.set('body', `${order ? `Bestelling: ${order}\n` : ''}${product ? `Product: ${product}\n` : ''}\nMijn vraag:\n`);
  } else {
    url.searchParams.set('order', order); url.searchParams.set('topic', topic);
    if (product) url.searchParams.set('product', product);
  }
  return url.href;
}

export const financialLabels = {
  AUTHORIZED: 'Betaling gereserveerd', EXPIRED: 'Betaling verlopen', PAID: 'Betaald',
  PARTIALLY_PAID: 'Gedeeltelijk betaald', PARTIALLY_REFUNDED: 'Gedeeltelijk terugbetaald',
  PENDING: 'Betaling in behandeling', REFUNDED: 'Terugbetaald', VOIDED: 'Betaling vervallen',
};
export const fulfillmentLabels = {
  FULFILLED: 'Verzonden', UNFULFILLED: 'Nog niet verzonden', PARTIALLY_FULFILLED: 'Deels verzonden',
  IN_PROGRESS: 'Wordt verwerkt', ON_HOLD: 'In afwachting', OPEN: 'In behandeling',
  PENDING_FULFILLMENT: 'Wordt voorbereid', RESTOCKED: 'Terug op voorraad',
  SCHEDULED: 'Verzending gepland', REQUEST_DECLINED: 'Verzendverzoek geweigerd',
};
export function money(value) {
  if (!value || !Number.isFinite(Number(value.amount))) return 'Bedrag niet beschikbaar';
  try { return new Intl.NumberFormat('nl-NL', {style: 'currency', currency: value.currencyCode}).format(Number(value.amount)); }
  catch { return 'Bedrag niet beschikbaar'; }
}
export function date(value) {
  const parsed = new Date(value);
  return value && Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('nl-NL', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam'}).format(parsed)
    : 'Datum niet beschikbaar';
}
export function tracking(order) {
  return (order.fulfillments?.nodes || []).filter(f => f.status === 'SUCCESS')
    .flatMap(f => f.trackingInformation || []).filter(t => httpsUrl(t.url));
}

// Snapshot format v1: records keyed by immutable order-line ID. No arithmetic
// using current product warranty_months and no inference about legal warranty.
export function warrantyFor(raw, lineId) {
  try {
    const snapshot = JSON.parse(raw || 'null');
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.items)) return null;
    const record = snapshot.items.find(item => item.lineItemId === lineId);
    if (!record || typeof record.description !== 'string' || !record.description.trim()) return null;
    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(record.expiresOn || '')
      ? new Date(`${record.expiresOn}T12:00:00Z`) : null;
    const validExpiry = expiry && Number.isFinite(expiry.getTime())
      && expiry.toISOString().slice(0, 10) === record.expiresOn;
    return {description: record.description.slice(0, 2000),
      expiresOn: validExpiry ? record.expiresOn : null};
  } catch { return null; }
}

export function wishlistIds(raw) {
  const parsed = JSON.parse(raw || '[]');
  if (!Array.isArray(parsed) || parsed.length > 100 || parsed.some(id => typeof id !== 'string' || !/^gid:\/\/shopify\/Product\/\d+$/.test(id))) {
    throw new PortalError('wishlist-data');
  }
  return [...new Set(parsed)];
}
export function wishlistInput(customerId, ids, compareDigest) {
  if (!/^gid:\/\/shopify\/Customer\/\d+$/.test(customerId)) throw new PortalError('access');
  return [{ownerId: customerId, namespace: 'custom', key: 'portal_wishlist',
    type: 'list.product_reference', value: JSON.stringify(wishlistIds(JSON.stringify(ids))),
    compareDigest: compareDigest ?? null}];
}

// Never turn user input into Shopify search operators.
export function productSearch(term) {
  const value = term.trim().slice(0, 80).replace(/[^\p{L}\p{N} ]/gu, ' ').trim();
  return `title:${JSON.stringify(value + '*')}`;
}

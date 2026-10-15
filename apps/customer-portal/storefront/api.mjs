import {ACCOUNT_QUERY, PortalError} from '../extensions/portal/src/api.mjs';

export const WEB_ACCOUNT_QUERY = ACCOUNT_QUERY.replace('defaultAddress { formatted(withName: true) }',
  'defaultAddress { id formatted(withName: true) }');
export const ADDRESSES_QUERY = `query PortalAddresses($after: String) {
  customer { id defaultAddress { id } addresses(first: 20, after: $after) {
    nodes { id firstName lastName address1 address2 city zip countryCode zoneCode phoneNumber formatted(withName: true) }
    pageInfo { hasNextPage endCursor }
  } }
}`;
export const UPDATE_CUSTOMER = `mutation PortalCustomer($input: CustomerUpdateInput!) {
  customerUpdate(input: $input) { customer { id firstName lastName } userErrors { field message code } }
}`;
export const CREATE_ADDRESS = `mutation PortalAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean) {
  customerAddressCreate(address: $address, defaultAddress: $defaultAddress) { customerAddress { id } userErrors { field message code } }
}`;
export const UPDATE_ADDRESS = `mutation PortalAddressUpdate($addressId: ID!, $address: CustomerAddressInput, $defaultAddress: Boolean) {
  customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) { customerAddress { id } userErrors { field message code } }
}`;
export const DELETE_ADDRESS = `mutation PortalAddressDelete($addressId: ID!) {
  customerAddressDelete(addressId: $addressId) { deletedAddressId userErrors { field message code } }
}`;

export function createApi(shopId, session, fetcher = fetch, onAccessLost = () => {}) {
  if (!/^\d+$/.test(shopId)) throw new Error('invalid-shop');
  const endpoint = `https://shopify.com/${shopId}/account/customer/api/2026-07/graphql`;
  let epoch = 0;
  const controllers = new Set();
  function clear() { epoch++; for (const c of controllers) c.abort(); controllers.clear(); }
  async function query(query, variables = {}) {
    const current = epoch;
    const controller = new AbortController(); controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const token = await session.accessToken();
      if (current !== epoch) throw new PortalError('access');
      const response = await fetcher(endpoint, {method: 'POST', cache: 'no-store', credentials: 'omit',
        headers: {'Content-Type': 'application/json', Authorization: token},
        body: JSON.stringify({query, variables}), signal: controller.signal});
      if (current !== epoch) throw new PortalError('access');
      if (response.status === 401 || response.status === 403) { session.clear(); clear(); onAccessLost(); throw new PortalError('access'); }
      if (!response.ok) throw new PortalError('network');
      const payload = await response.json();
      if (current !== epoch) throw new PortalError('access');
      if (payload.errors?.length || !payload.data) throw new PortalError('api');
      return payload.data;
    } catch (error) {
      if (current === epoch && ['login-required', 'session-changed'].includes(error?.message)) {
        clear(); onAccessLost(); throw new PortalError('access');
      }
      throw error;
    } finally { clearTimeout(timeout); controllers.delete(controller); }
  }
  return {query, clear};
}

// Public catalog queries belong to Storefront API, not Customer Account API.
// Tokenless product access never receives a customer bearer token or cookie.
export async function catalogQuery(query, variables = {}, fetcher = fetch) {
  const response = await fetcher('/api/2026-07/graphql.json', {
    method: 'POST', credentials: 'omit', cache: 'no-store',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new PortalError('catalog');
  const payload = await response.json();
  if (payload.errors?.length || !payload.data) throw new PortalError('catalog');
  return payload.data;
}

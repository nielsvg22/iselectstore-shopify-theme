// Test data only. Never imported by the production extension.
export function account(id = '1', orders = true) {
  return {id: `gid://shopify/Customer/${id}`, firstName: id === '1' ? 'Testklant A' : 'Testklant B', lastName: 'Test',
    emailAddress: {emailAddress: `test-${id}@example.invalid`}, phoneNumber: null, defaultAddress: null,
    orders: {nodes: orders ? [{id: 'gid://shopify/Order/10', name: '#TEST-10', createdAt: '2026-10-01T12:00:00Z',
      cancelledAt: null, financialStatus: 'PAID', fulfillmentStatus: 'FULFILLED', statusPageUrl: 'https://example.invalid/order/10',
      totalPrice: {amount: '500', currencyCode: 'EUR'}, totalRefunded: {amount: '0', currencyCode: 'EUR'},
      lineItems: {nodes: [{id: 'gid://shopify/LineItem/100', name: 'Testtoestel', title: '', variantTitle: '128 GB', quantity: 1, image: null}], pageInfo: {hasNextPage: false}},
      fulfillments: {nodes: [{status: 'SUCCESS', trackingInformation: [{company: 'Testvervoerder', url: 'https://example.invalid/tracking', number: 'TEST'}]}], pageInfo: {hasNextPage: false}},
    }] : [], pageInfo: {hasNextPage: false, endCursor: null}}};
}

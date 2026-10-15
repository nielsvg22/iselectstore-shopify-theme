// Validate against an official Shopify introspection file supplied by the caller.
// Usage: node scripts/validate-schema.mjs /path/customer-account.schema.json
import fs from 'node:fs';
import {buildClientSchema, parse, validate} from 'graphql';
import {ACCOUNT_QUERY, WARRANTY_QUERY, WISHLIST_QUERY, WISHLIST_MUTATION} from '../extensions/portal/src/api.mjs';
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const schema = buildClientSchema(raw.data || raw);
for (const query of [ACCOUNT_QUERY, WARRANTY_QUERY, WISHLIST_QUERY, WISHLIST_MUTATION]) {
  const errors = validate(schema, parse(query));
  if (errors.length) throw new Error(errors.map(e => e.message).join('\n'));
}
console.log('Alle vier Customer Account GraphQL-operaties zijn geldig in het opgegeven schema.');

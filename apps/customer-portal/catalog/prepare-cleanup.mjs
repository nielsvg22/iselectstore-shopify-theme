import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const deviceTypes = ['iPhone', 'iPad', 'MacBook', 'iMac', 'Mac mini', 'Apple Watch'];

export function prepareCleanup(products) {
  const metafields = [], productUpdates = [], unresolved = [];
  for (const product of products) {
    if (typeof product.productType !== 'string' || !Array.isArray(product.metafields?.nodes)) throw new Error('Producttype of metafield-back-up ontbreekt. Er is geen wijzigingsplan gemaakt.');
    const fields = new Map(product.metafields.nodes.filter(field => field.namespace === 'custom').map(field => [field.key, field]));
    function set(key, value, evidence, replace = false) {
      if (value === undefined || value === null || value === '') return;
      const existing = fields.get(key);
      if (existing?.value === String(value)) return;
      if (existing && !replace) { unresolved.push({id: product.id, title: product.title, key, reason: 'Bestaande waarde behouden; bron vereist controle.'}); return; }
      metafields.push({ownerId: product.id, namespace: 'custom', key, value: String(value), compareDigest: existing?.compareDigest ?? null, evidence, before: existing?.value ?? null});
    }
    const title = product.title;
    const description = text(product.descriptionHtml);
    const patch = {id: product.id};
    if (/\btest\b/i.test(title)) {
      patch.title = title.replace(/\s*\btest\b\s*/gi, ' ').trim();
      patch.seo = Object.fromEntries(Object.entries(product.seo).filter(([, value]) => value && /\btest\b/i.test(value)).map(([key, value]) => [key, value.replace(/\s*\btest\b\s*/gi, ' ').trim()]));
      if (!Object.keys(patch.seo).length) delete patch.seo;
    }
    const badge = fields.get('badge_text');
    if (/^test$/i.test(badge?.value || '') && fields.get('condition')?.value) set('badge_text', fields.get('condition').value, 'Testlabel vervangen door de bestaande conditie van hetzelfde toestel.', true);
    if (!deviceTypes.includes(product.productType)) { if (Object.keys(patch).length > 1) productUpdates.push({patch, expectedUpdatedAt: product.updatedAt}); continue; }
    const model = title.match(/^(iPhone\s+(?:Air|SE(?:\s+\d{4})?|\d+)(?:\s+(?:Pro Max|Pro|Plus|mini))?|iPad(?:\s+(?:Pro|Air|mini))?|MacBook\s+(?:Air|Pro)|Mac mini|iMac|Apple Watch\s+(?:Series\s+\d+|SE|Ultra(?:\s+\d+)?))(?=\s|$)/i)?.[1];
    if (model) set('model', model, 'Letterlijk model uit de bestaande producttitel: ' + title);
    const chip = /\b(M\d+(?:\s+(?:Pro|Max|Ultra))?)\b/i.exec(title)?.[1];
    if (['MacBook', 'iMac', 'Mac mini'].includes(product.productType) && chip) set('chip', chip, 'Chip staat expliciet in de producttitel: ' + title);
    const tail = title.split(/\b\d+\s*(?:GB|TB)\b/i)[1]?.split('/')[0].trim();
    if (tail && /^(?:wit titanium|zwart titanium|space grey|middernacht|sterrenlicht|zilver|roze|blauw|zwart|wit|titanium|rood)$/i.test(tail)) set('color', tail.charAt(0).toUpperCase() + tail.slice(1), 'Kleur staat expliciet achter de opslag in de bestaande titel: ' + title);
    if (product.productType === 'Apple Watch') {
      const series = title.match(/Apple Watch\s+(Series\s+\d+|SE|Ultra(?:\s+\d+)?)/i)?.[1];
      const size = title.match(/\b(\d+)\s*mm\b/i)?.[1];
      if (series) set('watch_series', series, 'Serie uit de bestaande titel: ' + title);
      if (size) set('watch_case_size', size + ' mm', 'Kastformaat uit de bestaande titel: ' + title);
    }
    const screen = title.match(/\b(\d+(?:[.,]\d+)?)\s*(?:"|inch)/i)?.[1];
    if (screen && ['iPad', 'MacBook', 'iMac'].includes(product.productType)) set('screen_size', screen.replace(',', '.') + ' inch', 'Schermformaat staat expliciet in de bestaande titel: ' + title);
    const cycles = description.match(/\b(\d+)\s*(?:keer\s+opgeladen|x\s+opgeladen)\b/i)?.[1];
    if (cycles) set('cycle_count', cycles, 'Aantal keer opgeladen staat expliciet in de bestaande beschrijving.');
    if (/(?:compleet met|incl\.?|inclusief)\s[^.]*\bdoos\b/i.test(description)) set('box_included', true, 'De bestaande beschrijving noemt expliciet een meegeleverde doos.');
    if (product.id === 'gid://shopify/Product/16617922363783') {
      if (!/^iPhone 14 128GB zwart\b/i.test(title) || !['128', '256'].includes(fields.get('storage_gb')?.value) || !['Zwart', 'Krasvrij scherm, minimale gebruikssporen op de behuizing'].includes(fields.get('condition')?.value)) throw new Error('De verwachte bron van de iPhone 14-correctie is gewijzigd. Controleer opnieuw.');
      if (!/Krasvrij scherm, enkele minimale sporen op de behuizing/i.test(description)) throw new Error('De conditiebron is gewijzigd. Controleer opnieuw.');
      set('storage_gb', 128, 'De producttitel noemt expliciet 128GB; correctie gevraagd door de eigenaar.', true);
      set('condition', 'Krasvrij scherm, minimale gebruikssporen op de behuizing', 'Exacte staat uit de bestaande productbeschrijving; kleur is geen conditie.', true);
      set('badge_text', 'Krasvrij scherm', 'De beschrijving garandeert uitsluitend een krasvrij scherm, geen krasvrije behuizing.', true);
      set('cosmetic_notes', 'Krasvrij scherm. Enkele minimale sporen op de behuizing ontstaan door de hoes; zie de fotoreportage.', 'De bestaande productbeschrijving.');
      if (/Incl\. 6 maanden garantie/.test(product.descriptionHtml)) patch.descriptionHtml = product.descriptionHtml.replace('Incl. 6 maanden garantie', 'Incl. 12 maanden garantie');
    }
    if (product.id === 'gid://shopify/Product/16617970237831' && fields.get('condition')?.value === 'Zwart') {
      if (!/<li>\s*Krasvrij\s*<\/li>/i.test(product.descriptionHtml)) throw new Error('De conditiebron is gewijzigd. Controleer opnieuw.');
      set('condition', 'Krasvrij', 'De beschrijving vermeldt expliciet Krasvrij; kleur staat voortaan in het kleurveld.', true);
    }
    if (['MacBook', 'iMac', 'Mac mini'].includes(product.productType) && !fields.has('ram_gb')) unresolved.push({id: product.id, title, key: 'ram_gb', reason: 'Exact RAM van dit exemplaar ontbreekt; niet afleiden uit een standaardconfiguratie.'});
    if (['iPhone', 'iPad'].includes(product.productType) && !fields.has('sim_type')) unresolved.push({id: product.id, title, key: 'sim_type', reason: 'Exacte regionale SIM-/eSIM-uitvoering ontbreekt; niet afleiden uit de modelnaam.'});
    if (Object.keys(patch).length > 1) productUpdates.push({patch, expectedUpdatedAt: product.updatedAt});
  }
  return {metafields, productUpdates, unresolved};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Gebruik: node catalog/prepare-cleanup.mjs product-backup.json wijzigingsplan.json');
  const source = JSON.parse(await fs.readFile(input, 'utf8'));
  const plan = prepareCleanup(source.products.nodes);
  await fs.writeFile(output, JSON.stringify(plan, null, 2) + '\n', {flag: 'wx'});
  console.log(`${plan.metafields.length} onderbouwde veldwijzigingen; ${plan.productUpdates.length} productcorrecties; ${plan.unresolved.length} gegevens nog te bevestigen. Er is niets naar Shopify geschreven.`);
}

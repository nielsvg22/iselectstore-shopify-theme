import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const marker = 'iselectstore-notification-brand';

export async function brandNotification(source) {
  const styles = await fs.readFile(path.join(root, 'docs/notifications/brand.css'), 'utf8');
  const existing = new RegExp(`<style\\b[^>]*\\bid=["']${marker}["'][^>]*>[\\s\\S]*?<\\/style>\\s*`, 'gi');
  const clean = source.replace(existing, '');
  if ((clean.match(/<head(?:\s[^>]*)?>/gi) || []).length !== 1 || (clean.match(/<\/head\s*>/gi) || []).length !== 1) {
    throw new Error('Exporteer de volledige HTML-mail uit Shopify, met één head-element. Er is niets gewijzigd.');
  }
  return clean.replace(/<\/head\s*>/i, `<style type="text/css" id="${marker}">\n${styles}</style>\n</head>`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Gebruik: node scripts/brand-notification.mjs originele-mail.html aangepaste-mail.html');
  if (path.resolve(input) === path.resolve(output)) throw new Error('Gebruik een apart uitvoerbestand; de originele Shopify-template blijft als back-up bewaard.');
  const source = await fs.readFile(input, 'utf8');
  await fs.writeFile(output, await brandNotification(source), {flag: 'wx'});
  console.log('Huisstijl toegevoegd. Originele Liquid, teksten, bedragen en links zijn behouden. Nog niet gepubliceerd; controleer de Shopify-preview en testmail.');
}

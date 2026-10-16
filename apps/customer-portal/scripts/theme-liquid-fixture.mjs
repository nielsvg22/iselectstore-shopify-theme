export function configureThemeLiquid(engine) {
  engine.registerTag('doc', {
    parse(token, remaining) {
      while (remaining.length) if (remaining.shift().name === 'enddoc') return;
      throw new Error('Unclosed Shopify LiquidDoc tag');
    },
    render() { return ''; }
  });
  engine.registerFilter('handleize', value => String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  return engine;
}

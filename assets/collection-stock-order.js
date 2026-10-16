(() => {
  const availabilityKey = 'filter.v.availability';

  async function order(root) {
    if (root.dataset.stockEnhanced || root.dataset.sort !== 'created-descending') return;
    root.dataset.stockEnhanced = 'loading';
    const status = root.querySelector('[data-stock-status]');
    const originalURL = new URL(location.href);
    const pageSize = Number(root.dataset.pageSize);
    const currentPage = Number(root.dataset.page) || 1;
    const total = Number(root.dataset.total);
    if (!total) { root.dataset.stockEnhanced = 'ready'; return; }
    const controller = new AbortController();
    root._stockAbort = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    root.setAttribute('aria-busy', 'true');
    status.textContent = status.dataset.loading;
    status.hidden = false;
    root.classList.add('stockOrderPending');
    const cache = new Map();

    async function getPage(available, page) {
      const key = `${available}:${page}`;
      if (!cache.has(key)) cache.set(key, (async () => {
        const url = new URL(originalURL);
        url.hash = '';
        url.searchParams.delete('sections');
        url.searchParams.set('section_id', root.dataset.sectionId);
        url.searchParams.set('sort_by', 'created-descending');
        url.searchParams.set(availabilityKey, available);
        url.searchParams.set('page', String(page));
        const response = await fetch(url, {signal: controller.signal, credentials: 'same-origin'});
        if (!response.ok) throw new Error('Collection request failed');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const result = doc.querySelector('[data-stock-results]');
        if (!result || result.dataset.sectionId !== root.dataset.sectionId) throw new Error('Invalid collection response');
        const count = Number(result.dataset.total);
        const cards = [...result.querySelectorAll('.collectionCard')];
        const expected = Math.min(pageSize, Math.max(0, count - (page - 1) * pageSize));
        if (!Number.isSafeInteger(count) || count < 0 || cards.length !== expected || cards.some(card => card.dataset.available !== (available === '1' ? 'true' : 'false'))) throw new Error('Invalid stock response');
        return {count, cards, result};
      })());
      return cache.get(key);
    }

    try {
      const chosen = [...new Set(originalURL.searchParams.getAll(availabilityKey).flatMap(value => value.split(',')))];
      let cards, source;
      if (chosen.length === 1 && ['0', '1'].includes(chosen[0])) {
        source = await getPage(chosen[0], currentPage);
        cards = source.cards;
      } else {
        const available = await getPage('1', 1);
        if (available.count > total) throw new Error('Stock changed during loading');
        source = available;
        const start = (currentPage - 1) * pageSize;
        const end = Math.min(start + pageSize, total);
        const ranges = [
          {value: '1', start, end: Math.min(end, available.count)},
          {value: '0', start: Math.max(0, start - available.count), end: end - available.count}
        ].filter(range => range.end > range.start);
        const chunks = await Promise.all(ranges.map(async range => {
          const first = Math.floor(range.start / pageSize) + 1;
          const last = Math.floor((range.end - 1) / pageSize) + 1;
          const pages = await Promise.all(Array.from({length: last - first + 1}, (_, i) => getPage(range.value, first + i)));
          if (range.value === '0' && pages.some(page => page.count + available.count !== total)) throw new Error('Stock changed during loading');
          return pages.flatMap(page => page.cards).slice(range.start % pageSize, range.start % pageSize + range.end - range.start);
        }));
        cards = chunks.flat();
        if (cards.length !== Math.max(0, end - start)) throw new Error('Incomplete collection page');
      }
      if (new Set(cards.map(card => card.dataset.productId)).size !== cards.length) throw new Error('Duplicate products');
      if (!root.isConnected) return;
      const grid = root.querySelector('[data-collection-grid]') || document.createElement('div');
      grid.className = 'products shopProductsGrid collectionGrid';
      grid.setAttribute('data-collection-grid', '');
      const banner = root.querySelector('[data-collection-trade]') || source.result.querySelector('[data-collection-trade]');
      grid._collectionObserver?.disconnect();
      grid.replaceChildren(...cards);
      cards.forEach(card => { card.classList.remove('reveal'); card.style.removeProperty('transition-delay'); });
      if (banner && cards.length >= 2) grid.append(banner);
      if (!grid.isConnected) root.append(grid);
      root.querySelector('.noResults')?.remove();
      const list = root.querySelector('script[type="application/ld+json"]');
      if (list) list.textContent = JSON.stringify({'@context': 'https://schema.org', '@type': 'ItemList', itemListElement: cards.map((card, index) => ({'@type': 'ListItem', position: (currentPage - 1) * pageSize + index + 1, url: new URL(card.querySelector('.productCardVisual').getAttribute('href'), location.origin).href}))});
      root.dataset.stockEnhanced = 'ready';
      status.hidden = true;
      root.dispatchEvent(new CustomEvent('iselect:collection:ordered', {bubbles: true}));
    } catch {
      root.dataset.stockEnhanced = 'error';
      status.textContent = status.dataset.error;
    } finally {
      clearTimeout(timeout);
      root.classList.remove('stockOrderPending');
      root.removeAttribute('aria-busy');
    }
  }

  function setup(root = document) { root.querySelectorAll('[data-stock-results]').forEach(order); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();
  document.addEventListener('shopify:section:load', event => setup(event.target));
  document.addEventListener('shopify:section:unload', event => event.target.querySelectorAll('[data-stock-results]').forEach(root => root._stockAbort?.abort()));
})();

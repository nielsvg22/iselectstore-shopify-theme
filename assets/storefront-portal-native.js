(() => {
  const root = document.querySelector('[data-native-portal]');
  for (const link of document.querySelectorAll('[data-portal-login]')) {
    try {
      const url = new URL(link.href, location.origin);
      if (url.origin === location.origin && url.pathname.includes('customer_authentication')) {
        url.searchParams.set('return_to', location.pathname + location.search);
        link.href = url.href;
      }
    } catch { /* Keep Shopify's original login link. */ }
  }
  if (!root) return;
  const panels = [...root.querySelectorAll('[data-native-panel]')];
  const tabs = [...root.querySelectorAll('[data-native-tab]')];
  const ids = new Set(panels.map(panel => panel.dataset.nativePanel));
  const hashTabs = {'#portal-orders': 'bestellingen', '#portal-products': 'producten', '#portal-profile': 'gegevens', '#portal-service': 'service'};
  function navigate(id, focus = true) {
    if (!ids.has(id)) return;
    for (const panel of panels) panel.hidden = panel.dataset.nativePanel !== id;
    for (const tab of tabs) {
      if (tab.dataset.nativeTab === id) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
    if (focus) root.querySelector('[data-native-content]')?.focus({preventScroll: true});
  }
  root.querySelector('[data-native-navigation]').hidden = false;
  navigate(hashTabs[location.hash] || 'overzicht', false);
  root.addEventListener('click', event => {
    const control = event.target.closest('[data-native-tab], [data-native-go]');
    if (control) { event.preventDefault(); navigate(control.dataset.nativeTab || control.dataset.nativeGo); }
  });
  // Alternative theme templates must survive Shopify's pagination links.
  for (const link of root.querySelectorAll('[data-native-pagination]')) {
    const url = new URL(link.href, location.origin);
    const view = new URL(location.href).searchParams.get('view');
    if (view) url.searchParams.set('view', view);
    link.href = url.href;
  }
  let channel;
  function scrub() {
    root.replaceChildren();
    const p = document.createElement('p');
    p.className = 'sp-notice'; p.textContent = 'Je accountgegevens zijn verborgen. Vernieuw de pagina om opnieuw verbinding te maken.';
    root.append(p);
  }
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel('iselectstore-native-account');
    channel.onmessage = () => { scrub(); }; 
    root.querySelector('[data-native-logout]')?.addEventListener('click', () => {
      channel.postMessage('logout'); scrub();
    });
  }
  window.addEventListener('pagehide', scrub);
  window.addEventListener('pageshow', event => { if (event.persisted) { scrub(); location.reload(); } });
})();

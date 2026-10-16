(() => {
  function setup(root = document) {
    root.querySelectorAll('[data-mobile-collection-controls]').forEach(bar => {
      if (bar._stickyCleanup) return;
      let frame = 0;
      const placeholder = document.createElement('div');
      placeholder.className = 'collectionControlsPlaceholder';
      placeholder.hidden = true;
      placeholder.setAttribute('aria-hidden', 'true');
      bar.before(placeholder);
      const mobileControls = matchMedia('(max-width:900px)');
      function update() {
        frame = 0;
        const header = document.getElementById('siteHeader');
        const headerBox = header?.getBoundingClientRect();
        const top = headerBox ? Math.max(0, Math.min(headerBox.bottom, headerBox.height)) : 0;
        const floating = bar.classList.contains('collectionControlsFloating');
        const anchor = (floating ? placeholder : bar).getBoundingClientRect();
        const bottom = bar.closest('.collectionMain').getBoundingClientRect().bottom;
        if (mobileControls.matches && anchor.top < top && bottom > 0) {
          placeholder.style.height = `${bar.getBoundingClientRect().height}px`;
          placeholder.hidden = false;
          bar.classList.add('collectionControlsFloating');
          const bounds = placeholder.getBoundingClientRect();
          bar.style.left = `${bounds.left}px`;
          bar.style.width = `${bounds.width}px`;
          bar.style.top = `${Math.min(Math.ceil(top), bottom - bar.getBoundingClientRect().height - 16)}px`;
        } else {
          bar.classList.remove('collectionControlsFloating');
          placeholder.hidden = true;
          bar.style.removeProperty('left');
          bar.style.removeProperty('width');
          bar.style.removeProperty('top');
        }
      }
      function schedule() { if (!frame) frame = requestAnimationFrame(update); }
      window.addEventListener('scroll', schedule, {passive: true});
      window.addEventListener('resize', schedule, {passive: true});
      const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
      const header = document.getElementById('siteHeader');
      if (header) observer?.observe(header);
      bar._stickyCleanup = () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); observer?.disconnect(); cancelAnimationFrame(frame); placeholder.remove(); };
      update();
    });
    root.querySelectorAll('[data-collection-sort]:not([data-enhanced])').forEach(form => {
      form.dataset.enhanced = 'true';
      form.querySelector('select').addEventListener('change', () => form.requestSubmit());
    });
    root.querySelectorAll('[data-collection-grid]').forEach(grid => {
      if (grid.dataset.enhanced) return;
      grid.dataset.enhanced = 'true';
      const banner = grid.querySelector('[data-collection-trade]');
      if (!banner) return;
      function positionBanner() {
        if (getComputedStyle(banner).display === 'none') return;
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
        const cards = [...grid.children].filter(node => node.classList.contains('collectionCard'));
        const last = cards[columns - 1];
        // CSS reserves row 2 before JS loads. DOM order then matches the visual and keyboard order.
        if (last && last.nextElementSibling !== banner) last.after(banner);
      }
      positionBanner();
      if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(positionBanner);
        observer.observe(grid);
        grid._collectionObserver = observer;
      } else window.addEventListener('resize', positionBanner);
    });
    const sidebar = root.querySelector('#filterSidebar');
    const toggle = document.getElementById('filterToggle');
    const close = root.querySelector('#filterClose');
    if (!sidebar || !toggle || sidebar.dataset.enhanced) return;
    sidebar.dataset.enhanced = 'true';
    const mobile = matchMedia('(max-width:900px)');
    function sync() {
      const open = sidebar.classList.contains('open');
      sidebar.inert = mobile.matches && !open;
      toggle.setAttribute('aria-expanded', String(open && mobile.matches));
    }
    function dismiss() {
      sidebar.classList.remove('open');
      document.body.classList.remove('locked');
      sync();
      toggle.focus();
    }
    toggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      document.body.classList.add('locked');
      sync();
      close?.focus();
    });
    close?.addEventListener('click', dismiss);
    sidebar.addEventListener('keydown', event => {
      if (!mobile.matches || !sidebar.classList.contains('open')) return;
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab') return;
      const controls = [...sidebar.querySelectorAll('a[href],button,input,summary,select')].filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    mobile.addEventListener('change', () => {
      sidebar.classList.remove('open');
      document.body.classList.remove('locked');
      sync();
    });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();
  document.addEventListener('shopify:section:load', event => setup(event.target));
  document.addEventListener('iselect:collection:ordered', event => {
    event.target.querySelectorAll('[data-collection-grid]').forEach(grid => delete grid.dataset.enhanced);
    setup(event.target);
  });
  document.addEventListener('shopify:section:unload', event => {
    event.target.querySelectorAll('[data-collection-grid]').forEach(grid => grid._collectionObserver?.disconnect());
    event.target.querySelectorAll('[data-mobile-collection-controls]').forEach(bar => bar._stickyCleanup?.());
  });
})();

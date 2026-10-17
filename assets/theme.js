// "Vers in voorraad": hartje-knop (puur visueel, lokaal onthouden, geen account/backend)
(function () {
  var likeBtns = document.querySelectorAll('[data-fresh-like]');
  if (!likeBtns.length) return;
  var stored;
  try { stored = JSON.parse(localStorage.getItem('freshStockLikes') || '[]'); } catch (e) { stored = []; }
  function likeKey(btn) {
    var link = btn.nextElementSibling;
    return (link && link.getAttribute('href')) || '';
  }
  likeBtns.forEach(function (btn) {
    if (stored.indexOf(likeKey(btn)) !== -1) btn.classList.add('is-liked');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var k = likeKey(btn);
      var idx = stored.indexOf(k);
      if (idx === -1) { stored.push(k); btn.classList.add('is-liked'); }
      else { stored.splice(idx, 1); btn.classList.remove('is-liked'); }
      try { localStorage.setItem('freshStockLikes', JSON.stringify(stored)); } catch (e) {}
    });
  });
})();

// Cart upsell: quick-add accessory to cart, then reload so totals/summary update
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-upsell-add]');
  if (!btn || btn.disabled) return;
  var variantId = parseInt(btn.dataset.variantId, 10);
  if (!variantId) return;
  btn.disabled = true;
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
  })
    .then(function (r) { if (!r.ok) throw new Error('add failed'); return r.json(); })
    .then(function () { window.location.reload(); })
    .catch(function () { btn.disabled = false; });
});

// Header scroll shadow
document.addEventListener('scroll', function () {
  var h = document.getElementById('siteHeader');
  if (h) h.classList.toggle('scrolled', window.scrollY > 4);
}, { passive: true });

// USP-balk: roteert elke 3.5s naar het volgende paar USP's
(function () {
  var bar = document.getElementById('uspBar');
  if (!bar) return;
  var pairs = bar.querySelectorAll('.topPair');
  if (pairs.length < 2) return;
  var mq = window.matchMedia('(min-width: 901px)');
  if (mq.matches) return; // desktop toont alle USP's naast elkaar, geen rotatie nodig
  var i = 0;
  setInterval(function () {
    pairs[i].classList.remove('is-active');
    i = (i + 1) % pairs.length;
    pairs[i].classList.add('is-active');
  }, 3500);
})();

// Mobile menu
var burger = document.getElementById('burger');
var mnav = document.getElementById('mnav');
if (burger && mnav) {
  burger.addEventListener('click', function () {
    var open = mnav.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.classList.toggle('locked', open);
  });
  mnav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mnav.classList.remove('open');
      burger.classList.remove('open');
      document.body.classList.remove('locked');
    });
  });
}

// Search overlay
var searchIcon = document.getElementById('searchIcon');
var searchOverlay = document.getElementById('searchOverlay');
var searchClose = document.getElementById('searchClose');
if (searchIcon && searchOverlay) {
  searchIcon.addEventListener('click', function () {
    searchOverlay.classList.add('open');
    var input = searchOverlay.querySelector('input[type="search"]');
    if (input) setTimeout(function () { input.focus(); }, 150);
  });
}
if (searchClose && searchOverlay) {
  searchClose.addEventListener('click', function () { searchOverlay.classList.remove('open'); });
  searchOverlay.addEventListener('click', function (e) { if (e.target === searchOverlay) searchOverlay.classList.remove('open'); });
}

// Batterijconditie-uitleg popup (productpagina)
var batteryInfoOverlay = document.getElementById('batteryInfoOverlay');
var batteryInfoClose = document.getElementById('batteryInfoClose');
if (batteryInfoOverlay) {
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-battery-info-trigger')) {
      e.preventDefault();
      batteryInfoOverlay.classList.add('open');
    }
  });
  if (batteryInfoClose) batteryInfoClose.addEventListener('click', function () { batteryInfoOverlay.classList.remove('open'); });
  batteryInfoOverlay.addEventListener('click', function (e) { if (e.target === batteryInfoOverlay) batteryInfoOverlay.classList.remove('open'); });
}

// Live zoeksuggesties (Shopify predictive search) onder het zoekveld
(function () {
  var input = document.querySelector('.shopSearchInput');
  var box = document.querySelector('[data-search-suggest]');
  if (!input || !box) return;
  var debounceTimer;
  var currentRequest = 0;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function hide() { box.hidden = true; box.innerHTML = ''; }
  function render(products) {
    if (!products.length) { hide(); return; }
    box.innerHTML = products.map(function (p) {
      var img = p.image ? '<img src="' + escapeHtml(p.image) + '" alt="" width="44" height="44">' : '<span class="searchSuggest__noimg"></span>';
      return '<a class="searchSuggest__item" href="' + escapeHtml(p.url) + '">' + img +
        '<span class="searchSuggest__info"><b>' + escapeHtml(p.title) + '</b><small>' + escapeHtml(p.price) + '</small></span></a>';
    }).join('');
    box.hidden = false;
  }
  input.addEventListener('input', function () {
    var term = input.value.trim();
    clearTimeout(debounceTimer);
    if (term.length < 2) { hide(); return; }
    debounceTimer = setTimeout(function () {
      var requestId = ++currentRequest;
      fetch('/search/suggest.json?q=' + encodeURIComponent(term) + '&resources[type]=product&resources[limit]=6&resources[options][fields]=title,product_type')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (requestId !== currentRequest) return; // verouderd antwoord, negeren
          var products = ((data.resources && data.resources.results && data.resources.results.products) || []).map(function (p) {
            return { title: p.title, url: p.url, image: p.featured_image && p.featured_image.url, price: p.price };
          });
          render(products);
        })
        .catch(function () { hide(); });
    }, 250);
  });
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input) hide();
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();

// Category tab filter (client-side, among rendered cards)
var tabs = document.querySelectorAll('#catTabs .tab');
if (tabs.length) {
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      var cat = t.dataset.cat;
      var grid = t.closest('section').querySelector('.products');
      if (!grid) return;
      grid.querySelectorAll('.card').forEach(function (card) {
        var show = cat === 'Alle' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

// Scroll-reveal animations
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
if (window.MutationObserver) {
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return;
        if (n.classList && n.classList.contains('reveal')) io.observe(n);
        if (n.querySelectorAll) n.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

// Reviews slider (one review at a time, with arrows + dots)
document.querySelectorAll('.reviewsSlider').forEach(function (slider) {
  var track = slider.querySelector('.reviewsTrack');
  var slides = slider.querySelectorAll('.review');
  var dots = slider.querySelectorAll('.reviewsDot');
  var prev = slider.querySelector('.reviewsArrow.prev');
  var next = slider.querySelector('.reviewsArrow.next');
  if (!track || slides.length < 2) return;
  var index = 0;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function (d, di) { d.classList.toggle('active', di === index); });
  }
  if (prev) prev.addEventListener('click', function () { go(index - 1); });
  if (next) next.addEventListener('click', function () { go(index + 1); });
  dots.forEach(function (d, di) { d.addEventListener('click', function () { go(di); }); });

  var startX = null;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 40) go(index + (diff < 0 ? 1 : -1));
    startX = null;
  });
});

// Accordion (FAQ, product description, specs)
document.querySelectorAll('.accHead').forEach(function (h) {
  h.addEventListener('click', function () {
    var item = h.closest('.accItem');
    var group = item.parentElement;
    var body = item.querySelector('.accBody');
    var wasOpen = item.classList.contains('open');
    group.querySelectorAll('.accItem').forEach(function (i) {
      i.classList.remove('open');
      i.querySelector('.accBody').style.maxHeight = 0;
    });
    if (!wasOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

// Product gallery thumbnails
document.querySelectorAll('.thumb').forEach(function (t) {
  t.addEventListener('click', function () {
    document.querySelectorAll('.thumb').forEach(function (x) { x.classList.remove('active'); });
    t.classList.add('active');
    var main = document.getElementById('mainImg');
    if (main) { main.src = t.dataset.img; main.dataset.full = t.dataset.full; }
  });
});

// Product photo lightbox (zoom)
(function () {
  var lightbox = document.getElementById('lightbox');
  var mainImg = document.getElementById('mainImg');
  if (!lightbox || !mainImg) return;

  var lbImg = document.getElementById('lightboxImg');
  var counter = document.getElementById('lightboxCounter');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');
  var zoomBtn = document.getElementById('galleryZoom');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));
  var images = thumbs.length ? thumbs.map(function (t) { return t.dataset.full; }) : [mainImg.dataset.full];
  var index = 0;

  function activeIndex() {
    var i = -1;
    thumbs.forEach(function (t, idx) { if (t.classList.contains('active')) i = idx; });
    return i >= 0 ? i : 0;
  }

  function render() {
    lbImg.src = images[index];
    var multi = images.length > 1;
    counter.style.display = multi ? '' : 'none';
    prevBtn.style.display = multi ? '' : 'none';
    nextBtn.style.display = multi ? '' : 'none';
    if (multi) counter.textContent = (index + 1) + ' / ' + images.length;
  }

  function openLightbox() {
    index = activeIndex();
    render();
    lightbox.classList.add('open');
    document.body.classList.add('locked');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.classList.remove('locked');
  }
  function go(dir) {
    index = (index + dir + images.length) % images.length;
    render();
  }

  if (zoomBtn) zoomBtn.addEventListener('click', openLightbox);
  mainImg.addEventListener('click', openLightbox);
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
})();

// Product page: accessories + add to cart (AJAX, multi-item)
(function () {
  var buyRow = document.querySelector('.buyRow[data-base-price]');
  if (!buyRow) return;
  var basePrice = parseInt(buyRow.dataset.basePrice, 10) || 0;
  var currency = buyRow.dataset.currency || 'EUR';

  function fmt(cents) {
    try {
      var locale = (window.themeStrings && window.themeStrings.locale) || 'nl-NL';
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(cents / 100);
    } catch (e) {
      return '€ ' + (cents / 100).toFixed(2);
    }
  }

  var accChecks = document.querySelectorAll('.accessory input');
  function updateTotal() {
    var total = basePrice;
    accChecks.forEach(function (cb) { if (cb.checked) total += parseInt(cb.dataset.price, 10); });
    var text = fmt(total);
    document.querySelectorAll('.js-total').forEach(function (el) { el.textContent = text; });
    document.querySelectorAll('.js-total-inline').forEach(function (el) { el.textContent = text; });
  }
  accChecks.forEach(function (cb) { cb.addEventListener('change', updateTotal); });
  updateTotal();

  var productForm = document.getElementById('productForm');
  function collectItems() {
    var idInput = productForm.querySelector('[name="id"]');
    var items = [{ id: parseInt(idInput.value, 10), quantity: 1 }];
    accChecks.forEach(function (cb) {
      if (cb.checked) items.push({ id: parseInt(cb.dataset.variantId, 10), quantity: 1 });
    });
    return items;
  }
  function addToCart(e) {
    if (e) e.preventDefault();
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: collectItems() })
    })
      .then(function (r) { if (!r.ok) throw new Error('add failed'); return r.json(); })
      .then(function () { window.location.href = '/cart'; })
      .catch(function () { if (productForm) productForm.submit(); });
  }
  if (productForm) productForm.addEventListener('submit', addToCart);
  var mobileBtn = document.getElementById('addToCartMobile');
  if (mobileBtn) mobileBtn.addEventListener('click', addToCart);
})();

// Collection page: mobile filter drawer
var filterToggle = document.getElementById('filterToggle');
var filterSidebar = document.getElementById('filterSidebar');
var filterClose = document.getElementById('filterClose');
if (filterToggle && filterSidebar) {
  filterToggle.addEventListener('click', function () {
    filterSidebar.classList.add('open');
    document.body.classList.add('locked');
  });
}
if (filterClose && filterSidebar) {
  filterClose.addEventListener('click', function () {
    filterSidebar.classList.remove('open');
    document.body.classList.remove('locked');
  });
}

// Trade-in value estimator (modal, self-contained)
(function () {
  var TS = (window.themeStrings && window.themeStrings.strings) || {};
  var ti = TS.tradeIn || {};
  var modelStrings = TS.tradeInModels || {};

  function pick(map, key, fallback) {
    return (map && map[key]) || fallback;
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function tpl(str, vars) {
    var out = String(str == null ? '' : str);
    Object.keys(vars || {}).forEach(function (k) {
      out = out.split('{{ ' + k + ' }}').join(vars[k]);
    });
    return out;
  }

  var MODELS = [
    { name: 'iPhone 13' },
    { name: 'iPhone 14' },
    { name: 'iPhone 15' },
    { name: 'iPhone 16' },
    { name: pick(modelStrings, 'ipad', 'iPad (2020 of nieuwer)') },
    { name: pick(modelStrings, 'macbook', 'MacBook Air/Pro (M1 of nieuwer)') },
    { name: pick(modelStrings, 'watch', 'Apple Watch (Series 6 of nieuwer)') }
  ];
  var STORAGE = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB', pick(ti, 'storage_other', 'Anders / weet ik niet')];
  var YES_NO = [pick(ti, 'yes', 'Ja'), pick(ti, 'no', 'Nee')];
  var SCRATCHES = [
    pick(ti, 'scratches_light', 'Enkele lichte krasjes'),
    pick(ti, 'scratches_heavy', 'Veel krasjes'),
    pick(ti, 'scratches_broken', 'Kapot')
  ];
  var ACCESSORIES = [
    pick(ti, 'accessories_yes', 'Ja, doosje en kabel aanwezig'),
    pick(ti, 'accessories_partial', 'Gedeeltelijk (alleen toestel of alleen doosje)'),
    pick(ti, 'accessories_no', 'Nee, alleen het toestel')
  ];
  var ICLOUD = [
    pick(ti, 'icloud_yes', 'Ja, uitgezet'),
    pick(ti, 'icloud_no', 'Nee, nog niet'),
    pick(ti, 'icloud_unsure', 'Weet ik niet')
  ];
  var state = { step: 1, display: 1 };

  function build() {
    var overlay = document.createElement('div');
    overlay.className = 'tiOverlay';
    overlay.id = 'tiOverlay';
    overlay.innerHTML = '<div class="tiModal"><button class="tiClose" id="tiClose" aria-label="' + esc(pick(ti, 'close_aria', 'Sluiten')) + '">×</button><div id="tiBody"></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('tiClose').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  }
  function open() {
    state = { step: 1, display: 1 };
    if (!document.getElementById('tiOverlay')) build();
    render();
    document.getElementById('tiOverlay').classList.add('open');
    document.body.classList.add('locked');
  }
  function close() {
    var ov = document.getElementById('tiOverlay');
    if (ov) ov.classList.remove('open');
    document.body.classList.remove('locked');
  }
  function stepHeader(labelKey, vars) {
    return '<p class="tiEyebrow">' + esc(tpl(pick(ti, 'step_of', ''), { current: state.display })) + '</p><h3>' + esc(tpl(pick(ti, labelKey, ''), vars || {})) + '</h3>';
  }
  function optionGrid(options, onPick) {
    var grid = document.createElement('div');
    grid.className = 'tiGrid';
    grid.innerHTML = options.map(function (label, i) { return '<button class="tiOption" data-i="' + i + '">' + esc(label) + '</button>'; }).join('');
    grid.querySelectorAll('.tiOption').forEach(function (btn) {
      btn.addEventListener('click', function () { onPick(parseInt(btn.dataset.i, 10)); });
    });
    return grid;
  }
  function backButton(toStep, toDisplay) {
    var btn = document.createElement('button');
    btn.className = 'tiBack';
    btn.innerHTML = '← ' + esc(pick(ti, 'back', 'Terug'));
    btn.addEventListener('click', function () { state.step = toStep; state.display = toDisplay; render(); });
    return btn;
  }
  function textStep(placeholder, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'tiTextStep';
    var input = document.createElement('input');
    input.type = opts.numeric ? 'number' : 'text';
    if (opts.numeric) { input.min = 0; input.max = opts.max || 999999; }
    input.className = 'tiInput';
    input.placeholder = placeholder;
    wrap.appendChild(input);
    var btnRow = document.createElement('div');
    btnRow.className = 'tiTextActions';
    var goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'btn primary';
    goBtn.style.cssText = 'width:100%;justify-content:center';
    goBtn.textContent = pick(ti, 'continue_label', 'Doorgaan');
    goBtn.addEventListener('click', function () { opts.onSubmit(input.value.trim()); });
    btnRow.appendChild(goBtn);
    if (opts.skippable) {
      var skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'tiBack';
      skipBtn.textContent = pick(ti, 'skip', 'Overslaan');
      skipBtn.addEventListener('click', function () { opts.onSubmit(''); });
      btnRow.appendChild(skipBtn);
    }
    wrap.appendChild(btnRow);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); opts.onSubmit(input.value.trim()); } });
    setTimeout(function () { input.focus(); }, 50);
    return wrap;
  }
  function render() {
    var body = document.getElementById('tiBody');
    body.innerHTML = '';
    if (state.step === 1) {
      body.insertAdjacentHTML('beforeend', stepHeader('choose_model'));
      body.appendChild(optionGrid(MODELS.map(function (m) { return m.name; }), function (i) {
        state.model = MODELS[i]; state.step = 2; state.display = 2; render();
      }));
    } else if (state.step === 2) {
      body.insertAdjacentHTML('beforeend', stepHeader('storage_question', { model: state.model.name }));
      body.appendChild(optionGrid(STORAGE, function (i) {
        state.storage = STORAGE[i]; state.step = 3; state.display = 3; render();
      }));
      body.appendChild(backButton(1, 1));
    } else if (state.step === 3) {
      body.insertAdjacentHTML('beforeend', stepHeader('color_question', { model: state.model.name }));
      body.appendChild(textStep(pick(ti, 'color_placeholder', ''), {
        onSubmit: function (val) { if (!val) return; state.color = val; state.step = 4; state.display = 4; render(); }
      }));
      body.appendChild(backButton(2, 2));
    } else if (state.step === 4) {
      body.insertAdjacentHTML('beforeend', stepHeader('battery_exact_question', { model: state.model.name }));
      body.appendChild(textStep(pick(ti, 'battery_exact_placeholder', ''), {
        numeric: true,
        onSubmit: function (val) {
          var n = parseInt(val, 10);
          if (!val || isNaN(n) || n < 0 || n > 100) return;
          state.batteryPct = n; state.step = 5; state.display = 5; render();
        }
      }));
      body.appendChild(backButton(3, 3));
    } else if (state.step === 5) {
      body.insertAdjacentHTML('beforeend', stepHeader('cycles_question'));
      body.appendChild(textStep(pick(ti, 'cycles_placeholder', ''), {
        numeric: true,
        skippable: true,
        onSubmit: function (val) { state.cycles = val || ''; state.step = 6; state.display = 6; render(); }
      }));
      body.appendChild(backButton(4, 4));
    } else if (state.step === 6) {
      body.insertAdjacentHTML('beforeend', stepHeader('parts_question', { model: state.model.name }));
      body.appendChild(optionGrid(YES_NO, function (i) {
        state.parts = YES_NO[i]; state.step = 7; state.display = 7; render();
      }));
      body.appendChild(backButton(5, 5));
    } else if (state.step === 7) {
      body.insertAdjacentHTML('beforeend', stepHeader('sim_question', { model: state.model.name }));
      body.appendChild(optionGrid(YES_NO, function (i) {
        state.sim = YES_NO[i]; state.step = 8; state.display = 8; render();
      }));
      body.appendChild(backButton(6, 6));
    } else if (state.step === 8) {
      body.insertAdjacentHTML('beforeend', stepHeader('screen_question'));
      body.appendChild(optionGrid(YES_NO, function (i) {
        if (i === 0) {
          state.screen = YES_NO[0]; state.damage = '';
          state.screenBackStep = 8; state.screenBackDisplay = 8;
          state.step = 10; state.display = 9;
        } else {
          state.step = 9; state.display = 9;
        }
        render();
      }));
      body.appendChild(backButton(7, 7));
    } else if (state.step === 9) {
      body.insertAdjacentHTML('beforeend', stepHeader('scratches_question'));
      body.appendChild(optionGrid(SCRATCHES, function (i) {
        state.screen = SCRATCHES[i];
        if (i === 2) {
          state.step = 95; state.display = 10;
        } else {
          state.damage = '';
          state.screenBackStep = 9; state.screenBackDisplay = 9;
          state.step = 10; state.display = 10;
        }
        render();
      }));
      body.appendChild(backButton(8, 8));
    } else if (state.step === 95) {
      body.insertAdjacentHTML('beforeend', stepHeader('damage_question'));
      body.appendChild(textStep(pick(ti, 'damage_placeholder', ''), {
        onSubmit: function (val) {
          if (!val) return;
          state.damage = val;
          state.screenBackStep = 95; state.screenBackDisplay = 10;
          state.step = 10; state.display = 11;
          render();
        }
      }));
      body.appendChild(backButton(9, 9));
    } else if (state.step === 10) {
      body.insertAdjacentHTML('beforeend', stepHeader('accessories_question'));
      body.appendChild(optionGrid(ACCESSORIES, function (i) {
        state.accessories = ACCESSORIES[i]; state.step = 11; state.display = state.display + 1; render();
      }));
      body.appendChild(backButton(state.screenBackStep, state.screenBackDisplay));
    } else if (state.step === 11) {
      body.insertAdjacentHTML('beforeend', stepHeader('icloud_question'));
      body.appendChild(optionGrid(ICLOUD, function (i) {
        state.icloud = ICLOUD[i]; state.step = 12; render();
      }));
      body.appendChild(backButton(10, state.display - 1));
    } else {
      var vars = {
        model: state.model.name,
        storage: state.storage,
        color: state.color,
        battery: state.batteryPct + '%',
        cycles: state.cycles || pick(ti, 'cycles_unknown', 'Weet ik niet'),
        parts: state.parts,
        sim: state.sim,
        screen: state.screen,
        accessories: state.accessories,
        icloud: state.icloud,
        damage_line: state.damage ? tpl(pick(ti, 'whatsapp_damage_line', ''), { damage: state.damage }) : ''
      };
      var waNumber = pick(ti, 'whatsapp_number', '31643295022');
      var waMessage = tpl(pick(ti, 'whatsapp_message', ''), vars);
      var waUrl = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waMessage);
      var rows = [
        [pick(ti, 'summary_model', 'Toestel'), state.model.name],
        [pick(ti, 'summary_storage', 'Opslag'), state.storage],
        [pick(ti, 'summary_color', 'Kleur'), state.color],
        [pick(ti, 'summary_battery', 'Batterijconditie'), vars.battery],
        [pick(ti, 'summary_cycles', 'Laadcycli'), vars.cycles],
        [pick(ti, 'summary_parts', 'Onderdelen vervangen'), state.parts],
        [pick(ti, 'summary_sim', 'Fysieke simkaart'), state.sim],
        [pick(ti, 'summary_screen', 'Scherm'), state.screen + (state.damage ? ' — ' + state.damage : '')],
        [pick(ti, 'summary_accessories', 'Doosje/toebehoren'), state.accessories],
        [pick(ti, 'summary_icloud', 'iCloud/Vind mijn uitgezet'), state.icloud]
      ];
      body.insertAdjacentHTML('beforeend',
        '<p class="tiEyebrow">' + esc(pick(ti, 'estimated', '')) + '</p>' +
        '<div class="tiSummary">' + rows.map(function (r) {
          return '<div class="tiSummaryRow"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
        }).join('') + '</div>' +
        '<p class="tiNote">' + esc(pick(ti, 'note', '')) + '</p>'
      );
      var waLink = document.createElement('a');
      waLink.className = 'btn primary';
      waLink.style.cssText = 'width:100%;justify-content:center';
      waLink.href = waUrl;
      waLink.target = '_blank';
      waLink.rel = 'noopener';
      waLink.textContent = pick(ti, 'whatsapp_cta', '') + ' →';
      body.appendChild(waLink);
      var restartBtn = document.createElement('button');
      restartBtn.className = 'tiBack';
      restartBtn.innerHTML = '← ' + esc(pick(ti, 'restart', ''));
      restartBtn.addEventListener('click', function () { state = { step: 1, display: 1 }; render(); });
      body.appendChild(restartBtn);
    }
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.js-tradein-trigger');
    if (trigger) { e.preventDefault(); open(); }
  });
})();

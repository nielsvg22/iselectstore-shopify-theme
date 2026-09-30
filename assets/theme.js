// Header scroll shadow
document.addEventListener('scroll', function () {
  var h = document.getElementById('siteHeader');
  if (h) h.classList.toggle('scrolled', window.scrollY > 4);
}, { passive: true });

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
    if (main) main.src = t.dataset.img;
  });
});

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
  var conditionStrings = TS.tradeInConditions || {};

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
    { name: 'iPhone 13', value: 180 },
    { name: 'iPhone 14', value: 240 },
    { name: 'iPhone 15', value: 320 },
    { name: 'iPhone 16', value: 420 },
    { name: pick(modelStrings, 'ipad', 'iPad (2020 of nieuwer)'), value: 150 },
    { name: pick(modelStrings, 'macbook', 'MacBook Air/Pro (M1 of nieuwer)'), value: 280 },
    { name: pick(modelStrings, 'watch', 'Apple Watch (Series 6 of nieuwer)'), value: 90 }
  ];
  var CONDITIONS = [
    { name: pick(conditionStrings, 'like_new', 'Zoals nieuw'), mult: 1 },
    { name: pick(conditionStrings, 'light_wear', 'Lichte gebruikssporen'), mult: .85 },
    { name: pick(conditionStrings, 'visible_wear', 'Zichtbare slijtage'), mult: .65 },
    { name: pick(conditionStrings, 'damaged', 'Beschadigd, werkt nog'), mult: .4 }
  ];
  var state = { step: 1 };
  function fmt(n) { return '€ ' + Math.round(n); }

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
    state = { step: 1 };
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
  function render() {
    var body = document.getElementById('tiBody');
    if (state.step === 1) {
      body.innerHTML = '<p class="tiEyebrow">' + esc(tpl(pick(ti, 'step_of', ''), { current: 1, total: 3 })) + '</p><h3>' + esc(pick(ti, 'choose_model', '')) + '</h3><div class="tiGrid">' +
        MODELS.map(function (m, i) { return '<button class="tiOption" data-i="' + i + '">' + m.name + '</button>'; }).join('') + '</div>';
      body.querySelectorAll('.tiOption').forEach(function (btn) {
        btn.addEventListener('click', function () { state.model = MODELS[parseInt(btn.dataset.i, 10)]; state.step = 2; render(); });
      });
    } else if (state.step === 2) {
      body.innerHTML = '<p class="tiEyebrow">' + esc(tpl(pick(ti, 'step_of', ''), { current: 2, total: 3 })) + '</p><h3>' + esc(tpl(pick(ti, 'condition_question', ''), { model: state.model.name })) + '</h3><div class="tiGrid">' +
        CONDITIONS.map(function (c, i) { return '<button class="tiOption" data-i="' + i + '">' + c.name + '</button>'; }).join('') +
        '</div><button class="tiBack" id="tiBack1">← ' + esc(pick(ti, 'back', 'Terug')) + '</button>';
      body.querySelector('#tiBack1').addEventListener('click', function () { state.step = 1; render(); });
      body.querySelectorAll('.tiOption').forEach(function (btn) {
        btn.addEventListener('click', function () { state.condition = CONDITIONS[parseInt(btn.dataset.i, 10)]; state.step = 3; render(); });
      });
    } else {
      var est = state.model.value * state.condition.mult;
      body.innerHTML = '<p class="tiEyebrow">' + esc(pick(ti, 'estimated', '')) + '</p><div class="tiEstimate">' + fmt(est) + '</div>' +
        '<p class="tiNote">' + esc(tpl(pick(ti, 'note', ''), { model: state.model.name, condition: state.condition.name })) + '</p>' +
        '<a class="btn primary" style="width:100%;justify-content:center" href="https://wa.me/31643295022" target="_blank" rel="noopener">' + esc(pick(ti, 'whatsapp_cta', '')) + ' →</a>' +
        '<button class="tiBack" id="tiBack2">← ' + esc(pick(ti, 'restart', '')) + '</button>';
      body.querySelector('#tiBack2').addEventListener('click', function () { state = { step: 1 }; render(); });
    }
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.js-tradein-trigger');
    if (trigger) { e.preventDefault(); open(); }
  });
})();

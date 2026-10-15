/* URL parameters are untrusted hints, never evidence of order ownership. */
(() => {
  const form = document.getElementById('portalSupportForm');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  form.querySelectorAll('[data-portal-prefill]').forEach(input => {
    const value = params.get(input.dataset.portalPrefill);
    if (!input.value && value) input.value = value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, input.maxLength);
  });
  const topic = form.querySelector('#portal-topic');
  if (topic && !form.querySelector('[data-portal-result]') && ['Bestelling', 'Retour', 'Garantie', 'Overig'].includes(params.get('topic'))) {
    topic.value = params.get('topic');
  }
  const result = form.querySelector('[data-portal-result]');
  if (result) result.focus();
})();

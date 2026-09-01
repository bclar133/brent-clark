(() => {
  'use strict';

  const bgInput = document.getElementById('contrastBgHex');
  const textInput = document.getElementById('contrastTextHex');
  const preview = document.getElementById('contrastPreview');
  const gradientBadge = document.getElementById('contrastGradientBadge');

  if (!bgInput || !textInput || !preview) return;

  function normaliseHex(value) {
    const raw = String(value || '').trim().replace(/^#/, '').toUpperCase();
    return /^[0-9A-F]{6}$/.test(raw) ? `#${raw}` : '';
  }

  function gradientIsActive() {
    return gradientBadge?.classList.contains('show') || preview.dataset.gradientApplied === 'true';
  }

  function syncPreview() {
    const text = normaliseHex(textInput.value);
    if (text) preview.style.setProperty('color', text, 'important');

    if (gradientIsActive()) return;

    const bg = normaliseHex(bgInput.value);
    if (!bg) return;

    // Solid mode must explicitly clear any stale gradient/background-image state.
    // Use !important because the gradient hand-off helper also uses inline !important styles.
    preview.style.setProperty('background-image', 'none', 'important');
    preview.style.setProperty('background-color', bg, 'important');
  }

  function queueSync() {
    syncPreview();
    requestAnimationFrame(syncPreview);
    setTimeout(syncPreview, 0);
  }

  bgInput.addEventListener('input', queueSync);
  bgInput.addEventListener('change', queueSync);
  textInput.addEventListener('input', queueSync);
  textInput.addEventListener('change', queueSync);

  ['contrastBgCurrent', 'contrastTextCurrent', 'swapContrastColours', 'clearContrastGradient'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => setTimeout(queueSync, 0));
  });

  document.querySelector('.gradient-contrast-button')?.addEventListener('click', () => {
    // Let the gradient handlers run first. If a gradient did not become active,
    // restore the solid colour instead of leaving an old background behind.
    setTimeout(queueSync, 0);
  });

  queueSync();
})();

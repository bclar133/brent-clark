(() => {
  'use strict';

  const select = document.getElementById('themeSelect');
  const rocketOption = select?.querySelector('option[value="rocket"]');
  const rocketTheme = document.querySelector('.visual[data-theme="rocket"]');
  const wasSelected = select?.value === 'rocket';

  rocketOption?.remove();
  rocketTheme?.remove();

  try {
    const key = 'chalkbox-noise-meter-v1';
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved.theme === 'rocket') {
      saved.theme = 'traffic';
      localStorage.setItem(key, JSON.stringify(saved));
    }
  } catch (_) {}

  if (wasSelected && select) {
    select.value = 'traffic';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
})();

/* Keep later visual enhancement modules loaded independently of the removed Rocket theme. */
(() => {
  function loadStyle(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  }

  loadStyle('pressure-upgrade.css');
  loadScript('pressure-upgrade.js');
  loadScript('equaliser-upgrade.js');
})();

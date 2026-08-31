(() => {
  'use strict';
  const storageKey = 'teacherToolsTheme';
  const body = document.body;
  const buttons = [...document.querySelectorAll('[data-site-theme-toggle]')];

  function apply(mode, persist = true) {
    const next = mode === 'light' ? 'light' : 'dark';
    body.dataset.colourMode = next;
    const dark = next === 'dark';
    buttons.forEach((button) => {
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
      const icon = button.querySelector('[data-theme-icon]');
      const label = button.querySelector('[data-theme-label]');
      if (icon) icon.textContent = dark ? '☀' : '🌙';
      if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    });
    if (persist) localStorage.setItem(storageKey, next);
  }

  const saved = localStorage.getItem(storageKey);
  apply(saved === 'light' ? 'light' : 'dark', false);
  buttons.forEach((button) => button.addEventListener('click', () => apply(body.dataset.colourMode === 'dark' ? 'light' : 'dark')));

  /* Keep the production homepage card aligned with the current Noise Meter build. */
  const noiseMeterCard = [...document.querySelectorAll('.tool-card')].find((card) => card.getAttribute('href') === 'tools/noise-meter/');
  const noiseMeterCopy = noiseMeterCard?.querySelector('p');
  if (noiseMeterCopy) {
    noiseMeterCopy.textContent = 'Use your device microphone to monitor relative classroom noise with adjustable targets, calibration and seven animated visual themes.';
  }
})();

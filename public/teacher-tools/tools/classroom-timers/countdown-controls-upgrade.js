(() => {
  'use strict';

  if (window.__countdownControlsUpgradeV4) return;
  window.__countdownControlsUpgradeV4 = true;

  const grid = document.querySelector('#countdownWorkspace .quick-times');
  const minutes = document.getElementById('countdownMinutes');
  const seconds = document.getElementById('countdownSeconds');
  if (!grid || !minutes || !seconds) return;

  /* Filtering is no longer needed. Clear any old saved filter and keep every scene visible,
     even if the older app startup code runs after this upgrade. */
  try { localStorage.setItem('ttTimers.themeFilter', JSON.stringify('all')); } catch {}
  document.querySelector('#countdownWorkspace .theme-filters')?.remove();
  const themeGrid = document.getElementById('themeGrid');
  const revealAllThemes = () => {
    document.querySelectorAll('#countdownWorkspace .theme-card').forEach(card => {
      card.hidden = false;
      card.removeAttribute('hidden');
    });
  };
  revealAllThemes();
  if (themeGrid) {
    new MutationObserver(revealAllThemes).observe(themeGrid, {
      subtree:true,
      attributes:true,
      attributeFilter:['hidden']
    });
  }

  const style = document.createElement('style');
  style.id = 'countdownControlsUpgradeStyleV4';
  style.textContent = `
    #countdownWorkspace .quick-times{
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:7px!important;
      margin:17px 0 10px!important;
    }
    #countdownWorkspace .quick-times button{
      min-height:44px!important;
      padding:0 7px!important;
      font-size:.82rem!important;
      white-space:nowrap;
    }
    #countdownWorkspace .countdown-presets{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:7px;
      margin:0 0 17px;
    }
    #countdownWorkspace .countdown-presets button{
      min-height:40px;
      padding:0 7px;
      border:1px solid var(--line);
      border-radius:10px;
      background:var(--panel-soft);
      color:var(--ink);
      font-weight:900;
      font-size:.76rem;
      white-space:nowrap;
    }
    #countdownWorkspace .countdown-presets button:hover{
      border-color:var(--sky);
      transform:translateY(-1px);
    }
    #countdownWorkspace .countdown-presets .reset-time{
      border-color:rgba(215,89,89,.35);
      color:var(--danger);
    }
    @media(max-width:760px){
      #countdownWorkspace .quick-times,
      #countdownWorkspace .countdown-presets{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
  `;
  document.head.appendChild(style);

  const addValues = [
    [1, '+1 sec'],
    [5, '+5 sec'],
    [10, '+10 sec'],
    [30, '+30 sec'],
    [60, '+1 min'],
    [300, '+5 min'],
    [600, '+10 min']
  ];

  const existing = [...grid.querySelectorAll('button')];
  while (existing.length < addValues.length) {
    const button = document.createElement('button');
    button.type = 'button';
    grid.appendChild(button);
    existing.push(button);
  }

  existing.forEach((button, index) => {
    if (index >= addValues.length) {
      button.remove();
      return;
    }
    const [value, label] = addValues[index];
    button.textContent = label;
    button.dataset.addSeconds = String(value);
    button.removeAttribute('data-seconds');
  });

  document.querySelector('#countdownWorkspace .countdown-presets')?.remove();
  const presets = document.createElement('div');
  presets.className = 'countdown-presets';
  presets.innerHTML = `
    <button type="button" data-preset-seconds="60">1 min</button>
    <button type="button" data-preset-seconds="300">5 min</button>
    <button type="button" data-preset-seconds="600">10 min</button>
    <button type="button" class="reset-time" data-reset-time>↺ Reset</button>
  `;
  grid.insertAdjacentElement('afterend', presets);

  const currentSeconds = () => {
    const m = Math.max(0, Math.min(180, Number(minutes.value) || 0));
    const s = Math.max(0, Math.min(59, Number(seconds.value) || 0));
    return Math.round(m * 60 + s);
  };

  const applySetupSeconds = total => {
    const status = document.getElementById('stageStatus')?.textContent;
    if (status === 'Running' || status === 'Paused') document.getElementById('countdownResetBtn')?.click();

    total = Math.max(0, Math.min(180 * 60 + 59, Math.round(total)));
    minutes.value = Math.floor(total / 60);
    seconds.value = total % 60;
    minutes.dispatchEvent(new Event('change', {bubbles:true}));
  };

  const addTime = amount => {
    if (typeof window.__ttAddCountdownTime === 'function') {
      window.__ttAddCountdownTime(amount);
      return;
    }
    applySetupSeconds(currentSeconds() + amount);
  };

  grid.addEventListener('click', event => {
    const button = event.target.closest('button[data-add-seconds]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addTime(Number(button.dataset.addSeconds || 0));
  }, true);

  presets.addEventListener('click', event => {
    const preset = event.target.closest('button[data-preset-seconds]');
    const reset = event.target.closest('button[data-reset-time]');
    if (preset) applySetupSeconds(Number(preset.dataset.presetSeconds));
    else if (reset) applySetupSeconds(0);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#countdownAddTenBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addTime(10);
  }, true);
})();

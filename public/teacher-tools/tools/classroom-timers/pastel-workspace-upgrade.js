(() => {
  'use strict';

  if (window.__pastelWorkspaceUpgradeV9) return;
  window.__pastelWorkspaceUpgradeV9 = true;

  const style = document.createElement('style');
  style.id = 'pastelWorkspaceUpgradeStyleV9';
  style.textContent = `
    html[data-theme="dark"] .workspace-tab.active {
      color:#f4f8fc!important;
      background:#26364b!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 4px 13px rgba(0,0,0,.24)!important;
    }

    #intervalWorkspace .builder-stage,
    #scheduleWorkspace .builder-stage,
    #focusWorkspace .focus-panel,
    #stopwatchWorkspace #stopwatchStage {
      background-image:none!important;
      background-color:var(--workspace-pastel,#f3c6d8)!important;
      transition:background-color 7s ease-in-out!important;
    }

    body.presentation-mode #intervalWorkspace .builder-stage,
    body.presentation-mode #scheduleWorkspace .builder-stage,
    body.presentation-mode #focusWorkspace .focus-panel,
    body.presentation-mode #stopwatchWorkspace #stopwatchStage {
      background-image:none!important;
      background-color:var(--workspace-pastel,#f3c6d8)!important;
    }

    #intervalWorkspace .builder-stage,
    #scheduleWorkspace .builder-stage,
    #focusWorkspace .focus-panel {
      color:#172033;
    }
    #intervalWorkspace .builder-stage .eyebrow,
    #scheduleWorkspace .builder-stage .eyebrow,
    #focusWorkspace .focus-panel .eyebrow {
      color:#5548b8;
    }

    #intervalWorkspace .form-grid input {
      font-family:var(--display,'Fredoka',sans-serif)!important;
      font-size:1.45rem!important;
      font-weight:800!important;
      line-height:1!important;
    }

    html[data-theme="dark"] #intervalWorkspace .builder-stage,
    html[data-theme="dark"] #scheduleWorkspace .builder-stage,
    html[data-theme="dark"] #focusWorkspace .focus-panel {
      color:#172033;
      filter:saturate(.78) brightness(.82);
    }
  `;
  document.head.appendChild(style);

  const PASTELS = [
    '#f3c6d8','#ffd0c2','#ffe3a8','#cdebbf','#bdebdc','#bcdff5','#c9d0f4','#d9c6f2','#efc7e8'
  ];

  const targets = [
    document.querySelector('#intervalWorkspace .builder-stage'),
    document.querySelector('#focusWorkspace .focus-panel'),
    document.querySelector('#scheduleWorkspace .builder-stage'),
    document.querySelector('#stopwatchWorkspace #stopwatchStage')
  ].filter(Boolean);

  const states = new Map(targets.map((el, index) => [el, { index: index % PASTELS.length }]));

  function chooseNext(el) {
    const state = states.get(el);
    if (!state) return;
    let next = state.index;
    while (next === state.index && PASTELS.length > 1) next = Math.floor(Math.random() * PASTELS.length);
    state.index = next;
    el.style.setProperty('--workspace-pastel', PASTELS[next]);
  }

  targets.forEach((el, index) => {
    const first = (index * 3) % PASTELS.length;
    states.get(el).index = first;
    el.style.setProperty('--workspace-pastel', PASTELS[first]);
  });

  window.setInterval(() => targets.forEach(chooseNext), 8000);

  document.addEventListener('click', event => {
    const card = event.target.closest?.('.theme-card[data-theme]');
    if (!card) return;
    const current = document.querySelector('.theme-card.active[data-theme]');
    if (!current || current.dataset.theme === card.dataset.theme) return;
    document.getElementById('countdownResetBtn')?.click();
  }, true);

  if (!document.querySelector('script[data-countdown-controls-upgrade]')) {
    const controlsScript = document.createElement('script');
    controlsScript.src = 'countdown-controls-upgrade.js?v=4';
    controlsScript.dataset.countdownControlsUpgrade = 'true';
    document.head.appendChild(controlsScript);
  }

  if (!document.querySelector('script[data-day-night-stars-upgrade]')) {
    const starsScript = document.createElement('script');
    starsScript.src = 'day-night-stars-upgrade.js?v=1';
    starsScript.dataset.dayNightStarsUpgrade = 'true';
    document.head.appendChild(starsScript);
  }
})();

(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const state = {
    mode: 'numbers',
    muted: localStorage.getItem('chalkboxRandomiserMuted') === 'true',
    busy: false,
    history: [],
    audioContext: null
  };

  try {
    const saved = JSON.parse(localStorage.getItem('chalkboxRandomiserHistory') || '[]');
    if (Array.isArray(saved)) state.history = saved.slice(0, 20);
  } catch (_) {}

  const els = {
    tabs: $$('.workspace-tab'),
    panels: $$('.workspace-panel'),
    muteBtn: $('#muteBtn'),
    themeBtn: $('#themeBtn'),
    fullscreenBtn: $('#fullscreenBtn'),
    presentationToolbar: $('#presentationToolbar'),
    presentationMuteBtn: $('#presentationMuteBtn'),
    presentationExitBtn: $('#presentationExitBtn'),
    minNumber: $('#minNumber'),
    maxNumber: $('#maxNumber'),
    numberCount: $('#numberCount'),
    noRepeats: $('#noRepeats'),
    generateNumberBtn: $('#generateNumberBtn'),
    generateNumberAgainBtn: $('#generateNumberAgainBtn'),
    numberResults: $('#numberResults'),
    numberStatus: $('#numberStatus'),
    numberError: $('#numberError'),
    dieSides: $('#dieSides'),
    customSidesWrap: $('#customSidesWrap'),
    customSides: $('#customSides'),
    diceCount: $('#diceCount'),
    diceCountUp: $('#diceCountUp'),
    diceCountDown: $('#diceCountDown'),
    usePips: $('#usePips'),
    pipToggleRow: $('#pipToggleRow'),
    rollDiceBtn: $('#rollDiceBtn'),
    rollDiceAgainBtn: $('#rollDiceAgainBtn'),
    diceResults: $('#diceResults'),
    diceEquation: $('#diceEquation'),
    diceTotal: $('#diceTotal'),
    diceStatus: $('#diceStatus'),
    diceError: $('#diceError'),
    flipCoinBtn: $('#flipCoinBtn'),
    flipCoinAgainBtn: $('#flipCoinAgainBtn'),
    coin: $('#coin'),
    coinResult: $('#coinResult'),
    coinStatus: $('#coinStatus'),
    headsLabel: $('#headsLabel'),
    tailsLabel: $('#tailsLabel'),
    headsPreview: $('#headsPreview'),
    tailsPreview: $('#tailsPreview'),
    coinFrontLabel: $('#coinFrontLabel'),
    coinBackLabel: $('#coinBackLabel'),
    historyList: $('#historyList'),
    clearHistoryBtn: $('#clearHistoryBtn')
  };

  function randomInt(min, max) {
    const span = max - min + 1;
    if (window.crypto?.getRandomValues) {
      const maxUint = 0x100000000;
      const limit = maxUint - (maxUint % span);
      const values = new Uint32Array(1);
      do window.crypto.getRandomValues(values); while (values[0] >= limit);
      return min + (values[0] % span);
    }
    return min + Math.floor(Math.random() * span);
  }

  function randomFloat(min, max) {
    return min + Math.random() * (max - min);
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  function setMode(mode) {
    if (!['numbers', 'dice', 'coin'].includes(mode) || state.busy) return;
    state.mode = mode;
    els.tabs.forEach(tab => {
      const active = tab.dataset.workspace === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    els.panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === mode));
  }
  els.tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.workspace)));

  function getAudioContext() {
    if (state.muted) return null;
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      state.audioContext = new AudioCtx();
    }
    if (state.audioContext.state === 'suspended') state.audioContext.resume();
    return state.audioContext;
  }

  function tone(freq = 440, duration = .06, volume = .03, type = 'sine', delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + .02);
  }

  function startShuffleSound() {
    if (state.muted) return () => {};
    let step = 0;
    const tick = () => {
      tone(180 + (step % 5) * 24, .025, .012, 'square');
      step += 1;
    };
    tick();
    const id = setInterval(tick, 72);
    return () => clearInterval(id);
  }

  function numberFinishSound() {
    tone(520, .08, .025, 'triangle');
    tone(710, .11, .033, 'triangle', .08);
    tone(900, .13, .028, 'sine', .18);
  }

  function diceSound() {
    [0,.07,.14,.22,.31].forEach((delay,i) => tone(145 + i * 28, .045, .023, 'square', delay));
    tone(320, .09, .03, 'triangle', .43);
  }

  function coinSound() {
    tone(720, .05, .02, 'triangle');
    tone(980, .05, .018, 'sine', .2);
    tone(650, .1, .03, 'triangle', 1.15);
  }

  function updateMuteUI() {
    const icon = state.muted ? '🔇' : '🔊';
    const label = state.muted ? 'Unmute sounds' : 'Mute sounds';
    [els.muteBtn, els.presentationMuteBtn].forEach(btn => {
      if (!btn) return;
      btn.textContent = icon;
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.setAttribute('aria-pressed', String(state.muted));
    });
  }

  function toggleMute() {
    state.muted = !state.muted;
    localStorage.setItem('chalkboxRandomiserMuted', String(state.muted));
    updateMuteUI();
    if (!state.muted) tone(520, .07, .025);
  }
  els.muteBtn?.addEventListener('click', toggleMute);
  els.presentationMuteBtn?.addEventListener('click', toggleMute);
  updateMuteUI();

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    els.themeBtn.textContent = dark ? '☀️' : '🌙';
    els.themeBtn.title = dark ? 'Turn on light mode' : 'Turn on dark mode';
    els.themeBtn.setAttribute('aria-label', els.themeBtn.title);
    localStorage.setItem('chalkboxRandomiserTheme', dark ? 'dark' : 'light');
  }
  applyTheme(localStorage.getItem('chalkboxRandomiserTheme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  els.themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  function setPresentation(on) {
    document.body.classList.toggle('presentation-mode', on);
    els.presentationToolbar.hidden = !on;
    els.fullscreenBtn.textContent = on ? '↙' : '⛶';
  }
  async function enterPresentation() {
    setPresentation(true);
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (_) {}
  }
  async function exitPresentation() {
    setPresentation(false);
    try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (_) {}
  }
  els.fullscreenBtn.addEventListener('click', () => document.body.classList.contains('presentation-mode') ? exitPresentation() : enterPresentation());
  els.presentationExitBtn.addEventListener('click', exitPresentation);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) setPresentation(false); });

  function saveHistory() {
    localStorage.setItem('chalkboxRandomiserHistory', JSON.stringify(state.history.slice(0, 20)));
  }

  function addHistory(type, label, icon) {
    state.history.unshift({ type, label, icon, time: Date.now() });
    state.history = state.history.slice(0, 20);
    saveHistory();
    renderHistory();
  }

  function timeLabel(timestamp) {
    try {
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
    } catch (_) {
      return '';
    }
  }

  function renderHistory() {
    els.historyList.innerHTML = '';
    if (!state.history.length) {
      const empty = document.createElement('li');
      empty.className = 'history-empty';
      empty.textContent = 'Your latest results will appear here.';
      els.historyList.append(empty);
      return;
    }
    state.history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      const icon = document.createElement('span');
      icon.className = 'history-icon';
      icon.textContent = item.icon;
      const copy = document.createElement('span');
      copy.className = 'history-copy';
      const strong = document.createElement('strong');
      strong.textContent = item.label;
      const small = document.createElement('small');
      small.textContent = `${item.type} · ${timeLabel(item.time)}`;
      copy.append(strong, small);
      li.append(icon, copy);
      els.historyList.append(li);
    });
  }
  els.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });
  renderHistory();

  function numberValues(min, max, count, unique) {
    if (!unique) return Array.from({ length: count }, () => randomInt(min, max));
    const chosen = new Set();
    while (chosen.size < count) chosen.add(randomInt(min, max));
    return [...chosen];
  }

  function setNumberClass(count) {
    els.numberResults.className = `number-results ${count === 1 ? 'single' : count >= 8 ? 'many' : 'multiple'}`;
  }

  function renderNumbers(values, shuffling = false) {
    els.numberResults.innerHTML = '';
    setNumberClass(values.length);
    values.forEach(value => {
      const chip = document.createElement('span');
      chip.className = `number-chip${shuffling ? ' shuffling' : ''}`;
      chip.textContent = value;
      els.numberResults.append(chip);
    });
  }

  async function generateNumbers() {
    if (state.busy) return;
    els.numberError.textContent = '';
    const rawMin = Number.parseInt(els.minNumber.value, 10);
    const rawMax = Number.parseInt(els.maxNumber.value, 10);
    const count = clampInt(els.numberCount.value, 1, 20, 1);
    els.numberCount.value = count;
    if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) {
      els.numberError.textContent = 'Enter a valid minimum and maximum.';
      return;
    }
    const min = Math.min(rawMin, rawMax);
    const max = Math.max(rawMin, rawMax);
    els.minNumber.value = min;
    els.maxNumber.value = max;
    const range = max - min + 1;
    if (els.noRepeats.checked && count > range) {
      els.numberError.textContent = `Only ${range} unique number${range === 1 ? '' : 's'} exist in this range.`;
      return;
    }
    state.busy = true;
    els.numberStatus.textContent = 'Shuffling…';
    const finalValues = numberValues(min, max, count, els.noRepeats.checked);
    renderNumbers(numberValues(min, max, count, false), true);
    const stopSound = startShuffleSound();
    const ticker = setInterval(() => $$('.number-chip', els.numberResults).forEach(chip => chip.textContent = randomInt(min, max)), 62);
    await wait(900);
    clearInterval(ticker);
    stopSound();
    renderNumbers(finalValues);
    numberFinishSound();
    els.numberStatus.textContent = count === 1 ? 'Number selected' : `${count} numbers selected`;
    addHistory('Numbers', finalValues.join(', '), '🔢');
    state.busy = false;
  }
  els.generateNumberBtn.addEventListener('click', generateNumbers);
  els.generateNumberAgainBtn.addEventListener('click', generateNumbers);

  function currentSides() {
    return els.dieSides.value === 'custom'
      ? clampInt(els.customSides.value, 2, 1000, 30)
      : Number.parseInt(els.dieSides.value, 10);
  }

  function dieShapeValue(sides) {
    return [4, 6, 8, 10, 12, 20].includes(sides) ? String(sides) : 'custom';
  }

  const pipMap = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

  function pipFace(value) {
    const face = document.createElement('div');
    face.className = 'pip-face';
    pipMap[value].forEach(pos => {
      const pip = document.createElement('span');
      pip.className = `pip p${pos}`;
      face.append(pip);
    });
    return face;
  }

  function setDieValue(die, value, sides) {
    die.innerHTML = '';
    const useDots = sides === 6 && els.usePips.checked;
    if (useDots) {
      die.append(pipFace(value));
    } else {
      const number = document.createElement('span');
      number.textContent = value;
      die.append(number);
      const label = document.createElement('small');
      label.textContent = `D${sides}`;
      die.append(label);
    }
  }

  function createDie(value, sides) {
    const die = document.createElement('div');
    die.className = 'die';
    die.dataset.sides = dieShapeValue(sides);
    setDieValue(die, value, sides);
    return die;
  }

  function renderDice(values, sides) {
    els.diceResults.innerHTML = '';
    values.forEach(value => els.diceResults.append(createDie(value, sides)));
  }

  function jitterDice(sides) {
    const dice = $$('.die', els.diceResults);
    dice.forEach((die, index) => {
      setDieValue(die, randomInt(1, sides), sides);
      const x = randomFloat(-12, 12) + (index % 2 ? 1.5 : -1.5);
      const y = randomFloat(-9, 9);
      const rotation = randomFloat(-6, 6);
      die.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(1)}deg)`;
    });
  }

  function settleDice(values, sides) {
    const dice = $$('.die', els.diceResults);
    dice.forEach((die, index) => {
      setDieValue(die, values[index], sides);
      die.style.transform = 'translate(0px, 0px) rotate(0deg)';
    });
  }

  function syncCustomSides() {
    const enabled = els.dieSides.value === 'custom';
    els.customSidesWrap.hidden = false;
    els.customSidesWrap.classList.toggle('disabled', !enabled);
    els.customSides.disabled = !enabled;
    els.customSides.setAttribute('aria-disabled', String(!enabled));
  }

  function updatePipAvailability() {
    const enabled = els.dieSides.value === '6';
    els.usePips.disabled = !enabled;
    els.pipToggleRow.classList.toggle('disabled', !enabled);
    if (!enabled) els.usePips.checked = false;
  }

  function stepDiceCount(delta) {
    const current = clampInt(els.diceCount.value, 1, 12, 1);
    els.diceCount.value = Math.min(12, Math.max(1, current + delta));
    els.diceCount.focus();
  }
  els.diceCountUp?.addEventListener('click', () => stepDiceCount(1));
  els.diceCountDown?.addEventListener('click', () => stepDiceCount(-1));

  async function rollDice() {
    if (state.busy) return;
    els.diceError.textContent = '';
    const sides = currentSides();
    const count = clampInt(els.diceCount.value, 1, 12, 1);
    els.diceCount.value = count;
    if (!Number.isFinite(sides) || sides < 2 || sides > 1000) {
      els.diceError.textContent = 'Choose between 2 and 1000 sides.';
      return;
    }

    state.busy = true;
    els.diceStatus.textContent = 'Shaking…';
    els.diceTotal.hidden = true;
    els.diceEquation.textContent = 'Rolling…';

    const finalValues = Array.from({ length: count }, () => randomInt(1, sides));
    renderDice(Array.from({ length: count }, () => randomInt(1, sides)), sides);
    $$('.die', els.diceResults).forEach(die => die.classList.add('shaking'));
    diceSound();

    const start = performance.now();
    while (performance.now() - start < 850) {
      jitterDice(sides);
      await wait(randomInt(48, 78));
    }

    $$('.die', els.diceResults).forEach(die => die.classList.remove('shaking'));
    settleDice(finalValues, sides);

    const total = finalValues.reduce((sum, value) => sum + value, 0);
    els.diceEquation.textContent = count === 1 ? `D${sides} → ${finalValues[0]}` : finalValues.join(' + ');
    $('strong', els.diceTotal).textContent = total;
    els.diceTotal.hidden = false;
    els.diceStatus.textContent = `${count} × D${sides}`;
    addHistory('Dice', count === 1 ? `D${sides}: ${total}` : `${finalValues.join(' + ')} = ${total}`, '🎲');
    state.busy = false;
  }

  els.dieSides.addEventListener('change', () => {
    syncCustomSides();
    updatePipAvailability();
    els.diceError.textContent = '';
  });
  syncCustomSides();
  updatePipAvailability();
  els.rollDiceBtn.addEventListener('click', rollDice);
  els.rollDiceAgainBtn.addEventListener('click', rollDice);

  function cleanLabel(input, fallback) {
    const value = input.value.trim().slice(0, 24);
    return value || fallback;
  }

  function syncCoinLabels() {
    const heads = cleanLabel(els.headsLabel, 'Heads');
    const tails = cleanLabel(els.tailsLabel, 'Tails');
    els.headsPreview.textContent = heads;
    els.tailsPreview.textContent = tails;
    els.coinFrontLabel.textContent = heads.toUpperCase();
    els.coinBackLabel.textContent = tails.toUpperCase();
    localStorage.setItem('chalkboxRandomiserCoinLabels', JSON.stringify({ heads, tails }));
  }

  try {
    const labels = JSON.parse(localStorage.getItem('chalkboxRandomiserCoinLabels') || 'null');
    if (labels) {
      els.headsLabel.value = labels.heads || 'Heads';
      els.tailsLabel.value = labels.tails || 'Tails';
    }
  } catch (_) {}
  syncCoinLabels();
  els.headsLabel.addEventListener('input', syncCoinLabels);
  els.tailsLabel.addEventListener('input', syncCoinLabels);

  function animateCoinX(isHeads) {
    const startsTails = els.coin.classList.contains('show-tails');
    const startAngle = startsTails ? 180 : 0;
    const endAngle = 1440 + (isHeads ? 0 : 180);
    const duration = 1450;
    const shadow = $('.coin-shadow');

    els.coin.classList.remove('show-heads', 'show-tails', 'flipping-to-heads', 'flipping-to-tails');

    return new Promise(resolve => {
      const started = performance.now();

      function frame(now) {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 2.15);
        const angle = startAngle + (endAngle - startAngle) * eased;
        const arc = Math.sin(Math.PI * progress);
        const lift = -92 * arc;
        const scale = 1 - (.075 * arc);

        els.coin.style.transform = `translateY(${lift.toFixed(1)}px) rotateX(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;

        if (shadow) {
          const shadowScale = 1 - (.5 * arc);
          shadow.style.transform = `scale(${shadowScale.toFixed(3)})`;
          shadow.style.opacity = String((1 - (.7 * arc)).toFixed(3));
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
  }

  async function flipCoin() {
    if (state.busy) return;
    state.busy = true;
    syncCoinLabels();
    const isHeads = randomInt(0, 1) === 0;
    const result = isHeads ? cleanLabel(els.headsLabel, 'Heads') : cleanLabel(els.tailsLabel, 'Tails');
    els.coinStatus.textContent = 'Flipping…';
    els.coinResult.textContent = '…';
    coinSound();

    await animateCoinX(isHeads);

    els.coin.style.transform = '';
    const shadow = $('.coin-shadow');
    if (shadow) {
      shadow.style.transform = '';
      shadow.style.opacity = '';
    }
    els.coin.classList.add(isHeads ? 'show-heads' : 'show-tails');
    els.coinResult.textContent = result;
    els.coinStatus.textContent = result;
    addHistory('Coin', result, isHeads ? '👑' : '🦎');
    state.busy = false;
  }
  els.flipCoinBtn.addEventListener('click', flipCoin);
  els.flipCoinAgainBtn.addEventListener('click', flipCoin);

  function clearMode(mode) {
    if (state.busy) return;
    if (mode === 'numbers') {
      els.numberResults.className = 'number-results single';
      els.numberResults.innerHTML = '<span class="placeholder-mark">?</span>';
      els.numberStatus.textContent = 'Ready';
      els.numberError.textContent = '';
    } else if (mode === 'dice') {
      els.diceResults.innerHTML = '<span class="placeholder-mark">?</span>';
      els.diceEquation.textContent = 'Choose your dice and roll.';
      els.diceTotal.hidden = true;
      els.diceStatus.textContent = 'Ready';
      els.diceError.textContent = '';
    } else if (mode === 'coin') {
      els.coin.style.transform = '';
      const shadow = $('.coin-shadow');
      if (shadow) {
        shadow.style.transform = '';
        shadow.style.opacity = '';
      }
      els.coin.classList.remove('flipping-to-heads', 'flipping-to-tails', 'show-tails');
      els.coin.classList.add('show-heads');
      els.coinResult.textContent = 'Ready to flip';
      els.coinStatus.textContent = 'Ready';
    }
  }
  $$('[data-clear-mode]').forEach(btn => btn.addEventListener('click', () => clearMode(btn.dataset.clearMode)));

  function repeatCurrent() {
    if (state.mode === 'numbers') generateNumbers();
    else if (state.mode === 'dice') rollDice();
    else flipCoin();
  }

  document.addEventListener('keydown', event => {
    const tag = event.target?.tagName?.toLowerCase();
    if (['input', 'select', 'textarea'].includes(tag) && event.key !== 'Escape') return;
    if (event.code === 'Space') {
      event.preventDefault();
      repeatCurrent();
    } else if (event.key === '1') setMode('numbers');
    else if (event.key === '2') setMode('dice');
    else if (event.key === '3') setMode('coin');
    else if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      document.body.classList.contains('presentation-mode') ? exitPresentation() : enterPresentation();
    } else if (event.key === 'Escape' && document.body.classList.contains('presentation-mode')) {
      exitPresentation();
    }
  });
})();
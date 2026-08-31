(() => {
  'use strict';

  const storageKey = 'teacherToolsTheme';
  const birdFilterStorageKey = 'chalkbox-noise-bird-filter-v1';
  const body = document.body;
  const traffic = document.querySelector('.theme-traffic');
  const levelNumber = document.getElementById('levelNumber');
  const micDot = document.getElementById('micDot');
  const micBtn = document.getElementById('micBtn');
  const micStatus = document.getElementById('micStatus');
  const currentReading = document.querySelector('.current-reading');
  const topButton = document.getElementById('themeModeBtn');
  const topLabel = document.getElementById('themeModeLabel');
  const darkToggle = document.getElementById('darkModeToggle');
  const warningToggle = document.getElementById('warningSound');
  const calibrateBtn = document.getElementById('calibrateBtn');
  let birdFilterToggle = null;
  let birdFilterEnabled = localStorage.getItem(birdFilterStorageKey) === 'true';
  let manualTestEnabled = false;
  let manualTestLevel = 0;
  let manualTestToggle = null;
  let manualTestSlider = null;
  let manualTestOutput = null;

  function applyMode(mode, persist = true) {
    const next = mode === 'light' ? 'light' : 'dark';
    body.dataset.colourMode = next;
    if (darkToggle) darkToggle.checked = next === 'dark';
    const dark = next === 'dark';
    topButton?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    if (topLabel) topLabel.textContent = dark ? 'Light mode' : 'Dark mode';
    const icon = topButton?.querySelector('.mode-icon');
    if (icon) icon.textContent = dark ? '☀' : '🌙';
    if (persist) localStorage.setItem(storageKey, next);
  }

  function updateTrafficTier() {
    if (!traffic || !levelNumber) return;
    const value = Math.max(0, Math.min(100, Number(levelNumber.textContent) || 0));
    const tier = value <= 20 ? 1 : value <= 40 ? 2 : value <= 60 ? 3 : value <= 80 ? 4 : 5;
    traffic.dataset.level = String(tier);
  }

  function installBirdFilterToggle() {
    if (document.getElementById('birdNoiseFilter')) {
      birdFilterToggle = document.getElementById('birdNoiseFilter');
      return;
    }

    const row = document.createElement('label');
    row.className = 'toggle-row';
    row.innerHTML = `
      <span><b>Bird / outdoor noise filter</b><small>Softens short, sharp bird calls and similar outdoor spikes</small></span>
      <input id="birdNoiseFilter" type="checkbox" ${birdFilterEnabled ? 'checked' : ''}>
      <span class="toggle-ui" aria-hidden="true"></span>
    `;

    const darkRow = darkToggle?.closest('.toggle-row');
    const warningRow = warningToggle?.closest('.toggle-row');
    if (darkRow?.parentElement) darkRow.parentElement.insertBefore(row, darkRow);
    else if (warningRow?.parentElement) warningRow.after(row);
    else return;

    birdFilterToggle = row.querySelector('#birdNoiseFilter');
    birdFilterToggle.addEventListener('change', () => {
      birdFilterEnabled = birdFilterToggle.checked;
      localStorage.setItem(birdFilterStorageKey, String(birdFilterEnabled));
    });
  }

  function installBirdFilterProcessing() {
    const proto = window.AnalyserNode?.prototype;
    if (!proto || proto.__chalkboxBirdFilterPatched) return;

    const originalFloat = proto.getFloatTimeDomainData;
    const originalFreq = proto.getByteFrequencyData;
    if (typeof originalFloat !== 'function' || typeof originalFreq !== 'function') return;

    const analyserState = new WeakMap();

    Object.defineProperty(proto, '__chalkboxBirdFilterPatched', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false
    });

    proto.getFloatTimeDomainData = function(array) {
      originalFloat.call(this, array);
      if (!birdFilterEnabled || !array?.length) return;

      let local = analyserState.get(this);
      if (!local || local.spectrum.length !== this.frequencyBinCount) {
        local = {
          prevDb: -100,
          suppressUntil: 0,
          spectrum: new Uint8Array(this.frequencyBinCount)
        };
        analyserState.set(this, local);
      }

      originalFreq.call(this, local.spectrum);

      let sumSquares = 0;
      for (let i = 0; i < array.length; i += 1) sumSquares += array[i] * array[i];
      const rms = Math.sqrt(sumSquares / array.length);
      const db = rms > 0 ? 20 * Math.log10(rms) : -100;

      const sampleRate = this.context?.sampleRate || 48000;
      const binHz = sampleRate / this.fftSize;
      let totalPower = 0;
      let midHighPower = 0;
      let weightedFrequency = 0;

      for (let i = 1; i < local.spectrum.length; i += 1) {
        const frequency = i * binHz;
        if (frequency < 150 || frequency > 7500) continue;
        const magnitude = local.spectrum[i] / 255;
        const power = magnitude * magnitude;
        totalPower += power;
        weightedFrequency += power * frequency;
        if (frequency >= 700) midHighPower += power;
      }

      const centroid = totalPower > 0 ? weightedFrequency / totalPower : 0;
      const midHighRatio = totalPower > 0 ? midHighPower / totalPower : 0;
      const spectralProfile = totalPower > 0.004 && centroid > 850 && midHighRatio > 0.56;
      const riseDb = db - local.prevDb;
      const now = performance.now();
      const calibrationActive = calibrateBtn?.textContent?.includes('Listening');

      if ((riseDb > 5.5 && spectralProfile) || (calibrationActive && spectralProfile)) {
        local.suppressUntil = Math.max(local.suppressUntil, now + (calibrationActive ? 1300 : 950));
      }

      if (now < local.suppressUntil && spectralProfile) {
        const factor = calibrationActive ? 0.25 : 0.42;
        for (let i = 0; i < array.length; i += 1) array[i] *= factor;
      }

      local.prevDb = db;
    };
  }

  function installManualTestControls() {
    if (document.getElementById('manualTestToggle')) return;
    const darkRow = darkToggle?.closest('.toggle-row');
    if (!darkRow?.parentElement) return;

    const panel = document.createElement('div');
    panel.className = 'manual-test-panel';
    panel.innerHTML = `
      <label class="toggle-row manual-test-toggle-row">
        <span><b>Manual test mode <em class="test-badge">TEMP</em></b><small>Test theme visuals without making any noise</small></span>
        <input id="manualTestToggle" type="checkbox">
        <span class="toggle-ui" aria-hidden="true"></span>
      </label>
      <label class="range-row manual-test-range">
        <span><b>Test sound level</b><output id="manualTestOutput">0</output></span>
        <input id="manualTestSlider" type="range" min="0" max="100" step="1" value="0" disabled>
      </label>
    `;
    darkRow.parentElement.insertBefore(panel, darkRow);

    const style = document.createElement('style');
    style.id = 'manualTestStyles';
    style.textContent = `
      .manual-test-panel{margin-top:16px;padding-top:2px;border-top:1px dashed rgba(91,108,101,.28)}
      .manual-test-panel .toggle-row{margin-top:13px}
      .manual-test-range{margin-top:12px;opacity:.52;transition:opacity .18s ease}
      .manual-test-panel.is-active .manual-test-range{opacity:1}
      .manual-test-range input{accent-color:#8b6ec2!important}
      .test-badge{display:inline-block;margin-left:5px;padding:2px 5px;border-radius:5px;background:#8b6ec2;color:white;font-style:normal;font-size:.58rem;letter-spacing:.06em;vertical-align:1px}
    `;
    document.head.appendChild(style);

    manualTestToggle = panel.querySelector('#manualTestToggle');
    manualTestSlider = panel.querySelector('#manualTestSlider');
    manualTestOutput = panel.querySelector('#manualTestOutput');

    manualTestToggle.addEventListener('change', () => {
      manualTestEnabled = manualTestToggle.checked;
      panel.classList.toggle('is-active', manualTestEnabled);
      manualTestSlider.disabled = !manualTestEnabled;
      if (manualTestEnabled) {
        if (micDot?.classList.contains('active')) micBtn?.click();
        if (micStatus) micStatus.textContent = 'Manual test mode is active. Move the slider to test each visual without using the microphone.';
      } else if (micStatus) {
        micStatus.textContent = 'Microphone access stays in this browser. Chalkbox does not record or upload audio.';
      }
    });

    manualTestSlider.addEventListener('input', () => {
      manualTestLevel = Math.max(0, Math.min(100, Number(manualTestSlider.value) || 0));
      manualTestOutput.textContent = String(manualTestLevel);
    });
  }

  function mixColour(a, b, t) {
    const p = Math.max(0, Math.min(1, t));
    const rgb = a.map((value, i) => Math.round(value + (b[i] - value) * p));
    return `rgb(${rgb.join(',')})`;
  }

  function manualColour(level, quiet, loud) {
    if (level <= quiet) return mixColour([72,156,210], [77,169,129], quiet ? level / quiet : 0);
    if (level < loud) return mixColour([77,169,129], [224,173,79], (level - quiet) / Math.max(1, loud - quiet));
    return mixColour([224,173,79], [220,83,78], (level - loud) / Math.max(1, 100 - loud));
  }

  function applyManualTestVisuals() {
    if (!manualTestEnabled) return;

    const level = manualTestLevel;
    const quiet = Number(document.getElementById('quietThreshold')?.value) || 30;
    const loud = Number(document.getElementById('loudThreshold')?.value) || 68;
    const target = Number(document.getElementById('targetLevel')?.value) || 55;
    const zone = level >= loud ? 'loud' : level > quiet ? 'working' : 'quiet';
    const stage = document.getElementById('stage');
    const colour = manualColour(level, quiet, loud);

    if (levelNumber) levelNumber.textContent = String(Math.round(level));
    if (stage) stage.dataset.zone = zone;
    const zoneLabel = document.getElementById('zoneLabel');
    const zoneMessage = document.getElementById('zoneMessage');
    if (zoneLabel) zoneLabel.textContent = 'Testing visuals';
    if (zoneMessage) zoneMessage.textContent = `Manual sound level ${Math.round(level)} — microphone not required.`;

    const targetStatus = document.getElementById('targetStatus');
    const targetStrong = targetStatus?.querySelector('strong');
    if (targetStatus && targetStrong) {
      if (level <= target) {
        targetStatus.className = 'target-status on-target';
        targetStrong.textContent = 'Manual test · on target';
      } else {
        targetStatus.className = 'target-status above-target';
        targetStrong.textContent = `Manual test · ${Math.round(level - target)} above target`;
      }
    }

    updateTrafficTier();

    const volcano = document.querySelector('.theme-volcano');
    volcano?.style.setProperty('--lava-scale', (0.4 + level / 115).toFixed(2));
    volcano?.style.setProperty('--smoke-opacity', (0.08 + level / 130).toFixed(2));
    volcano?.style.setProperty('--eruption-opacity', zone === 'loud' ? Math.min(1, (level - loud + 20) / 30).toFixed(2) : '0');

    const progress = level / 100;
    const rocket = document.getElementById('rocketVisual');
    if (rocket && stage) {
      const rocketX = progress * Math.min(560, stage.clientWidth * 0.58);
      const rocketY = (Math.sin(progress * Math.PI * 0.55) * 0.58 + progress * 0.42) * Math.min(430, stage.clientHeight * 0.62);
      rocket.style.setProperty('--rocket-x', `${rocketX}px`);
      rocket.style.setProperty('--rocket-y', `${rocketY}px`);
      rocket.style.setProperty('--rocket-r', `${progress * 48}deg`);
      rocket.style.setProperty('--flame-scale', (0.35 + progress * 1.2).toFixed(2));
    }

    const balloon = document.getElementById('balloonVisual');
    balloon?.style.setProperty('--balloon-scale', (0.56 + progress * 0.72).toFixed(2));
    document.querySelector('.theme-balloon')?.classList.toggle('popped', level > 96);

    document.getElementById('thermometerMercury')?.style.setProperty('--thermo-level', `${level}%`);
    document.querySelector('.thermometer-bulb')?.style.setProperty('--thermo-colour', colour);

    const stormScene = document.getElementById('stormScene');
    const stormTheme = document.querySelector('.theme-storm');
    if (stormScene && stormTheme) {
      const cloud = level < quiet ? '#f4f8f8' : level < loud ? '#aeb9bd' : '#565d67';
      const top = level < quiet ? '#8eb7cc' : level < loud ? '#6d8190' : '#313a48';
      const bottom = level < quiet ? '#d9e7e8' : level < loud ? '#abb8bd' : '#5c6671';
      stormScene.style.setProperty('--cloud-colour', cloud);
      stormTheme.style.setProperty('--storm-top', top);
      stormTheme.style.setProperty('--storm-bottom', bottom);
      stormScene.style.setProperty('--rain-opacity', Math.max(0, (level - quiet) / 55).toFixed(2));
      stormScene.style.setProperty('--lightning-opacity', zone === 'loud' ? Math.min(1, (level - loud + 15) / 28).toFixed(2) : '0');
    }

    const emojiFace = document.getElementById('emojiFace');
    const emojiCaption = document.getElementById('emojiCaption');
    emojiFace?.style.setProperty('--emoji-colour', colour);
    if (emojiCaption) emojiCaption.textContent = zone === 'quiet' ? 'Calm classroom' : zone === 'working' ? 'Getting lively…' : 'Too noisy!';

    const minecart = document.getElementById('minecartVisual');
    if (minecart && stage) {
      const cartTravel = Math.max(0, stage.clientWidth * 0.55 - 110);
      minecart.style.setProperty('--cart-x', `${progress * cartTravel}px`);
    }

    document.getElementById('gaugeNeedle')?.style.setProperty('--needle-angle', `${-130 + progress * 260}deg`);
    document.querySelector('.gauge-wrap')?.style.setProperty('--steam-opacity', zone === 'loud' ? Math.min(1, (level - loud + 18) / 30).toFixed(2) : '0');

    const bars = [...(document.getElementById('equaliserBars')?.children || [])];
    bars.forEach((bar, i) => {
      const pattern = 0.54 + (((i * 17) % 31) / 100);
      const wave = 8 * Math.sin((i + level / 8) * 0.75);
      const height = Math.max(7, Math.min(100, 8 + level * pattern + wave));
      bar.style.setProperty('--bar-height', `${height.toFixed(1)}%`);
    });
  }

  function manualTestLoop() {
    applyManualTestVisuals();
    requestAnimationFrame(manualTestLoop);
  }

  /* Session average: time-weighted from microphone start until stop. */
  let sessionAverageNumber = null;
  let sessionRunning = false;
  let weightedTotal = 0;
  let elapsedTotal = 0;
  let lastAt = 0;
  let lastLevel = 0;

  function liveLevel() {
    return Math.max(0, Math.min(100, Number(levelNumber?.textContent) || 0));
  }

  function installSessionAverage() {
    if (!currentReading || document.getElementById('sessionAverageNumber')) return;
    const parent = currentReading.parentElement;
    if (!parent) return;

    const cluster = document.createElement('div');
    cluster.className = 'reading-cluster';
    parent.insertBefore(cluster, currentReading);
    cluster.appendChild(currentReading);

    const average = document.createElement('div');
    average.className = 'session-average';
    average.innerHTML = '<span class="session-average-number" id="sessionAverageNumber">—</span><span class="session-average-label">session average</span>';
    cluster.appendChild(average);
    sessionAverageNumber = document.getElementById('sessionAverageNumber');

    const style = document.createElement('style');
    style.id = 'sessionAverageStyles';
    style.textContent = `
      .reading-cluster{display:flex;align-items:center;gap:18px;min-width:285px}
      .session-average{display:flex;align-items:baseline;gap:7px;padding-left:18px;border-left:1px solid rgba(245,240,223,.18)}
      .session-average-number{min-width:46px;font-family:var(--display-font);font-size:1.9rem;line-height:.9;font-weight:700;color:var(--gold)}
      .session-average-label{max-width:74px;color:var(--chalk-muted);font-size:.66rem;line-height:1.05;text-transform:uppercase;letter-spacing:.075em;font-weight:900}
      body[data-colour-mode="light"] .session-average{border-left-color:rgba(35,54,49,.16)}
      body[data-colour-mode="light"] .session-average-number{color:#80642c}
      body[data-colour-mode="light"] .session-average-label{color:#5b6c65}
      @media(max-width:760px){.reading-cluster{gap:11px;min-width:0}.session-average{gap:5px;padding-left:11px}.session-average-number{min-width:38px;font-size:1.55rem}.session-average-label{font-size:.58rem}}
    `;
    document.head.appendChild(style);
  }

  function renderAverage() {
    if (!sessionAverageNumber) return;
    if (elapsedTotal <= 0) {
      sessionAverageNumber.textContent = sessionRunning ? String(Math.round(lastLevel)) : '—';
      return;
    }
    sessionAverageNumber.textContent = String(Math.round(weightedTotal / elapsedTotal));
  }

  function accrue(now = performance.now()) {
    if (!sessionRunning) return;
    const elapsed = Math.max(0, now - lastAt);
    if (elapsed > 0) {
      weightedTotal += lastLevel * elapsed;
      elapsedTotal += elapsed;
      lastAt = now;
    }
    renderAverage();
  }

  function startSession() {
    weightedTotal = 0;
    elapsedTotal = 0;
    lastLevel = liveLevel();
    lastAt = performance.now();
    sessionRunning = true;
    renderAverage();
  }

  function stopSession() {
    if (!sessionRunning) return;
    accrue(performance.now());
    sessionRunning = false;
    renderAverage();
  }

  function syncMicSession() {
    const active = Boolean(micDot?.classList.contains('active'));
    if (active && !sessionRunning) startSession();
    if (!active && sessionRunning) stopSession();
  }

  function handleLevelChange() {
    updateTrafficTier();
    if (!sessionRunning) return;
    const now = performance.now();
    accrue(now);
    lastLevel = liveLevel();
    lastAt = now;
    renderAverage();
  }

  const saved = localStorage.getItem(storageKey);
  applyMode(saved === 'light' ? 'light' : 'dark', false);
  installBirdFilterToggle();
  installBirdFilterProcessing();
  installManualTestControls();
  installSessionAverage();
  updateTrafficTier();
  syncMicSession();
  requestAnimationFrame(manualTestLoop);

  if (levelNumber) new MutationObserver(handleLevelChange).observe(levelNumber, { childList:true, characterData:true, subtree:true });
  if (micDot) new MutationObserver(syncMicSession).observe(micDot, { attributes:true, attributeFilter:['class'] });
  setInterval(() => { if (sessionRunning) accrue(performance.now()); }, 500);

  darkToggle?.addEventListener('change', () => applyMode(darkToggle.checked ? 'dark' : 'light'));
  topButton?.addEventListener('click', () => applyMode(body.dataset.colourMode === 'dark' ? 'light' : 'dark'));
})();

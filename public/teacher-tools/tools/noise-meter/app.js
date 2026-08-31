(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

  const els = {
    micBtn: $('#micBtn'),
    calibrateBtn: $('#calibrateBtn'),
    micStatus: $('#micStatus'),
    micDot: $('#micDot'),
    themeSelect: $('#themeSelect'),
    quietThreshold: $('#quietThreshold'),
    loudThreshold: $('#loudThreshold'),
    targetLevel: $('#targetLevel'),
    sensitivity: $('#sensitivity'),
    averaging: $('#averaging'),
    warningSound: $('#warningSound'),
    quietOutput: $('#quietOutput'),
    loudOutput: $('#loudOutput'),
    targetOutput: $('#targetOutput'),
    sensitivityOutput: $('#sensitivityOutput'),
    quietPill: $('#quietPill'),
    workingPill: $('#workingPill'),
    loudPill: $('#loudPill'),
    levelNumber: $('#levelNumber'),
    stage: $('#stage'),
    zoneLabel: $('#zoneLabel'),
    zoneMessage: $('#zoneMessage'),
    targetBadgeValue: $('#targetBadgeValue'),
    targetStatus: $('#targetStatus'),
    calibrationReadout: $('#calibrationReadout'),
    fullscreenBtn: $('#fullscreenBtn'),
    rocket: $('#rocketVisual'),
    balloonTheme: $('.theme-balloon'),
    balloonPop: $('#balloonPop'),
    thermometerMercury: $('#thermometerMercury'),
    stormScene: $('#stormScene'),
    emojiFace: $('#emojiFace'),
    emojiCaption: $('#emojiCaption'),
    minecart: $('#minecartVisual'),
    gaugeNeedle: $('#gaugeNeedle'),
    equaliser: $('#equaliserBars')
  };

  const settings = {
    theme: 'traffic',
    quiet: 30,
    loud: 68,
    target: 55,
    sensitivity: 1,
    averaging: 0.8,
    warningSound: false,
    floorDb: -55,
    calibrated: false
  };

  const state = {
    audioContext: null,
    analyser: null,
    stream: null,
    timeData: null,
    freqData: null,
    running: false,
    rawDb: -100,
    instantLevel: 0,
    displayLevel: 0,
    lastFrame: performance.now(),
    zone: 'quiet',
    lastZone: null,
    warningCooldownUntil: 0,
    suppressAnalysisUntil: 0,
    calibrating: false,
    calibrationSamples: [],
    calibrationEnds: 0,
    balloonPopped: false,
    balloonResetAt: 0
  };

  const storageKey = 'chalkbox-noise-meter-v1';

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      Object.assign(settings, saved);
    } catch (_) {}

    els.themeSelect.value = settings.theme;
    els.quietThreshold.value = settings.quiet;
    els.loudThreshold.value = settings.loud;
    els.targetLevel.value = settings.target;
    els.sensitivity.value = settings.sensitivity;
    els.averaging.value = String(settings.averaging);
    els.warningSound.checked = settings.warningSound;
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function normaliseThresholds(changed) {
    let quiet = Number(els.quietThreshold.value);
    let loud = Number(els.loudThreshold.value);
    if (loud - quiet < 10) {
      if (changed === 'quiet') {
        loud = clamp(quiet + 10, 45, 90);
        els.loudThreshold.value = loud;
      } else {
        quiet = clamp(loud - 10, 10, 55);
        els.quietThreshold.value = quiet;
      }
    }
    settings.quiet = quiet;
    settings.loud = loud;
  }

  function updateSettingLabels() {
    els.quietOutput.textContent = settings.quiet;
    els.loudOutput.textContent = settings.loud;
    els.targetOutput.textContent = settings.target;
    els.sensitivityOutput.textContent = `${settings.sensitivity.toFixed(1)}×`;
    els.quietPill.textContent = `Quiet ≤ ${settings.quiet}`;
    els.workingPill.textContent = `Working ${settings.quiet + 1}–${settings.loud - 1}`;
    els.loudPill.textContent = `Too loud ≥ ${settings.loud}`;
    els.targetBadgeValue.textContent = settings.target;
  }

  function setTheme(theme) {
    settings.theme = theme;
    $$('.visual[data-theme]').forEach((node) => {
      node.hidden = node.dataset.theme !== theme;
    });
    saveSettings();
  }

  function zoneForLevel(level) {
    if (level >= settings.loud) return 'loud';
    if (level > settings.quiet) return 'working';
    return 'quiet';
  }

  function zoneCopy(zone) {
    if (!state.running) return ['Ready', 'Start the microphone to begin.'];
    if (state.calibrating) return ['Listening…', 'Keep the room at its normal quiet baseline.'];
    if (zone === 'quiet') return ['Quiet', 'The room is calm.'];
    if (zone === 'working') return ['Working noise', 'A comfortable classroom level.'];
    return ['Too loud', 'Bring the room volume down.'];
  }

  async function startMicrophone() {
    if (state.running) {
      stopMicrophone();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      micError('This browser does not support microphone access.');
      return;
    }

    try {
      els.micBtn.disabled = true;
      els.micBtn.textContent = 'Requesting access…';
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.15;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      state.audioContext = ctx;
      state.analyser = analyser;
      state.stream = stream;
      state.timeData = new Float32Array(analyser.fftSize);
      state.freqData = new Uint8Array(analyser.frequencyBinCount);
      state.running = true;
      state.displayLevel = 0;
      state.lastFrame = performance.now();

      els.micBtn.disabled = false;
      els.micBtn.textContent = 'Stop microphone';
      els.calibrateBtn.disabled = false;
      els.micDot.className = 'status-dot active';
      els.micStatus.textContent = 'Microphone is active. Audio is analysed locally and is not recorded or uploaded.';
    } catch (error) {
      const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
      micError(denied ? 'Microphone permission was blocked. Allow microphone access for this site, then try again.' : 'I could not start the microphone on this device.');
    }
  }

  function stopMicrophone() {
    if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
    if (state.audioContext && state.audioContext.state !== 'closed') state.audioContext.close().catch(() => {});
    state.audioContext = null;
    state.analyser = null;
    state.stream = null;
    state.running = false;
    state.calibrating = false;
    state.displayLevel = 0;
    state.instantLevel = 0;
    els.micBtn.disabled = false;
    els.micBtn.textContent = 'Start microphone';
    els.calibrateBtn.disabled = true;
    els.calibrateBtn.textContent = 'Calibrate room';
    els.micDot.className = 'status-dot';
    els.micStatus.textContent = 'Microphone access stays in this browser. Chalkbox does not record or upload audio.';
  }

  function micError(message) {
    state.running = false;
    els.micBtn.disabled = false;
    els.micBtn.textContent = 'Try microphone again';
    els.calibrateBtn.disabled = true;
    els.micDot.className = 'status-dot error';
    els.micStatus.textContent = message;
  }

  function readMicrophone() {
    state.analyser.getFloatTimeDomainData(state.timeData);
    let sumSquares = 0;
    for (let i = 0; i < state.timeData.length; i += 1) {
      const sample = state.timeData[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / state.timeData.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    state.rawDb = clamp(db, -100, 0);

    const rangeDb = 35;
    const relative = ((state.rawDb - settings.floorDb) / rangeDb) * 100;
    state.instantLevel = clamp(relative * settings.sensitivity);

    state.analyser.getByteFrequencyData(state.freqData);
  }

  function startCalibration() {
    if (!state.running || state.calibrating) return;
    state.calibrating = true;
    state.calibrationSamples = [];
    state.calibrationEnds = performance.now() + 2200;
    els.calibrateBtn.disabled = true;
    els.calibrateBtn.textContent = 'Listening…';
    els.micStatus.textContent = 'Calibration: keep the room at the normal quiet baseline for a moment.';
  }

  function finishCalibration() {
    state.calibrating = false;
    els.calibrateBtn.disabled = false;
    els.calibrateBtn.textContent = 'Calibrate room';

    const usable = state.calibrationSamples.filter(Number.isFinite).sort((a, b) => a - b);
    if (usable.length < 5) {
      els.micStatus.textContent = 'Calibration did not get enough sound data. Try again.';
      return;
    }

    const trim = Math.floor(usable.length * 0.12);
    const trimmed = usable.slice(trim, usable.length - trim || usable.length);
    const average = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;

    settings.floorDb = clamp(average - 7, -82, -22);
    settings.calibrated = true;
    saveSettings();
    els.calibrationReadout.textContent = 'Room calibrated';
    els.micStatus.textContent = 'Room baseline saved. Recalibrate any time you move to a different room or device.';
  }

  function maybeWarning(zone, now) {
    if (!settings.warningSound || zone !== 'loud' || state.lastZone === 'loud') return;
    if (now < state.warningCooldownUntil || !state.audioContext) return;
    state.warningCooldownUntil = now + 5000;
    state.suppressAnalysisUntil = now + 450;

    try {
      const ctx = state.audioContext;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(620, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.24);
    } catch (_) {}
  }

  function updateEqualiser(level) {
    const bars = els.equaliser.children;
    if (!bars.length) return;

    if (!state.running || !state.freqData) {
      [...bars].forEach((bar, i) => {
        bar.style.setProperty('--bar-height', `${10 + ((i * 13) % 22)}%`);
      });
      return;
    }

    const usableBins = Math.min(state.freqData.length, 640);
    const stride = usableBins / bars.length;
    [...bars].forEach((bar, i) => {
      const start = Math.floor(i * stride);
      const end = Math.max(start + 1, Math.floor((i + 1) * stride));
      let sum = 0;
      for (let j = start; j < end; j += 1) sum += state.freqData[j];
      const average = sum / (end - start || 1);
      const frequencyHeight = (average / 255) * 72;
      const levelBoost = level * 0.23;
      bar.style.setProperty('--bar-height', `${clamp(7 + frequencyHeight + levelBoost, 7, 100)}%`);
    });
  }

  function updateVisuals(level, zone, now) {
    document.documentElement.style.setProperty('--meter-level', level.toFixed(2));

    const volcano = $('.theme-volcano');
    volcano.style.setProperty('--lava-scale', (0.4 + level / 115).toFixed(2));
    volcano.style.setProperty('--smoke-opacity', (0.08 + level / 130).toFixed(2));
    volcano.style.setProperty('--eruption-opacity', zone === 'loud' ? Math.min(1, (level - settings.loud + 20) / 30).toFixed(2) : '0');

    const progress = level / 100;
    const rocketX = progress * Math.min(560, els.stage.clientWidth * 0.58);
    const rocketY = (Math.sin(progress * Math.PI * 0.55) * 0.58 + progress * 0.42) * Math.min(430, els.stage.clientHeight * 0.62);
    els.rocket.style.setProperty('--rocket-x', `${rocketX}px`);
    els.rocket.style.setProperty('--rocket-y', `${rocketY}px`);
    els.rocket.style.setProperty('--rocket-r', `${progress * 48}deg`);
    els.rocket.style.setProperty('--flame-scale', (0.35 + progress * 1.2).toFixed(2));

    const balloonScale = 0.56 + progress * 0.72;
    $('#balloonVisual').style.setProperty('--balloon-scale', balloonScale.toFixed(2));
    if (level > 96 && !state.balloonPopped) {
      state.balloonPopped = true;
      state.balloonResetAt = now + 900;
      els.balloonTheme.classList.add('popped');
    }
    if (state.balloonPopped && now > state.balloonResetAt && level < 90) {
      state.balloonPopped = false;
      els.balloonTheme.classList.remove('popped');
    }

    els.thermometerMercury.style.setProperty('--thermo-level', `${level}%`);
    $('.thermometer-bulb').style.setProperty('--thermo-colour', colourForLevel(level));

    const cloud = level < settings.quiet ? '#f4f8f8' : level < settings.loud ? '#aeb9bd' : '#565d67';
    const top = level < settings.quiet ? '#8eb7cc' : level < settings.loud ? '#6d8190' : '#313a48';
    const bottom = level < settings.quiet ? '#d9e7e8' : level < settings.loud ? '#abb8bd' : '#5c6671';
    els.stormScene.style.setProperty('--cloud-colour', cloud);
    $('.theme-storm').style.setProperty('--storm-top', top);
    $('.theme-storm').style.setProperty('--storm-bottom', bottom);
    els.stormScene.style.setProperty('--rain-opacity', Math.max(0, (level - settings.quiet) / 55).toFixed(2));
    els.stormScene.style.setProperty('--lightning-opacity', zone === 'loud' ? Math.min(1, (level - settings.loud + 15) / 28).toFixed(2) : '0');

    els.emojiFace.style.setProperty('--emoji-colour', colourForLevel(level));
    els.emojiCaption.textContent = zone === 'quiet' ? 'Calm classroom' : zone === 'working' ? 'Getting lively…' : 'Too noisy!';

    const cartTravel = Math.max(0, els.stage.clientWidth * 0.55 - 110);
    els.minecart.style.setProperty('--cart-x', `${progress * cartTravel}px`);

    els.gaugeNeedle.style.setProperty('--needle-angle', `${-130 + progress * 260}deg`);
    $('.gauge-wrap').style.setProperty('--steam-opacity', zone === 'loud' ? Math.min(1, (level - settings.loud + 18) / 30).toFixed(2) : '0');

    updateEqualiser(level);
  }

  function colourForLevel(level) {
    if (level <= settings.quiet) {
      const t = settings.quiet ? level / settings.quiet : 0;
      return mixColour([72, 156, 210], [77, 169, 129], t);
    }
    if (level < settings.loud) {
      const t = (level - settings.quiet) / Math.max(1, settings.loud - settings.quiet);
      return mixColour([77, 169, 129], [224, 173, 79], t);
    }
    const t = (level - settings.loud) / Math.max(1, 100 - settings.loud);
    return mixColour([224, 173, 79], [220, 83, 78], t);
  }

  function mixColour(a, b, t) {
    const p = clamp(t, 0, 1);
    const rgb = a.map((value, i) => Math.round(value + (b[i] - value) * p));
    return `rgb(${rgb.join(',')})`;
  }

  function render(now) {
    const dt = Math.max(0.001, Math.min(0.1, (now - state.lastFrame) / 1000));
    state.lastFrame = now;

    if (state.running && state.analyser && now >= state.suppressAnalysisUntil) readMicrophone();

    if (state.calibrating) {
      if (Number.isFinite(state.rawDb) && state.rawDb > -95) state.calibrationSamples.push(state.rawDb);
      if (now >= state.calibrationEnds) finishCalibration();
    }

    const targetLevel = state.running ? state.instantLevel : 0;
    const tau = Math.max(0.05, Number(settings.averaging));
    const alpha = 1 - Math.exp(-dt / tau);
    state.displayLevel += (targetLevel - state.displayLevel) * alpha;
    if (!state.running && state.displayLevel < 0.1) state.displayLevel = 0;

    const rounded = Math.round(state.displayLevel);
    const zone = zoneForLevel(state.displayLevel);
    maybeWarning(zone, now);
    state.lastZone = state.zone;
    state.zone = zone;

    els.levelNumber.textContent = rounded;
    els.stage.dataset.zone = zone;
    const [label, message] = zoneCopy(zone);
    els.zoneLabel.textContent = label;
    els.zoneMessage.textContent = message;

    if (!state.running) {
      els.targetStatus.className = 'target-status';
      els.targetStatus.querySelector('strong').textContent = 'Waiting for microphone';
    } else if (state.displayLevel <= settings.target) {
      els.targetStatus.className = 'target-status on-target';
      els.targetStatus.querySelector('strong').textContent = 'On target';
    } else {
      els.targetStatus.className = 'target-status above-target';
      els.targetStatus.querySelector('strong').textContent = `${Math.round(state.displayLevel - settings.target)} above target`;
    }

    updateVisuals(state.displayLevel, zone, now);
    requestAnimationFrame(render);
  }

  function createEqualiserBars() {
    const count = 26;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const bar = document.createElement('span');
      bar.className = 'eq-bar';
      fragment.appendChild(bar);
    }
    els.equaliser.appendChild(fragment);
  }

  function bindEvents() {
    els.micBtn.addEventListener('click', startMicrophone);
    els.calibrateBtn.addEventListener('click', startCalibration);
    els.themeSelect.addEventListener('change', () => setTheme(els.themeSelect.value));

    els.quietThreshold.addEventListener('input', () => {
      normaliseThresholds('quiet');
      updateSettingLabels();
      saveSettings();
    });
    els.loudThreshold.addEventListener('input', () => {
      normaliseThresholds('loud');
      updateSettingLabels();
      saveSettings();
    });
    els.targetLevel.addEventListener('input', () => {
      settings.target = Number(els.targetLevel.value);
      updateSettingLabels();
      saveSettings();
    });
    els.sensitivity.addEventListener('input', () => {
      settings.sensitivity = Number(els.sensitivity.value);
      updateSettingLabels();
      saveSettings();
    });
    els.averaging.addEventListener('change', () => {
      settings.averaging = Number(els.averaging.value);
      saveSettings();
    });
    els.warningSound.addEventListener('change', () => {
      settings.warningSound = els.warningSound.checked;
      saveSettings();
    });

    els.fullscreenBtn.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch (_) {
        document.body.classList.toggle('is-fullscreen');
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const active = Boolean(document.fullscreenElement);
      document.body.classList.toggle('is-fullscreen', active);
      els.fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
      const label = els.fullscreenBtn.querySelector('.button-label');
      if (label) label.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    });

    window.addEventListener('beforeunload', () => {
      if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
    });
  }

  function init() {
    loadSettings();
    normaliseThresholds();
    settings.target = Number(els.targetLevel.value);
    settings.sensitivity = Number(els.sensitivity.value);
    settings.averaging = Number(els.averaging.value);
    updateSettingLabels();
    setTheme(settings.theme);
    createEqualiserBars();
    els.calibrationReadout.textContent = settings.calibrated ? 'Room calibration saved' : 'Default calibration';
    bindEvents();
    requestAnimationFrame(render);
  }

  init();
})();

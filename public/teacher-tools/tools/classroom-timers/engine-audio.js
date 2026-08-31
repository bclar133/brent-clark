(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !stage) return;

  let audioCtx = null;
  let masterGain = null;
  let lowOsc = null;
  let upperOsc = null;
  let moving = false;
  let silenceTimer = null;
  let trackedCar = null;
  let carObserver = null;
  let lastX = null;
  let lastY = null;
  let lastTime = null;

  function muted() {
    try {
      const stored = localStorage.getItem('ttTimers.muted');
      if (stored !== null) return JSON.parse(stored) === true;
    } catch {}
    return muteBtn?.getAttribute('aria-pressed') === 'true';
  }

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    audioCtx = new AudioContextCtor();

    const lowGain = audioCtx.createGain();
    const upperGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    masterGain = audioCtx.createGain();

    lowOsc = audioCtx.createOscillator();
    upperOsc = audioCtx.createOscillator();
    const wobble = audioCtx.createOscillator();
    const wobbleLow = audioCtx.createGain();
    const wobbleUpper = audioCtx.createGain();

    lowOsc.type = 'sawtooth';
    upperOsc.type = 'triangle';
    lowOsc.frequency.value = 54;
    upperOsc.frequency.value = 108;

    lowGain.gain.value = 0.62;
    upperGain.gain.value = 0.28;

    filter.type = 'lowpass';
    filter.frequency.value = 235;
    filter.Q.value = 1.1;
    masterGain.gain.value = 0;

    wobble.type = 'sine';
    wobble.frequency.value = 4.2;
    wobbleLow.gain.value = 1.7;
    wobbleUpper.gain.value = 3.2;

    wobble.connect(wobbleLow);
    wobble.connect(wobbleUpper);
    wobbleLow.connect(lowOsc.frequency);
    wobbleUpper.connect(upperOsc.frequency);

    lowOsc.connect(lowGain).connect(filter);
    upperOsc.connect(upperGain).connect(filter);
    filter.connect(masterGain).connect(audioCtx.destination);

    lowOsc.start();
    upperOsc.start();
    wobble.start();

    return audioCtx;
  }

  function unlockAudio() {
    const ctx = ensureAudio();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  }

  function setHum(on, speed = 0) {
    const ctx = audioCtx;
    if (!ctx || !masterGain) return;

    const audible = Boolean(on) && !muted() && sceneLayer.querySelector('.race-car') && !stage.classList.contains('finished');
    const now = ctx.currentTime;
    const targetGain = audible ? 0.018 : 0;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(targetGain, now, audible ? 0.055 : 0.035);

    if (audible && lowOsc && upperOsc) {
      const speedBoost = Math.max(0, Math.min(14, speed * 0.9));
      lowOsc.frequency.setTargetAtTime(54 + speedBoost, now, 0.09);
      upperOsc.frequency.setTargetAtTime(108 + speedBoost * 2, now, 0.09);
    }
  }

  function stopSoon(delay = 120) {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      moving = false;
      setHum(false);
    }, delay);
  }

  function syncCarMotion() {
    const car = trackedCar;
    if (!car || !car.isConnected) {
      moving = false;
      setHum(false);
      return;
    }

    const rect = sceneLayer.getBoundingClientRect();
    const left = parseFloat(car.style.left);
    const top = parseFloat(car.style.top);
    if (!rect.width || !rect.height || !Number.isFinite(left) || !Number.isFinite(top)) return;

    const x = left / 100 * rect.width;
    const y = top / 100 * rect.height;
    const now = performance.now();

    if (lastX !== null && lastY !== null && lastTime !== null) {
      const distance = Math.hypot(x - lastX, y - lastY);
      const elapsed = Math.max(1, now - lastTime);

      if (distance > 0.08 && !stage.classList.contains('finished')) {
        moving = true;
        unlockAudio();
        const pxPerFrame = distance * (16.667 / elapsed);
        setHum(true, pxPerFrame);
        stopSoon(135);
      }
    }

    lastX = x;
    lastY = y;
    lastTime = now;
  }

  function attachToCar(car) {
    if (car === trackedCar) return;

    carObserver?.disconnect();
    trackedCar = car;
    lastX = lastY = lastTime = null;
    moving = false;
    setHum(false);

    if (!car) return;

    let queued = false;
    carObserver = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        syncCarMotion();
      });
    });
    carObserver.observe(car, { attributes: true, attributeFilter: ['style'] });
    requestAnimationFrame(syncCarMotion);
  }

  function syncScene() {
    attachToCar(sceneLayer.querySelector('.race-car'));
    if (!sceneLayer.querySelector('.race-car') || stage.classList.contains('finished')) {
      moving = false;
      setHum(false);
    }
  }

  const sceneObserver = new MutationObserver(syncScene);
  sceneObserver.observe(sceneLayer, { childList: true, subtree: true });

  const stageObserver = new MutationObserver(() => {
    if (stage.classList.contains('finished')) {
      moving = false;
      clearTimeout(silenceTimer);
      setHum(false);
    }
  });
  stageObserver.observe(stage, { attributes: true, attributeFilter: ['class'] });

  const refreshMute = () => setTimeout(() => setHum(moving), 0);
  muteBtn?.addEventListener('click', refreshMute);
  presentationMuteBtn?.addEventListener('click', refreshMute);

  document.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
  document.addEventListener('keydown', unlockAudio, { capture: true });
  window.addEventListener('storage', event => {
    if (event.key === 'ttTimers.muted') setHum(moving);
  });

  syncScene();
})();

(() => {
  const current = document.currentScript;
  if (!current) return;

  const loadRopeFix = () => {
    if (document.getElementById('parachuteRopeFixScript')) return;
    const ropeFix = document.createElement('script');
    ropeFix.id = 'parachuteRopeFixScript';
    ropeFix.src = new URL('parachute-rope-fix.js', current.src).href;
    ropeFix.async = false;
    document.body.appendChild(ropeFix);
  };

  const existingUpgrade = document.getElementById('parachuteUpgradeScript');
  if (existingUpgrade || document.getElementById('parachuteCharacterUpgrade')) {
    loadRopeFix();
    return;
  }

  const parachuteUpgrade = document.createElement('script');
  parachuteUpgrade.id = 'parachuteUpgradeScript';
  parachuteUpgrade.src = new URL('parachute-upgrade.js', current.src).href;
  parachuteUpgrade.async = false;
  parachuteUpgrade.addEventListener('load', loadRopeFix, { once: true });
  document.body.appendChild(parachuteUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('rocketShootingStarsScript')) return;

  const shootingStars = document.createElement('script');
  shootingStars.id = 'rocketShootingStarsScript';
  shootingStars.src = new URL('rocket-shooting-stars.js', current.src).href;
  shootingStars.async = false;
  document.body.appendChild(shootingStars);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('hourglassLayoutFixScript')) return;

  const hourglassFix = document.createElement('script');
  hourglassFix.id = 'hourglassLayoutFixScript';
  hourglassFix.src = new URL('hourglass-layout-fix.js', current.src).href;
  hourglassFix.async = false;
  document.body.appendChild(hourglassFix);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('plantUpgradeScript')) return;

  const plantUpgrade = document.createElement('script');
  plantUpgrade.id = 'plantUpgradeScript';
  plantUpgrade.src = new URL('plant-upgrade.js', current.src).href;
  plantUpgrade.async = false;
  document.body.appendChild(plantUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('popcornUpgradeScript')) return;

  const popcornUpgrade = document.createElement('script');
  popcornUpgrade.id = 'popcornUpgradeScript';
  popcornUpgrade.src = new URL('popcorn-upgrade.js', current.src).href;
  popcornUpgrade.async = false;
  document.body.appendChild(popcornUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('popcornSequenceFixScript')) return;

  const loadSequenceFix = () => {
    if (document.getElementById('popcornSequenceFixScript')) return;
    const fix = document.createElement('script');
    fix.id = 'popcornSequenceFixScript';
    fix.src = new URL('popcorn-sequence-fix.js', current.src).href;
    fix.async = false;
    document.body.appendChild(fix);
  };

  const upgrade = document.getElementById('popcornUpgradeScript');
  if (!upgrade) {
    loadSequenceFix();
    return;
  }

  if (document.getElementById('popcornCinemaUpgradeStyleV3')) {
    loadSequenceFix();
  } else {
    upgrade.addEventListener('load', loadSequenceFix, { once: true });
  }
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('coasterUpgradeScript')) return;

  const coasterUpgrade = document.createElement('script');
  coasterUpgrade.id = 'coasterUpgradeScript';
  coasterUpgrade.src = new URL('coaster-upgrade.js', current.src).href;
  coasterUpgrade.async = false;
  document.body.appendChild(coasterUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('coasterFairgroundScript')) return;

  const loadFairground = () => {
    if (document.getElementById('coasterFairgroundScript')) return;
    const fairground = document.createElement('script');
    fairground.id = 'coasterFairgroundScript';
    fairground.src = new URL('coaster-fairground.js', current.src).href;
    fairground.async = false;
    document.body.appendChild(fairground);
  };

  const coaster = document.getElementById('coasterUpgradeScript');
  if (coaster) {
    coaster.addEventListener('load', loadFairground, { once: true });
  } else {
    loadFairground();
  }
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('mazeUpgradeScript')) return;

  const mazeUpgrade = document.createElement('script');
  mazeUpgrade.id = 'mazeUpgradeScript';
  mazeUpgrade.src = new URL('maze-upgrade.js', current.src).href;
  mazeUpgrade.async = false;
  document.body.appendChild(mazeUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('mazeMotionFixScript')) return;

  const loadMazeMotionFix = () => {
    if (document.getElementById('mazeMotionFixScript')) return;
    const fix = document.createElement('script');
    fix.id = 'mazeMotionFixScript';
    fix.src = new URL('maze-motion-fix.js', current.src).href;
    fix.async = false;
    document.body.appendChild(fix);
  };

  const mazeUpgrade = document.getElementById('mazeUpgradeScript');
  if (mazeUpgrade) {
    mazeUpgrade.addEventListener('load', loadMazeMotionFix, { once:true });
  } else {
    loadMazeMotionFix();
  }
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('candleLayoutFixScript')) return;

  const candleFix = document.createElement('script');
  candleFix.id = 'candleLayoutFixScript';
  candleFix.src = new URL('candle-layout-fix.js', current.src).href;
  candleFix.async = false;
  document.body.appendChild(candleFix);
})();
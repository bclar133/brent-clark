(() => {
  'use strict';

  if (window.__dominoWoodSoundFixV1) return;
  window.__dominoWoodSoundFixV1 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  const startBtn = document.getElementById('countdownStartBtn');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !display) return;

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

  let audioCtx = null;
  let master = null;
  let lastScene = null;
  let lastHitCount = null;
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';

  function muted(){
    try{
      const stored = localStorage.getItem('ttTimers.muted');
      if (stored !== null) return JSON.parse(stored) === true;
    }catch{}
    return muteBtn?.getAttribute('aria-pressed') === 'true' || presentationMuteBtn?.getAttribute('aria-pressed') === 'true';
  }

  function ensureAudio(){
    if (audioCtx) return audioCtx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;
    master.connect(compressor).connect(audioCtx.destination);
    return audioCtx;
  }

  function unlockAudio(){
    if (muted()) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  document.addEventListener('pointerdown', unlockAudio, {capture:true, passive:true});
  document.addEventListener('keydown', unlockAudio, {capture:true});
  startBtn?.addEventListener('pointerdown', unlockAudio, {capture:true, passive:true});
  startBtn?.addEventListener('click', unlockAudio, {capture:true});

  function fireWoodClack(index){
    if (muted()) return;
    const ctx = ensureAudio();
    if (!ctx || !master) return;

    const makeSound = () => {
      if (muted() || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const jitter = (index % 9) * 3;

      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      const bodyFilter = ctx.createBiquadFilter();
      body.type = 'triangle';
      body.frequency.setValueAtTime(310 + jitter, now);
      body.frequency.exponentialRampToValueAtTime(105 + jitter * 0.2, now + 0.105);
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.value = 1550;
      bodyFilter.Q.value = 0.7;
      bodyGain.gain.setValueAtTime(0.0001, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.19, now + 0.003);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      body.connect(bodyFilter).connect(bodyGain).connect(master);
      body.start(now);
      body.stop(now + 0.13);

      const knock = ctx.createOscillator();
      const knockGain = ctx.createGain();
      knock.type = 'sine';
      knock.frequency.setValueAtTime(680 + jitter * 2, now);
      knock.frequency.exponentialRampToValueAtTime(290, now + 0.038);
      knockGain.gain.setValueAtTime(0.0001, now);
      knockGain.gain.exponentialRampToValueAtTime(0.095, now + 0.0015);
      knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      knock.connect(knockGain).connect(master);
      knock.start(now);
      knock.stop(now + 0.05);

      const duration = 0.075;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<data.length;i++){
        const env = Math.exp(-i/(ctx.sampleRate*0.014));
        data[i] = (Math.random()*2-1) * env;
      }
      const noise = ctx.createBufferSource();
      const band = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.buffer = buffer;
      band.type = 'bandpass';
      band.frequency.value = 1150 + jitter * 3;
      band.Q.value = 0.9;
      noiseGain.gain.setValueAtTime(0.085, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      noise.connect(band).connect(noiseGain).connect(master);
      noise.start(now);
      noise.stop(now + duration);
    };

    if (ctx.state === 'running') {
      makeSound();
    } else {
      ctx.resume().then(makeSound).catch(() => {});
    }
  }

  function parseRemaining(){
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(v => !Number.isFinite(v))) return null;
    if (parts.length === 2) return parts[0]*60 + parts[1];
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60 + (Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current = parseRemaining();
    if (current === null) return 0;
    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';
    if (displayedRemaining === null || current !== displayedRemaining || status !== lastStatus){
      displayedRemaining = current;
      displayChangedAt = now;
      lastStatus = status;
    }
    let estimated = current;
    if (running && current > 0) estimated = Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-dominoes[data-xt-theme="dominoes"]');
    if (scene !== lastScene){
      lastScene = scene || null;
      lastHitCount = null;
      displayedRemaining = null;
    }

    if (scene){
      const pieces = scene.querySelectorAll('.domino2-piece');
      const count = pieces.length;
      if (count){
        const progress = progressNow(now);
        const hitCount = Math.min(count,Math.floor(progress*count));
        const running = (stageStatus?.textContent.trim()||'') === 'Running';

        if (lastHitCount === null){
          lastHitCount = hitCount;
        } else if (hitCount > lastHitCount){
          if (running){
            const from = lastHitCount;
            const to = hitCount;
            for (let i=from;i<to;i++){
              const delay = (i-from)*14;
              setTimeout(() => fireWoodClack(i), delay);
            }
          }
          lastHitCount = hitCount;
        } else if (hitCount < lastHitCount){
          lastHitCount = hitCount;
        }
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

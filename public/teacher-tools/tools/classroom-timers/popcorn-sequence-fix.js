(() => {
  'use strict';

  if (document.getElementById('popcornSequenceFixStyleV4')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'popcornSequenceFixStyleV4';
  style.textContent = `
    .sequenced-popcorn-piece{position:absolute;width:calc(40px * var(--piece-size,1) * var(--piece-x,1));height:calc(35px * var(--piece-size,1) * var(--piece-y,1));border-radius:var(--piece-radius,55% 45% 52% 48%);background:radial-gradient(circle at var(--highlight-x,30%) var(--highlight-y,28%),var(--p1,#fffef7) 0 17%,var(--p2,#fff3c9) 18% 53%,var(--p3,#ead18f) 54% 76%,var(--p4,#d9bb74) 77%);box-shadow:inset calc(-4px * var(--piece-size,1)) calc(-4px * var(--piece-size,1)) 0 rgba(211,187,119,.42),0 calc(2px + var(--depth,0) * 2px) calc(4px + var(--depth,0) * 4px) rgba(0,0,0,var(--shadow-alpha,.16));opacity:var(--piece-opacity,1);filter:brightness(var(--piece-brightness,1)) saturate(var(--piece-saturation,1));transform-origin:center;will-change:transform;z-index:var(--piece-z,10)}
    .sequenced-popcorn-piece:before,.sequenced-popcorn-piece:after{content:'';position:absolute;border-radius:50%;background:radial-gradient(circle,var(--p1,#fffefa) 0 39%,var(--p2,#f5e8bc) 40% 100%)}
    .sequenced-popcorn-piece:before{width:var(--l1w,46%);height:var(--l1h,45%);left:var(--l1x,-7%);top:var(--l1y,15%);transform:rotate(var(--l1r,-25deg))}
    .sequenced-popcorn-piece:after{width:var(--l2w,43%);height:var(--l2h,41%);right:var(--l2x,-5%);top:var(--l2y,12%);transform:rotate(var(--l2r,24deg))}
    .sequenced-popcorn-piece.shape-b{border-radius:45% 55% 41% 59% / 58% 43% 57% 42%}
    .sequenced-popcorn-piece.shape-c{border-radius:58% 42% 61% 39% / 43% 59% 41% 57%}
    .sequenced-popcorn-piece.shape-d{border-radius:42% 58% 54% 46% / 61% 39% 55% 45%}
    .sequenced-popcorn-piece.just-popped{z-index:80!important}
    @media(max-width:680px){.sequenced-popcorn-piece{width:calc(31px * var(--piece-size,1) * var(--piece-x,1));height:calc(27px * var(--piece-size,1) * var(--piece-y,1))}}
  `;
  document.head.appendChild(style);

  let audioCtx = null;
  let trackedScene = null;
  let pieces = [];
  let raw = [];
  let poppedCount = 0;
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let raf = 0;

  function isMuted() {
    try {
      const value = localStorage.getItem('ttTimers.muted');
      if (value !== null) return JSON.parse(value) === true;
    } catch {}
    return muteBtn?.getAttribute('aria-pressed') === 'true' || presentationMuteBtn?.getAttribute('aria-pressed') === 'true';
  }

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  }

  function unlockAudio() {
    const ctx = ensureAudio();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  }

  function popSound(index) {
    if (isMuted()) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = index % 3 === 0 ? 'triangle' : (index % 3 === 1 ? 'sine' : 'square');
    osc.frequency.setValueAtTime(720 + Math.random() * 310, t);
    osc.frequency.exponentialRampToValueAtTime(245 + Math.random() * 120, t + .07 + Math.random() * .025);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.022 + Math.random() * .009, t + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .09 + Math.random() * .025);
    filter.type = 'lowpass';
    filter.frequency.value = 1450 + Math.random() * 500;
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + .13);
  }

  function parseRemainingSeconds() {
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(n => !Number.isFinite(n))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  function totalSeconds() {
    return Math.max(1, (Number(minutesInput?.value) || 0) * 60 + (Number(secondsInput?.value) || 0));
  }

  function continuousProgress(now, running) {
    const current = parseRemainingSeconds();
    if (current === null) return 0;

    if (displayedRemaining === null || current !== displayedRemaining) {
      displayedRemaining = current;
      displayChangedAt = now;
    }

    let estimatedRemaining = current;
    if (running && current > 0) {
      estimatedRemaining = Math.max(0, current - (now - displayChangedAt) / 1000);
    }

    return Math.max(0, Math.min(1, 1 - estimatedRemaining / totalSeconds()));
  }

  function setPieceVisible(piece, visible) {
    const rotation = piece.dataset.rotation || '0';
    piece.style.transform = `rotate(${rotation}deg) scale(${visible ? 1 : 0})`;
  }

  function rebuildRawKernels(scene, count) {
    const bed = scene.querySelector('.raw-kernel-bed');
    if (!bed) return [];
    bed.innerHTML = '';

    const kernels = [];
    for (let i = 0; i < count; i++) {
      const kernel = document.createElement('i');
      kernel.className = 'raw-kernel';
      const scale = .74 + Math.random() * .43;
      kernel.style.left = `${1 + Math.random() * 96}%`;
      kernel.style.bottom = `${2 + Math.random() * 73}%`;
      kernel.style.transform = `rotate(${-45 + Math.random() * 90}deg) scale(${scale.toFixed(2)})`;
      kernel.dataset.baseOpacity = String(.74 + Math.random() * .26);
      kernel.style.opacity = kernel.dataset.baseOpacity;
      bed.appendChild(kernel);
      kernels.push(kernel);
    }
    return kernels;
  }

  function updateRawKernels() {
    raw.forEach((kernel, i) => {
      kernel.style.opacity = i < poppedCount ? '0' : (kernel.dataset.baseOpacity || '1');
    });
    if (poppedCount >= pieces.length) raw.forEach(kernel => { kernel.style.opacity = '0'; });
  }

  function hijackScene(scene, now) {
    if (!scene) return false;
    const original = [...scene.querySelectorAll('.cinema-popcorn-piece')];
    if (!original.length) return false;

    original.forEach(piece => {
      piece.classList.remove('cinema-popcorn-piece');
      piece.classList.add('sequenced-popcorn-piece');
    });

    trackedScene = scene;
    pieces = [...scene.querySelectorAll('.sequenced-popcorn-piece')];
    raw = rebuildRawKernels(scene, pieces.length);

    const status = stageStatus?.textContent.trim() || '';
    displayedRemaining = parseRemainingSeconds();
    displayChangedAt = now;
    const progress = continuousProgress(now, status === 'Running');
    poppedCount = Math.min(pieces.length, Math.floor(progress * pieces.length));

    pieces.forEach((piece, i) => setPieceVisible(piece, i < poppedCount));
    updateRawKernels();
    lastStatus = status;
    return true;
  }

  function animatePop(piece, kernel, index) {
    if (!piece) return;

    const finalRect = piece.getBoundingClientRect();
    const sourceRect = kernel?.getBoundingClientRect();
    const rotation = Number(piece.dataset.rotation || 0);
    let dx = 0;
    let dy = 44;

    if (sourceRect && finalRect.width && finalRect.height) {
      dx = (sourceRect.left + sourceRect.width / 2) - (finalRect.left + finalRect.width / 2);
      dy = (sourceRect.top + sourceRect.height / 2) - (finalRect.top + finalRect.height / 2);
    }

    const side = (Math.random() < .5 ? -1 : 1) * (16 + Math.random() * 28);
    const spin = (Math.random() < .5 ? -1 : 1) * (16 + Math.random() * 34);
    const apexY = Math.min(-78, dy * .18 - (82 + Math.random() * 38));
    const base = `rotate(${rotation}deg)`;

    piece.classList.add('just-popped');

    const keyframes = [
      { offset:0, transform:`translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) ${base} scale(.22,.34)` },
      { offset:.13, transform:`translate(${(dx*.82 + side*.15).toFixed(1)}px, ${(dy*.62 - 24).toFixed(1)}px) rotate(${(rotation + spin*.35).toFixed(1)}deg) scale(1.22,.78)` },
      { offset:.50, transform:`translate(${(dx*.28 + side).toFixed(1)}px, ${apexY.toFixed(1)}px) rotate(${(rotation + spin).toFixed(1)}deg) scale(.93,1.10)` },
      { offset:.72, transform:`translate(0px, 0px) ${base} scale(1.22,.76)` },
      { offset:.83, transform:`translate(0px, -13px) ${base} scale(.94,1.09)` },
      { offset:.92, transform:`translate(0px, 2px) ${base} scale(1.07,.93)` },
      { offset:1, transform:`translate(0px, 0px) ${base} scale(1,1)` }
    ];

    if (typeof piece.animate === 'function') {
      const animation = piece.animate(keyframes, {
        duration:820,
        easing:'cubic-bezier(.18,.76,.26,1)',
        fill:'none'
      });
      animation.addEventListener('finish', () => piece.classList.remove('just-popped'), { once:true });
      animation.addEventListener('cancel', () => piece.classList.remove('just-popped'), { once:true });
    } else {
      piece.style.transition = 'none';
      piece.style.transform = keyframes[0].transform;
      requestAnimationFrame(() => {
        piece.style.transition = 'transform .82s cubic-bezier(.18,.76,.26,1)';
        piece.style.transform = keyframes[keyframes.length - 1].transform;
        setTimeout(() => {
          piece.style.transition = '';
          piece.classList.remove('just-popped');
        }, 850);
      });
    }
  }

  function popOne() {
    if (poppedCount >= pieces.length) return;
    const index = poppedCount;
    const piece = pieces[index];
    const kernel = raw[index];

    poppedCount += 1;
    setPieceVisible(piece, true);
    animatePop(piece, kernel, index);
    popSound(index);
    updateRawKernels();
  }

  function loop(now) {
    const scene = sceneLayer.querySelector('.popcorn-scene');

    if (!scene) {
      trackedScene = null;
      pieces = [];
      raw = [];
      poppedCount = 0;
      displayedRemaining = null;
      lastStatus = '';
      raf = requestAnimationFrame(loop);
      return;
    }

    if (scene !== trackedScene || !scene.querySelector('.sequenced-popcorn-piece')) {
      if (!hijackScene(scene, now)) {
        raf = requestAnimationFrame(loop);
        return;
      }
    }

    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';

    if (status !== lastStatus) {
      lastStatus = status;
      displayedRemaining = parseRemainingSeconds();
      displayChangedAt = now;
    }

    const progress = continuousProgress(now, running);

    const desiredCount = progress >= 1
      ? pieces.length
      : Math.min(pieces.length, Math.floor(progress * pieces.length + .5));

    if (running && poppedCount < desiredCount) {
      popOne();
    }

    const remaining = parseRemainingSeconds();
    if (remaining === 0) {
      raw.forEach(kernel => { kernel.style.opacity = '0'; });
      if (poppedCount < pieces.length) popOne();
    }

    raf = requestAnimationFrame(loop);
  }

  document.addEventListener('pointerdown', unlockAudio, { capture:true, passive:true });
  document.addEventListener('keydown', unlockAudio, { capture:true });

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();
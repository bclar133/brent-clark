(() => {
  'use strict';

  if (document.getElementById('plantUpgradeStyleV5')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !stage) return;

  const style = document.createElement('style');
  style.id = 'plantUpgradeStyleV5';
  style.textContent = `
    .plant-scene{--plant-x:39%;overflow:hidden}
    #countdownStage.theme-plant .time-display-wrap{position:absolute!important;left:auto!important;right:4%!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;width:min(38%,390px)!important;justify-items:center!important;text-align:center!important;z-index:12!important}
    #countdownStage.theme-plant #countdownDisplay,#countdownStage.theme-plant .time-display{font-size:clamp(4.4rem,6.8vw,6.5rem)!important;padding:8px 20px 10px!important;line-height:.98!important;text-align:center!important}
    #countdownStage.theme-plant #countdownMessage,#countdownStage.theme-plant .timer-message{font-size:clamp(.95rem,1.15vw,1.08rem)!important;padding:6px 14px!important;text-align:center!important}

    .plant-scene .plant-pot,.plant-scene .plant-stem{left:var(--plant-x)!important}
    .plant-scene .plant-pot,.plant-scene .plant-stem,.plant-scene .leaf,.plant-scene .flower{z-index:5!important}
    .plant-scene .leaf{width:88px!important;height:44px!important;background:linear-gradient(135deg,#52c36b,#2f934d)!important;filter:drop-shadow(0 4px 4px rgba(37,93,54,.16));opacity:1}
    .plant-scene .leaf.l1,.plant-scene .leaf.l3{left:calc(var(--plant-x) - 88px)!important;border-radius:100% 0 100% 0!important;transform-origin:right center!important}
    .plant-scene .leaf.l1{bottom:38%!important;transform:rotate(-14deg) scale(var(--leafScale,0))!important}
    .plant-scene .leaf.l3{bottom:57%!important;transform:rotate(-9deg) scale(var(--leafScale,0))!important}
    .plant-scene .leaf.l2,.plant-scene .leaf.l4{left:var(--plant-x)!important;border-radius:0 100% 0 100%!important;transform-origin:left center!important}
    .plant-scene .leaf.l2{bottom:47%!important;transform:rotate(14deg) scale(var(--leafScale,0))!important}
    .plant-scene .leaf.l4{bottom:65%!important;transform:rotate(9deg) scale(var(--leafScale,0))!important}

    .plant-scene .flower{width:204px!important;height:204px!important;transform:translate(-50%,-50%) scale(var(--flowerScale,0))!important;transform-origin:center!important;top:auto;bottom:auto!important;pointer-events:none}
    .plant-scene .flower .petal{left:69px!important;top:6px!important;width:64px!important;height:96px!important;border-radius:60% 60% 45% 45%!important;transform-origin:32px 95px!important}
    .plant-scene .flower .petal:nth-child(2){transform:rotate(72deg)!important}.plant-scene .flower .petal:nth-child(3){transform:rotate(144deg)!important}.plant-scene .flower .petal:nth-child(4){transform:rotate(216deg)!important}.plant-scene .flower .petal:nth-child(5){transform:rotate(288deg)!important}
    .plant-scene .flower-core{left:67px!important;top:67px!important;width:70px!important;height:70px!important;box-shadow:0 3px 9px rgba(156,111,24,.22)!important}

    .plant-extras{position:absolute;inset:0;z-index:2;pointer-events:none}
    .plant-bee{--bee-scale:1;position:absolute;left:0;top:0;width:44px;height:30px;z-index:3;will-change:left,top,transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))}
    .plant-bee.b2{--bee-scale:.9}
    .plant-bee .body{position:absolute;left:9px;top:10px;width:25px;height:15px;border-radius:14px;background:repeating-linear-gradient(90deg,#ffd84e 0 6px,#292322 6px 10px)}
    .plant-bee .head{position:absolute;left:3px;top:11px;width:12px;height:12px;border-radius:50%;background:#292322}.plant-bee .head:after{content:'';position:absolute;left:2px;top:3px;width:2px;height:2px;border-radius:50%;background:white}
    .plant-bee .wing{position:absolute;top:1px;width:15px;height:13px;border-radius:50%;background:rgba(255,255,255,.84);animation:plantBeeWing .1s linear infinite alternate}.plant-bee .wing.w1{left:12px;transform-origin:right bottom}.plant-bee .wing.w2{left:21px;transform-origin:left bottom}
    @keyframes plantBeeWing{from{rotate:-22deg}to{rotate:22deg}}

    .plant-snail{position:absolute;left:-100px;bottom:5.5%;width:78px;height:52px;z-index:2;will-change:left;transition:left .95s linear;filter:drop-shadow(0 2px 3px rgba(0,0,0,.16))}
    .plant-snail .shell{position:absolute;left:0;top:0;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#edc489 0 15%,#c98555 16% 34%,#8b5639 35% 50%,#d79a61 51% 66%,#75452e 67%);box-shadow:inset -4px -5px 5px rgba(75,41,25,.18)}
    .plant-snail .body{position:absolute;left:35px;top:31px;width:34px;height:13px;border-radius:11px 12px 8px 8px;background:#8f9364}
    .plant-snail .head{position:absolute;right:0;top:25px;width:16px;height:15px;border-radius:50%;background:#8f9364}
    .plant-snail .eye{position:absolute;top:14px;width:2px;height:12px;background:#6d704f;transform-origin:bottom}.plant-snail .eye.e1{right:10px;rotate:-12deg}.plant-snail .eye.e2{right:4px;rotate:12deg}.plant-snail .eye:after{content:'';position:absolute;left:-1px;top:-2px;width:4px;height:4px;border-radius:50%;background:#29231f}

    @media(max-width:760px){.plant-scene{--plant-x:37%}#countdownStage.theme-plant .time-display-wrap{right:3%!important;top:16%!important;transform:none!important;width:min(48%,210px)!important}#countdownStage.theme-plant #countdownDisplay,#countdownStage.theme-plant .time-display{font-size:clamp(2.4rem,7vw,3.2rem)!important}.plant-scene .flower{width:154px!important;height:154px!important}.plant-scene .flower .petal{left:52px!important;width:48px!important;height:74px!important;transform-origin:24px 73px!important}.plant-scene .flower-core{left:52px!important;top:52px!important;width:52px!important;height:52px!important}.plant-bee{--bee-scale:.82}.plant-bee.b2{--bee-scale:.74}.plant-snail{width:66px;height:46px}.plant-snail .shell{width:42px;height:42px}.plant-snail .body{left:31px;top:28px;width:29px}.plant-snail .head{top:22px}}
  `;
  document.head.appendChild(style);

  let stemObserver = null;
  let observedStem = null;
  let alignQueued = false;

  function alignFlower(scene) {
    alignQueued = false;
    const stem = scene?.querySelector('.plant-stem');
    const flower = scene?.querySelector('.flower');
    if (!stem || !flower) return;
    const sr = scene.getBoundingClientRect();
    const tr = stem.getBoundingClientRect();
    const x = tr.left - sr.left + tr.width / 2;
    const y = tr.top - sr.top;
    flower.style.left = `${x.toFixed(1)}px`;
    flower.style.top = `${y.toFixed(1)}px`;
  }

  function queueAlign(scene) {
    if (alignQueued) return;
    alignQueued = true;
    requestAnimationFrame(() => alignFlower(scene));
  }

  function attachStemObserver(scene) {
    const stem = scene?.querySelector('.plant-stem');
    if (!stem || stem === observedStem) return;
    stemObserver?.disconnect();
    observedStem = stem;
    stemObserver = new MutationObserver(() => queueAlign(scene));
    stemObserver.observe(stem, { attributes:true, attributeFilter:['style'] });
    queueAlign(scene);
  }

  const beeStates = new WeakMap();
  let beeFrame = 0;
  let lastBeeTime = 0;

  function newBeeTarget(scene, state) {
    const rect = scene.getBoundingClientRect();
    state.tx = rect.width * (.06 + Math.random() * .88);
    state.ty = rect.height * (.06 + Math.random() * .54);
  }

  function initBee(scene, bee, index) {
    const rect = scene.getBoundingClientRect();
    const state = {
      x: rect.width * (index ? .72 : .15),
      y: rect.height * (index ? .24 : .14),
      tx: 0, ty: 0,
      speed: index ? 58 : 68
    };
    newBeeTarget(scene, state);
    beeStates.set(bee, state);
    bee.style.left = `${state.x}px`;
    bee.style.top = `${state.y}px`;
  }

  function animateBees(time) {
    const scene = sceneLayer.querySelector('.plant-scene');
    if (!scene) { beeFrame = requestAnimationFrame(animateBees); return; }
    const bees = [...scene.querySelectorAll('.plant-bee')];
    const dt = Math.min(.035, lastBeeTime ? (time - lastBeeTime) / 1000 : .016);
    lastBeeTime = time;

    bees.forEach((bee, index) => {
      if (!beeStates.has(bee)) initBee(scene, bee, index);
      const state = beeStates.get(bee);
      const dx = state.tx - state.x;
      const dy = state.ty - state.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18) {
        newBeeTarget(scene, state);
        return;
      }
      const step = Math.min(dist, state.speed * dt);
      state.x += dx / dist * step;
      state.y += dy / dist * step;
      const face = dx >= 0 ? -1 : 1;
      const tilt = Math.max(-12, Math.min(12, dy / Math.max(1, Math.abs(dx)) * 9));
      bee.style.left = `${state.x.toFixed(1)}px`;
      bee.style.top = `${state.y.toFixed(1)}px`;
      bee.style.transform = `scaleX(${face}) scale(var(--bee-scale)) rotate(${tilt.toFixed(1)}deg)`;
    });

    beeFrame = requestAnimationFrame(animateBees);
  }

  function addExtras(scene) {
    if (!scene || scene.querySelector('.plant-extras')) return;
    const extras = document.createElement('div');
    extras.className = 'plant-extras';
    extras.innerHTML = `
      <div class="plant-bee b1"><i class="wing w1"></i><i class="wing w2"></i><i class="head"></i><i class="body"></i></div>
      <div class="plant-bee b2"><i class="wing w1"></i><i class="wing w2"></i><i class="head"></i><i class="body"></i></div>
      <div class="plant-snail"><i class="shell"></i><i class="body"></i><i class="head"></i><i class="eye e1"></i><i class="eye e2"></i></div>`;
    scene.appendChild(extras);
  }

  function parseRemainingSeconds() {
    const parts = (display?.textContent || '').trim().split(':').map(Number);
    if (parts.some(v => !Number.isFinite(v))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  function syncSnail(scene) {
    const snail = scene?.querySelector('.plant-snail');
    if (!snail) return;
    const total = Math.max(1, (Number(minutesInput?.value) || 0) * 60 + (Number(secondsInput?.value) || 0));
    const remaining = parseRemainingSeconds();
    if (remaining === null) return;
    const progress = Math.max(0, Math.min(1, 1 - remaining / total));
    const width = scene.clientWidth;
    const snailWidth = snail.getBoundingClientRect().width || 78;
    const start = -snailWidth - 6;
    const end = width + 6;
    const target = start + (end - start) * progress;
    const previous = parseFloat(snail.style.left);

    if (!snail.dataset.positionReady) {
      snail.style.transition = 'none';
      snail.style.left = `${target.toFixed(1)}px`;
      snail.dataset.positionReady = 'true';
      requestAnimationFrame(() => {
        if (snail.isConnected) snail.style.transition = 'left .95s linear';
      });
      return;
    }

    if (Number.isFinite(previous) && target < previous - .5) {
      snail.style.transition = 'none';
      snail.style.left = `${target.toFixed(1)}px`;
      requestAnimationFrame(() => {
        if (snail.isConnected) snail.style.transition = 'left .95s linear';
      });
      return;
    }

    snail.style.transition = 'left .95s linear';
    snail.style.left = `${target.toFixed(1)}px`;
  }

  function syncScene() {
    const scene = sceneLayer.querySelector('.plant-scene');
    if (!scene) return;
    addExtras(scene);
    attachStemObserver(scene);
    queueAlign(scene);
    syncSnail(scene);
  }

  const sceneObserver = new MutationObserver(syncScene);
  sceneObserver.observe(sceneLayer, { childList:true, subtree:true });
  if (display) new MutationObserver(syncScene).observe(display, { childList:true, characterData:true, subtree:true });
  minutesInput?.addEventListener('change', syncScene);
  secondsInput?.addEventListener('change', syncScene);
  window.addEventListener('resize', syncScene);

  let audioCtx = null;
  let buzzOut = null;
  function isMuted() {
    try { const v = localStorage.getItem('ttTimers.muted'); if (v !== null) return JSON.parse(v) === true; } catch {}
    return muteBtn?.getAttribute('aria-pressed') === 'true';
  }
  function ensureBuzz() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    const a = audioCtx.createOscillator();
    const b = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    const g2 = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    buzzOut = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    a.type='sawtooth'; a.frequency.value=175; g1.gain.value=.012;
    b.type='triangle'; b.frequency.value=238; g2.gain.value=.008;
    filter.type='bandpass'; filter.frequency.value=520; filter.Q.value=1.1;
    lfo.type='sine'; lfo.frequency.value=.7; lfoGain.gain.value=18;
    buzzOut.gain.value=0;
    lfo.connect(lfoGain).connect(a.frequency);
    a.connect(g1).connect(filter); b.connect(g2).connect(filter); filter.connect(buzzOut).connect(audioCtx.destination);
    a.start(); b.start(); lfo.start();
  }
  function updateBuzz() {
    if (!audioCtx || !buzzOut) return;
    const running = stageStatus?.textContent.trim() === 'Running';
    const active = stage.classList.contains('theme-plant') && running && !isMuted();
    if (audioCtx.state === 'suspended' && active) audioCtx.resume().catch(()=>{});
    const now = audioCtx.currentTime;
    buzzOut.gain.cancelScheduledValues(now);
    buzzOut.gain.setTargetAtTime(active ? .75 : 0, now, active ? .15 : .06);
  }
  function unlock() { ensureBuzz(); updateBuzz(); }
  document.addEventListener('pointerdown', unlock, {capture:true,passive:true});
  document.addEventListener('keydown', unlock, {capture:true});
  muteBtn?.addEventListener('click', () => setTimeout(updateBuzz,0));
  presentationMuteBtn?.addEventListener('click', () => setTimeout(updateBuzz,0));
  new MutationObserver(updateBuzz).observe(stage, {attributes:true, attributeFilter:['class']});
  if (stageStatus) new MutationObserver(updateBuzz).observe(stageStatus, {childList:true, characterData:true, subtree:true});
  window.addEventListener('storage', e => { if(e.key==='ttTimers.muted') updateBuzz(); });

  syncScene();
  cancelAnimationFrame(beeFrame);
  beeFrame = requestAnimationFrame(animateBees);
})();
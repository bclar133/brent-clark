(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = (n, width = 2) => String(Math.floor(Math.abs(n))).padStart(width, '0');
  const formatClock = (totalSeconds, showHundredths = false) => {
    const total = Math.max(0, totalSeconds);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    if (showHundredths) return `${pad(mins)}:${pad(secs)}.${pad(Math.floor((total % 1) * 100))}`;
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${pad(hours)}:${pad(mins % 60)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));

  const storage = {
    get(key, fallback = null) {
      try { const value = localStorage.getItem(`ttTimers.${key}`); return value === null ? fallback : JSON.parse(value); }
      catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(`ttTimers.${key}`, JSON.stringify(value)); } catch {} }
  };

  let muted = Boolean(storage.get('muted', false));
  let audioCtx = null;
  let activeWorkspace = 'countdown';
  let toastTimer = null;

  function showToast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
  }

  function ensureAudio() {
    if (muted) return null;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch { return null; }
  }

  function tone(freq, duration = .12, type = 'sine', gain = .07, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + .015);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration + .03);
  }

  function endChime() {
    if (muted || !$('#endSoundToggle')?.checked) return;
    tone(659, .18, 'sine', .08, 0);
    tone(784, .18, 'sine', .08, .16);
    tone(1047, .42, 'sine', .09, .32);
  }

  function tickBeep() { if (!muted) tone(760, .07, 'square', .025); }

  function updateMuteUI() {
    const text = muted ? '🔇' : '🔊';
    $('#muteBtn').textContent = text;
    $('#muteBtn').setAttribute('aria-pressed', String(muted));
    $('#muteBtn').title = muted ? 'Turn sounds on' : 'Mute sounds';
    $('#presentationMuteBtn').textContent = text;
    storage.set('muted', muted);
  }

  function setDarkMode(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('#themeBtn').textContent = dark ? '☀️' : '🌙';
    $('#themeBtn').setAttribute('aria-pressed', String(dark));
    $('#themeBtn').title = dark ? 'Turn on light mode' : 'Turn on dark mode';
    storage.set('dark', dark);
  }

  function setWorkspace(name) {
    activeWorkspace = name;
    $$('.workspace-tab').forEach(btn => {
      const active = btn.dataset.workspace === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    $$('.workspace-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === name));
    storage.set('workspace', name);
  }

  function setPresentation(on) {
    document.body.classList.toggle('presentation-mode', on);
    $('#presentationToolbar').hidden = !on;
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    $('#fullscreenBtn').setAttribute('aria-pressed', String(on));
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('presentation-mode')) {
      document.body.classList.remove('presentation-mode');
      $('#presentationToolbar').hidden = true;
    }
  });

  const themeMeta = {
    sunrise: ['Day & Night', 'The whole day passes as your time runs out.'],
    racing: ['Road Racer', 'A fresh winding road is generated for every scene.'],
    parachute: ['Parachute', 'The parachutist touches down exactly at zero.'],
    ramps: ['Ramp Ball', 'A ball works down a newly generated chain of ramps.'],
    rocket: ['Rocket', 'Systems ready throughout the timer — blast-off at zero.'],
    hourglass: ['Hourglass', 'Sand moves from the top chamber to the bottom.'],
    plant: ['Growing Plant', 'A seed grows, sprouts leaves and blooms at zero.'],
    popcorn: ['Popcorn', 'The box fills as kernels pop throughout the countdown.'],
    coaster: ['Rollercoaster', 'The cart follows one giant track to the station.'],
    maze: ['Marble Maze', 'A marble travels through a new maze to the finish hole.'],
    candle: ['Candle', 'A calm candle burns down with the remaining time.'],
    space: ['Space Journey', 'A spacecraft crosses the stars from Earth to Saturn.']
  };

  let themeFilter = storage.get('themeFilter', 'all');

  function setThemeFilter(filter) {
    themeFilter = ['all','minimal','calm','fun','action'].includes(filter) ? filter : 'all';
    storage.set('themeFilter', themeFilter);
    $$('.theme-filters button').forEach(btn => btn.classList.toggle('active', btn.dataset.themeFilter === themeFilter));
    $$('.theme-card').forEach(card => {
      const categories = (card.dataset.category || '').split(/\s+/);
      card.hidden = themeFilter !== 'all' && !categories.includes(themeFilter);
    });
  }

  let countdown = {
    totalMs: 300000,
    remainingMs: 300000,
    running: false,
    endAt: 0,
    raf: null,
    theme: storage.get('countdownTheme', 'sunrise'),
    lastSecond: null,
    sceneData: null,
    sceneAnchorProgress: null,
    sceneAnchorRemainingMs: null
  };

  function getInputSeconds() {
    const mins = clamp(Number($('#countdownMinutes').value) || 0, 0, 180);
    const secs = clamp(Number($('#countdownSeconds').value) || 0, 0, 59);
    return Math.round(mins * 60 + secs);
  }

  function syncCountdownInputs(seconds) {
    seconds = clamp(Math.round(seconds), 0, 180 * 60 + 59);
    $('#countdownMinutes').value = Math.floor(seconds / 60);
    $('#countdownSeconds').value = seconds % 60;
  }

  function clearCountdownSceneAnchor() {
    countdown.sceneAnchorProgress = null;
    countdown.sceneAnchorRemainingMs = null;
  }

  function setCountdownDuration(seconds, {render = true} = {}) {
    seconds = clamp(Number(seconds) || 0, 0, 180 * 60 + 59);
    countdown.totalMs = seconds * 1000;
    countdown.remainingMs = countdown.totalMs;
    countdown.running = false;
    cancelAnimationFrame(countdown.raf);
    countdown.lastSecond = null;
    clearCountdownSceneAnchor();
    syncCountdownInputs(seconds);
    updateCountdownButtons();
    if (render) renderCountdown(0);
  }

  function countdownProgress() {
    if (countdown.sceneAnchorProgress !== null && countdown.sceneAnchorRemainingMs > 0) {
      const local = clamp(1 - countdown.remainingMs / countdown.sceneAnchorRemainingMs, 0, 1);
      return clamp(countdown.sceneAnchorProgress + (1 - countdown.sceneAnchorProgress) * local, 0, 1);
    }
    if (countdown.totalMs <= 0) return 1;
    return clamp(1 - countdown.remainingMs / countdown.totalMs, 0, 1);
  }

  function updateCountdownButtons() {
    $('#countdownStartBtn').innerHTML = countdown.running ? '⏸ Pause' : (countdown.remainingMs < countdown.totalMs && countdown.remainingMs > 0 ? '▶ Resume' : '▶ Start');
    $('#stageStatus').textContent = countdown.running ? 'Running' : (countdown.remainingMs <= 0 ? 'Time’s up' : (countdown.remainingMs < countdown.totalMs ? 'Paused' : 'Ready'));
  }

  function startPauseCountdown() {
    if (countdown.running) {
      countdown.remainingMs = Math.max(0, countdown.endAt - performance.now());
      countdown.running = false;
      cancelAnimationFrame(countdown.raf);
      updateCountdownButtons();
      return;
    }
    if (countdown.remainingMs <= 0 || countdown.totalMs <= 0) {
      const input = getInputSeconds();
      if (!input) { showToast('Set a countdown time first.'); return; }
      setCountdownDuration(input, {render:false});
    }
    ensureAudio();
    countdown.running = true;
    countdown.endAt = performance.now() + countdown.remainingMs;
    updateCountdownButtons();
    countdownLoop();
  }

  function countdownLoop() {
    if (!countdown.running) return;
    countdown.remainingMs = Math.max(0, countdown.endAt - performance.now());
    const whole = Math.ceil(countdown.remainingMs / 1000);
    if (whole !== countdown.lastSecond) {
      if (whole > 0 && whole <= 3) tickBeep();
      countdown.lastSecond = whole;
    }
    renderCountdown(countdownProgress());
    if (countdown.remainingMs <= 0) {
      countdown.running = false;
      updateCountdownButtons();
      renderCountdown(1, true);
      endChime();
      return;
    }
    countdown.raf = requestAnimationFrame(countdownLoop);
  }

  function resetCountdown() {
    cancelAnimationFrame(countdown.raf);
    countdown.running = false;
    countdown.remainingMs = countdown.totalMs;
    countdown.lastSecond = null;
    clearCountdownSceneAnchor();
    buildCountdownScene(countdown.theme);
    renderCountdown(0);
    updateCountdownButtons();
  }

  function addCountdownTime(seconds) {
    const deltaMs = Math.max(0, Number(seconds) || 0) * 1000;
    if (!deltaMs) return;

    const maxMs = (180 * 60 + 59) * 1000;
    if (countdown.remainingMs <= 0) {
      const added = Math.min(deltaMs, maxMs);
      countdown.totalMs = added;
      countdown.remainingMs = added;
      countdown.running = false;
      countdown.lastSecond = null;
      clearCountdownSceneAnchor();
      syncCountdownInputs(Math.round(countdown.totalMs / 1000));
      buildCountdownScene(countdown.theme);
      renderCountdown(0);
      updateCountdownButtons();
      return;
    }

    const currentProgress = countdownProgress();
    const oldRemaining = countdown.remainingMs;
    countdown.remainingMs = Math.min(maxMs, countdown.remainingMs + deltaMs);
    const actualDelta = countdown.remainingMs - oldRemaining;
    if (actualDelta <= 0) return;

    countdown.totalMs = Math.min(maxMs, countdown.totalMs + actualDelta);
    if (countdown.running) countdown.endAt += actualDelta;

    if (currentProgress > 0 && currentProgress < 1) {
      countdown.sceneAnchorProgress = currentProgress;
      countdown.sceneAnchorRemainingMs = countdown.remainingMs;
    }

    syncCountdownInputs(Math.round(countdown.totalMs / 1000));
    renderCountdown(currentProgress);
    updateCountdownButtons();
  }

  function addMinute() {
    addCountdownTime(60);
    showToast('+1 minute');
  }

  window.__ttAddCountdownTime = seconds => addCountdownTime(seconds);

  function chooseCountdownTheme(name) {
    countdown.theme = themeMeta[name] ? name : 'sunrise';
    storage.set('countdownTheme', countdown.theme);
    $$('.theme-card').forEach(btn => {
      const active = btn.dataset.theme === countdown.theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    $('#stageKicker').textContent = themeMeta[countdown.theme][0];
    $('#themeDescription').textContent = themeMeta[countdown.theme][1];
    $('#countdownStage').className = `timer-stage theme-${countdown.theme}`;
    buildCountdownScene(countdown.theme);
    renderCountdown(countdownProgress());
  }

  function buildCountdownScene(theme) {
    const layer = $('#sceneLayer');
    countdown.sceneData = {};
    layer.innerHTML = '';

    if (theme === 'sunrise') {
      layer.innerHTML = `<div class="sky-scene"><div class="sky-stars"></div><div class="celestial moonish"></div><div class="sky-hills"></div></div>`;
    }

    if (theme === 'racing') {
      const points = generateWindingPath(9, 8, 92, 70, 28);
      const d = smoothPath(points);
      layer.innerHTML = `<div class="race-scene"><div class="race-cloud" style="left:10%;top:15%"></div><div class="race-cloud" style="left:68%;top:25%;transform:scale(.7)"></div><div class="race-road"><svg viewBox="0 0 1000 600" preserveAspectRatio="none"><path class="race-path" d="${d}" fill="none" stroke="#34383d" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f3f0cf" stroke-width="4" stroke-dasharray="22 23"/></svg></div><div class="finish-flag"></div><div class="race-car"><div class="car-body"></div><div class="car-cabin"></div><div class="car-wheel w1"></div><div class="car-wheel w2"></div></div></div>`;
      countdown.sceneData.points = points;
      requestAnimationFrame(() => {
        const path = $('.race-path', layer); if (path) countdown.sceneData.pathLength = path.getTotalLength();
      });
    }

    if (theme === 'parachute') {
      layer.innerHTML = `<div class="parachute-scene"><div class="parachute-cloud" style="left:7%;top:22%"></div><div class="parachute-cloud" style="right:8%;top:36%;transform:scale(.72)"></div><div class="landing-target"></div><div class="parachutist"><div class="parachute-canopy"></div><div class="parachute-lines"></div><div class="parachute-person"></div></div></div>`;
    }

    if (theme === 'ramps') {
      const points = generateRampPath();
      countdown.sceneData.points = points;
      const ramps = points.slice(0,-1).map((p,i) => {
        const q = points[i+1];
        return `<line x1="${p.x * 10}" y1="${p.y * 6}" x2="${q.x * 10}" y2="${q.y * 6}" />`;
      }).join('');
      layer.innerHTML = `<div class="ramp-scene"><svg class="ramp-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">${ramps}</svg><div class="ramp-ball"></div></div>`;
    }

    if (theme === 'rocket') {
      layer.innerHTML = `<div class="rocket-scene"><div class="rocket-stars"></div><div class="rocket-pad"></div><div class="rocket"><div class="rocket-body"></div><div class="rocket-nose"></div><div class="rocket-window"></div><div class="rocket-fin left"></div><div class="rocket-fin right"></div><div class="rocket-flame"></div></div><div class="launch-count">SYSTEMS READY</div></div>`;
    }

    if (theme === 'hourglass') {
      layer.innerHTML = `<div class="hourglass-scene"><div class="hourglass"><div class="hg-bar top"></div><div class="hg-top"><div class="hg-sand-top"></div></div><div class="hg-stream"></div><div class="hg-bottom"><div class="hg-sand-bottom"></div></div><div class="hg-bar bottom"></div></div></div>`;
    }

    if (theme === 'plant') {
      layer.innerHTML = `<div class="plant-scene"><div class="plant-stem"></div><div class="leaf l1"></div><div class="leaf l2"></div><div class="leaf l3"></div><div class="leaf l4"></div><div class="flower"><div class="petal"></div><div class="petal"></div><div class="petal"></div><div class="petal"></div><div class="petal"></div><div class="flower-core"></div></div><div class="plant-pot"></div></div>`;
    }

    if (theme === 'popcorn') {
      const kernels = Array.from({length:44},(_,i) => `<i class="kernel" style="left:${8+(i*37)%84}%;bottom:${(i*19)%88}%;transform:rotate(${(i*43)%130-65}deg) scale(0)"></i>`).join('');
      layer.innerHTML = `<div class="popcorn-scene"><div class="popcorn-box"></div><div class="popcorn-fill">${kernels}</div></div>`;
    }

    if (theme === 'coaster') {
      const points = generateCoasterPath();
      const d = smoothPath(points);
      layer.innerHTML = `<div class="coaster-scene"><div class="coaster-track"><svg viewBox="0 0 1000 600" preserveAspectRatio="none"><path class="coaster-path" d="${d}" fill="none" stroke="#5c4d3e" stroke-width="13"/><path d="${d}" fill="none" stroke="#d5b680" stroke-width="4" stroke-dasharray="5 12"/></svg></div><div class="coaster-cart"></div></div>`;
      requestAnimationFrame(() => { const path=$('.coaster-path',layer); if(path) countdown.sceneData.pathLength=path.getTotalLength(); });
    }

    if (theme === 'maze') {
      const pts = generateMazePath(); countdown.sceneData.points = pts;
      const walls = generateMazeWalls().map(w => `<div class="maze-wall" style="left:${w.x}%;top:${w.y}%;width:${w.w}%;height:${w.h}%"></div>`).join('');
      const end = pts[pts.length-1];
      layer.innerHTML = `<div class="maze-scene"><div class="maze-board">${walls}<div class="maze-hole" style="left:${end.x}%;top:${end.y}%"></div><div class="maze-marble"></div></div></div>`;
    }

    if (theme === 'candle') {
      layer.innerHTML = `<div class="candle-scene"><div class="candle"><div class="candle-wax"></div><div class="candle-wick"></div><div class="candle-flame"></div></div></div>`;
    }

    if (theme === 'space') {
      layer.innerHTML = `<div class="space-scene"><div class="space-stars"></div><div class="space-path"></div><div class="planet earth"></div><div class="planet target"></div><div class="spacecraft"></div></div>`;
    }
  }

  function generateWindingPath(count, startX, endX, startY, spread) {
    const pts = [];
    for (let i=0;i<count;i++) {
      const t=i/(count-1);
      const x=lerp(startX,endX,t);
      let y=i===0?startY:(i===count-1?25+Math.random()*45:18+Math.random()*(spread+25));
      pts.push({x:x*10,y:y*6});
    }
    return pts;
  }

  function smoothPath(points) {
    if (!points.length) return '';
    let d=`M ${points[0].x} ${points[0].y}`;
    for(let i=1;i<points.length;i++) {
      const p0=points[i-1],p=points[i];
      const mx=(p0.x+p.x)/2;
      d+=` C ${mx} ${p0.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
    }
    return d;
  }

  function generateRampPath() {
    const pts=[]; const rows=7;
    let side=Math.random()>.5?0:1;
    for(let i=0;i<rows;i++) {
      const y=20+i*10.2;
      const left=10+Math.random()*12, right=78+Math.random()*10;
      if(side===0){pts.push({x:left,y});pts.push({x:right,y:y+7});} else {pts.push({x:right,y});pts.push({x:left,y:y+7});}
      side=1-side;
    }
    return pts;
  }

  function generateCoasterPath() {
    return [
      {x:50,y:470},{x:150,y:420},{x:245,y:170},{x:340,y:410},{x:450,y:330},
      {x:555,y:120},{x:665,y:420},{x:760,y:275},{x:860,y:390},{x:955,y:330}
    ].map((p,i)=>({x:p.x,y:p.y+(i%2?Math.random()*28-14:0)}));
  }

  function generateMazePath() {
    const variants=[
      [{x:8,y:15},{x:35,y:15},{x:35,y:34},{x:68,y:34},{x:68,y:17},{x:90,y:17},{x:90,y:56},{x:58,y:56},{x:58,y:80},{x:88,y:80}],
      [{x:10,y:18},{x:10,y:48},{x:42,y:48},{x:42,y:20},{x:72,y:20},{x:72,y:62},{x:28,y:62},{x:28,y:82},{x:90,y:82}],
      [{x:8,y:20},{x:48,y:20},{x:48,y:42},{x:18,y:42},{x:18,y:72},{x:65,y:72},{x:65,y:35},{x:89,y:35},{x:89,y:80}]
    ];
    return variants[Math.floor(Math.random()*variants.length)];
  }

  function generateMazeWalls() {
    return [
      {x:18,y:8,w:3,h:27},{x:50,y:4,w:3,h:28},{x:79,y:8,w:3,h:30},
      {x:8,y:34,w:24,h:3},{x:45,y:42,w:34,h:3},{x:20,y:62,w:30,h:3},
      {x:64,y:62,w:3,h:24},{x:36,y:73,w:3,h:20},{x:72,y:78,w:20,h:3}
    ].map(w=>({...w,x:w.x+(Math.random()*4-2),y:w.y+(Math.random()*4-2)}));
  }

  function pointAlongPolyline(points, t) {
    if (!points?.length) return {x:50,y:50};
    const dists=[]; let total=0;
    for(let i=1;i<points.length;i++){const d=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);dists.push(d);total+=d;}
    let target=clamp(t,0,1)*total;
    for(let i=0;i<dists.length;i++){
      if(target<=dists[i]){const u=dists[i] ? target/dists[i] : 0;return{x:lerp(points[i].x,points[i+1].x,u),y:lerp(points[i].y,points[i+1].y,u)};}
      target-=dists[i];
    }
    return points[points.length-1];
  }

  function renderCountdown(progress, justFinished = false) {
    progress = clamp(progress,0,1);
    $('#countdownStage').classList.toggle('finished', progress >= 1);
    $('#countdownDisplay').textContent = formatClock(Math.ceil(countdown.remainingMs/1000));
    $('#countdownMessage').textContent = progress >= 1 ? 'Time’s up!' : countdown.running ? `${Math.round((1-progress)*100)}% remaining` : (progress > 0 ? 'Paused' : 'Ready when you are');
    const layer=$('#sceneLayer');

    if (countdown.theme==='sunrise') {
      const scene=$('.sky-scene',layer), orb=$('.celestial',layer), stars=$('.sky-stars',layer);
      if(scene&&orb){
        const x=8+84*progress, y=72-50*Math.sin(Math.PI*progress);
        orb.style.left=`${x}%`;orb.style.top=`${y}%`;
        const nightness=Math.abs(progress-.5)*2;
        const daylight=1-nightness;
        const top=mixColor([7,20,41],[70,169,216],daylight);
        const bottom=mixColor([39,51,74],[255,194,112],Math.sin(Math.PI*progress));
        scene.style.setProperty('--skyTop',top); scene.style.setProperty('--skyBottom',bottom); stars.style.opacity=String(clamp(nightness*1.4-.25,0,1));
        orb.classList.toggle('moonish',progress<.19||progress>.81);
      }
    }

    if (countdown.theme==='racing') {
      const path=$('.race-path',layer),car=$('.race-car',layer),flag=$('.finish-flag',layer);
      if(path&&car){const len=countdown.sceneData?.pathLength||path.getTotalLength(); const pt=path.getPointAtLength(len*progress); const pt2=path.getPointAtLength(Math.min(len,len*progress+5));car.style.left=`${pt.x/10}%`;car.style.top=`${pt.y/6}%`;car.style.rotate=`${Math.atan2(pt2.y-pt.y,pt2.x-pt.x)*180/Math.PI}deg`;const end=path.getPointAtLength(len);flag.style.left=`${end.x/10}%`;flag.style.top=`${end.y/6}%`;}
    }

    if(countdown.theme==='parachute'){
      const p=$('.parachutist',layer);if(p){const y=12+72*(1-Math.pow(1-progress,1.2));p.style.top=`${y}%`;p.style.left=`${50+7*Math.sin(progress*8)}%`;p.style.transform=`translate(-50%,-50%) scale(${.68+.35*progress})`;}
    }

    if(countdown.theme==='ramps'){
      const ball=$('.ramp-ball',layer);const p=pointAlongPolyline(countdown.sceneData?.points,progress);if(ball){ball.style.left=`${p.x}%`;ball.style.top=`${p.y}%`;ball.style.rotate=`${progress*1400}deg`;}
    }

    if(countdown.theme==='rocket'){
      const rocket=$('.rocket',layer),flame=$('.rocket-flame',layer),label=$('.launch-count',layer);
      if(rocket&&flame){flame.style.setProperty('--flame',`${16+progress*45}px`); rocket.style.filter=`drop-shadow(0 0 ${progress*18}px rgba(255,120,40,.45))`;}
      if(label){const secs=Math.ceil(countdown.remainingMs/1000);label.textContent=secs<=10&&secs>0?String(secs):(progress>=1?'BLAST OFF!':'SYSTEMS READY');}
      if(justFinished&&rocket){rocket.animate([{transform:'translateX(-50%) translateY(0)'},{transform:'translateX(-50%) translateY(-115vh)'}],{duration:1800,easing:'cubic-bezier(.3,.05,.7,.3)',fill:'forwards'});}
    }

    if(countdown.theme==='hourglass'){
      $('.hg-sand-top',layer)?.style.setProperty('--topSand',`${(1-progress)*100}%`); $('.hg-sand-bottom',layer)?.style.setProperty('--bottomSand',`${progress*100}%`); $('.hg-stream',layer)?.style.setProperty('--stream',progress>=1?'0':'1');
    }

    if(countdown.theme==='plant'){
      $('.plant-stem',layer)?.style.setProperty('--stemH',`${2+56*Math.min(1,progress/0.76)}%`);
      $$('.leaf',layer).forEach((leaf,i)=>{const start=.18+i*.13;const s=clamp((progress-start)/.15,0,1);leaf.style.setProperty('--leafScale',s);leaf.style.opacity=s;});
      $('.flower',layer)?.style.setProperty('--flowerScale',clamp((progress-.78)/.22,0,1));
    }

    if(countdown.theme==='popcorn'){
      $('.popcorn-fill',layer)?.style.setProperty('--fillH',`${8+progress*88}%`);
      $$('.kernel',layer).forEach((k,i)=>{const threshold=(i+1)/44;const s=clamp((progress-threshold+.08)/.08,0,1);k.style.setProperty('--kernelScale',s);k.style.transform=k.style.transform.replace(/scale\([^)]*\)/,`scale(${s})`);});
    }

    if(countdown.theme==='coaster'){
      const path=$('.coaster-path',layer),cart=$('.coaster-cart',layer);if(path&&cart){const len=countdown.sceneData?.pathLength||path.getTotalLength();const pt=path.getPointAtLength(len*progress),pt2=path.getPointAtLength(Math.min(len,len*progress+5));cart.style.left=`${pt.x/10}%`;cart.style.top=`${pt.y/6}%`;cart.style.rotate=`${Math.atan2(pt2.y-pt.y,pt2.x-pt.x)*180/Math.PI}deg`;}
    }

    if(countdown.theme==='maze'){
      const marble=$('.maze-marble',layer),p=pointAlongPolyline(countdown.sceneData?.points,progress);if(marble){marble.style.left=`${p.x}%`;marble.style.top=`${p.y}%`;}
    }

    if(countdown.theme==='candle'){
      const remaining=1-progress; const wax=Math.max(3,remaining*100);$('.candle-wax',layer)?.style.setProperty('--waxH',`${wax}%`);$('.candle-wick',layer)?.style.setProperty('--wickBottom',`${wax}%`);$('.candle-flame',layer)?.style.setProperty('--flameBottom',`${wax}%`);$('.candle-flame',layer)?.style.setProperty('--flameOpacity',progress>=1?'0':'1');
    }

    if(countdown.theme==='space'){
      const ship=$('.spacecraft',layer);if(ship){const t=progress;const x=(1-t)*(1-t)*15+2*(1-t)*t*49+t*t*83;const y=(1-t)*(1-t)*71+2*(1-t)*t*17+t*t*41;ship.style.left=`${x}%`;ship.style.top=`${y}%`;ship.style.transform=`translate(-50%,-50%) rotate(${-25+18*t}deg) scale(${.85+.3*t})`;}
    }
  }

  function mixColor(a,b,t){const c=a.map((v,i)=>Math.round(lerp(v,b[i],clamp(t,0,1))));return `rgb(${c.join(',')})`;}

  let stopwatch={running:false,elapsedMs:0,startAt:0,raf:null,laps:[]};
  function renderStopwatch(){const ms=stopwatch.running?stopwatch.elapsedMs+(performance.now()-stopwatch.startAt):stopwatch.elapsedMs;$('#stopwatchDisplay').textContent=formatClock(ms/1000,true);}
  function stopwatchLoop(){if(!stopwatch.running)return;renderStopwatch();stopwatch.raf=requestAnimationFrame(stopwatchLoop);}
  function pressStopwatchFinger(){const finger=$('#stopwatchFinger');finger.classList.add('press');setTimeout(()=>finger.classList.remove('press'),180);}
  function toggleStopwatch(){pressStopwatchFinger();ensureAudio();tone(stopwatch.running?430:620,.07,'sine',.035);if(stopwatch.running){stopwatch.elapsedMs+=performance.now()-stopwatch.startAt;stopwatch.running=false;cancelAnimationFrame(stopwatch.raf);}else{stopwatch.startAt=performance.now();stopwatch.running=true;stopwatchLoop();}$('#stopwatchStartBtn').innerHTML=stopwatch.running?'⏸ Stop':'▶ Start';renderStopwatch();}
  function resetStopwatch(){stopwatch.running=false;cancelAnimationFrame(stopwatch.raf);stopwatch.elapsedMs=0;stopwatch.laps=[];$('#stopwatchStartBtn').innerHTML='▶ Start';renderStopwatch();renderLaps();pressStopwatchFinger();}
  function addLap(){if(!stopwatch.running&&stopwatch.elapsedMs===0)return;const ms=stopwatch.running?stopwatch.elapsedMs+(performance.now()-stopwatch.startAt):stopwatch.elapsedMs;stopwatch.laps.unshift(ms);renderLaps();tone(880,.05,'sine',.025);}
  function renderLaps(){const list=$('#lapsList');if(!stopwatch.laps.length){list.innerHTML='<li class="empty-state">No laps yet.</li>';return;}list.innerHTML=stopwatch.laps.map((ms,i)=>`<li><strong>Lap ${stopwatch.laps.length-i}</strong> · ${formatClock(ms/1000,true)}</li>`).join('');}

  let clockStyle=storage.get('clockStyle','digital');
  function chooseClockStyle(style){clockStyle=style;storage.set('clockStyle',style);$$('[data-clock-style]').forEach(b=>b.classList.toggle('active',b.dataset.clockStyle===style));$$('.clock-view',$('#clockStage')).forEach(v=>v.hidden=true);$(`#${style==='digital'?'digitalClock':style==='analogue'?'analogueClock':style==='flip'?'flipClock':'scenicClock'}`).hidden=false;}
  function renderClock(){const now=new Date();const h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();const hh=h%12||12;$('#digitalClockTime').textContent=`${pad(hh)}:${pad(m)}:${pad(s)}`;$('#digitalClockDate').textContent=now.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});$('#hourHand').style.transform=`translateX(-50%) rotate(${(h%12)*30+m*.5}deg)`;$('#minuteHand').style.transform=`translateX(-50%) rotate(${m*6+s*.1}deg)`;$('#secondHand').style.transform=`translateX(-50%) rotate(${s*6}deg)`;$('#flipHour').textContent=pad(hh);$('#flipMinute').textContent=pad(m);$('#flipSecond').textContent=pad(s);$('#scenicTime').textContent=`${pad(hh)}:${pad(m)}`;const scenic=$('#scenicClock');let label='Good morning',top='#6ecdf0',bottom='#f9e5a5',y=36;if(h<6){label='Good night';top='#08162b';bottom='#25334b';y=72}else if(h<12){label='Good morning';top='#6ecdf0';bottom='#f9e5a5';y=36}else if(h<17){label='Good afternoon';top='#51bfe8';bottom='#ccebf4';y=29}else if(h<20){label='Good evening';top='#6d72b9';bottom='#f18f6f';y=48}else{label='Good night';top='#08162b';bottom='#25334b';y=72}scenic.style.setProperty('--scenicTop',top);scenic.style.setProperty('--scenicBottom',bottom);scenic.style.setProperty('--orbY',`${y}%`);$('#scenicLabel').textContent=label;}

  class SequenceTimer {
    constructor({onRender,onPhase,onDone}){this.phases=[];this.index=0;this.remainingMs=0;this.durationMs=0;this.running=false;this.endAt=0;this.raf=null;this.onRender=onRender;this.onPhase=onPhase;this.onDone=onDone;}
    setPhases(phases){this.pause(false);this.phases=phases.filter(p=>p.seconds>0);this.index=0;this.loadPhase();}
    loadPhase(){const phase=this.phases[this.index];this.durationMs=(phase?.seconds||0)*1000;this.remainingMs=this.durationMs;this.onPhase?.(phase,this.index,this.phases);this.render();}
    toggle(){if(!this.phases.length)return;if(this.running){this.remainingMs=Math.max(0,this.endAt-performance.now());this.running=false;cancelAnimationFrame(this.raf);this.render();return;}if(this.remainingMs<=0)this.loadPhase();ensureAudio();this.running=true;this.endAt=performance.now()+this.remainingMs;this.loop();}
    pause(render=true){if(this.running){this.remainingMs=Math.max(0,this.endAt-performance.now());this.running=false;cancelAnimationFrame(this.raf);}if(render)this.render();}
    reset(){this.pause(false);this.index=0;this.loadPhase();}
    skip(){if(!this.phases.length)return;this.pause(false);this.index++;if(this.index>=this.phases.length){this.index=0;this.loadPhase();this.onDone?.();return;}this.loadPhase();tone(820,.07,'sine',.03);}
    loop(){if(!this.running)return;this.remainingMs=Math.max(0,this.endAt-performance.now());this.render();if(this.remainingMs<=0){this.running=false;tone(880,.12,'sine',.05);this.index++;if(this.index>=this.phases.length){this.index=this.phases.length-1;this.onDone?.();this.render();return;}this.loadPhase();this.running=true;this.endAt=performance.now()+this.remainingMs;this.loop();return;}this.raf=requestAnimationFrame(()=>this.loop());}
    render(){this.onRender?.(this.remainingMs,this.durationMs,this.running,this.index,this.phases);}
  }

  const intervalTimer=new SequenceTimer({
    onRender(ms,dur,running){$('#intervalDisplay').textContent=formatClock(Math.ceil(ms/1000));$('#intervalStartBtn').innerHTML=running?'⏸ Pause':'▶ Start';renderRoundDots(intervalTimer.index);},
    onPhase(phase,index){if(phase)$('#intervalPhase').textContent=`${phase.label} · Round ${phase.round} of ${phase.totalRounds}`;},
    onDone(){endChime();showToast('Intervals complete!');$('#intervalPhase').textContent='Complete';}
  });
  function applyInterval(){const work=clamp(Number($('#intervalWork').value)||0,0,60)*60;const rest=clamp(Number($('#intervalRest').value)||0,0,30)*60;const rounds=clamp(Number($('#intervalRounds').value)||1,1,20);const phases=[];for(let r=1;r<=rounds;r++){if(work)phases.push({label:'WORK',seconds:work,round:r,totalRounds:rounds});if(rest&&r<rounds)phases.push({label:'REST',seconds:rest,round:r,totalRounds:rounds});}intervalTimer.setPhases(phases);renderRoundDots(0);}
  function renderRoundDots(){const rounds=clamp(Number($('#intervalRounds').value)||1,1,20);const currentRound=intervalTimer.phases[intervalTimer.index]?.round||1;$('#roundDots').innerHTML=Array.from({length:rounds},(_,i)=>`<span class="round-dot ${i+1<currentRound?'done':i+1===currentRound?'current':''}"></span>`).join('');}

  let focusWork=20,focusBreak=5;
  const focusTimer=new SequenceTimer({
    onRender(ms,dur,running,index,phases){$('#focusDisplay').textContent=formatClock(Math.ceil(ms/1000));$('#focusStartBtn').innerHTML=running?'⏸ Pause':'▶ Start';const phase=phases[index];if(phase){$('#focusPhase').textContent=phase.label;$('#focusPhase').style.background=phase.label==='FOCUS'?'#e7f4eb':'#e8efff';$('#focusPhase').style.color=phase.label==='FOCUS'?'#287344':'#3554a5';}},
    onDone(){endChime();showToast('Focus cycle complete!');}
  });
  function applyFocus(){focusTimer.setPhases([{label:'FOCUS',seconds:focusWork*60},{label:'BREAK',seconds:focusBreak*60}]);}

  const scheduleTimer=new SequenceTimer({
    onRender(ms,dur,running,index){$('#scheduleDisplay').textContent=formatClock(Math.ceil(ms/1000));$('#scheduleStartBtn').innerHTML=running?'⏸ Pause':'▶ Start';renderScheduleProgress(index);},
    onPhase(phase){$('#scheduleStageName').textContent=phase?.label||'Add a stage';},
    onDone(){endChime();showToast('Lesson schedule complete!');$('#scheduleStageName').textContent='Lesson complete';}
  });

  function defaultSchedule(){return storage.get('schedule',[{label:'Starter',minutes:5},{label:'Instruction',minutes:10},{label:'Activity',minutes:25},{label:'Pack up',minutes:5}]);}
  let schedule=defaultSchedule();
  function renderScheduleRows(){const root=$('#scheduleRows');root.innerHTML=schedule.map((row,i)=>`<div class="schedule-row"><input data-schedule-label="${i}" maxlength="35" value="${escapeHtml(row.label)}" aria-label="Stage ${i+1} name"><input data-schedule-minutes="${i}" type="number" min="1" max="90" value="${row.minutes}" aria-label="Stage ${i+1} minutes"><button type="button" data-remove-schedule="${i}" aria-label="Remove ${escapeHtml(row.label)}">×</button></div>`).join('');applySchedule();}
  function applySchedule(){storage.set('schedule',schedule);scheduleTimer.setPhases(schedule.map(r=>({label:r.label||'Stage',seconds:clamp(Number(r.minutes)||1,1,90)*60})));}
  function renderScheduleProgress(index){$('#scheduleProgress').innerHTML=schedule.map((_,i)=>`<span class="schedule-step ${i<index?'done':i===index?'current':''}"></span>`).join('');}

  $$('.workspace-tab').forEach(btn=>btn.addEventListener('click',()=>setWorkspace(btn.dataset.workspace)));
  $('#muteBtn').addEventListener('click',()=>{muted=!muted;updateMuteUI();if(!muted)tone(660,.07,'sine',.03);});
  $('#presentationMuteBtn').addEventListener('click',()=>{muted=!muted;updateMuteUI();});
  $('#themeBtn').addEventListener('click',()=>setDarkMode(document.documentElement.dataset.theme!=='dark'));
  $('#fullscreenBtn').addEventListener('click',()=>setPresentation(!document.body.classList.contains('presentation-mode')));
  $('#presentationExitBtn').addEventListener('click',()=>setPresentation(false));

  $$('.quick-times button').forEach(btn=>btn.addEventListener('click',()=>setCountdownDuration(Number(btn.dataset.seconds))));
  ['countdownMinutes','countdownSeconds'].forEach(id=>$('#'+id).addEventListener('change',()=>{if(countdown.running)return;setCountdownDuration(getInputSeconds());}));
  $$('.theme-filters button').forEach(btn=>btn.addEventListener('click',()=>setThemeFilter(btn.dataset.themeFilter)));
  $$('.theme-card').forEach(btn=>btn.addEventListener('click',()=>chooseCountdownTheme(btn.dataset.theme)));
  $('#resetSceneBtn').addEventListener('click',()=>{buildCountdownScene(countdown.theme);renderCountdown(countdownProgress());showToast('Fresh scene generated');});
  $('#countdownStartBtn').addEventListener('click',startPauseCountdown);
  $('#countdownResetBtn').addEventListener('click',resetCountdown);
  $('#countdownAddBtn').addEventListener('click',addMinute);

  $('#stopwatchStartBtn').addEventListener('click',toggleStopwatch);$('#stopwatchResetBtn').addEventListener('click',resetStopwatch);$('#lapBtn').addEventListener('click',addLap);
  $('#stopwatchStyle').addEventListener('change',e=>{$('#stopwatchStage').className=`stopwatch-stage style-${e.target.value}`;storage.set('stopwatchStyle',e.target.value);});
  $$('[data-clock-style]').forEach(btn=>btn.addEventListener('click',()=>chooseClockStyle(btn.dataset.clockStyle)));

  $('#intervalApplyBtn').addEventListener('click',applyInterval);$('#intervalStartBtn').addEventListener('click',()=>intervalTimer.toggle());$('#intervalResetBtn').addEventListener('click',()=>intervalTimer.reset());
  $$('.focus-card').forEach(card=>card.addEventListener('click',()=>{focusWork=Number(card.dataset.focusWork);focusBreak=Number(card.dataset.focusBreak);$$('.focus-card').forEach(c=>c.classList.toggle('active',c===card));applyFocus();}));
  $('#focusStartBtn').addEventListener('click',()=>focusTimer.toggle());$('#focusResetBtn').addEventListener('click',()=>focusTimer.reset());$('#focusSkipBtn').addEventListener('click',()=>focusTimer.skip());
  $('#addScheduleRowBtn').addEventListener('click',()=>{schedule.push({label:`Stage ${schedule.length+1}`,minutes:5});renderScheduleRows();});
  $('#scheduleRows').addEventListener('input',e=>{const labelIndex=e.target.dataset.scheduleLabel,minutesIndex=e.target.dataset.scheduleMinutes;if(labelIndex!==undefined)schedule[Number(labelIndex)].label=e.target.value;if(minutesIndex!==undefined)schedule[Number(minutesIndex)].minutes=clamp(Number(e.target.value)||1,1,90);storage.set('schedule',schedule);});
  $('#scheduleRows').addEventListener('change',()=>applySchedule());
  $('#scheduleRows').addEventListener('click',e=>{if(e.target.dataset.removeSchedule!==undefined&&schedule.length>1){schedule.splice(Number(e.target.dataset.removeSchedule),1);renderScheduleRows();}});
  $('#scheduleStartBtn').addEventListener('click',()=>scheduleTimer.toggle());$('#scheduleResetBtn').addEventListener('click',()=>{applySchedule();scheduleTimer.reset();});$('#scheduleSkipBtn').addEventListener('click',()=>scheduleTimer.skip());

  document.addEventListener('keydown',e=>{
    const tag=document.activeElement?.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    if(e.key.toLowerCase()==='f'){e.preventDefault();setPresentation(!document.body.classList.contains('presentation-mode'));return;}
    if(e.code==='Space'){
      e.preventDefault();
      if(activeWorkspace==='countdown')startPauseCountdown();
      else if(activeWorkspace==='stopwatch')toggleStopwatch();
      else if(activeWorkspace==='interval')intervalTimer.toggle();
      else if(activeWorkspace==='focus')focusTimer.toggle();
      else if(activeWorkspace==='schedule')scheduleTimer.toggle();
    }
    if(e.key.toLowerCase()==='r'){
      if(activeWorkspace==='countdown')resetCountdown();
      else if(activeWorkspace==='stopwatch')resetStopwatch();
      else if(activeWorkspace==='interval')intervalTimer.reset();
      else if(activeWorkspace==='focus')focusTimer.reset();
      else if(activeWorkspace==='schedule')scheduleTimer.reset();
    }
  });

  setDarkMode(Boolean(storage.get('dark', false)));
  updateMuteUI();
  setWorkspace(storage.get('workspace','countdown'));
  setThemeFilter(themeFilter);
  chooseCountdownTheme(countdown.theme);
  setCountdownDuration(storage.get('durationSeconds',300));
  chooseClockStyle(clockStyle);
  const swStyle=storage.get('stopwatchStyle','classic');$('#stopwatchStyle').value=swStyle;$('#stopwatchStage').className=`stopwatch-stage style-${swStyle}`;
  applyInterval();applyFocus();renderScheduleRows();renderStopwatch();renderClock();setInterval(renderClock,250);
  window.addEventListener('beforeunload',()=>storage.set('durationSeconds',Math.round(countdown.totalMs/1000)));
})();

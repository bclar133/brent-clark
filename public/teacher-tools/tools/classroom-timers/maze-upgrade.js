(() => {
  'use strict';

  if (document.getElementById('mazeProperUpgradeStyleV2')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !stage || !display) return;

  const COLS = 11;
  const ROWS = 7;
  const CELL = 100;
  const DIRS = [
    { name:'N', dc:0, dr:-1, opposite:'S' },
    { name:'E', dc:1, dr:0, opposite:'W' },
    { name:'S', dc:0, dr:1, opposite:'N' },
    { name:'W', dc:-1, dr:0, opposite:'E' }
  ];

  const style = document.createElement('style');
  style.id = 'mazeProperUpgradeStyleV2';
  style.textContent = `
    .maze-scene.maze-proper-upgraded{
      background:linear-gradient(145deg,#304660 0%,#17263c 100%)!important;
    }
    .maze-proper-board{
      position:absolute;left:4%;right:4%;top:22%;bottom:5%;
      border:7px solid #deb15d;border-radius:18px;
      background:
        radial-gradient(circle at 22% 18%,rgba(255,255,255,.18),transparent 23%),
        linear-gradient(135deg,#f5dfa5,#ecd18c);
      box-shadow:0 13px 30px rgba(0,0,0,.30),inset 0 0 0 2px rgba(255,255,255,.18);
      overflow:hidden;
    }
    .maze-proper-svg,.maze-trail-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
    .maze-trail-svg{z-index:1;pointer-events:none}
    .maze-proper-svg{z-index:2;pointer-events:none}
    .maze-trail-path{
      fill:none;stroke:#111;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;
      opacity:.78;vector-effect:non-scaling-stroke;
    }
    .maze-proper-wall{
      stroke:#73502c;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;
      filter:drop-shadow(0 2px 0 rgba(255,255,255,.12));
    }
    .maze-proper-start{
      position:absolute;width:34px;height:34px;border-radius:50%;
      transform:translate(-50%,-50%);z-index:3;
      border:4px solid rgba(60,139,75,.74);background:rgba(94,178,100,.20);
      box-shadow:0 0 0 5px rgba(255,255,255,.18);
    }
    .maze-proper-hole{
      position:absolute;z-index:3;width:48px;height:48px;border-radius:50%;
      transform:translate(-50%,-50%);
      background:radial-gradient(circle at 45% 38%,#101d2b 0 57%,#050b12 59% 68%,#6b4a29 70% 79%,#3a281b 81%);
      box-shadow:inset 0 6px 10px rgba(0,0,0,.56),0 3px 3px rgba(255,255,255,.16);
    }
    .maze-proper-start::after,.maze-proper-hole::after{display:none!important;content:none!important}
    .maze-proper-marble{
      position:absolute;z-index:5;width:34px;height:34px;border-radius:50%;
      transform:translate(-50%,-50%) rotate(var(--maze-roll,0deg));
      background:radial-gradient(circle at 28% 25%,#fff 0 7%,#9ce4ff 10%,#52b7df 34%,#2d75ad 67%,#174d80 100%);
      box-shadow:inset -5px -6px 8px rgba(10,46,83,.34),0 5px 8px rgba(0,0,0,.30);
      will-change:left,top,transform;
    }
    .maze-proper-marble.at-finish{box-shadow:0 0 18px rgba(92,196,255,.8),inset -5px -6px 8px rgba(10,46,83,.34)}

    #countdownStage.theme-maze .time-display-wrap{
      position:absolute!important;left:auto!important;right:3.8%!important;top:2.5%!important;bottom:auto!important;
      transform:none!important;width:min(38%,360px)!important;z-index:30!important;
      justify-items:end!important;text-align:right!important;
    }
    #countdownStage.theme-maze #countdownDisplay,
    #countdownStage.theme-maze .time-display{
      width:auto!important;max-width:100%!important;
      font-size:clamp(3rem,5.7vw,5.6rem)!important;line-height:.96!important;
      padding:7px 15px 9px!important;white-space:nowrap!important;text-align:right!important;
    }
    #countdownStage.theme-maze #countdownMessage,
    #countdownStage.theme-maze .timer-message{
      margin-top:6px!important;padding:5px 10px!important;
      font-size:clamp(.7rem,.9vw,.88rem)!important;text-align:right!important;
    }
    #countdownStage.theme-maze.finished .time-display-wrap{
      display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-end!important;
      gap:14px!important;width:auto!important;max-width:92%!important;
    }
    #countdownStage.theme-maze.finished #countdownMessage,
    #countdownStage.theme-maze.finished .timer-message{
      margin:0!important;flex:0 0 auto!important;white-space:nowrap!important;
    }

    @media(max-width:760px){
      .maze-proper-board{left:3%;right:3%;top:25%;bottom:4%;border-width:5px;border-radius:14px}
      .maze-proper-wall{stroke-width:9}
      .maze-trail-path{stroke-width:5.5}
      .maze-proper-marble{width:27px;height:27px}
      .maze-proper-hole{width:39px;height:39px}
      .maze-proper-start{width:28px;height:28px}
      #countdownStage.theme-maze .time-display-wrap{right:3%!important;top:2%!important;width:min(50%,250px)!important}
      #countdownStage.theme-maze #countdownDisplay,#countdownStage.theme-maze .time-display{font-size:clamp(2.35rem,7.4vw,3.65rem)!important}
      #countdownStage.theme-maze.finished .time-display-wrap{gap:8px!important;max-width:94%!important}
      #countdownStage.theme-maze.finished #countdownMessage,#countdownStage.theme-maze.finished .timer-message{font-size:.66rem!important;padding:5px 8px!important}
    }
  `;
  document.head.appendChild(style);

  let trackedScene = null;
  let board = null;
  let marble = null;
  let trailPath = null;
  let route = [];
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let raf = 0;

  let audioCtx = null;
  let rollSource = null;
  let rollFilter = null;
  let rollGain = null;
  let rollOn = false;

  function index(c,r) { return r * COLS + c; }
  function cellAt(c,r,cells) { return cells[index(c,r)]; }

  function muted() {
    try {
      const stored = localStorage.getItem('ttTimers.muted');
      if (stored !== null) return JSON.parse(stored) === true;
    } catch {}
    return muteBtn?.getAttribute('aria-pressed') === 'true';
  }

  function ensureRollAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      audioCtx = new Ctx();
      const length = Math.max(1,audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1,length,audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<length;i++) data[i] = (Math.random()*2-1) * .55;

      rollSource = audioCtx.createBufferSource();
      rollSource.buffer = buffer;
      rollSource.loop = true;
      rollFilter = audioCtx.createBiquadFilter();
      rollFilter.type = 'bandpass';
      rollFilter.frequency.value = 230;
      rollFilter.Q.value = .7;
      rollGain = audioCtx.createGain();
      rollGain.gain.value = 0;
      rollSource.connect(rollFilter).connect(rollGain).connect(audioCtx.destination);
      rollSource.start();
      return audioCtx;
    } catch {
      audioCtx = null;
      return null;
    }
  }

  function setRolling(on) {
    const should = Boolean(on) && !muted() && !!sceneLayer.querySelector('.maze-proper-marble') && !stage.classList.contains('finished');
    if (should === rollOn && rollGain) return;
    rollOn = should;
    const ctx = should ? ensureRollAudio() : audioCtx;
    if (!ctx || !rollGain) return;
    const now = ctx.currentTime;
    rollGain.gain.cancelScheduledValues(now);
    rollGain.gain.setTargetAtTime(should ? .012 : 0,now,should ? .045 : .035);
  }

  function makeCells() {
    return Array.from({ length:COLS * ROWS }, (_,i) => ({
      c:i % COLS,r:Math.floor(i / COLS),visited:false,
      walls:{ N:true,E:true,S:true,W:true }
    }));
  }

  function neighbours(cell,cells,onlyUnvisited=false) {
    const out = [];
    for (const dir of DIRS) {
      const c = cell.c + dir.dc;
      const r = cell.r + dir.dr;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
      const next = cellAt(c,r,cells);
      if (onlyUnvisited && next.visited) continue;
      out.push({ dir,next });
    }
    return out;
  }

  function carvePerfectMaze() {
    const cells = makeCells();
    const start = cells[0];
    start.visited = true;
    const stack = [start];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const options = neighbours(current,cells,true);
      if (!options.length) { stack.pop(); continue; }
      const choice = options[Math.floor(Math.random() * options.length)];
      current.walls[choice.dir.name] = false;
      choice.next.walls[choice.dir.opposite] = false;
      choice.next.visited = true;
      stack.push(choice.next);
    }
    cells.forEach(cell => { cell.visited = false; });
    return cells;
  }

  function openNeighbours(cell,cells) {
    const out = [];
    for (const dir of DIRS) {
      if (cell.walls[dir.name]) continue;
      const c = cell.c + dir.dc;
      const r = cell.r + dir.dr;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
      out.push(cellAt(c,r,cells));
    }
    return out;
  }

  function solve(cells) {
    const start = cells[0];
    const finish = cells[cells.length - 1];
    const queue = [start];
    const seen = new Set([start]);
    const parent = new Map();
    while (queue.length) {
      const current = queue.shift();
      if (current === finish) break;
      for (const next of openNeighbours(current,cells)) {
        if (seen.has(next)) continue;
        seen.add(next);parent.set(next,current);queue.push(next);
      }
    }
    const path = [finish];
    let current = finish;
    while (current !== start && parent.has(current)) { current = parent.get(current); path.push(current); }
    path.reverse();
    return path;
  }

  function deadEndCount(cells) {
    return cells.reduce((count,cell) => count + (openNeighbours(cell,cells).length === 1 ? 1 : 0),0);
  }

  function createGoodMaze() {
    let best = null;
    for (let attempt=0; attempt<40; attempt++) {
      const cells = carvePerfectMaze();
      const solved = solve(cells);
      const deadEnds = deadEndCount(cells);
      const candidate = { cells, solved, score:solved.length + deadEnds * 1.4 };
      if (!best || candidate.score > best.score) best = candidate;
      if (solved.length >= 25 && deadEnds >= 10) return candidate;
    }
    return best;
  }

  function wallMarkup(cells) {
    const lines = [];
    for (const cell of cells) {
      const x = cell.c * CELL;
      const y = cell.r * CELL;
      if (cell.walls.N) lines.push(`<line class="maze-proper-wall" x1="${x}" y1="${y}" x2="${x+CELL}" y2="${y}"/>`);
      if (cell.walls.W) lines.push(`<line class="maze-proper-wall" x1="${x}" y1="${y}" x2="${x}" y2="${y+CELL}"/>`);
      if (cell.c === COLS-1 && cell.walls.E) lines.push(`<line class="maze-proper-wall" x1="${x+CELL}" y1="${y}" x2="${x+CELL}" y2="${y+CELL}"/>`);
      if (cell.r === ROWS-1 && cell.walls.S) lines.push(`<line class="maze-proper-wall" x1="${x}" y1="${y+CELL}" x2="${x+CELL}" y2="${y+CELL}"/>`);
    }
    return lines.join('');
  }

  function pointPercent(cell) {
    return { x:(cell.c + .5) / COLS * 100, y:(cell.r + .5) / ROWS * 100 };
  }

  function parseRemainingSeconds() {
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(n => !Number.isFinite(n))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  function totalSeconds() {
    return Math.max(1,(Number(minutesInput?.value)||0)*60 + (Number(secondsInput?.value)||0));
  }

  function progressNow(now,running) {
    const current = parseRemainingSeconds();
    if (current === null) return 0;
    if (displayedRemaining === null || current !== displayedRemaining) {
      displayedRemaining = current;
      displayChangedAt = now;
    }
    let estimated = current;
    if (running && current > 0) estimated = Math.max(0,current - (now-displayChangedAt)/1000);
    return Math.max(0,Math.min(1,1 - estimated / totalSeconds()));
  }

  function upgradeScene(scene,now) {
    if (!scene || scene.dataset.properMaze === 'true') return;
    const generated = createGoodMaze();
    if (!generated) return;

    scene.dataset.properMaze = 'true';
    scene.classList.add('maze-proper-upgraded');
    route = generated.solved.map(pointPercent);
    const start = route[0];
    const finish = route[route.length - 1];

    scene.innerHTML = `
      <div class="maze-proper-board">
        <svg class="maze-trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="maze-trail-path" d="M ${start.x} ${start.y}"/>
        </svg>
        <svg class="maze-proper-svg" viewBox="0 0 ${COLS*CELL} ${ROWS*CELL}" preserveAspectRatio="none" aria-hidden="true">
          ${wallMarkup(generated.cells)}
        </svg>
        <div class="maze-proper-start" style="left:${start.x}%;top:${start.y}%"></div>
        <div class="maze-proper-hole" style="left:${finish.x}%;top:${finish.y}%"></div>
        <div class="maze-proper-marble" style="left:${start.x}%;top:${start.y}%"></div>
      </div>`;

    trackedScene = scene;
    board = scene.querySelector('.maze-proper-board');
    marble = scene.querySelector('.maze-proper-marble');
    trailPath = scene.querySelector('.maze-trail-path');
    displayedRemaining = parseRemainingSeconds();
    displayChangedAt = now;
    lastStatus = stageStatus?.textContent.trim() || '';
  }

  function placeMarble(progress) {
    if (!board || !marble || !route.length || route.length === 1) return;
    const rect = board.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const segments = [];
    let total = 0;
    for (let i=0;i<route.length-1;i++) {
      const a = route[i];
      const b = route[i+1];
      const dx = (b.x-a.x)/100 * rect.width;
      const dy = (b.y-a.y)/100 * rect.height;
      const length = Math.hypot(dx,dy);
      segments.push({ a,b,length,start:total,index:i });
      total += length;
    }

    const target = Math.max(0,Math.min(total,total*progress));
    let segment = segments[segments.length-1];
    for (const candidate of segments) {
      if (target <= candidate.start + candidate.length) { segment = candidate; break; }
    }
    const local = segment.length ? Math.max(0,Math.min(1,(target-segment.start)/segment.length)) : 0;
    const x = segment.a.x + (segment.b.x-segment.a.x)*local;
    const y = segment.a.y + (segment.b.y-segment.a.y)*local;
    marble.style.left = `${x}%`;
    marble.style.top = `${y}%`;
    marble.style.setProperty('--maze-roll',`${((target / 34) * 57.2958).toFixed(1)}deg`);
    marble.classList.toggle('at-finish',progress >= .999);

    if (trailPath) {
      const trailPoints = [route[0]];
      for (let i=1;i<=segment.index;i++) trailPoints.push(route[i]);
      trailPoints.push({x,y});
      trailPath.setAttribute('d',trailPoints.map((p,i) => `${i ? 'L' : 'M'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' '));
    }
  }

  function loop(now) {
    const scene = sceneLayer.querySelector('.maze-scene');
    if (!scene) {
      trackedScene = board = marble = trailPath = null;
      route = [];
      displayedRemaining = null;
      lastStatus = '';
      setRolling(false);
      raf = requestAnimationFrame(loop);
      return;
    }

    if (scene !== trackedScene || scene.dataset.properMaze !== 'true') upgradeScene(scene,now);

    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';
    if (status !== lastStatus) {
      lastStatus = status;
      displayedRemaining = parseRemainingSeconds();
      displayChangedAt = now;
    }
    const progress = progressNow(now,running);
    placeMarble(progress);
    setRolling(running && progress < .999);
    raf = requestAnimationFrame(loop);
  }

  const observer = new MutationObserver(() => {
    const scene = sceneLayer.querySelector('.maze-scene');
    if (scene && scene.dataset.properMaze !== 'true') upgradeScene(scene,performance.now());
  });
  observer.observe(sceneLayer,{ childList:true,subtree:true });

  const unlockAudio = () => ensureRollAudio();
  document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
  document.addEventListener('keydown',unlockAudio,{capture:true});
  const refreshMute = () => setTimeout(() => setRolling(stageStatus?.textContent.trim()==='Running'),0);
  muteBtn?.addEventListener('click',refreshMute);
  presentationMuteBtn?.addEventListener('click',refreshMute);
  window.addEventListener('storage',event => { if (event.key === 'ttTimers.muted') refreshMute(); });
  window.addEventListener('resize',() => placeMarble(progressNow(performance.now(),stageStatus?.textContent.trim()==='Running')));

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();

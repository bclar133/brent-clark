(() => {
  'use strict';

  if (document.getElementById('moonPhasesSmoothStyleV2')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'moonPhasesSmoothStyleV2';
  style.textContent = `
    .xt-moon .xt-moon-orbit,
    .xt-moon .xt-moon-glyph,
    .xt-moon .xt-moon-label {
      display:none !important;
    }

    .xt-moon.moon-smooth-upgraded {
      background:
        radial-gradient(circle at 73% 43%, rgba(67,91,143,.24), transparent 28%),
        radial-gradient(circle at 46% 18%, #1d3158 0, #101c35 43%, #070d1d 78%, #040813 100%) !important;
    }

    .smooth-moon-stars {
      position:absolute;
      inset:0;
      pointer-events:none;
      z-index:1;
    }

    .smooth-moon-star {
      position:absolute;
      width:var(--star-size);
      height:var(--star-size);
      border-radius:50%;
      background:rgba(244,248,255,.96);
      opacity:var(--star-opacity);
      box-shadow:0 0 5px rgba(205,224,255,.65);
    }

    .smooth-moon-wrap {
      position:absolute;
      right:8%;
      top:48%;
      width:min(48vw,430px);
      aspect-ratio:1;
      transform:translateY(-50%);
      z-index:4;
      filter:drop-shadow(0 0 var(--moon-glow,8px) rgba(211,226,255,.52));
    }

    .smooth-moon-svg {
      display:block;
      width:100%;
      height:100%;
      overflow:visible;
      shape-rendering:geometricPrecision;
    }

    .smooth-moon-phase-label {
      position:absolute;
      left:50%;
      top:calc(100% + 14px);
      transform:translateX(-50%);
      min-width:260px;
      text-align:center;
      color:#f3f6ff;
      font-family:var(--display);
      font-size:clamp(1.25rem,2.8vw,2rem);
      letter-spacing:.035em;
      text-shadow:0 3px 12px rgba(0,0,0,.55);
      white-space:nowrap;
    }

    .smooth-moon-phase-dots {
      display:flex;
      justify-content:center;
      gap:8px;
      margin-top:9px;
    }

    .smooth-moon-phase-dots i {
      width:6px;
      height:6px;
      border-radius:50%;
      background:rgba(220,230,249,.28);
      box-shadow:none;
    }

    .smooth-moon-phase-dots i.active {
      background:#f3f6ff;
      box-shadow:0 0 7px rgba(236,242,255,.65);
    }

    @media(max-width:760px){
      .smooth-moon-wrap {
        right:2%;
        top:53%;
        width:min(54vw,330px);
      }
      .smooth-moon-phase-label {
        min-width:190px;
        font-size:clamp(1rem,4.2vw,1.45rem);
      }
    }
  `;
  document.head.appendChild(style);

  const PHASES = [
    {name:'New Moon', at:0},
    {name:'Waxing Crescent', at:.24},
    {name:'First Quarter', at:.50},
    {name:'Waxing Gibbous', at:.76},
    {name:'Full Moon', at:1}
  ];

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastScene = null;
  let raf = 0;

  function parseRemaining(){
    const parts = display.textContent.trim().split(':').map(Number);
    if(parts.some(v => !Number.isFinite(v))) return null;
    if(parts.length === 2) return parts[0]*60 + parts[1];
    if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60 + (Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current = parseRemaining();
    if(current === null) return 0;
    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';
    if(displayedRemaining === null || current !== displayedRemaining || status !== lastStatus){
      displayedRemaining = current;
      displayChangedAt = now;
      lastStatus = status;
    }
    let estimated = current;
    if(running && current > 0) estimated = Math.max(0,current - (now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function seededStars(){
    let seed = 18473;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    return Array.from({length:104},() => {
      const x = (1 + rand()*98).toFixed(2);
      const y = (2 + rand()*94).toFixed(2);
      const size = (0.9 + rand()*2.3).toFixed(1);
      const opacity = (0.28 + rand()*.70).toFixed(2);
      return `<i class="smooth-moon-star" style="left:${x}%;top:${y}%;--star-size:${size}px;--star-opacity:${opacity}"></i>`;
    }).join('');
  }

  function moonMarkup(){
    const dots = PHASES.map((_,i)=>`<i data-phase-dot="${i}"></i>`).join('');
    return `
      <div class="smooth-moon-stars">${seededStars()}</div>
      <div class="smooth-moon-wrap">
        <svg class="smooth-moon-svg" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="smoothMoonDiskClipV2">
              <circle cx="200" cy="200" r="154"></circle>
            </clipPath>
            <clipPath id="smoothMoonLightClipV2">
              <path class="smooth-moon-light-path"></path>
            </clipPath>
            <radialGradient id="smoothMoonDarkGradientV2" cx="34%" cy="28%" r="78%">
              <stop offset="0" stop-color="#182640"></stop>
              <stop offset=".68" stop-color="#0e1a2d"></stop>
              <stop offset="1" stop-color="#060d19"></stop>
            </radialGradient>
            <radialGradient id="smoothMoonLitGradientV2" cx="38%" cy="30%" r="78%">
              <stop offset="0" stop-color="#fffdf3"></stop>
              <stop offset=".55" stop-color="#deddd5"></stop>
              <stop offset="1" stop-color="#a8adb0"></stop>
            </radialGradient>
          </defs>

          <g clip-path="url(#smoothMoonDiskClipV2)">
            <circle cx="200" cy="200" r="154" fill="url(#smoothMoonDarkGradientV2)"></circle>

            <g opacity=".38">
              <circle cx="132" cy="155" r="40" fill="#030914"></circle>
              <circle cx="245" cy="125" r="26" fill="#26354c"></circle>
              <circle cx="226" cy="246" r="31" fill="#06101f"></circle>
              <circle cx="300" cy="277" r="38" fill="#2d394d"></circle>
              <circle cx="108" cy="292" r="34" fill="#020711"></circle>
              <circle cx="184" cy="92" r="18" fill="#2c3a51"></circle>
            </g>

            <g class="smooth-moon-lit-layer" clip-path="url(#smoothMoonLightClipV2)">
              <circle cx="200" cy="200" r="154" fill="url(#smoothMoonLitGradientV2)"></circle>
              <g opacity=".30">
                <circle cx="132" cy="155" r="40" fill="#85888b"></circle>
                <circle cx="245" cy="125" r="26" fill="#f2f1e9"></circle>
                <circle cx="226" cy="246" r="31" fill="#96999b"></circle>
                <circle cx="300" cy="277" r="38" fill="#c2b790"></circle>
                <circle cx="108" cy="292" r="34" fill="#777b80"></circle>
                <circle cx="184" cy="92" r="18" fill="#efeee8"></circle>
              </g>
              <g fill="none" stroke="rgba(255,255,255,.20)" stroke-width="2">
                <circle cx="132" cy="155" r="40"></circle>
                <circle cx="245" cy="125" r="26"></circle>
                <circle cx="226" cy="246" r="31"></circle>
                <circle cx="300" cy="277" r="38"></circle>
              </g>
            </g>
          </g>
        </svg>
        <div class="smooth-moon-phase-label">
          <span class="smooth-moon-phase-name">New Moon</span>
          <span class="smooth-moon-phase-dots">${dots}</span>
        </div>
      </div>
    `;
  }

  function upgrade(scene){
    if(!scene || scene.dataset.smoothMoon === '2') return;
    scene.innerHTML = moonMarkup();
    scene.dataset.smoothMoon = '2';
    scene.classList.add('moon-smooth-upgraded');
  }

  function buildLightPath(progress){
    const p = clamp(progress,0,1);
    const cx = 200;
    const cy = 200;
    const r = 154;
    const samples = 96;
    const bulge = r * (1 - 2*p);
    const pts = [];

    // Fixed illuminated outer edge: the right half of the Moon.
    for(let i=0;i<=samples;i++){
      const angle = -Math.PI/2 + Math.PI*(i/samples);
      pts.push([cx + r*Math.cos(angle), cy + r*Math.sin(angle)]);
    }

    // Curved terminator: starts on the right rim at New Moon, becomes a
    // vertical line at First Quarter, then bows left until Full Moon.
    for(let i=0;i<=samples;i++){
      const y = cy + r - (2*r)*(i/samples);
      const yn = clamp((y-cy)/r,-1,1);
      const x = cx + bulge*Math.sqrt(Math.max(0,1-yn*yn));
      pts.push([x,y]);
    }

    return pts.map((pt,i)=>`${i===0?'M':'L'}${pt[0].toFixed(3)},${pt[1].toFixed(3)}`).join(' ') + ' Z';
  }

  function phaseIndexFor(p){
    if(p < .12) return 0;
    if(p < .38) return 1;
    if(p < .63) return 2;
    if(p < .88) return 3;
    return 4;
  }

  function render(scene,p){
    const progress = clamp(p,0,1);
    const path = scene.querySelector('.smooth-moon-light-path');
    const litLayer = scene.querySelector('.smooth-moon-lit-layer');
    if(path) path.setAttribute('d',buildLightPath(progress));
    if(litLayer) litLayer.style.opacity = progress <= .0005 ? '0' : '1';

    const phaseIndex = phaseIndexFor(progress);
    const label = scene.querySelector('.smooth-moon-phase-name');
    if(label) label.textContent = PHASES[phaseIndex].name;
    scene.querySelectorAll('[data-phase-dot]').forEach((dot,i)=>dot.classList.toggle('active',i===phaseIndex));

    const wrap = scene.querySelector('.smooth-moon-wrap');
    if(wrap) wrap.style.setProperty('--moon-glow',`${5 + progress*34}px`);
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-moon[data-xt-theme="moon"]');
    if(scene !== lastScene){
      lastScene = scene || null;
      displayedRemaining = null;
    }

    if(scene){
      upgrade(scene);
      render(scene,progressNow(now));
    }

    raf = requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();

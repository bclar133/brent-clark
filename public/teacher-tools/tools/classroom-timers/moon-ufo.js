(() => {
  'use strict';

  if (document.getElementById('moonUfoStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'moonUfoStyleV1';
  style.textContent = `
    .xt-moon .moon-ufo {
      position:absolute;
      left:-90px;
      top:35%;
      width:76px;
      height:52px;
      z-index:2;
      pointer-events:none;
      opacity:0;
      transform:translate(-50%,-50%);
      transform-origin:50% 50%;
      will-change:left,top,transform,opacity;
      filter:drop-shadow(0 4px 6px rgba(0,0,0,.34));
    }

    .xt-moon .moon-ufo svg {
      display:block;
      width:100%;
      height:100%;
      overflow:visible;
    }

    .xt-moon .moon-ufo-light {
      animation:moonUfoLightBlink .48s ease-in-out infinite alternate;
    }

    .xt-moon .moon-ufo-alien-head {
      transform-origin:60px 31px;
      animation:moonUfoAlienBob .78s ease-in-out infinite alternate;
    }

    @keyframes moonUfoLightBlink {
      from { opacity:.48; }
      to { opacity:1; }
    }

    @keyframes moonUfoAlienBob {
      from { transform:rotate(-3deg) translateY(0); }
      to { transform:rotate(3deg) translateY(-1.8px); }
    }

    @media(max-width:760px){
      .xt-moon .moon-ufo {
        width:60px;
        height:42px;
      }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const smooth = t => t*t*(3-2*t);
  const random = (a,b) => a + Math.random()*(b-a);

  let activeScene = null;
  let ufo = null;
  let raf = 0;
  let state = null;

  function makeState(now){
    return {
      active:false,
      nextAt:now + random(2600,5200),
      start:0,
      duration:0,
      fromX:0,
      toX:0,
      baseY:0,
      wave:0,
      wave2:0,
      direction:1,
      tiltSeed:random(0,Math.PI*2)
    };
  }

  function markup(){
    return `
      <svg viewBox="0 0 120 82" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="moonUfoMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#d6e1ed"/>
            <stop offset=".52" stop-color="#8ea1b8"/>
            <stop offset="1" stop-color="#58697f"/>
          </linearGradient>
          <linearGradient id="moonUfoGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="rgba(223,255,255,.84)"/>
            <stop offset="1" stop-color="rgba(82,185,222,.45)"/>
          </linearGradient>
        </defs>

        <ellipse cx="60" cy="67" rx="31" ry="6" fill="rgba(126,240,255,.09)"/>

        <path d="M41 39 C43 20 77 20 79 39 Z" fill="url(#moonUfoGlass)" stroke="rgba(219,246,255,.55)" stroke-width="2"/>

        <g class="moon-ufo-alien-head">
          <ellipse cx="60" cy="31" rx="10" ry="12" fill="#7be570"/>
          <path d="M55 20 Q60 14 65 20" fill="none" stroke="#7be570" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="60" cy="14.8" r="2.2" fill="#b9ff91"/>
          <ellipse cx="55.5" cy="29" rx="2.5" ry="3.3" fill="#15211a" transform="rotate(-18 55.5 29)"/>
          <ellipse cx="64.5" cy="29" rx="2.5" ry="3.3" fill="#15211a" transform="rotate(18 64.5 29)"/>
          <path d="M55 36 Q60 39.5 65 36" fill="none" stroke="#24472b" stroke-width="1.7" stroke-linecap="round"/>
        </g>

        <ellipse cx="60" cy="49" rx="47" ry="15" fill="url(#moonUfoMetal)" stroke="#46576d" stroke-width="2"/>
        <ellipse cx="60" cy="45" rx="37" ry="9" fill="#bcc9d8" opacity=".72"/>
        <path d="M18 49 Q60 66 102 49 Q96 64 60 68 Q24 64 18 49 Z" fill="#53657b" opacity=".78"/>

        <circle class="moon-ufo-light" cx="31" cy="56" r="3.3" fill="#ffd35c"/>
        <circle class="moon-ufo-light" cx="45" cy="61" r="3.3" fill="#ff8970" style="animation-delay:-.18s"/>
        <circle class="moon-ufo-light" cx="60" cy="62.5" r="3.3" fill="#9cffb7" style="animation-delay:-.34s"/>
        <circle class="moon-ufo-light" cx="75" cy="61" r="3.3" fill="#ff8970" style="animation-delay:-.09s"/>
        <circle class="moon-ufo-light" cx="89" cy="56" r="3.3" fill="#ffd35c" style="animation-delay:-.27s"/>
      </svg>
    `;
  }

  function ensureUfo(scene){
    let el = scene.querySelector('.moon-ufo');
    if (!el){
      el = document.createElement('div');
      el.className = 'moon-ufo';
      el.innerHTML = markup();
      scene.appendChild(el);
    }
    return el;
  }

  function startFlight(scene,now){
    const width = Math.max(320,scene.clientWidth || 900);
    const height = Math.max(260,scene.clientHeight || 560);
    const leftToRight = Math.random() >= .5;

    state.active = true;
    state.start = now;
    state.duration = random(6200,9200);
    state.direction = leftToRight ? 1 : -1;
    state.fromX = leftToRight ? -70 : width + 70;
    state.toX = leftToRight ? width + 70 : -70;

    // Keep most flights near the Moon's vertical band so some naturally pass behind it.
    state.baseY = random(height*.30,height*.61);
    state.wave = random(18,52);
    state.wave2 = random(7,22);
    state.tiltSeed = random(0,Math.PI*2);
  }

  function renderFlight(scene,now){
    if (!ufo || !state) return;

    if (!state.active && now >= state.nextAt){
      startFlight(scene,now);
    }

    if (!state.active){
      ufo.style.opacity = '0';
      return;
    }

    const raw = clamp((now-state.start)/state.duration,0,1);
    const travel = smooth(raw);
    const x = lerp(state.fromX,state.toX,travel);
    const y = state.baseY
      + Math.sin(raw*Math.PI*2.15)*state.wave
      + Math.sin(raw*Math.PI*5.1 + .7)*state.wave2;

    const fadeIn = clamp(raw/.08,0,1);
    const fadeOut = clamp((1-raw)/.08,0,1);
    const opacity = Math.min(fadeIn,fadeOut);
    const tilt = Math.sin(raw*Math.PI*4 + state.tiltSeed)*7;
    const bobScale = 1 + Math.sin(raw*Math.PI*3.2)*.025;

    ufo.style.left = `${x.toFixed(2)}px`;
    ufo.style.top = `${y.toFixed(2)}px`;
    ufo.style.opacity = String(opacity);
    ufo.style.transform = `translate(-50%,-50%) rotate(${tilt.toFixed(2)}deg) scale(${bobScale.toFixed(3)})`;

    if (raw >= 1){
      state.active = false;
      state.nextAt = now + random(7000,15000);
      ufo.style.opacity = '0';
    }
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-moon[data-xt-theme="moon"]');

    if (scene !== activeScene){
      activeScene = scene || null;
      ufo = null;
      state = makeState(now);
    }

    if (scene){
      ufo = ensureUfo(scene);
      renderFlight(scene,now);
    }

    raf = requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();
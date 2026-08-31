(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV5')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV5';
  style.textContent = `
    /* Taller left-background tree with darker foliage for contrast. */
    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 {
      left:7% !important;
      bottom:24.8% !important;
      width:64px !important;
      height:176px !important;
      transform:none !important;
      opacity:.94 !important;
      z-index:1 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 .trunk {
      left:26px !important;
      width:13px !important;
      height:108px !important;
      background:linear-gradient(90deg,#664329,#8a6038,#5f3f27) !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 .canopy,
    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 .canopy::before,
    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 .canopy::after {
      background:#3f7540 !important;
      box-shadow:inset -6px -5px 0 rgba(25,67,36,.18) !important;
    }

    /* Pond sits to the right of the tree with a visible grass gap. */
    .xt-dino.dino-egg-upgraded .dino-up-water {
      left:21.5% !important;
      right:auto !important;
      bottom:21.8% !important;
      width:108px !important;
      height:28px !important;
      z-index:1 !important;
      opacity:.78 !important;
      filter:saturate(.9) !important;
    }

    /* Small dinosaur stands on grass beside the pond. */
    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      left:13.2% !important;
      right:auto !important;
      bottom:22.3% !important;
      width:62px !important;
      height:39px !important;
      z-index:1 !important;
      opacity:.66 !important;
      filter:drop-shadow(0 1px 1px rgba(0,0,0,.08)) !important;
      transform:none !important;
      animation:none !important;
    }

    .xt-dino.dino-egg-upgraded .dino-v5-drink-head {
      transform-box:view-box;
      transform-origin:61px 45px;
      animation:dinoV5DrinkHead 4.8s ease-in-out infinite;
    }

    @keyframes dinoV5DrinkHead {
      0%,18%,47%,58%,84%,100% { transform:rotate(0deg); }
      28%,37% { transform:rotate(20deg); }
      67%,75% { transform:rotate(14deg); }
    }

    /* Move HATCHED high enough that it never covers the dinosaur. */
    .xt-dino.dino-egg-upgraded .dino-up-pop {
      top:7% !important;
      bottom:auto !important;
      color:#344722 !important;
      text-shadow:0 2px 0 rgba(255,255,255,.26),0 3px 8px rgba(35,48,22,.18) !important;
    }

    /* Hatchling remains behind the foreground shell pieces. */
    .xt-dino.dino-egg-upgraded .dino-up-baby {
      z-index:3 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-shell-half {
      z-index:7 !important;
      position:absolute !important;
    }

    /* Original crack layer is used while the egg is intact. */
    .xt-dino.dino-egg-upgraded .dino-up-cracks {
      pointer-events:none !important;
      z-index:7 !important;
    }

    /* Copies of those same cracks live on each shell half once it separates. */
    .xt-dino.dino-egg-upgraded .dino-up-shell-cracks {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      pointer-events:none;
      z-index:9;
    }

    .xt-dino.dino-egg-upgraded .dino-up-shell-cracks path {
      fill:none;
      stroke:#857652;
      stroke-width:3.2;
      stroke-linecap:round;
      stroke-linejoin:round;
      opacity:0;
      filter:drop-shadow(0 0 1px rgba(0,0,0,.06));
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-tree.t1 {
        left:3% !important;
        bottom:25.5% !important;
        width:48px !important;
        height:136px !important;
      }

      .xt-dino.dino-egg-upgraded .dino-up-tree.t1 .trunk {
        left:19px !important;
        width:10px !important;
        height:83px !important;
      }

      .xt-dino.dino-egg-upgraded .dino-up-water {
        left:18.5% !important;
        bottom:22.3% !important;
        width:86px !important;
        height:22px !important;
      }

      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        left:10.5% !important;
        bottom:23.1% !important;
        width:48px !important;
        height:31px !important;
      }

      .xt-dino.dino-egg-upgraded .dino-up-pop {
        top:5.5% !important;
      }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const crackThresholds = [.13,.25,.38,.52,.66,.79,.88];

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastScene = null;
  let raf = 0;

  function parseRemaining(){
    const parts = display.textContent.trim().split(':').map(Number);
    if(parts.some(v => !Number.isFinite(v))) return null;
    if(parts.length===2) return parts[0]*60+parts[1];
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current = parseRemaining();
    if(current===null) return 0;
    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';

    if(displayedRemaining===null || current!==displayedRemaining || status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }

    let estimated=current;
    if(running && current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function patchDrinker(scene){
    const drinker = scene.querySelector('.dino-up-drinker');
    if(!drinker || drinker.dataset.v5Patched==='2') return;

    drinker.innerHTML = `
      <svg viewBox="0 0 130 95" aria-hidden="true" focusable="false">
        <!-- body and tail remain planted -->
        <path d="M34 51 Q18 48 7 40" fill="none" stroke="#79aa5b" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="49" cy="52" rx="22" ry="12" fill="#84b867"/>
        <ellipse cx="44" cy="48" rx="11" ry="5" fill="#93c676" opacity=".48"/>

        <!-- four legs fully on the grass -->
        <path d="M36 61 L34 83 M47 62 L46 84 M59 61 L61 83 M69 58 L73 80"
              fill="none" stroke="#5b8047" stroke-width="4" stroke-linecap="round"/>
        <path d="M30 83 L38 83 M42 84 L50 84 M57 83 L65 83 M69 80 L77 80"
              fill="none" stroke="#4b7139" stroke-width="2.7" stroke-linecap="round"/>

        <!-- only the neck/head nods down to drink -->
        <g class="dino-v5-drink-head">
          <path d="M65 48 Q82 40 98 29" fill="none" stroke="#84b867" stroke-width="9" stroke-linecap="round"/>
          <ellipse cx="105" cy="26" rx="9" ry="7" fill="#8ec171" transform="rotate(-8 105 26)"/>
          <circle cx="108" cy="24" r="1.5" fill="#1c2719"/>
          <circle cx="108.4" cy="23.6" r=".5" fill="#eef7e8"/>
          <path d="M111 29 Q107 31 102 30" fill="none" stroke="#52733f" stroke-width="1.7" stroke-linecap="round"/>
        </g>
      </svg>
    `;

    drinker.dataset.v5Patched='2';
  }

  function installShellCracks(scene){
    const sourceSvg = scene.querySelector('.dino-up-cracks');
    const leftHalf = scene.querySelector('.dino-up-shell-half.left');
    const rightHalf = scene.querySelector('.dino-up-shell-half.right');
    if(!sourceSvg || !leftHalf || !rightHalf) return;

    if(scene.dataset.v5ShellCracks==='2') return;

    /* Remove any stale v5 copies so we rebuild from the current crack artwork. */
    scene.querySelectorAll('.dino-up-shell-cracks').forEach(el=>el.remove());

    const sourcePaths = [...sourceSvg.querySelectorAll('path')];
    if(!sourcePaths.length) return;
    const viewBox = sourceSvg.getAttribute('viewBox') || '0 0 278 365';

    const makeOverlay = side => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class',`dino-up-shell-cracks ${side}`);
      svg.setAttribute('viewBox',viewBox);
      svg.setAttribute('preserveAspectRatio','none');
      sourcePaths.forEach((p,i)=>{
        const cp = document.createElementNS('http://www.w3.org/2000/svg','path');
        cp.setAttribute('d',p.getAttribute('d')||'');
        cp.dataset.crackIndex=String(i);
        svg.appendChild(cp);
      });
      return svg;
    };

    leftHalf.appendChild(makeOverlay('left'));
    rightHalf.appendChild(makeOverlay('right'));
    scene.dataset.v5ShellCracks='2';
  }

  function syncCracks(scene,p){
    /* Shell halves do not become visible until this point. */
    const shellSeparating = p >= .86;

    const original = scene.querySelector('.dino-up-cracks');
    const originalPaths = original ? [...original.querySelectorAll('[data-dino-crack],path')] : [];

    if(original){
      original.style.setProperty('visibility',shellSeparating?'hidden':'visible','important');
      original.style.setProperty('opacity',shellSeparating?'0':'1','important');
    }

    originalPaths.forEach((path,i)=>{
      const visible = p >= (crackThresholds[i] ?? 1.1);
      path.style.setProperty('opacity',(!shellSeparating && visible)?'1':'0','important');
    });

    const shellGroups = [
      [...scene.querySelectorAll('.dino-up-shell-half.left .dino-up-shell-cracks path')],
      [...scene.querySelectorAll('.dino-up-shell-half.right .dino-up-shell-cracks path')]
    ];

    shellGroups.forEach(group=>{
      group.forEach((path,i)=>{
        const visible = p >= (crackThresholds[i] ?? 1.1);
        path.style.setProperty('opacity',(shellSeparating && visible)?'1':'0','important');
      });
    });
  }

  function tick(now){
    const scene = sceneLayer.querySelector('.xt-dino[data-xt-theme="dino"]');

    if(scene!==lastScene){
      lastScene=scene||null;
      displayedRemaining=null;
    }

    if(scene){
      patchDrinker(scene);
      installShellCracks(scene);
      syncCracks(scene,progressNow(now));
    }

    raf=requestAnimationFrame(tick);
  }

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(tick);
})();
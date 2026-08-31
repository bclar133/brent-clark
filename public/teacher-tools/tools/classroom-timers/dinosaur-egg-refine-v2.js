(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV2')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV2';
  style.textContent = `
    /* Pull the pond and its little sauropod up beside the smaller background tree. */
    .xt-dino.dino-egg-upgraded .dino-up-water {
      right:20% !important;
      bottom:16.5% !important;
      width:150px !important;
      height:46px !important;
      z-index:1 !important;
      opacity:.90 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      right:23% !important;
      bottom:20% !important;
      width:60px !important;
      height:43px !important;
      z-index:1 !important;
      opacity:.68 !important;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.08)) !important;
    }

    /* Restore the simpler, friendlier hatchling proportions from the first version. */
    .xt-dino.dino-egg-upgraded .dino-up-baby {
      width:175px !important;
      height:190px !important;
      filter:drop-shadow(0 5px 4px rgba(0,0,0,.15)) !important;
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-water {
        right:12% !important;
        bottom:17% !important;
        width:120px !important;
        height:38px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        right:17% !important;
        bottom:20% !important;
        width:49px !important;
        height:36px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-baby {
        width:165px !important;
        height:180px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const firstBabyMarkup = `
    <svg viewBox="0 0 180 190" aria-hidden="true" focusable="false">
      <g class="dino-up-baby-head">
        <ellipse cx="91" cy="68" rx="42" ry="36" fill="#7fd06a"/>
        <ellipse cx="122" cy="73" rx="19" ry="14" fill="#82d56d"/>
        <circle cx="80" cy="62" r="5.4" fill="#152015"/>
        <circle cx="104" cy="62" r="5.4" fill="#152015"/>
        <circle cx="78.5" cy="60.5" r="1.4" fill="#ffffff"/>
        <circle cx="102.5" cy="60.5" r="1.4" fill="#ffffff"/>
        <circle class="happy-cheek" cx="72" cy="78" r="6" fill="#f29c87" opacity=".62"/>
        <circle class="happy-cheek" cx="111" cy="78" r="6" fill="#f29c87" opacity=".62"/>
        <path class="flat-mouth" d="M81 83 Q91 79 101 83" fill="none" stroke="#24441f" stroke-width="4" stroke-linecap="round"/>
        <path class="happy-mouth" d="M79 81 Q91 98 105 81" fill="#fff6d8" stroke="#24441f" stroke-width="4" stroke-linejoin="round"/>
        <path d="M66 42 Q72 27 84 39 M87 36 Q95 20 106 34" fill="none" stroke="#5aa64e" stroke-width="7" stroke-linecap="round"/>
      </g>
      <ellipse cx="91" cy="138" rx="38" ry="31" fill="#74bf5d"/>
      <path class="normal-arm" d="M62 126 Q48 133 43 145 M120 126 Q135 132 141 144" fill="none" stroke="#74bf5d" stroke-width="11" stroke-linecap="round"/>
      <path class="happy-arm" d="M62 126 Q45 113 43 96 M120 126 Q138 112 139 94" fill="none" stroke="#74bf5d" stroke-width="11" stroke-linecap="round"/>
      <path d="M67 160 L61 183 M113 160 L121 183" stroke="#568e49" stroke-width="10" stroke-linecap="round"/>
      <path d="M53 144 Q34 150 25 163" fill="none" stroke="#74bf5d" stroke-width="12" stroke-linecap="round"/>
    </svg>
  `;

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const smooth = t => t*t*(3-2*t);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastScene = null;
  let raf = 0;

  function parseRemaining(){
    const parts = display.textContent.trim().split(':').map(Number);
    if(parts.some(v=>!Number.isFinite(v))) return null;
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

  function patchArtwork(scene){
    if(!scene || scene.dataset.dinoRefinedV2==='1') return;
    /* Wait for the earlier refinement to finish, then deliberately restore the first hatchling. */
    if(scene.dataset.dinoRefined!=='1') return;
    const baby=scene.querySelector('.dino-up-baby');
    if(baby) baby.innerHTML=firstBabyMarkup;
    scene.dataset.dinoRefinedV2='1';
  }

  function renderShellOpening(scene,p){
    const left=scene.querySelector('.dino-up-shell-half.left');
    const right=scene.querySelector('.dino-up-shell-half.right');
    const base=scene.querySelector('.dino-up-shell-base');
    if(!left || !right || !base) return;

    /* Begin a small opening before the head peeks out at 90% progress. */
    if(p < .86){
      base.style.setProperty('opacity','1','important');
      left.style.setProperty('opacity','0','important');
      right.style.setProperty('opacity','0','important');
      left.style.setProperty('transform','none','important');
      right.style.setProperty('transform','none','important');
      return;
    }

    const reveal=smooth(clamp((p-.86)/.04,0,1));
    base.style.setProperty('opacity',String(1-reveal),'important');
    left.style.setProperty('opacity','1','important');
    right.style.setProperty('opacity','1','important');

    if(p < .965){
      const open=smooth(clamp((p-.86)/.105,0,1));
      left.style.setProperty('transform',`translate(${-lerp(0,12,open)}px,0px) rotate(${-lerp(0,5,open)}deg)`,'important');
      right.style.setProperty('transform',`translate(${lerp(0,12,open)}px,0px) rotate(${lerp(0,5,open)}deg)`,'important');
    }else{
      const hatch=smooth(clamp((p-.965)/.035,0,1));
      left.style.setProperty('transform',`translate(${lerp(-12,-58,hatch)}px,${lerp(0,20,hatch)}px) rotate(${lerp(-5,-25,hatch)}deg)`,'important');
      right.style.setProperty('transform',`translate(${lerp(12,62,hatch)}px,${lerp(0,18,hatch)}px) rotate(${lerp(5,27,hatch)}deg)`,'important');
    }
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.xt-dino[data-xt-theme="dino"]');
    if(scene!==lastScene){
      lastScene=scene||null;
      displayedRemaining=null;
    }
    if(scene){
      patchArtwork(scene);
      renderShellOpening(scene,progressNow(now));
    }
    raf=requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
})();

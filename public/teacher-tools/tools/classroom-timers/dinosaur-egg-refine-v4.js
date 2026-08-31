(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV4')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV4';
  style.textContent = `
    /* Put the waterhole deeper in the LEFT background beside the left tree. */
    .xt-dino.dino-egg-upgraded .dino-up-tree.t1 {
      left:7% !important;
      bottom:27% !important;
      transform:scale(.68) !important;
      opacity:.78 !important;
      z-index:1 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-water {
      left:3.5% !important;
      right:auto !important;
      bottom:22% !important;
      width:108px !important;
      height:29px !important;
      z-index:1 !important;
      opacity:.74 !important;
      filter:saturate(.86) !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      left:8.5% !important;
      right:auto !important;
      bottom:23.4% !important;
      width:42px !important;
      height:30px !important;
      z-index:1 !important;
      opacity:.56 !important;
      filter:drop-shadow(0 1px 1px rgba(0,0,0,.07)) !important;
    }

    /* HATCHED should read clearly but not glow bright yellow. */
    .xt-dino.dino-egg-upgraded .dino-up-pop {
      color:#344722 !important;
      text-shadow:0 2px 0 rgba(255,255,255,.26), 0 3px 8px rgba(35,48,22,.18) !important;
    }

    /* Keep the toy T-rex neutral rather than forcing a smile after hatching. */
    .xt-dino.dino-egg-upgraded .dino-up-baby .happy-mouth,
    .xt-dino.dino-egg-upgraded .dino-up-baby .happy-cheek {
      display:none !important;
      opacity:0 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-baby .flat-mouth,
    .xt-dino.dino-egg-upgraded .dino-up-baby.happy .flat-mouth {
      display:block !important;
      opacity:1 !important;
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-tree.t1 {
        left:3% !important;
        bottom:27.5% !important;
        transform:scale(.52) !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-water {
        left:1.5% !important;
        bottom:22.5% !important;
        width:86px !important;
        height:24px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        left:6% !important;
        bottom:23.9% !important;
        width:34px !important;
        height:25px !important;
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
    if(parts.some(v=>!Number.isFinite(v))) return null;
    if(parts.length===2) return parts[0]*60+parts[1];
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current=parseRemaining();
    if(current===null) return 0;
    const status=stageStatus?.textContent.trim()||'';
    const running=status==='Running';
    if(displayedRemaining===null || current!==displayedRemaining || status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }
    let estimated=current;
    if(running && current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function keepCracks(scene,p){
    const paths=[...scene.querySelectorAll('[data-dino-crack]')];
    paths.forEach((path,i)=>{
      const visible = p>=crackThresholds[i];
      path.style.setProperty('opacity',visible?'1':'0','important');
    });
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.xt-dino[data-xt-theme="dino"]');
    if(scene!==lastScene){
      lastScene=scene||null;
      displayedRemaining=null;
    }
    if(scene){
      keepCracks(scene,progressNow(now));
    }
    raf=requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV5Script')) return;

  const dinoRefineV5 = document.createElement('script');
  dinoRefineV5.id = 'dinosaurEggRefineV5Script';
  dinoRefineV5.src = new URL('dinosaur-egg-refine-v5.js', current.src).href;
  dinoRefineV5.async = false;
  document.body.appendChild(dinoRefineV5);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV6Script')) return;

  const dinoRefineV6 = document.createElement('script');
  dinoRefineV6.id = 'dinosaurEggRefineV6Script';
  dinoRefineV6.src = new URL('dinosaur-egg-refine-v6.js', current.src).href;
  dinoRefineV6.async = false;
  document.body.appendChild(dinoRefineV6);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV7Script')) return;

  const dinoRefineV7 = document.createElement('script');
  dinoRefineV7.id = 'dinosaurEggRefineV7Script';
  dinoRefineV7.src = new URL('dinosaur-egg-refine-v7.js', current.src).href;
  dinoRefineV7.async = false;
  document.body.appendChild(dinoRefineV7);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dominoesUpgradeScript')) return;

  const dominoesUpgrade = document.createElement('script');
  dominoesUpgrade.id = 'dominoesUpgradeScript';
  dominoesUpgrade.src = new URL('dominoes-upgrade.js', current.src).href;
  dominoesUpgrade.async = false;
  document.body.appendChild(dominoesUpgrade);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dominoesSoundFixScript')) return;

  const dominoesSoundFix = document.createElement('script');
  dominoesSoundFix.id = 'dominoesSoundFixScript';
  dominoesSoundFix.src = new URL('dominoes-sound-fix.js', current.src).href;
  dominoesSoundFix.async = false;
  document.body.appendChild(dominoesSoundFix);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('pacmanUpgradeScript')) return;

  const pacmanUpgrade = document.createElement('script');
  pacmanUpgrade.id = 'pacmanUpgradeScript';
  pacmanUpgrade.src = new URL('pacman-upgrade.js', current.src).href;
  pacmanUpgrade.async = false;
  document.body.appendChild(pacmanUpgrade);
})();

(() => {
  'use strict';

  if (window.__autumnVulturePerchFinalV1) return;
  window.__autumnVulturePerchFinalV1 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const display = document.getElementById('countdownDisplay');
  const stageStatus = document.getElementById('stageStatus');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'autumnVulturePerchFinalStyleV1';
  style.textContent = `
    .xt-autumn .autumn-v2-vulture{
      transform-origin:50% 82%!important;
    }
  `;
  document.head.appendChild(style);

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const lerp=(a,b,t)=>a+(b-a)*t;

  let displayedRemaining=null;
  let displayChangedAt=performance.now();
  let lastStatus='';

  function parseRemaining(){
    const parts=(display.textContent||'').trim().split(':').map(Number);
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
    const status=(stageStatus?.textContent||'').trim();
    if(displayedRemaining===null||displayedRemaining!==current||status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }
    let estimated=current;
    if(status==='Running'&&current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function tick(now){
    const scene=sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    const vulture=scene?.querySelector('.autumn-v2-vulture');
    if(scene&&vulture){
      const progress=progressNow(now);
      const t=clamp((progress-.91)/.085,0,1);
      if(t>=.90){
        const settle=clamp((t-.90)/.10,0,1);
        // Keep only a gentle perch angle. Rotating around the feet keeps both feet
        // centred over the branch instead of lifting one foot clear of the wood.
        const rotation=lerp(-7,-4.5,settle);
        const scale=lerp(.985,1,settle);
        vulture.style.setProperty('--v-wing-angle','-7deg');
        vulture.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scaleX(-1) scale(${scale.toFixed(3)})`;
      }
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

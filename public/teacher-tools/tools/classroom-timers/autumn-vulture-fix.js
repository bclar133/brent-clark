(() => {
  'use strict';

  if (window.__autumnVultureFixV1) return;
  window.__autumnVultureFixV1 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const display = document.getElementById('countdownDisplay');
  const stageStatus = document.getElementById('stageStatus');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'autumnVultureFixStyleV1';
  style.textContent = `
    .xt-autumn .autumn-v2-vulture{
      z-index:15!important;
      transform-origin:50% 72%!important;
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const quad = (a,b,c,t) => {
    const mt=1-t;
    return mt*mt*a+2*mt*t*b+t*t*c;
  };

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';

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

  function render(now){
    const scene=sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    const vulture=scene?.querySelector('.autumn-v2-vulture');
    if(!scene||!vulture){
      requestAnimationFrame(render);
      return;
    }

    const progress=progressNow(now);
    const t=clamp((progress-.91)/.085,0,1);

    if(t<=0){
      vulture.style.opacity='0';
      vulture.style.left='108%';
      vulture.style.top='18%';
      vulture.style.transform='translate(-50%,-50%) scaleX(-1) scale(.82)';
      requestAnimationFrame(render);
      return;
    }

    // Fly from the right toward the upper-right branch. The final centre point is
    // deliberately below the old target so the feet meet the branch rather than hover above it.
    const perchX=76.5;
    const perchY=45.2;
    const x=quad(108,93,perchX,t);
    const y=quad(18,28,perchY,t);
    const flying=t<.90;
    const wing=flying ? -18+Math.sin(now/58)*28 : -7;
    const scale=lerp(.82,1,t);
    const rotation=flying ? lerp(8,-5,t) : -5;

    vulture.style.opacity='1';
    vulture.style.left=`${x}%`;
    vulture.style.top=`${y}%`;
    vulture.style.setProperty('--v-wing-angle',`${wing.toFixed(1)}deg`);
    // Flip horizontally so the head faces left while travelling in from the right.
    vulture.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scaleX(-1) scale(${scale.toFixed(3)})`;

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  const loadFinalPerch = () => {
    if (document.querySelector('script[data-autumn-vulture-perch-final]')) return;
    const script = document.createElement('script');
    script.src = 'autumn-vulture-perch-final.js?v=1';
    script.dataset.autumnVulturePerchFinal = 'true';
    document.head.appendChild(script);
  };

  if (document.readyState === 'complete') setTimeout(loadFinalPerch, 0);
  else window.addEventListener('load', loadFinalPerch, { once:true });
})();

(() => {
  'use strict';

  if (window.__autumnFinishingTouchesV2) return;
  window.__autumnFinishingTouchesV2 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const display = document.getElementById('countdownDisplay');
  const stageStatus = document.getElementById('stageStatus');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const mix = (a,b,t) => a.map((v,i)=>Math.round(lerp(v,b[i],t)));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
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

  function hash01(index){
    const x=Math.sin((index+1)*12.9898)*43758.5453;
    return x-Math.floor(x);
  }

  function finalAutumnColour(index){
    const hue=hash01(index);
    if(hue<.34) return mix([88,52,29],[126,62,34],hue/.34);
    if(hue<.68) return mix([126,62,34],[164,78,38],(hue-.34)/.34);
    return mix([164,78,38],[163,48,43],(hue-.68)/.32);
  }

  function colourForLeaf(progress,index){
    const t=clamp(progress/.55,0,1);
    const greenA=[48,137,58];
    const greenB=[78,154,60];
    const gold=[184,139,43];
    const target=finalAutumnColour(index);

    let colour;
    if(t<.40) colour=mix(greenA,greenB,t/.40);
    else if(t<.70) colour=mix(greenB,gold,(t-.40)/.30);
    else colour=mix(gold,target,(t-.70)/.30);

    const shade=(hash01(index+701)-.5)*14;
    return rgb(colour.map(v=>clamp(Math.round(v+shade),0,255)));
  }

  function renderLeaves(scene,progress){
    const leaves=scene.querySelectorAll('.autumn-canopy-leaf');
    leaves.forEach((leaf,index)=>{
      leaf.style.background=colourForLeaf(progress,index);
    });
  }

  function renderVulture(scene,progress,now){
    const vulture=scene.querySelector('.autumn-v2-vulture');
    if(!vulture) return;

    const t=clamp((progress-.91)/.085,0,1);
    if(t<=0){
      vulture.style.opacity='0';
      vulture.style.left='108%';
      vulture.style.top='18%';
      vulture.style.transform='translate(-50%,-50%) scaleX(-1) scale(.82)';
      return;
    }

    const perchX=76.5;
    const perchY=42.2;
    const x=quad(108,93,perchX,t);
    const y=quad(18,27,perchY,t);
    const flying=t<.90;
    const wing=flying ? -18+Math.sin(now/58)*28 : -7;
    const scale=lerp(.82,1,t);
    const rotation=flying ? lerp(8,-5,t) : -5;

    vulture.style.opacity='1';
    vulture.style.left=`${x}%`;
    vulture.style.top=`${y}%`;
    vulture.style.setProperty('--v-wing-angle',`${wing.toFixed(1)}deg`);
    vulture.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scaleX(-1) scale(${scale.toFixed(3)})`;
  }

  function tick(now){
    const scene=sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    if(scene){
      const progress=progressNow(now);
      renderLeaves(scene,progress);
      renderVulture(scene,progress,now);
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

/* Keep Classroom Timers on the same site-wide light/dark preference as Chalkbox. */
(() => {
  'use strict';
  const sharedKey='teacherToolsTheme';
  const timerKey='ttTimers.dark';
  const button=document.getElementById('themeBtn');

  function applyShared(theme){
    const dark=theme==='dark';
    document.documentElement.dataset.theme=dark?'dark':'light';
    if(button){
      button.textContent=dark?'☀️':'🌙';
      button.setAttribute('aria-pressed',String(dark));
      button.setAttribute('aria-label',dark?'Turn on light mode':'Turn on dark mode');
      button.title=dark?'Turn on light mode':'Turn on dark mode';
    }
    try{localStorage.setItem(timerKey,JSON.stringify(dark));}catch(_){ }
  }

  let shared=null;
  try{shared=localStorage.getItem(sharedKey);}catch(_){ }
  if(shared==='dark'||shared==='light') applyShared(shared);
  else {
    const current=document.documentElement.dataset.theme==='dark'?'dark':'light';
    try{localStorage.setItem(sharedKey,current);}catch(_){ }
  }

  button?.addEventListener('click',()=>{
    setTimeout(()=>{
      const current=document.documentElement.dataset.theme==='dark'?'dark':'light';
      try{localStorage.setItem(sharedKey,current);}catch(_){ }
    },0);
  });
})();

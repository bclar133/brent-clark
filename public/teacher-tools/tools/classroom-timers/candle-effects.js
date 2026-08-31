(() => {
  'use strict';

  if (document.getElementById('candleEffectsStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  const muteBtn = document.getElementById('muteBtn');
  const presentationMuteBtn = document.getElementById('presentationMuteBtn');
  if (!sceneLayer || !stage || !display) return;

  const style = document.createElement('style');
  style.id = 'candleEffectsStyleV1';
  style.textContent = `
    .candle-scene.candle-effects-upgraded{
      background:
        radial-gradient(circle at 80% 30%,rgba(255,209,126,var(--candle-halo,.58)) 0 5%,rgba(255,198,100,calc(var(--candle-halo,.58) * .45)) 14%,transparent 34%),
        linear-gradient(180deg,var(--candle-sky-top,#f6dfae) 0%,var(--candle-sky-mid,#b17b5d) 48%,var(--candle-sky-bottom,#4d3436) 100%)!important;
      transition:background .15s linear;
    }
    .candle-scene.candle-effects-upgraded::before{
      content:'';position:absolute;inset:0;z-index:1;pointer-events:none;
      background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(5,7,14,var(--candle-darken,.08)));
    }
    .candle-scene.candle-effects-upgraded .candle{z-index:3}
    .candle-night-stars{
      position:absolute;inset:0;z-index:1;pointer-events:none;opacity:var(--candle-stars,0);
      background-image:
        radial-gradient(circle,#fff 0 1px,transparent 1.4px),
        radial-gradient(circle,#fff 0 1px,transparent 1.5px);
      background-position:16px 22px,71px 49px;
      background-size:92px 92px,127px 127px;
      transition:opacity .18s linear;
    }
    .candle-wind{
      position:absolute;left:-38%;top:19%;width:48%;height:155px;z-index:5;pointer-events:none;opacity:0;
    }
    .candle-wind-line{
      position:absolute;height:4px;border-radius:999px;
      background:linear-gradient(90deg,transparent,rgba(224,241,255,.94),rgba(255,255,255,.72),transparent);
      filter:drop-shadow(0 0 4px rgba(210,235,255,.38));
    }
    .candle-wind-line.w1{top:16px;left:2%;width:62%}
    .candle-wind-line.w2{top:50px;left:12%;width:82%}
    .candle-wind-line.w3{top:86px;left:0;width:72%}
    .candle-wind-line.w4{top:120px;left:20%;width:60%}
    .candle-smoke{
      position:absolute;left:44px;bottom:calc(var(--flameBottom,100%) + 18px);width:42px;height:82px;
      z-index:4;pointer-events:none;opacity:0;
    }
    .candle-smoke::before,.candle-smoke::after{
      content:'';position:absolute;inset:0;border-radius:50%;
      background:radial-gradient(circle at 48% 62%,rgba(220,225,232,.52),rgba(160,169,181,.23) 42%,transparent 72%);
      filter:blur(4px);
    }
    .candle-smoke::after{transform:translate(10px,-19px) scale(.72);opacity:.72}

    .candle-scene.candle-blowout .candle-wind{animation:candleWindSweep 1.15s cubic-bezier(.18,.72,.18,1) forwards}
    .candle-scene.candle-blowout .candle-flame{animation:candleFlameBlowout .82s ease-out forwards!important}
    .candle-scene.candle-blowout .candle-smoke{animation:candleSmokeRise 2.15s ease-out .38s forwards}

    @keyframes candleWindSweep{
      0%{transform:translateX(0);opacity:0}
      10%{opacity:.92}
      78%{opacity:.82}
      100%{transform:translateX(305%);opacity:0}
    }
    @keyframes candleFlameBlowout{
      0%{opacity:1;transform:translateY(-7px) rotate(0deg) scale(1)}
      18%{opacity:1;transform:translate(4px,-8px) rotate(9deg) scaleX(.95) scaleY(1.05)}
      42%{opacity:.96;transform:translate(17px,-6px) rotate(28deg) scaleX(1.34) scaleY(.78)}
      68%{opacity:.48;transform:translate(28px,-3px) rotate(43deg) scaleX(.62) scaleY(.52)}
      100%{opacity:0;transform:translate(38px,1px) rotate(55deg) scale(.05)}
    }
    @keyframes candleSmokeRise{
      0%{opacity:0;transform:translate(0,0) scale(.48)}
      18%{opacity:.78;transform:translate(2px,-8px) scale(.7)}
      58%{opacity:.44;transform:translate(14px,-38px) scale(1)}
      100%{opacity:0;transform:translate(25px,-72px) scale(1.2)}
    }
  `;
  document.head.appendChild(style);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let finishedTriggered = false;
  let raf = 0;
  let audioCtx = null;

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

  function mix(a,b,t){
    const parse = hex => {
      const n = parseInt(hex.replace('#',''),16);
      return [(n>>16)&255,(n>>8)&255,n&255];
    };
    const c1 = parse(a), c2 = parse(b);
    const vals = c1.map((v,i)=>Math.round(v+(c2[i]-v)*t));
    return `rgb(${vals[0]},${vals[1]},${vals[2]})`;
  }

  function parseRemainingSeconds(){
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(n=>!Number.isFinite(n))) return null;
    if (parts.length===2) return parts[0]*60+parts[1];
    if (parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));
  }

  function progressNow(now,running){
    const current = parseRemainingSeconds();
    if (current===null) return 0;
    if (displayedRemaining===null || current!==displayedRemaining){
      displayedRemaining=current;
      displayChangedAt=now;
    }
    let estimated=current;
    if (running && current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function muted(){
    try{
      const stored=localStorage.getItem('ttTimers.muted');
      if (stored!==null) return JSON.parse(stored)===true;
    }catch{}
    return muteBtn?.getAttribute('aria-pressed')==='true';
  }

  function playWindWhoosh(){
    if (muted()) return;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if (!Ctx) return;
    try{
      audioCtx ||= new Ctx();
      if (audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      const duration=1.05;
      const buffer=audioCtx.createBuffer(1,Math.ceil(audioCtx.sampleRate*duration),audioCtx.sampleRate);
      const data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1);
      const source=audioCtx.createBufferSource();
      const filter=audioCtx.createBiquadFilter();
      const gain=audioCtx.createGain();
      filter.type='bandpass';
      filter.frequency.value=950;
      filter.Q.value=.55;
      const now=audioCtx.currentTime;
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.065,now+.14);
      gain.gain.exponentialRampToValueAtTime(.022,now+.68);
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      source.connect(filter).connect(gain).connect(audioCtx.destination);
      source.start(now);
      source.stop(now+duration+.05);
    }catch{}
  }

  function ensureScene(scene){
    if (!scene || scene.dataset.candleEffects==='true') return;
    scene.dataset.candleEffects='true';
    scene.classList.add('candle-effects-upgraded');
    const stars=document.createElement('div');
    stars.className='candle-night-stars';
    scene.appendChild(stars);
    const wind=document.createElement('div');
    wind.className='candle-wind';
    wind.innerHTML='<i class="candle-wind-line w1"></i><i class="candle-wind-line w2"></i><i class="candle-wind-line w3"></i><i class="candle-wind-line w4"></i>';
    scene.appendChild(wind);
    const candle=scene.querySelector('.candle');
    if (candle && !candle.querySelector('.candle-smoke')){
      const smoke=document.createElement('div');
      smoke.className='candle-smoke';
      candle.appendChild(smoke);
    }
  }

  function applyLighting(scene,progress){
    scene.style.setProperty('--candle-sky-top',mix('#f7e2ad','#11131f',progress));
    scene.style.setProperty('--candle-sky-mid',mix('#b77c59','#18131d',progress));
    scene.style.setProperty('--candle-sky-bottom',mix('#5a3938','#070910',progress));
    scene.style.setProperty('--candle-halo',(0.62-progress*0.33).toFixed(3));
    scene.style.setProperty('--candle-darken',(0.05+progress*0.40).toFixed(3));
    scene.style.setProperty('--candle-stars',clamp((progress-.42)/.48,0,.82).toFixed(3));
  }

  function triggerBlowout(scene){
    if (!scene || finishedTriggered) return;
    finishedTriggered=true;
    scene.classList.remove('candle-blowout');
    void scene.offsetWidth;
    scene.classList.add('candle-blowout');
    playWindWhoosh();
  }

  function resetBlowout(scene){
    if (!finishedTriggered) return;
    finishedTriggered=false;
    scene?.classList.remove('candle-blowout');
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.candle-scene');
    if (!scene){
      displayedRemaining=null;
      finishedTriggered=false;
      raf=requestAnimationFrame(loop);
      return;
    }
    ensureScene(scene);

    const status=stageStatus?.textContent.trim()||'';
    const running=status==='Running';
    if (status!==lastStatus){
      lastStatus=status;
      displayedRemaining=parseRemainingSeconds();
      displayChangedAt=now;
    }
    const progress=progressNow(now,running);
    applyLighting(scene,progress);

    const remaining=parseRemainingSeconds();
    const finished=stage.classList.contains('finished') || remaining===0;
    if (finished) triggerBlowout(scene);
    else resetBlowout(scene);

    raf=requestAnimationFrame(loop);
  }

  const observer=new MutationObserver(()=>{
    const scene=sceneLayer.querySelector('.candle-scene');
    if (scene) ensureScene(scene);
  });
  observer.observe(sceneLayer,{childList:true,subtree:true});

  document.addEventListener('pointerdown',()=>{
    if (!audioCtx) return;
    if (audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
  },{capture:true,passive:true});

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
})();

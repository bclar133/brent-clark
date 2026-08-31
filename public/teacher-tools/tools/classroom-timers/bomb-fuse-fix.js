(() => {
  'use strict';

  if (document.getElementById('bombFuseFixStyleV1')) return;

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
  style.id = 'bombFuseFixStyleV1';
  style.textContent = `
    .xt-bomb .xt-fuse-char{
      stroke:#b68b53!important;
      stroke-width:13!important;
    }
    .xt-bomb .xt-fuse-live{
      stroke:#241a14!important;
      stroke-width:9!important;
      filter:drop-shadow(0 0 2px rgba(0,0,0,.28));
    }

    .xt-bomb .xt-fuse-spark{
      width:31px!important;height:31px!important;z-index:9!important;
      background:radial-gradient(circle,#fff 0 12%,#fff39a 16% 25%,#ffd34d 31% 40%,#ff842f 46% 59%,transparent 65%)!important;
      filter:drop-shadow(0 0 7px #fff3a0) drop-shadow(0 0 14px #ff8a2a)!important;
      overflow:visible!important;
    }
    .bomb-fizz-particle{
      position:absolute;left:50%;top:50%;width:3px;height:var(--fizz-len,18px);
      margin-left:-1.5px;margin-top:calc(var(--fizz-len,18px) * -1);
      border-radius:999px;
      background:linear-gradient(to top,transparent 0 8%,#ff8a2e 36%,#ffe76b 72%,#fff 100%);
      transform-origin:50% 100%;
      transform:rotate(var(--fizz-angle,0deg));
      animation:bombFizzBurst var(--fizz-speed,.42s) ease-out var(--fizz-delay,0s) infinite;
      pointer-events:none;
    }
    .bomb-fizz-dot{
      position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;
      margin:-2.5px;background:#ffe768;box-shadow:0 0 7px #ff8b2d;
      animation:bombFizzDot var(--dot-speed,.5s) ease-out var(--dot-delay,0s) infinite;
      pointer-events:none;
    }
    @keyframes bombFizzBurst{
      0%{opacity:1;transform:rotate(var(--fizz-angle)) translateY(-3px) scaleY(.75)}
      72%{opacity:.8}
      100%{opacity:0;transform:rotate(var(--fizz-angle)) translateY(calc(var(--fizz-distance,22px) * -1)) scaleY(.12)}
    }
    @keyframes bombFizzDot{
      0%{opacity:1;transform:translate(0,0) scale(1)}
      100%{opacity:0;transform:translate(var(--dot-x,20px),var(--dot-y,-22px)) scale(.35)}
    }

    .bomb-extra-explosion{
      position:absolute;left:76%;top:48%;width:340px;height:340px;
      transform:translate(-50%,-50%);z-index:7;pointer-events:none;opacity:0;
    }
    .bomb-explosion-core{
      position:absolute;left:50%;top:50%;width:150px;height:150px;border-radius:50%;
      transform:translate(-50%,-50%) scale(.08);opacity:0;
      background:radial-gradient(circle,#fff 0 13%,#fff69b 15% 27%,#ffc83f 31% 45%,#ff6b23 50% 67%,#d52d22 72% 84%,transparent 88%);
      filter:drop-shadow(0 0 22px rgba(255,118,31,.95));
    }
    .bomb-explosion-cloud{
      position:absolute;left:50%;top:50%;width:190px;height:160px;
      transform:translate(-50%,-50%) scale(.1);opacity:0;
      filter:drop-shadow(0 8px 12px rgba(0,0,0,.3));
    }
    .bomb-explosion-cloud i{
      position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 28%,#6a625d,#3e3836 58%,#242122);
    }
    .bomb-explosion-cloud i:nth-child(1){width:88px;height:88px;left:48px;top:31px}
    .bomb-explosion-cloud i:nth-child(2){width:72px;height:72px;left:12px;top:55px}
    .bomb-explosion-cloud i:nth-child(3){width:76px;height:76px;right:9px;top:50px}
    .bomb-explosion-cloud i:nth-child(4){width:63px;height:63px;left:61px;top:3px}
    .bomb-explosion-cloud i:nth-child(5){width:60px;height:60px;left:70px;bottom:2px}
    .bomb-explosion-ring{
      position:absolute;left:50%;top:50%;width:64px;height:64px;border-radius:50%;
      border:9px solid rgba(255,218,96,.88);transform:translate(-50%,-50%) scale(.2);opacity:0;
    }
    .bomb-explosion-ring.r2{border-color:rgba(255,104,37,.75);width:86px;height:86px}
    .bomb-debris{position:absolute;left:50%;top:50%;width:10px;height:21px;border-radius:3px;background:linear-gradient(#ffdc54,#d33e23);opacity:0;transform-origin:50% 0}

    .xt-bomb.bomb-fix-finished .bomb-extra-explosion{opacity:1}
    .xt-bomb.bomb-fix-finished .bomb-explosion-core{animation:bombCoreBurst .72s ease-out forwards}
    .xt-bomb.bomb-fix-finished .bomb-explosion-cloud{animation:bombCloudBurst 1.7s cubic-bezier(.18,.72,.2,1) .11s forwards}
    .xt-bomb.bomb-fix-finished .bomb-explosion-ring.r1{animation:bombShockwave 1.05s ease-out forwards}
    .xt-bomb.bomb-fix-finished .bomb-explosion-ring.r2{animation:bombShockwave 1.18s ease-out .08s forwards}
    .xt-bomb.bomb-fix-finished .bomb-debris{animation:bombDebris 1.2s cubic-bezier(.16,.7,.25,1) var(--delay,0s) forwards}
    @keyframes bombCoreBurst{
      0%{opacity:0;transform:translate(-50%,-50%) scale(.08)}
      18%{opacity:1;transform:translate(-50%,-50%) scale(.82)}
      48%{opacity:1;transform:translate(-50%,-50%) scale(1.38)}
      100%{opacity:0;transform:translate(-50%,-50%) scale(2.1)}
    }
    @keyframes bombCloudBurst{
      0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}
      18%{opacity:.96;transform:translate(-50%,-50%) scale(.78)}
      55%{opacity:.88;transform:translate(-50%,-58%) scale(1.24)}
      100%{opacity:0;transform:translate(-50%,-85%) scale(1.68)}
    }
    @keyframes bombShockwave{
      0%{opacity:.95;transform:translate(-50%,-50%) scale(.15)}
      100%{opacity:0;transform:translate(-50%,-50%) scale(4.8)}
    }
    @keyframes bombDebris{
      0%{opacity:1;transform:rotate(var(--a)) translateY(-18px) rotate(0deg)}
      58%{opacity:1}
      100%{opacity:0;transform:rotate(var(--a)) translateY(var(--d)) rotate(260deg)}
    }
  `;
  document.head.appendChild(style);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let activeScene = null;
  let exploded = false;
  let raf = 0;

  let audioCtx = null;
  let hissSource = null;
  let hissGain = null;
  let hissFilter = null;

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const random = (min,max) => min + Math.random()*(max-min);

  function muted(){
    try{
      const stored = localStorage.getItem('ttTimers.muted');
      if (stored !== null) return JSON.parse(stored) === true;
    }catch{}
    return muteBtn?.getAttribute('aria-pressed') === 'true';
  }

  function ensureAudio(){
    if (muted()) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try{
      audioCtx ||= new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
      return audioCtx;
    }catch{return null;}
  }

  function noiseBuffer(ctx,seconds){
    const buffer = ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    return buffer;
  }

  function startHiss(){
    if (hissSource || muted()) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    try{
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = noiseBuffer(ctx,1.2);
      source.loop = true;
      filter.type = 'bandpass';
      filter.frequency.value = 2850;
      filter.Q.value = .75;
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      gain.gain.setTargetAtTime(.024,ctx.currentTime,.055);
      hissSource=source;hissGain=gain;hissFilter=filter;
    }catch{}
  }

  function stopHiss(){
    if (!hissSource || !audioCtx) return;
    const source=hissSource,gain=hissGain,ctx=audioCtx;
    hissSource=null;hissGain=null;hissFilter=null;
    try{
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0,ctx.currentTime,.035);
      source.stop(ctx.currentTime+.16);
    }catch{}
  }

  function playExplosion(){
    if (muted()) return;
    const ctx=ensureAudio();
    if(!ctx) return;
    try{
      const now=ctx.currentTime;
      const noise=ctx.createBufferSource();
      noise.buffer=noiseBuffer(ctx,1.25);
      const low=ctx.createBiquadFilter();
      low.type='lowpass';
      low.frequency.setValueAtTime(1450,now);
      low.frequency.exponentialRampToValueAtTime(95,now+.78);
      const ng=ctx.createGain();
      ng.gain.setValueAtTime(.0001,now);
      ng.gain.exponentialRampToValueAtTime(.19,now+.012);
      ng.gain.exponentialRampToValueAtTime(.0001,now+.9);
      noise.connect(low).connect(ng).connect(ctx.destination);
      noise.start(now);noise.stop(now+1.0);

      const boom=ctx.createOscillator();
      const bg=ctx.createGain();
      boom.type='sine';
      boom.frequency.setValueAtTime(115,now);
      boom.frequency.exponentialRampToValueAtTime(34,now+.72);
      bg.gain.setValueAtTime(.0001,now);
      bg.gain.exponentialRampToValueAtTime(.17,now+.018);
      bg.gain.exponentialRampToValueAtTime(.0001,now+.78);
      boom.connect(bg).connect(ctx.destination);
      boom.start(now);boom.stop(now+.82);

      const crack=ctx.createOscillator();
      const cg=ctx.createGain();
      crack.type='square';
      crack.frequency.setValueAtTime(210,now);
      crack.frequency.exponentialRampToValueAtTime(70,now+.16);
      cg.gain.setValueAtTime(.07,now);
      cg.gain.exponentialRampToValueAtTime(.0001,now+.17);
      crack.connect(cg).connect(ctx.destination);
      crack.start(now);crack.stop(now+.18);
    }catch{}
  }

  function parseRemaining(){
    const parts=display.textContent.trim().split(':').map(Number);
    if(parts.some(v=>!Number.isFinite(v))) return null;
    if(parts.length===2) return parts[0]*60+parts[1];
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));
  }

  function progressNow(now,running){
    const current=parseRemaining();
    if(current===null) return 0;
    if(displayedRemaining===null || current!==displayedRemaining){displayedRemaining=current;displayChangedAt=now;}
    let estimated=current;
    if(running&&current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function ensureBombScene(scene){
    if(!scene || scene.dataset.bombFuseFix==='true') return;
    scene.dataset.bombFuseFix='true';

    const spark=scene.querySelector('.xt-fuse-spark');
    if(spark){
      for(let i=0;i<14;i++){
        const p=document.createElement('i');
        p.className='bomb-fizz-particle';
        p.style.setProperty('--fizz-angle',`${(i*360/14+random(-9,9)).toFixed(1)}deg`);
        p.style.setProperty('--fizz-len',`${random(12,24).toFixed(1)}px`);
        p.style.setProperty('--fizz-distance',`${random(15,32).toFixed(1)}px`);
        p.style.setProperty('--fizz-speed',`${random(.25,.5).toFixed(2)}s`);
        p.style.setProperty('--fizz-delay',`${(-random(0,.5)).toFixed(2)}s`);
        spark.appendChild(p);
      }
      for(let i=0;i<8;i++){
        const d=document.createElement('b');
        d.className='bomb-fizz-dot';
        d.style.setProperty('--dot-x',`${random(-30,30).toFixed(1)}px`);
        d.style.setProperty('--dot-y',`${random(-38,-10).toFixed(1)}px`);
        d.style.setProperty('--dot-speed',`${random(.28,.55).toFixed(2)}s`);
        d.style.setProperty('--dot-delay',`${(-random(0,.55)).toFixed(2)}s`);
        spark.appendChild(d);
      }
    }

    if(!scene.querySelector('.bomb-extra-explosion')){
      const overlay=document.createElement('div');
      overlay.className='bomb-extra-explosion';
      const debris=Array.from({length:18},(_,i)=>`<i class="bomb-debris" style="--a:${(i*20).toFixed(0)}deg;--d:${random(115,205).toFixed(0)}px;--delay:${(i*.012).toFixed(3)}s"></i>`).join('');
      overlay.innerHTML=`<div class="bomb-explosion-ring r1"></div><div class="bomb-explosion-ring r2"></div><div class="bomb-explosion-core"></div><div class="bomb-explosion-cloud"><i></i><i></i><i></i><i></i><i></i></div>${debris}`;
      scene.appendChild(overlay);
    }
  }

  function renderBomb(scene,progress,finished,running){
    ensureBombScene(scene);
    const path=scene.querySelector('.xt-fuse-live');
    const spark=scene.querySelector('.xt-fuse-spark');
    if(path){
      let len=Number(path.dataset.bombFixLen)||0;
      if(!len){try{len=path.getTotalLength();path.dataset.bombFixLen=String(len);}catch{}}
      if(len){
        path.style.strokeDasharray=`${len} ${len}`;
        path.style.strokeDashoffset=`${len*(1-progress)}`;
        try{
          const p=path.getPointAtLength(len*progress);
          if(spark){spark.style.left=`${p.x/10}%`;spark.style.top=`${p.y/6}%`;spark.style.opacity=finished?'0':'1';}
        }catch{}
      }
    }

    if(running&&!finished) startHiss(); else stopHiss();

    if(finished&&!exploded){
      exploded=true;
      stopHiss();
      scene.classList.remove('bomb-fix-finished');
      void scene.offsetWidth;
      scene.classList.add('bomb-fix-finished');
      playExplosion();
    }else if(!finished&&exploded){
      exploded=false;
      scene.classList.remove('bomb-fix-finished');
    }
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.xt-bomb');
    if(scene!==activeScene){
      stopHiss();
      activeScene=scene||null;
      displayedRemaining=parseRemaining();
      displayChangedAt=now;
      exploded=false;
      if(scene) ensureBombScene(scene);
    }

    if(scene){
      const status=stageStatus?.textContent.trim()||'';
      if(status!==lastStatus){lastStatus=status;displayedRemaining=parseRemaining();displayChangedAt=now;}
      const running=status==='Running';
      const progress=progressNow(now,running);
      const remaining=parseRemaining();
      const finished=stage.classList.contains('finished')||remaining===0;
      renderBomb(scene,progress,finished,running);
    }else{
      stopHiss();
    }
    raf=requestAnimationFrame(loop);
  }

  const observer=new MutationObserver(()=>{
    const scene=sceneLayer.querySelector('.xt-bomb');
    if(scene) ensureBombScene(scene);
  });
  observer.observe(sceneLayer,{childList:true,subtree:true});

  const syncMute=()=>setTimeout(()=>{if(muted()) stopHiss();},0);
  muteBtn?.addEventListener('click',syncMute);
  presentationMuteBtn?.addEventListener('click',syncMute);
  window.addEventListener('storage',event=>{if(event.key==='ttTimers.muted'&&muted()) stopHiss();});

  document.addEventListener('pointerdown',()=>{if(audioCtx?.state==='suspended') audioCtx.resume().catch(()=>{});},{capture:true,passive:true});
  document.addEventListener('keydown',()=>{if(audioCtx?.state==='suspended') audioCtx.resume().catch(()=>{});},{capture:true});

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
})();
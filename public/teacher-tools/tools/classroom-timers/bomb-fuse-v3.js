(() => {
  'use strict';

  if (document.getElementById('bombFuseV3Style')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const status = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const message = document.getElementById('countdownMessage');
  const muteBtn = document.getElementById('muteBtn');
  if (!sceneLayer || !stage || !display) return;

  const style = document.createElement('style');
  style.id = 'bombFuseV3Style';
  style.textContent = `
    .xt-bomb .xt-fuse-spark{
      width:36px!important;height:36px!important;z-index:25!important;overflow:visible!important;
      background:radial-gradient(circle,#fff 0 10%,#fffbd3 13% 22%,#ffe15b 27% 39%,#ff912c 45% 58%,#e84220 62% 69%,transparent 72%)!important;
      filter:drop-shadow(0 0 9px #fff0a0) drop-shadow(0 0 20px #ff7b26)!important;
      animation:bombV3Flame .1s steps(2,end) infinite!important;
    }
    @keyframes bombV3Flame{
      0%{transform:translate(-50%,-50%) rotate(-8deg) scale(.82)}
      50%{transform:translate(-50%,-50%) rotate(7deg) scale(1.28)}
      100%{transform:translate(-50%,-50%) rotate(-3deg) scale(.96)}
    }
    .bomb-v3-fizz{
      position:absolute;z-index:26;pointer-events:none;width:5px;height:5px;border-radius:50%;
      background:#fff9a0;box-shadow:0 0 7px #fff,0 0 12px #ff8325;
      animation:bombV3Fizz var(--life,.45s) cubic-bezier(.12,.74,.2,1) forwards;
    }
    .bomb-v3-fizz.streak{
      width:3px;height:var(--h,20px);border-radius:999px;
      background:linear-gradient(transparent,#ff6f23 25%,#ffe45b 68%,#fff 100%);
      transform-origin:50% 100%;
    }
    @keyframes bombV3Fizz{
      0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) rotate(var(--rot,0deg)) scale(1)}
      70%{opacity:.95}
      100%{opacity:0;transform:translate(-50%,-50%) translate(var(--dx),var(--dy)) rotate(calc(var(--rot,0deg) + 120deg)) scale(.2)}
    }

    .bomb-v3-flash{position:absolute;inset:0;z-index:33;pointer-events:none;opacity:0;background:radial-gradient(circle at 76% 48%,#fff 0 7%,#fff59a 11%,rgba(255,161,39,.95) 20%,rgba(255,77,25,.58) 36%,transparent 62%)}
    .bomb-v3-explosion{position:absolute;left:76%;top:48%;width:760px;height:760px;transform:translate(-50%,-50%);z-index:34;pointer-events:none;opacity:0}
    .bomb-v3-core{position:absolute;left:50%;top:50%;width:270px;height:270px;border-radius:50%;transform:translate(-50%,-50%) scale(.05);opacity:0;background:radial-gradient(circle,#fff 0 9%,#fff9bf 12% 19%,#ffe24c 23% 36%,#ff8a24 42% 58%,#ee3c21 64% 76%,#8e1f1c 80% 86%,transparent 89%);filter:drop-shadow(0 0 50px rgba(255,101,22,.95))}
    .bomb-v3-ring{position:absolute;left:50%;top:50%;width:145px;height:145px;border:15px solid rgba(255,241,153,.95);border-radius:50%;transform:translate(-50%,-50%) scale(.08);opacity:0;box-shadow:0 0 28px rgba(255,129,30,.8)}
    .bomb-v3-ring.r2{width:190px;height:190px;border-color:rgba(255,92,29,.7)}
    .bomb-v3-lobe{position:absolute;left:50%;top:50%;width:145px;height:210px;margin-left:-72px;margin-top:-170px;border-radius:55% 55% 48% 48%;background:radial-gradient(ellipse at 50% 72%,#fff6a3 0 12%,#ffd13e 29%,#ff6c23 58%,#d92c1f 75%,transparent 79%);transform-origin:50% 170px;opacity:0;filter:drop-shadow(0 0 18px rgba(255,88,24,.72))}
    .bomb-v3-smoke{position:absolute;left:50%;top:50%;width:540px;height:450px;transform:translate(-50%,-50%) scale(.1);opacity:0}
    .bomb-v3-smoke i{position:absolute;border-radius:50%;background:radial-gradient(circle at 34% 26%,#81766e,#4b4440 52%,#262326 80%);filter:drop-shadow(0 8px 12px rgba(0,0,0,.24))}
    .bomb-v3-debris{position:absolute;left:50%;top:50%;width:13px;height:32px;margin:-6px;border-radius:3px;background:linear-gradient(#ffe766,#e95624 55%,#38231f 56%);opacity:0;transform-origin:50% 0}
    .bomb-v3-boom{position:absolute;left:50%;top:50%;z-index:38;opacity:0;transform:translate(-50%,-50%) scale(.05) rotate(-8deg);font-family:var(--heading);font-size:clamp(6rem,15vw,12rem);color:#fff66d;text-shadow:8px 8px 0 #d93627,-7px -7px 0 #fb6927,0 0 48px #ff8b24;white-space:nowrap}

    .xt-bomb.bomb-v3-ended{animation:bombV3Shake .65s linear both}
    .xt-bomb.bomb-v3-ended .bomb-v3-flash{animation:bombV3Flash .82s ease-out forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-explosion{opacity:1}
    .xt-bomb.bomb-v3-ended .bomb-v3-core{animation:bombV3Core 1.15s ease-out forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-ring.r1{animation:bombV3Ring 1.2s ease-out forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-ring.r2{animation:bombV3Ring 1.45s ease-out .08s forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-lobe{animation:bombV3Lobe 1.08s cubic-bezier(.13,.74,.22,1) var(--delay) forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-smoke{animation:bombV3Smoke 2.8s cubic-bezier(.15,.68,.26,1) .14s forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-debris{animation:bombV3Debris 1.7s cubic-bezier(.13,.72,.22,1) var(--delay) forwards}
    .xt-bomb.bomb-v3-ended .bomb-v3-boom{animation:bombV3Boom 1.65s cubic-bezier(.16,.8,.22,1) .06s forwards}
    @keyframes bombV3Shake{0%,100%{transform:none}12%{transform:translate(-9px,5px)}24%{transform:translate(10px,-6px)}38%{transform:translate(-8px,-4px)}52%{transform:translate(7px,5px)}68%{transform:translate(-5px,2px)}82%{transform:translate(3px,-2px)}}
    @keyframes bombV3Flash{0%{opacity:0}6%{opacity:1}28%{opacity:.96}100%{opacity:0}}
    @keyframes bombV3Core{0%{opacity:0;transform:translate(-50%,-50%) scale(.05)}10%{opacity:1;transform:translate(-50%,-50%) scale(.75)}36%{opacity:1;transform:translate(-50%,-50%) scale(1.9)}72%{opacity:.9;transform:translate(-50%,-50%) scale(2.85)}100%{opacity:0;transform:translate(-50%,-50%) scale(3.5)}}
    @keyframes bombV3Ring{0%{opacity:.98;transform:translate(-50%,-50%) scale(.08)}100%{opacity:0;transform:translate(-50%,-50%) scale(5.1)}}
    @keyframes bombV3Lobe{0%{opacity:0;transform:rotate(var(--a)) scale(.08)}14%{opacity:1}50%{opacity:1;transform:rotate(var(--a)) scale(1.2)}100%{opacity:0;transform:rotate(var(--a)) scale(1.68)}}
    @keyframes bombV3Smoke{0%{opacity:0;transform:translate(-50%,-45%) scale(.15)}18%{opacity:.97;transform:translate(-50%,-50%) scale(.8)}55%{opacity:.92;transform:translate(-50%,-70%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-115%) scale(1.58)}}
    @keyframes bombV3Debris{0%{opacity:1;transform:rotate(var(--a)) translateY(-34px) rotate(0)}68%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(var(--d)) rotate(430deg)}}
    @keyframes bombV3Boom{0%{opacity:0;transform:translate(-50%,-50%) scale(.05) rotate(-8deg)}17%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(5deg)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.02) rotate(-2deg)}100%{opacity:0;transform:translate(-50%,-65%) scale(1.1) rotate(1deg)}}
  `;
  document.head.appendChild(style);

  let activeScene = null;
  let exploded = false;
  let nextFizz = 0;
  let raf = 0;
  let audioCtx = null;

  const random = (min,max) => min + Math.random() * (max-min);

  function muted(){
    try{
      const stored=localStorage.getItem('ttTimers.muted');
      if(stored!==null) return JSON.parse(stored)===true;
    }catch{}
    return muteBtn?.getAttribute('aria-pressed')==='true';
  }

  function ensureAudio(){
    if(muted()) return null;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx) return null;
    try{
      audioCtx ||= new Ctx();
      if(audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      return audioCtx;
    }catch{return null;}
  }

  function noiseBuffer(ctx,seconds){
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    return buffer;
  }

  function playExplosion(){
    if(muted()) return;
    const ctx=ensureAudio();
    if(!ctx) return;
    try{
      const now=ctx.currentTime+.01;
      const comp=ctx.createDynamicsCompressor();
      comp.threshold.value=-10;comp.knee.value=16;comp.ratio.value=5;comp.attack.value=.002;comp.release.value=.3;comp.connect(ctx.destination);

      const blast=ctx.createBufferSource();blast.buffer=noiseBuffer(ctx,1.6);
      const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.setValueAtTime(2400,now);low.frequency.exponentialRampToValueAtTime(80,now+1);
      const bg=ctx.createGain();bg.gain.setValueAtTime(.0001,now);bg.gain.exponentialRampToValueAtTime(.55,now+.008);bg.gain.exponentialRampToValueAtTime(.17,now+.16);bg.gain.exponentialRampToValueAtTime(.0001,now+1.25);
      blast.connect(low).connect(bg).connect(comp);blast.start(now);blast.stop(now+1.35);

      const crack=ctx.createBufferSource();crack.buffer=noiseBuffer(ctx,.3);
      const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=1150;
      const cg=ctx.createGain();cg.gain.setValueAtTime(.38,now);cg.gain.exponentialRampToValueAtTime(.0001,now+.24);
      crack.connect(high).connect(cg).connect(comp);crack.start(now);crack.stop(now+.27);

      [100,66,43].forEach((freq,i)=>{
        const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=i===0?'sine':'triangle';
        osc.frequency.setValueAtTime(freq,now+i*.02);osc.frequency.exponentialRampToValueAtTime(Math.max(24,freq*.45),now+.9);
        gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(i===0?.46:.27,now+.018+i*.012);gain.gain.exponentialRampToValueAtTime(.0001,now+1.02+i*.08);
        osc.connect(gain).connect(comp);osc.start(now);osc.stop(now+1.16);
      });
    }catch{}
  }

  function ensureOverlay(scene){
    if(!scene || scene.querySelector('.bomb-v3-explosion')) return;
    const flash=document.createElement('div');flash.className='bomb-v3-flash';scene.appendChild(flash);
    const overlay=document.createElement('div');overlay.className='bomb-v3-explosion';
    const lobes=Array.from({length:16},(_,i)=>`<i class="bomb-v3-lobe" style="--a:${i*22.5}deg;--delay:${(i%4)*.014}s"></i>`).join('');
    const smoke=Array.from({length:10},()=>`<i style="width:${random(130,230)}px;height:${random(130,230)}px;left:${random(5,72)}%;top:${random(4,64)}%"></i>`).join('');
    const debris=Array.from({length:30},(_,i)=>`<i class="bomb-v3-debris" style="--a:${i*12}deg;--d:${random(190,350)}px;--delay:${(i%5)*.012}s"></i>`).join('');
    overlay.innerHTML=`<div class="bomb-v3-ring r1"></div><div class="bomb-v3-ring r2"></div>${lobes}<div class="bomb-v3-core"></div><div class="bomb-v3-smoke">${smoke}</div>${debris}<div class="bomb-v3-boom">BOOM!</div>`;
    scene.appendChild(overlay);
  }

  function emitFizz(scene){
    const spark=scene.querySelector('.xt-fuse-spark');
    if(!spark || spark.style.opacity==='0') return;
    const left=parseFloat(spark.style.left),top=parseFloat(spark.style.top);
    if(!Number.isFinite(left)||!Number.isFinite(top)) return;
    const count=Math.floor(random(5,10));
    for(let i=0;i<count;i++){
      const p=document.createElement('i');
      const streak=Math.random()<.65;
      p.className=`bomb-v3-fizz${streak?' streak':''}`;
      p.style.left=`${left}%`;p.style.top=`${top}%`;
      const a=random(0,Math.PI*2),d=random(18,streak?64:46);
      p.style.setProperty('--dx',`${Math.cos(a)*d}px`);p.style.setProperty('--dy',`${Math.sin(a)*d-random(8,24)}px`);
      p.style.setProperty('--rot',`${random(-180,180)}deg`);p.style.setProperty('--life',`${random(.26,.58)}s`);
      if(streak)p.style.setProperty('--h',`${random(13,31)}px`);
      scene.appendChild(p);
      setTimeout(()=>p.remove(),750);
    }
  }

  function isFinished(){
    const txt=display.textContent.trim();
    return stage.classList.contains('finished') || /^0+:0+$/.test(txt) || /time.?s up/i.test(status?.textContent||'') || /time.?s up/i.test(message?.textContent||'');
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.xt-bomb');
    if(scene!==activeScene){
      activeScene=scene||null;exploded=false;nextFizz=0;
      if(scene)ensureOverlay(scene);
    }
    if(scene){
      ensureOverlay(scene);
      const finished=isFinished();
      const running=(status?.textContent||'').trim()==='Running' && !finished;
      if(running && now>=nextFizz){emitFizz(scene);nextFizz=now+random(35,65);}
      if(finished&&!exploded){
        exploded=true;
        scene.classList.remove('bomb-v3-ended');void scene.offsetWidth;scene.classList.add('bomb-v3-ended');
        playExplosion();
      }else if(!finished&&exploded){
        exploded=false;scene.classList.remove('bomb-v3-ended');
      }
    }
    raf=requestAnimationFrame(loop);
  }

  const observer=new MutationObserver(()=>{const scene=sceneLayer.querySelector('.xt-bomb');if(scene)ensureOverlay(scene);});
  observer.observe(sceneLayer,{childList:true,subtree:true});

  const unlock=()=>{const ctx=ensureAudio();if(ctx?.state==='suspended')ctx.resume().catch(()=>{});};
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});

  cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
})();
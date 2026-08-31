(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  if (!sceneLayer || !stage) return;

  const style = document.createElement('style');
  style.id = 'rocketMoonFlightV5';
  style.textContent = `
    .rocket-scene.rocket-flight-active {
      background:
        radial-gradient(circle at 18% 78%, rgba(42,87,132,.28) 0 10%, transparent 30%),
        radial-gradient(circle at 75% 18%, rgba(45,67,116,.23), transparent 28%),
        linear-gradient(#030714,#0b1730 65%,#132747) !important;
    }

    .rocket-scene.rocket-flight-active .rocket-pad,
    .rocket-scene.rocket-flight-active .launch-count {
      display:none !important;
    }

    .rocket-scene.rocket-flight-active .rocket-stars {
      display:none !important;
    }

    .rocket-random-stars {
      position:absolute;
      inset:0;
      z-index:1;
      pointer-events:none;
      overflow:hidden;
    }
    .rocket-random-stars i {
      position:absolute;
      width:var(--star-size,2px);
      height:var(--star-size,2px);
      border-radius:50%;
      background:var(--star-colour,#fff);
      opacity:var(--star-opacity,.8);
      box-shadow:0 0 calc(var(--star-size,2px) * 2.8) rgba(205,229,255,.55);
      animation:rocketStarTwinkle var(--twinkle,3.2s) ease-in-out infinite alternate;
      animation-delay:var(--delay,0s);
    }
    @keyframes rocketStarTwinkle {
      from { opacity:calc(var(--star-opacity,.8) * .48); transform:scale(.85); }
      to { opacity:var(--star-opacity,.8); transform:scale(1.18); }
    }

    /* Background planets should add depth without competing with the rocket or moon. */
    .rocket-mini-planet {
      position:absolute;
      z-index:2;
      border-radius:50%;
      pointer-events:none;
      opacity:.38;
      filter:saturate(.72) brightness(.82) drop-shadow(0 0 10px rgba(144,180,235,.08));
    }
    .rocket-mini-planet.planet-a {
      left:24%;
      top:25%;
      width:42px;
      height:42px;
      background:
        radial-gradient(circle at 34% 29%,rgba(255,255,255,.28) 0 5%,transparent 6%),
        repeating-linear-gradient(14deg,#bd7252 0 7px,#8e4c46 8px 12px,#d99a6e 13px 18px);
      box-shadow:inset -7px -6px 10px rgba(44,23,41,.24),0 0 10px rgba(213,128,91,.09);
    }
    .rocket-mini-planet.planet-b {
      left:57%;
      top:70%;
      width:32px;
      height:32px;
      background:radial-gradient(circle at 32% 28%,#9de1d5,#4f9ea2 45%,#376789 76%,#243e69 100%);
      box-shadow:inset -5px -5px 8px rgba(10,31,68,.32),0 0 10px rgba(99,194,210,.08);
    }
    .rocket-mini-planet.planet-b::after {
      content:'';
      position:absolute;
      left:-10px;
      top:11px;
      width:52px;
      height:9px;
      border:2px solid rgba(193,213,193,.48);
      border-left-color:transparent;
      border-right-color:transparent;
      border-radius:50%;
      transform:rotate(-14deg);
    }

    .rocket-smoke-layer {
      position:absolute;
      inset:0;
      z-index:5;
      pointer-events:none;
      overflow:hidden;
    }
    .rocket-smoke-puff {
      position:absolute;
      width:var(--smoke-size,28px);
      height:var(--smoke-size,28px);
      margin-left:calc(var(--smoke-size,28px) / -2);
      margin-top:calc(var(--smoke-size,28px) / -2);
      border-radius:50%;
      background:radial-gradient(circle at 38% 34%,rgba(250,253,255,.94) 0 18%,rgba(205,216,226,.78) 40%,rgba(132,150,170,.36) 66%,rgba(88,106,128,.09) 78%,transparent 82%);
      filter:blur(.7px);
      opacity:.9;
      animation:rocketSmokeFade 5.3s ease-out forwards;
      will-change:transform,opacity;
    }
    @keyframes rocketSmokeFade {
      0% { opacity:.9; transform:translate(0,0) scale(.7); }
      28% { opacity:.76; }
      58% { opacity:.48; }
      100% { opacity:0; transform:translate(var(--smoke-drift-x,6px),var(--smoke-drift-y,-12px)) scale(3.05); }
    }

    .timer-stage.theme-rocket .time-display-wrap {
      top:auto !important;
      left:auto !important;
      right:22px !important;
      bottom:22px !important;
      transform:none !important;
      justify-items:end !important;
      text-align:right;
    }

    .timer-stage.theme-rocket .time-display {
      font-size:clamp(2.6rem,6vw,5.2rem);
    }

    .timer-stage.theme-rocket .timer-message {
      display:block !important;
      margin-top:6px;
    }

    .rocket-scene.rocket-flight-active .rocket {
      z-index:7;
      left:var(--rocket-x,12%) !important;
      top:var(--rocket-y,82%) !important;
      bottom:auto !important;
      transform:translate(-50%,-50%) rotate(var(--rocket-angle,-55deg)) scale(.68) !important;
      transform-origin:50% 50% !important;
      will-change:left,top,transform;
      filter:drop-shadow(0 0 12px rgba(255,126,48,.42)) drop-shadow(0 8px 8px rgba(0,0,0,.28)) !important;
    }

    .rocket-scene.rocket-flight-active .rocket-flame {
      min-height:22px !important;
      filter:drop-shadow(0 0 12px #ff883a);
    }

    .rocket-moon {
      position:absolute;
      z-index:4;
      left:86%;
      top:18%;
      width:116px;
      height:116px;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:
        radial-gradient(circle at 31% 28%,rgba(255,255,255,.92) 0 7%,transparent 8%),
        radial-gradient(circle at 66% 31%,rgba(125,139,157,.34) 0 10%,transparent 11%),
        radial-gradient(circle at 38% 67%,rgba(119,133,151,.3) 0 8%,transparent 9%),
        radial-gradient(circle at 72% 72%,rgba(135,149,166,.26) 0 5%,transparent 6%),
        radial-gradient(circle at 38% 31%,#fff 0%,#e8eef4 44%,#c6d0db 78%,#aebbc8 100%);
      box-shadow:
        inset -15px -12px 20px rgba(75,90,108,.18),
        0 0 35px rgba(226,239,255,.48),
        0 0 75px rgba(190,218,255,.18);
    }

    .rocket-moon::before,
    .rocket-moon::after {
      content:'';
      position:absolute;
      border-radius:50%;
      border:2px solid rgba(115,131,149,.18);
      background:rgba(122,137,154,.13);
    }
    .rocket-moon::before { width:24px;height:15px;left:20px;top:57px;transform:rotate(-17deg); }
    .rocket-moon::after { width:17px;height:12px;right:21px;top:49px;transform:rotate(12deg); }

    .rocket-flight-active.rocket-arrived .rocket-moon {
      animation:
        moonImpactPulse .55s ease-out 1,
        moonColourFlicker 2s steps(1,end) 1;
    }
    @keyframes moonImpactPulse {
      0% { box-shadow:inset -15px -12px 20px rgba(75,90,108,.18),0 0 35px rgba(226,239,255,.48),0 0 75px rgba(190,218,255,.18); }
      45% { box-shadow:inset -15px -12px 20px rgba(75,90,108,.18),0 0 50px rgba(255,246,183,.9),0 0 100px rgba(255,205,95,.42); }
      100% { box-shadow:inset -15px -12px 20px rgba(75,90,108,.18),0 0 35px rgba(226,239,255,.48),0 0 75px rgba(190,218,255,.18); }
    }
    @keyframes moonColourFlicker {
      0%,100% { filter:none; }
      10% { filter:sepia(.9) saturate(7) hue-rotate(300deg) brightness(1.22); }
      22% { filter:sepia(.85) saturate(8) hue-rotate(155deg) brightness(1.18); }
      34% { filter:sepia(.95) saturate(8) hue-rotate(5deg) brightness(1.28); }
      46% { filter:sepia(.9) saturate(7) hue-rotate(75deg) brightness(1.17); }
      58% { filter:sepia(.9) saturate(8) hue-rotate(225deg) brightness(1.22); }
      70% { filter:sepia(.9) saturate(9) hue-rotate(335deg) brightness(1.24); }
      82% { filter:sepia(.85) saturate(7) hue-rotate(175deg) brightness(1.2); }
      92% { filter:sepia(.95) saturate(8) hue-rotate(35deg) brightness(1.3); }
    }

    @media (max-width:760px) {
      .rocket-moon { width:92px;height:92px; }
      .rocket-mini-planet.planet-a { width:32px;height:32px; }
      .rocket-mini-planet.planet-b { width:25px;height:25px; }
      .rocket-mini-planet.planet-b::after { left:-8px;top:8px;width:41px;height:8px; }
      .rocket-scene.rocket-flight-active .rocket {
        transform:translate(-50%,-50%) rotate(var(--rocket-angle,-55deg)) scale(.55) !important;
      }
      .timer-stage.theme-rocket .time-display-wrap {
        right:12px !important;
        bottom:12px !important;
      }
      .timer-stage.theme-rocket .time-display {
        font-size:clamp(2.35rem,12vw,4.4rem);
      }
      .timer-stage.theme-rocket .timer-message {
        display:block !important;
        font-size:.68rem;
      }
    }
  `;
  document.head.appendChild(style);

  let active = null;

  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

  function progressFromFlame(flame) {
    if (!flame) return 0;
    const px = parseFloat(flame.style.getPropertyValue('--flame'));
    return Number.isFinite(px) ? clamp((px - 16) / 45, 0, 1) : 0;
  }

  function quadratic(a,b,c,t) {
    const mt=1-t;
    return mt*mt*a + 2*mt*t*b + t*t*c;
  }

  function flightGeometry(scene) {
    const rect=scene.getBoundingClientRect();
    const moon=scene.querySelector('.rocket-moon');
    const moonRect=moon?.getBoundingClientRect();
    const moonRadius=(moonRect?.width || 116)/2;
    const start={x:rect.width*.12,y:rect.height*.82};
    const control={x:rect.width*.39,y:rect.height*.22};
    const moonCenter={x:rect.width*.86,y:rect.height*.18};

    const noseOffset=rect.width<=760 ? 61 : 75;
    let end={...moonCenter};
    for(let i=0;i<4;i++){
      const dx=end.x-control.x,dy=end.y-control.y;
      const mag=Math.hypot(dx,dy)||1;
      const ux=dx/mag,uy=dy/mag;
      end={
        x:moonCenter.x-ux*(moonRadius+noseOffset),
        y:moonCenter.y-uy*(moonRadius+noseOffset)
      };
    }
    return {rect,start,control,end};
  }

  function buildRandomStars(scene) {
    const stars=document.createElement('div');
    stars.className='rocket-random-stars';
    stars.setAttribute('aria-hidden','true');

    const count=74;
    for(let i=0;i<count;i++) {
      const star=document.createElement('i');
      const size=(Math.random()*2.2+1).toFixed(2);
      const opacity=(Math.random()*.52+.38).toFixed(2);
      const colour=Math.random()>.83?'#b8dcff':(Math.random()>.76?'#fff2c4':'#ffffff');
      star.style.left=`${(Math.random()*96+2).toFixed(2)}%`;
      star.style.top=`${(Math.random()*94+2).toFixed(2)}%`;
      star.style.setProperty('--star-size',`${size}px`);
      star.style.setProperty('--star-opacity',opacity);
      star.style.setProperty('--star-colour',colour);
      star.style.setProperty('--twinkle',`${(Math.random()*3+2.1).toFixed(2)}s`);
      star.style.setProperty('--delay',`${(-Math.random()*4).toFixed(2)}s`);
      stars.appendChild(star);
    }
    scene.appendChild(stars);
  }

  function buildPlanets(scene) {
    const a=document.createElement('div');
    a.className='rocket-mini-planet planet-a';
    a.setAttribute('aria-hidden','true');
    const b=document.createElement('div');
    b.className='rocket-mini-planet planet-b';
    b.setAttribute('aria-hidden','true');
    scene.append(a,b);
  }

  function buildSmokeLayer(scene) {
    const smoke=document.createElement('div');
    smoke.className='rocket-smoke-layer';
    smoke.setAttribute('aria-hidden','true');
    scene.appendChild(smoke);
    return smoke;
  }

  function makeSmokePuff(instance,x,y,ux,uy,spread=1) {
    const rocketScale=instance.scene.getBoundingClientRect().width<=760 ? .55 : .68;
    const tailOffset=70*rocketScale;
    const jitter=7*spread;
    const puff=document.createElement('span');
    puff.className='rocket-smoke-puff';
    const px=x-ux*tailOffset+(Math.random()-.5)*jitter;
    const py=y-uy*tailOffset+(Math.random()-.5)*jitter;
    const size=22+Math.random()*16;
    puff.style.left=`${px}px`;
    puff.style.top=`${py}px`;
    puff.style.setProperty('--smoke-size',`${size.toFixed(1)}px`);
    puff.style.setProperty('--smoke-drift-x',`${((Math.random()-.5)*18).toFixed(1)}px`);
    puff.style.setProperty('--smoke-drift-y',`${(-7-Math.random()*15).toFixed(1)}px`);
    instance.smokeLayer.appendChild(puff);
    puff.addEventListener('animationend',()=>puff.remove(),{once:true});
    setTimeout(()=>puff.remove(),5700);
  }

  function spawnSmoke(instance,x,y,dx,dy) {
    const now=performance.now();
    if(instance.progress<=0 || instance.progress>=.9995 || now-instance.lastSmokeAt<72) return;
    instance.lastSmokeAt=now;

    const mag=Math.hypot(dx,dy)||1;
    const ux=dx/mag,uy=dy/mag;
    makeSmokePuff(instance,x,y,ux,uy,1);
    if(Math.random()>.48) makeSmokePuff(instance,x-ux*6,y-uy*6,ux,uy,.75);
  }

  function render(instance,progress) {
    if(!instance?.scene?.isConnected) return;
    progress=clamp(progress,0,1);
    instance.progress=progress;

    const {rect,start,control,end}=flightGeometry(instance.scene);
    if(!rect.width||!rect.height) return;

    const t=progress;
    const x=quadratic(start.x,control.x,end.x,t);
    const y=quadratic(start.y,control.y,end.y,t);

    const dx=2*(1-t)*(control.x-start.x)+2*t*(end.x-control.x);
    const dy=2*(1-t)*(control.y-start.y)+2*t*(end.y-control.y);
    const tangentAngle=Math.atan2(dy,dx)*180/Math.PI;

    instance.rocket.style.setProperty('--rocket-x',`${x/rect.width*100}%`);
    instance.rocket.style.setProperty('--rocket-y',`${y/rect.height*100}%`);
    instance.rocket.style.setProperty('--rocket-angle',`${tangentAngle+90}deg`);

    if(progress>instance.lastProgress+0.000001) spawnSmoke(instance,x,y,dx,dy);
    if(progress<instance.lastProgress-.001) instance.smokeLayer.replaceChildren();
    instance.lastProgress=progress;

    instance.rocket.getAnimations().forEach(animation=>animation.cancel());

    const arrived=progress>=.9999;
    instance.scene.classList.toggle('rocket-arrived',arrived);
  }

  function install(scene) {
    if(!scene || scene.dataset.moonFlight==='true') return;
    const rocket=scene.querySelector('.rocket');
    const flame=scene.querySelector('.rocket-flame');
    if(!rocket||!flame) return;

    scene.dataset.moonFlight='true';
    scene.classList.add('rocket-flight-active');

    buildRandomStars(scene);
    buildPlanets(scene);
    const smokeLayer=buildSmokeLayer(scene);

    const moon=document.createElement('div');
    moon.className='rocket-moon';
    moon.setAttribute('aria-hidden','true');
    scene.appendChild(moon);

    const startingProgress=progressFromFlame(flame);
    const instance={scene,rocket,flame,smokeLayer,progress:startingProgress,lastProgress:startingProgress,lastSmokeAt:0,observer:null};
    let queued=false;
    instance.observer=new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        render(instance,progressFromFlame(flame));
      });
    });
    instance.observer.observe(flame,{attributes:true,attributeFilter:['style']});
    active=instance;
    requestAnimationFrame(()=>render(instance,instance.progress));
  }

  function scan() {
    const scene=sceneLayer.querySelector('.rocket-scene');
    if(scene) install(scene);
    else if(active&&!active.scene.isConnected){
      active.observer?.disconnect();
      active=null;
    }
  }

  const observer=new MutationObserver(scan);
  observer.observe(sceneLayer,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{ if(active) requestAnimationFrame(()=>render(active,active.progress)); });
  scan();
})();
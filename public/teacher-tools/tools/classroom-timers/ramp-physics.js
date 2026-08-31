(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  if (!sceneLayer || !stage) return;

  const style = document.createElement('style');
  style.id = 'rampBallPhysicsV5';
  style.textContent = `
    .ramp-scene.physics-ramp-active {
      background:
        radial-gradient(circle at 18% 16%, rgba(255,255,255,.055) 0 2px, transparent 3px),
        radial-gradient(circle at 79% 31%, rgba(255,255,255,.045) 0 2px, transparent 3px),
        linear-gradient(145deg,#263a55,#111a28) !important;
    }

    .ramp-scene.physics-ramp-active > .ramp-svg,
    .ramp-scene.physics-ramp-active > .rube-arrow,
    .ramp-scene.physics-ramp-active > .rube-bucket,
    .ramp-scene.physics-ramp-active > .ramp-ball {
      opacity:0 !important;
      visibility:hidden !important;
      pointer-events:none !important;
    }

    .physics-ramp-machine {
      position:absolute;
      inset:0;
      z-index:2;
      pointer-events:none;
      overflow:hidden;
    }

    .physics-ramp-svg {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      overflow:visible;
      filter:drop-shadow(0 8px 7px rgba(0,0,0,.28));
    }

    .physics-ramp-shadow { stroke:#6c4826; stroke-width:22; stroke-linecap:round; opacity:.88; }
    .physics-ramp-top { stroke:#e9b85a; stroke-width:14; stroke-linecap:round; }
    .physics-ramp-highlight { stroke:rgba(255,231,165,.78); stroke-width:3; stroke-linecap:round; }
    .physics-ramp-support { stroke:#788592; stroke-width:6; stroke-linecap:round; opacity:.72; }
    .physics-ramp-foot { fill:#59636e; opacity:.82; }
    .physics-ramp-bolt { fill:#f7d47a; stroke:#654522; stroke-width:4; }

    .physics-ball {
      position:absolute;
      z-index:6;
      width:40px;
      height:40px;
      margin:-20px 0 0 -20px;
      border-radius:50%;
      background:radial-gradient(circle at 31% 24%,#fff5c5 0 10%,#ffb443 27%,#ee7a2e 58%,#b83c27 100%);
      box-shadow:inset -5px -7px 8px rgba(115,34,16,.22),0 8px 11px rgba(0,0,0,.34);
      overflow:hidden;
      will-change:left,top;
    }

    .physics-ball-spin {
      position:absolute;
      inset:0;
      border-radius:50%;
      transform:rotate(var(--ball-spin,0deg));
      will-change:transform;
    }
    .physics-ball-spin::before {
      content:'';
      position:absolute;
      left:17px;
      top:-4px;
      width:7px;
      height:48px;
      border-radius:50%;
      border-left:3px solid rgba(128,45,21,.5);
      border-right:2px solid rgba(255,219,126,.3);
      transform:rotate(22deg);
    }
    .physics-ball-spin::after {
      content:'';
      position:absolute;
      left:7px;
      top:8px;
      width:7px;
      height:7px;
      border-radius:50%;
      background:rgba(126,46,22,.48);
      box-shadow:20px 17px 0 -1px rgba(126,46,22,.34);
    }

    .physics-ball-shine {
      position:absolute;
      left:8px;
      top:6px;
      width:8px;
      height:8px;
      border-radius:50%;
      background:rgba(255,255,255,.62);
      pointer-events:none;
    }

    .physics-bucket {
      position:absolute;
      z-index:5;
      width:92px;
      height:82px;
      transform:translate(-50%,-12px);
      pointer-events:none;
    }
    .physics-bucket-back {
      position:absolute; z-index:5; left:10px; right:10px; top:6px; height:62px;
      border-radius:9px 9px 23px 23px;
      background:linear-gradient(90deg,#64717b,#cbd3d9 48%,#697782);
      clip-path:polygon(3% 0,97% 0,82% 100%,18% 100%);
      box-shadow:0 10px 16px rgba(0,0,0,.32);
    }
    .physics-bucket-opening {
      position:absolute; z-index:5; left:10px; top:0; width:72px; height:22px;
      border:5px solid #edf1f4; border-radius:50%; background:#17202a;
      box-shadow:inset 0 5px 8px rgba(0,0,0,.75);
    }
    .physics-bucket-front {
      position:absolute; z-index:7; left:10px; right:10px; top:13px; height:58px;
      border-radius:6px 6px 22px 22px;
      background:linear-gradient(90deg,#65727c,#d8dee3 48%,#6d7a84);
      clip-path:polygon(3% 0,97% 0,82% 100%,18% 100%);
      box-shadow:inset 0 5px 7px rgba(255,255,255,.12);
    }

    .physics-bucket-front-mask {
      position:absolute;
      z-index:8;
      width:92px;
      height:82px;
      transform:translate(-50%,-12px);
      pointer-events:none;
    }
    .physics-bucket-front-mask::before {
      content:'';
      position:absolute;
      left:10px;
      right:10px;
      top:13px;
      height:58px;
      border-radius:6px 6px 22px 22px;
      background:linear-gradient(90deg,#65727c,#d8dee3 48%,#6d7a84);
      clip-path:polygon(3% 0,97% 0,82% 100%,18% 100%);
      box-shadow:inset 0 5px 7px rgba(255,255,255,.12);
    }
    .physics-bucket-front-mask::after {
      content:'';
      position:absolute;
      left:10px;
      top:8px;
      width:72px;
      height:13px;
      border-bottom:5px solid #edf1f4;
      border-radius:0 0 50% 50%;
    }

    @media (max-width:760px) {
      .physics-ball { width:34px;height:34px;margin:-17px 0 0 -17px; }
      .physics-bucket,
      .physics-bucket-front-mask { transform:translate(-50%,-8px) scale(.84); transform-origin:50% 0; }
    }
  `;
  document.head.appendChild(style);

  const ramps = [
    { x1:10, y1:16, x2:72, y2:25 },
    { x1:84, y1:42, x2:22, y2:51 },
    { x1:10, y1:68, x2:72, y2:77 }
  ];

  const bucket = { x:84, y:91 };
  const phases = [
    { type:'roll', ramp:0, duration:.27 },
    { type:'drop', from:0, to:1, duration:.08 },
    { type:'roll', ramp:1, duration:.27 },
    { type:'drop', from:1, to:2, duration:.08 },
    { type:'roll', ramp:2, duration:.22 },
    { type:'bucket', from:2, duration:.08 }
  ];

  let active = null;
  let bounceAudioCtx = null;

  function soundsMuted() {
    try {
      const stored = localStorage.getItem('ttTimers.muted');
      if (stored !== null) return JSON.parse(stored) === true;
    } catch {}
    return document.getElementById('muteBtn')?.getAttribute('aria-pressed') === 'true';
  }

  function ensureBounceAudio() {
    if (bounceAudioCtx) return bounceAudioCtx;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    bounceAudioCtx = new AudioContextCtor();
    return bounceAudioCtx;
  }

  function unlockBounceAudio() {
    const ctx = ensureBounceAudio();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  }

  function playBounceSound(strength = 1) {
    if (soundsMuted()) return;
    const ctx = ensureBounceAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBounceSound(strength)).catch(() => {});
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + .085);

    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = .7;

    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.024 * strength, now + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .095);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + .11);
  }

  document.addEventListener('pointerdown', unlockBounceAudio, { capture:true, passive:true });
  document.addEventListener('keydown', unlockBounceAudio, { capture:true });

  function svgEl(name, attrs={}) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
    return el;
  }

  function machineMarkup(scene) {
    const machine=document.createElement('div');
    machine.className='physics-ramp-machine';
    const svg=svgEl('svg',{class:'physics-ramp-svg',viewBox:'0 0 1000 600',preserveAspectRatio:'none'});

    ramps.forEach((ramp,index)=>{
      const x1=ramp.x1*10,y1=ramp.y1*6,x2=ramp.x2*10,y2=ramp.y2*6;
      const firstSupportX=x1+(index===1?2:18);
      const firstSupportY=y1+(index===1?5:15);
      svg.appendChild(svgEl('line',{class:'physics-ramp-support',x1:firstSupportX,y1:firstSupportY,x2:firstSupportX,y2:Math.min(585,y1+78)}));
      svg.appendChild(svgEl('rect',{class:'physics-ramp-foot',x:firstSupportX-21,y:Math.min(575,y1+72),width:42,height:9,rx:4}));
      const supportX=x2+(index%2===0?-18:18);
      svg.appendChild(svgEl('line',{class:'physics-ramp-support',x1:supportX,y1:y2+13,x2:supportX,y2:Math.min(585,y2+73)}));
      svg.appendChild(svgEl('rect',{class:'physics-ramp-foot',x:supportX-20,y:Math.min(575,y2+68),width:42,height:9,rx:4}));
      svg.appendChild(svgEl('line',{class:'physics-ramp-shadow',x1,y1,x2,y2}));
      svg.appendChild(svgEl('line',{class:'physics-ramp-top',x1,y1,x2,y2}));
      svg.appendChild(svgEl('line',{class:'physics-ramp-highlight',x1,y1:y1-4,x2,y2:y2-4}));
      svg.appendChild(svgEl('circle',{class:'physics-ramp-bolt',cx:x1,cy:y1,r:8}));
      svg.appendChild(svgEl('circle',{class:'physics-ramp-bolt',cx:x2,cy:y2,r:8}));
    });

    machine.appendChild(svg);

    const ball=document.createElement('div');
    ball.className='physics-ball';
    ball.innerHTML='<div class="physics-ball-spin"></div><div class="physics-ball-shine"></div>';
    machine.appendChild(ball);

    const bucketEl=document.createElement('div');
    bucketEl.className='physics-bucket';
    bucketEl.style.left=`${bucket.x}%`;
    bucketEl.style.top=`${bucket.y}%`;
    bucketEl.innerHTML='<div class="physics-bucket-back"></div><div class="physics-bucket-opening"></div><div class="physics-bucket-front"></div>';
    machine.appendChild(bucketEl);

    const bucketMask=document.createElement('div');
    bucketMask.className='physics-bucket-front-mask';
    bucketMask.style.left=`${bucket.x}%`;
    bucketMask.style.top=`${bucket.y}%`;
    machine.appendChild(bucketMask);

    scene.appendChild(machine);
    return {machine,ball};
  }

  function pointOnRamp(ramp,u,rect,radius) {
    const x1=ramp.x1/100*rect.width,y1=ramp.y1/100*rect.height;
    const x2=ramp.x2/100*rect.width,y2=ramp.y2/100*rect.height;
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
    let nx=dy/len,ny=-dx/len;
    if(ny>0){nx=-nx;ny=-ny;}
    const offset=radius+7;
    return {x:x1+dx*u+nx*offset,y:y1+dy*u+ny*offset,dx,dy,len,nx,ny,angle:Math.atan2(dy,dx)};
  }

  function smoothRoll(u) {
    return .24*u+.76*u*u;
  }

  function landingBounce(u,rampIndex,radius) {
    if(rampIndex===0) return 0;
    const window=.12;
    if(u<=0||u>=window) return 0;
    const t=u/window;
    return Math.sin(Math.PI*t)*(1-t)*Math.min(10,radius*.42);
  }

  function phaseAt(progress) {
    let start=0;
    for(let i=0;i<phases.length;i++){
      const phase=phases[i],end=start+phase.duration;
      if(progress<=end||i===phases.length-1){
        return {phase,u:Math.max(0,Math.min(1,(progress-start)/phase.duration)),index:i};
      }
      start=end;
    }
    return {phase:phases[phases.length-1],u:1,index:phases.length-1};
  }

  function travelRotation(index,localU,rect,radius) {
    let signedDistance=0;
    for(let i=0;i<index;i++){
      const phase=phases[i];
      if(phase.type==='roll'){
        const a=pointOnRamp(ramps[phase.ramp],0,rect,radius),b=pointOnRamp(ramps[phase.ramp],1,rect,radius);
        signedDistance+=Math.sign(b.x-a.x)*Math.hypot(b.x-a.x,b.y-a.y);
      } else if(phase.type==='drop'){
        const a=pointOnRamp(ramps[phase.from],1,rect,radius),b=pointOnRamp(ramps[phase.to],0,rect,radius);
        signedDistance+=Math.sign(b.x-a.x)*Math.hypot(b.x-a.x,b.y-a.y)*.45;
      }
    }

    const current=phases[index];
    if(current.type==='roll'){
      const a=pointOnRamp(ramps[current.ramp],0,rect,radius),b=pointOnRamp(ramps[current.ramp],1,rect,radius);
      signedDistance+=Math.sign(b.x-a.x)*Math.hypot(b.x-a.x,b.y-a.y)*smoothRoll(localU);
    } else if(current.type==='drop'){
      const a=pointOnRamp(ramps[current.from],1,rect,radius),b=pointOnRamp(ramps[current.to],0,rect,radius);
      signedDistance+=Math.sign(b.x-a.x)*Math.hypot(b.x-a.x,b.y-a.y)*.45*localU;
    }
    return signedDistance/radius*180/Math.PI;
  }

  function render(instance,progress) {
    if(!instance?.scene?.isConnected) return;
    progress=Math.max(0,Math.min(1,progress));

    const rect=instance.scene.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    const ballRect=instance.ball.getBoundingClientRect();
    const radius=Math.max(14,(ballRect.width||40)/2);
    const {phase,u,index}=phaseAt(progress);

    if(progress>instance.progress+.00001 && index!==instance.lastPhaseIndex && phase.type==='roll' && phase.ramp>0){
      playBounceSound(phase.ramp===1?1:.92);
    }
    instance.lastPhaseIndex=index;
    instance.progress=progress;

    let x=0,y=0;
    const rotation=travelRotation(index,u,rect,radius);

    if(phase.type==='roll'){
      const p=pointOnRamp(ramps[phase.ramp],smoothRoll(u),rect,radius);
      const bounce=landingBounce(u,phase.ramp,radius);
      x=p.x+p.nx*bounce;
      y=p.y+p.ny*bounce;
      instance.ball.style.opacity='1';
      instance.ball.style.zIndex='6';
    } else if(phase.type==='drop'){
      const start=pointOnRamp(ramps[phase.from],1,rect,radius);
      const end=pointOnRamp(ramps[phase.to],0,rect,radius);
      x=start.x+(end.x-start.x)*u;
      y=start.y+(end.y-start.y)*u*u;
      instance.ball.style.opacity='1';
      instance.ball.style.zIndex='6';
    } else {
      const start=pointOnRamp(ramps[phase.from],1,rect,radius);
      const targetX=bucket.x/100*rect.width;
      const targetY=Math.min(rect.height-4,bucket.y/100*rect.height+46);
      x=start.x+(targetX-start.x)*u;
      y=start.y+(targetY-start.y)*u*u;
      instance.ball.style.opacity='1';
      instance.ball.style.zIndex='6';
    }

    instance.ball.style.left=`${x}px`;
    instance.ball.style.top=`${y}px`;
    instance.ball.style.setProperty('--ball-spin',`${rotation.toFixed(2)}deg`);
  }

  function progressFromSensor(sensor){
    const rotation=parseFloat(sensor.style.rotate);
    return Number.isFinite(rotation)?Math.max(0,Math.min(1,rotation/1400)):0;
  }

  function install(scene){
    if(!scene||scene.dataset.physicsRamp==='true') return;
    const sensor=scene.querySelector(':scope > .ramp-ball');
    if(!sensor) return;

    scene.dataset.physicsRamp='true';
    scene.classList.add('physics-ramp-active');
    const created=machineMarkup(scene);
    const initialProgress=progressFromSensor(sensor);
    const initialPhase=phaseAt(initialProgress);
    const instance={
      scene,
      sensor,
      ball:created.ball,
      machine:created.machine,
      progress:initialProgress,
      lastPhaseIndex:initialPhase.index,
      observer:null
    };

    let queued=false;
    instance.observer=new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        render(instance,progressFromSensor(sensor));
      });
    });
    instance.observer.observe(sensor,{attributes:true,attributeFilter:['style']});
    active=instance;
    requestAnimationFrame(()=>render(instance,instance.progress));
  }

  function scan(){
    const scene=sceneLayer.querySelector('.ramp-scene');
    if(scene) install(scene);
    else if(active&&!active.scene.isConnected){active.observer?.disconnect();active=null;}
  }

  const observer=new MutationObserver(scan);
  observer.observe(sceneLayer,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{if(active) requestAnimationFrame(()=>render(active,active.progress));});
  scan();
})();
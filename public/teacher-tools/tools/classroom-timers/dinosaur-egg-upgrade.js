(() => {
  'use strict';

  if (document.getElementById('dinosaurEggUpgradeStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggUpgradeStyleV1';
  style.textContent = `
    .xt-dino.dino-egg-upgraded {
      background:
        radial-gradient(ellipse at 58% 69%, rgba(110,148,67,.25) 0 26%, transparent 27%),
        linear-gradient(180deg,#89caba 0 57%,#668c4d 57% 65%,#79964e 65% 100%) !important;
      overflow:hidden;
    }

    .dino-up-hills {
      position:absolute;
      left:-7%;right:-7%;bottom:26%;height:25%;
      border-radius:50% 50% 0 0;
      background:#557d49;
      opacity:.72;
      z-index:0;
    }
    .dino-up-hills::after {
      content:'';
      position:absolute;
      left:31%;right:-4%;bottom:-17%;height:82%;
      border-radius:50% 50% 0 0;
      background:#668a49;
    }

    .dino-up-ground {
      position:absolute;
      inset:auto 0 0 0;
      height:36%;
      z-index:0;
      background:linear-gradient(180deg,#78984e,#6f8c48);
    }

    .dino-up-water {
      position:absolute;
      right:8%;
      bottom:9%;
      width:185px;
      height:58px;
      z-index:1;
      border-radius:50%;
      background:radial-gradient(ellipse at 45% 38%,#bfe9eb 0,#79bdca 48%,#4d899c 100%);
      box-shadow:inset 0 6px 10px rgba(255,255,255,.28),0 4px 7px rgba(46,74,54,.18);
    }
    .dino-up-water::before,
    .dino-up-water::after {
      content:'';
      position:absolute;
      left:18%;right:18%;height:2px;
      border-radius:99px;
      background:rgba(230,251,255,.52);
    }
    .dino-up-water::before { top:38%; }
    .dino-up-water::after { top:58%;left:30%;right:28%; }

    .dino-up-tree {
      position:absolute;
      width:70px;
      height:144px;
      z-index:1;
      transform-origin:50% 100%;
      filter:drop-shadow(0 5px 4px rgba(0,0,0,.12));
    }
    .dino-up-tree.t1 { left:8%;bottom:24%;transform:scale(.92); }
    .dino-up-tree.t2 { right:29%;bottom:27%;transform:scale(.68);opacity:.86; }
    .dino-up-tree .trunk {
      position:absolute;left:29px;bottom:0;width:13px;height:86px;
      border-radius:8px 8px 2px 2px;
      background:linear-gradient(90deg,#69472c,#8d633d,#65432a);
    }
    .dino-up-tree .canopy,
    .dino-up-tree .canopy::before,
    .dino-up-tree .canopy::after {
      content:'';
      position:absolute;
      border-radius:50%;
      background:#4f8847;
      box-shadow:inset -6px -5px 0 rgba(37,82,45,.13);
    }
    .dino-up-tree .canopy { left:8px;top:15px;width:55px;height:48px; }
    .dino-up-tree .canopy::before { left:-11px;top:17px;width:45px;height:40px; }
    .dino-up-tree .canopy::after { left:28px;top:13px;width:43px;height:39px; }

    .dino-up-drinker {
      position:absolute;
      right:15%;
      bottom:13%;
      width:105px;
      height:78px;
      z-index:2;
      transform-origin:72% 82%;
      animation:dinoDrinkNod 2.25s ease-in-out infinite;
      filter:drop-shadow(0 3px 3px rgba(0,0,0,.15));
    }
    .dino-up-drinker svg { width:100%;height:100%;display:block;overflow:visible; }
    @keyframes dinoDrinkNod {
      0%,35%,100%{transform:rotate(0deg)}
      48%,68%{transform:rotate(8deg)}
    }

    .dino-up-ptero {
      position:absolute;
      left:-10%;
      top:20%;
      width:96px;
      height:58px;
      z-index:1;
      pointer-events:none;
      opacity:.82;
      will-change:left,top,transform;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.15));
    }
    .dino-up-ptero svg { width:100%;height:100%;display:block;overflow:visible; }
    .dino-up-ptero .wing-l { transform-origin:55px 33px;animation:dinoWingLeft .72s ease-in-out infinite alternate; }
    .dino-up-ptero .wing-r { transform-origin:62px 33px;animation:dinoWingRight .72s ease-in-out infinite alternate; }
    @keyframes dinoWingLeft { from{transform:rotate(8deg)} to{transform:rotate(-13deg)} }
    @keyframes dinoWingRight { from{transform:rotate(-8deg)} to{transform:rotate(13deg)} }

    .dino-up-stage {
      position:absolute;
      left:61%;
      bottom:5%;
      width:330px;
      height:445px;
      transform:translateX(-50%);
      z-index:6;
    }
    .dino-up-shadow {
      position:absolute;
      left:50%;bottom:5px;
      width:235px;height:35px;
      transform:translateX(-50%);
      border-radius:50%;
      background:rgba(54,64,35,.20);
      filter:blur(7px);
    }

    .dino-up-egg {
      position:absolute;
      left:50%;bottom:24px;
      width:278px;height:365px;
      transform:translateX(-50%);
      border-radius:50% 50% 45% 45% / 61% 61% 39% 39%;
      overflow:visible;
    }

    .dino-up-shell-base,
    .dino-up-shell-half {
      position:absolute;
      inset:0;
      border-radius:inherit;
      background:radial-gradient(circle at 35% 24%,#fff6d6 0,#eadfb7 53%,#cfbf8c 100%);
      box-shadow:inset -20px -18px 26px rgba(103,84,45,.10),0 18px 28px rgba(43,60,35,.20);
    }
    .dino-up-shell-base { z-index:2; }
    .dino-up-shell-half { z-index:5;opacity:0; }
    .dino-up-shell-half.left { clip-path:polygon(0 0,54% 0,52% 14%,58% 25%,50% 36%,57% 48%,49% 59%,55% 70%,49% 82%,52% 100%,0 100%);transform-origin:40% 94%; }
    .dino-up-shell-half.right { clip-path:polygon(46% 0,100% 0,100% 100%,48% 100%,51% 82%,45% 70%,51% 59%,43% 48%,50% 36%,42% 25%,48% 14%);transform-origin:60% 94%; }

    .dino-up-speck {
      position:absolute;
      border-radius:50%;
      background:rgba(121,133,83,.28);
      z-index:3;
      pointer-events:none;
    }

    .dino-up-cracks {
      position:absolute;
      inset:0;
      width:100%;height:100%;
      z-index:7;
      overflow:visible;
      pointer-events:none;
    }
    .dino-up-cracks path {
      fill:none;
      stroke:#7f7357;
      stroke-width:3.2;
      stroke-linecap:round;
      stroke-linejoin:round;
      opacity:0;
      filter:drop-shadow(0 1px 0 rgba(255,255,255,.26));
    }

    .dino-up-baby {
      position:absolute;
      left:50%;
      bottom:42px;
      width:175px;
      height:190px;
      z-index:6;
      opacity:0;
      transform:translateX(-50%) translateY(88px) scale(.82);
      transform-origin:50% 100%;
      pointer-events:none;
      will-change:transform,opacity,clip-path;
      clip-path:inset(0 0 58% 0);
      filter:drop-shadow(0 5px 4px rgba(0,0,0,.16));
    }
    .dino-up-baby svg { width:100%;height:100%;display:block;overflow:visible; }
    .dino-up-baby .happy-mouth,
    .dino-up-baby .happy-cheek,
    .dino-up-baby .happy-arm { opacity:0; }
    .dino-up-baby.happy .flat-mouth { opacity:0; }
    .dino-up-baby.happy .happy-mouth,
    .dino-up-baby.happy .happy-cheek,
    .dino-up-baby.happy .happy-arm { opacity:1; }
    .dino-up-baby.happy .normal-arm { opacity:0; }
    .dino-up-baby.happy .dino-up-baby-head { animation:dinoHappyHead .48s ease-in-out infinite alternate;transform-origin:91px 71px; }
    @keyframes dinoHappyHead { from{transform:rotate(-3deg)} to{transform:rotate(3deg)} }

    .dino-up-pop {
      position:absolute;
      left:50%;top:47%;
      transform:translate(-50%,-50%) scale(.6);
      z-index:10;
      opacity:0;
      color:#fff4a8;
      font-family:var(--heading);
      font-size:clamp(2rem,6vw,4.8rem);
      text-shadow:0 4px 0 rgba(77,91,46,.45),0 0 14px rgba(255,245,163,.5);
      pointer-events:none;
    }
    .dino-up-pop.show { animation:dinoHatchedPop .75s cubic-bezier(.2,.85,.25,1.15) forwards; }
    @keyframes dinoHatchedPop {
      0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-6deg)}
      45%{opacity:1;transform:translate(-50%,-50%) scale(1.15) rotate(3deg)}
      100%{opacity:.92;transform:translate(-50%,-50%) scale(1) rotate(0)}
    }

    @media(max-width:760px){
      .dino-up-stage { left:68%;bottom:2%;transform:translateX(-50%) scale(.78);transform-origin:50% 100%; }
      .dino-up-water { right:2%;width:135px;height:44px; }
      .dino-up-drinker { right:8%;width:82px;height:62px; }
      .dino-up-tree.t1 { left:3%;transform:scale(.72); }
      .dino-up-tree.t2 { right:22%;transform:scale(.52); }
      .dino-up-ptero { width:74px;height:45px; }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const smooth = t => t*t*(3-2*t);
  const random = (a,b) => a + Math.random()*(b-a);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastScene = null;
  let sceneState = null;
  let raf = 0;
  let audioCtx = null;

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
    const status = stageStatus?.textContent.trim()||'';
    const running = status==='Running';
    if(displayedRemaining===null || current!==displayedRemaining || status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }
    let estimated=current;
    if(running && current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function isMuted(){
    try{
      const keys=['ttTimers.muted','ttTimers.mute','ttTimers.audioMuted'];
      return keys.some(k=>{
        const v=localStorage.getItem(k);
        return v==='true' || v==='1' || v==='"true"';
      });
    }catch{return false;}
  }

  function primeAudio(){
    if(isMuted()) return;
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
    }catch{}
  }
  window.addEventListener('pointerdown',primeAudio,{passive:true});
  window.addEventListener('keydown',primeAudio,{passive:true});

  function playCrack(){
    if(isMuted()) return;
    primeAudio();
    const ctx=audioCtx;
    if(!ctx || ctx.state!=='running') return;
    const now=ctx.currentTime;

    const duration=.16;
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){
      const env=Math.exp(-i/(ctx.sampleRate*.032));
      data[i]=(Math.random()*2-1)*env;
    }
    const noise=ctx.createBufferSource();
    noise.buffer=buffer;
    const band=ctx.createBiquadFilter();
    band.type='bandpass';band.frequency.value=1850+Math.random()*500;band.Q.value=.65;
    const ng=ctx.createGain();
    ng.gain.setValueAtTime(.0001,now);
    ng.gain.exponentialRampToValueAtTime(.095,now+.008);
    ng.gain.exponentialRampToValueAtTime(.0001,now+.15);
    noise.connect(band).connect(ng).connect(ctx.destination);
    noise.start(now);noise.stop(now+duration);

    const tick=ctx.createOscillator();
    const tg=ctx.createGain();
    tick.type='triangle';
    tick.frequency.setValueAtTime(620+Math.random()*130,now);
    tick.frequency.exponentialRampToValueAtTime(185,now+.11);
    tg.gain.setValueAtTime(.0001,now);
    tg.gain.exponentialRampToValueAtTime(.055,now+.006);
    tg.gain.exponentialRampToValueAtTime(.0001,now+.12);
    tick.connect(tg).connect(ctx.destination);
    tick.start(now);tick.stop(now+.13);
  }

  function jaggedPath(x,y,len,angleDeg,segments){
    let a=angleDeg*Math.PI/180;
    const step=len/segments;
    let d=`M ${x.toFixed(1)} ${y.toFixed(1)}`;
    for(let i=0;i<segments;i++){
      a += random(-.42,.42);
      x += Math.cos(a)*step + random(-3.8,3.8);
      y += Math.sin(a)*step + random(-3.5,3.5);
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      if(i>1 && i<segments-2 && Math.random()<.28){
        const ba=a+random(-1.35,1.35);
        const bl=random(12,28);
        d += ` M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x+Math.cos(ba)*bl).toFixed(1)} ${(y+Math.sin(ba)*bl).toFixed(1)} M ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return d;
  }

  function specks(){
    return Array.from({length:14},()=>{
      const left=random(18,78),top=random(14,80),w=random(10,24),h=random(7,18),rot=random(-50,50);
      return `<i class="dino-up-speck" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;width:${w.toFixed(0)}px;height:${h.toFixed(0)}px;transform:rotate(${rot.toFixed(0)}deg)"></i>`;
    }).join('');
  }

  function buildScene(scene){
    const crackDefs=[
      [139,137,88,89,9],[139,167,78,15,8],[136,186,70,160,8],
      [147,202,66,32,8],[128,220,54,205,7],[155,225,48,58,6],[137,246,47,128,6]
    ];
    const cracks=crackDefs.map(([x,y,l,a,s],i)=>`<path data-dino-crack="${i}" d="${jaggedPath(x,y,l,a,s)}"></path>`).join('');

    scene.innerHTML=`
      <div class="dino-up-hills"></div>
      <div class="dino-up-ground"></div>
      <div class="dino-up-tree t1"><div class="trunk"></div><div class="canopy"></div></div>
      <div class="dino-up-tree t2"><div class="trunk"></div><div class="canopy"></div></div>
      <div class="dino-up-water"></div>
      <div class="dino-up-drinker" aria-hidden="true">
        <svg viewBox="0 0 120 90">
          <ellipse cx="58" cy="54" rx="28" ry="18" fill="#73a84f"/>
          <path d="M80 53 Q95 60 105 68" fill="none" stroke="#73a84f" stroke-width="8" stroke-linecap="round"/>
          <path d="M78 48 Q93 37 103 25" fill="none" stroke="#73a84f" stroke-width="9" stroke-linecap="round"/>
          <ellipse cx="104" cy="23" rx="12" ry="9" fill="#78b157" transform="rotate(-18 104 23)"/>
          <circle cx="108" cy="21" r="2" fill="#172116"/>
          <path d="M35 52 Q22 44 16 37" fill="none" stroke="#73a84f" stroke-width="8" stroke-linecap="round"/>
          <path d="M50 68 L47 83 M69 68 L73 83" stroke="#52783c" stroke-width="5" stroke-linecap="round"/>
          <path d="M98 30 Q106 42 105 55" fill="none" stroke="#52783c" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="dino-up-ptero" aria-hidden="true">
        <svg viewBox="0 0 120 70">
          <g class="wing-l"><path d="M58 33 Q31 4 5 22 Q29 25 49 42 Z" fill="#647879"/></g>
          <g class="wing-r"><path d="M62 33 Q90 5 116 24 Q90 25 70 42 Z" fill="#647879"/></g>
          <ellipse cx="60" cy="36" rx="16" ry="8" fill="#7d9290"/>
          <path d="M72 35 L94 30 L78 41 Z" fill="#7d9290"/>
          <circle cx="72" cy="33" r="1.8" fill="#161c1c"/>
          <path d="M48 38 L38 49" stroke="#647879" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="dino-up-stage">
        <div class="dino-up-shadow"></div>
        <div class="dino-up-egg">
          <div class="dino-up-shell-base"></div>
          ${specks()}
          <svg class="dino-up-cracks" viewBox="0 0 278 365" preserveAspectRatio="none">${cracks}</svg>
          <div class="dino-up-baby" aria-hidden="true">
            <svg viewBox="0 0 180 190">
              <g class="dino-up-baby-head">
                <ellipse cx="91" cy="68" rx="42" ry="36" fill="#7fd06a"/>
                <ellipse cx="122" cy="73" rx="19" ry="14" fill="#82d56d"/>
                <circle cx="80" cy="62" r="5.4" fill="#152015"/><circle cx="104" cy="62" r="5.4" fill="#152015"/>
                <circle cx="78.5" cy="60.5" r="1.4" fill="#fff"/><circle cx="102.5" cy="60.5" r="1.4" fill="#fff"/>
                <circle class="happy-cheek" cx="72" cy="78" r="6" fill="#f29c87" opacity=".62"/><circle class="happy-cheek" cx="111" cy="78" r="6" fill="#f29c87" opacity=".62"/>
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
          </div>
          <div class="dino-up-shell-half left"></div>
          <div class="dino-up-shell-half right"></div>
        </div>
        <div class="dino-up-pop">HATCHED!</div>
      </div>
    `;
    scene.classList.add('dino-egg-upgraded');
    scene.dataset.dinoEggUpgrade='1';
    sceneState={revealed:0,hatched:false,pteroSeed:random(0,Math.PI*2)};
  }

  function render(scene,p,now){
    if(scene.dataset.dinoEggUpgrade!=='1') buildScene(scene);
    if(!sceneState) return;

    const crackThresholds=[.13,.25,.38,.52,.66,.79,.88];
    const paths=[...scene.querySelectorAll('[data-dino-crack]')];
    const visible=crackThresholds.filter(t=>p>=t).length;
    if(visible>sceneState.revealed){
      for(let i=sceneState.revealed;i<visible;i++) playCrack();
      sceneState.revealed=visible;
    }
    paths.forEach((path,i)=>{path.style.opacity=i<visible?'1':'0';});

    const baby=scene.querySelector('.dino-up-baby');
    const leftShell=scene.querySelector('.dino-up-shell-half.left');
    const rightShell=scene.querySelector('.dino-up-shell-half.right');
    const shellBase=scene.querySelector('.dino-up-shell-base');
    const speckEls=[...scene.querySelectorAll('.dino-up-speck')];
    const pop=scene.querySelector('.dino-up-pop');

    const peek=smooth(clamp((p-.90)/.065,0,1));
    const hatch=smooth(clamp((p-.965)/.035,0,1));

    if(baby){
      baby.style.opacity=String(peek);
      if(hatch<.01){
        baby.classList.remove('happy');
        baby.style.clipPath='inset(0 0 57% 0)';
        baby.style.transform=`translateX(-50%) translateY(${lerp(94,49,peek)}px) scale(${lerp(.78,.86,peek)})`;
      }else{
        baby.classList.add('happy');
        baby.style.clipPath=`inset(0 0 ${lerp(57,0,hatch)}% 0)`;
        const bounce=Math.sin(hatch*Math.PI)*12;
        baby.style.transform=`translateX(-50%) translateY(${lerp(49,-17,hatch)-bounce}px) scale(${lerp(.86,1,hatch)})`;
      }
    }

    if(hatch>0){
      if(shellBase) shellBase.style.opacity=String(1-hatch);
      speckEls.forEach(el=>el.style.opacity=String(1-hatch));
      if(leftShell){leftShell.style.opacity='1';leftShell.style.transform=`translate(${-58*hatch}px,${20*hatch}px) rotate(${-25*hatch}deg)`;}
      if(rightShell){rightShell.style.opacity='1';rightShell.style.transform=`translate(${62*hatch}px,${18*hatch}px) rotate(${27*hatch}deg)`;}
      paths.forEach(path=>path.style.opacity=String(1-hatch));
      if(!sceneState.hatched && hatch>.15){sceneState.hatched=true;pop?.classList.add('show');}
    }else{
      if(shellBase) shellBase.style.opacity='1';
      if(leftShell){leftShell.style.opacity='0';leftShell.style.transform='none';}
      if(rightShell){rightShell.style.opacity='0';rightShell.style.transform='none';}
      pop?.classList.remove('show');sceneState.hatched=false;
    }

    const ptero=scene.querySelector('.dino-up-ptero');
    if(ptero){
      const travel=((now/1000)/13 + sceneState.pteroSeed)%1;
      const x=lerp(-10,111,travel);
      const y=18 + Math.sin(travel*Math.PI*2.2)*5 + Math.sin(now/1300)*1.5;
      const tilt=Math.cos(travel*Math.PI*2.2)*5;
      ptero.style.left=`${x}%`;ptero.style.top=`${y}%`;ptero.style.transform=`translate(-50%,-50%) rotate(${tilt}deg)`;
    }
  }

  function loop(now){
    const scene=sceneLayer.querySelector('.xt-dino[data-xt-theme="dino"]');
    if(scene!==lastScene){
      lastScene=scene||null;displayedRemaining=null;sceneState=null;
    }
    if(scene) render(scene,progressNow(now),now);
    raf=requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
})();
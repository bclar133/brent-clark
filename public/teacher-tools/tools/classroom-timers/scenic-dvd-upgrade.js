(() => {
  'use strict';

  if (window.__scenicDvdUpgradeV4) return;
  window.__scenicDvdUpgradeV4 = true;

  const scenic = document.getElementById('scenicClock');
  if (!scenic) return;

  const scenicButton = document.querySelector('[data-clock-style="scenic"]');
  if (scenicButton) scenicButton.textContent = 'DVD Bounce';

  const style = document.createElement('style');
  style.id = 'scenicDvdUpgradeStyleV4';
  style.textContent = `
    #scenicClock.dvd-scene{
      position:relative!important;
      width:100%!important;
      height:100%!important;
      min-height:500px!important;
      overflow:hidden!important;
      isolation:isolate;
      background-color:var(--dvd-bg,#f3c6d8)!important;
      transition:background-color 7s ease-in-out!important;
    }
    #scenicClock.dvd-scene.clock-upgrade-visible{display:block!important}
    #scenicClock.dvd-scene > .scenic-orb,
    #scenicClock.dvd-scene > .scenic-horizon,
    #scenicClock.dvd-scene > #scenicTime,
    #scenicClock.dvd-scene > #scenicLabel{display:none!important}

    .dvd-time-logo{
      position:absolute;
      left:0;
      top:0;
      display:flex;
      align-items:center;
      justify-content:center;
      width:clamp(360px,38vw,520px);
      min-width:0;
      max-width:none;
      height:clamp(105px,14vw,178px);
      padding:0 28px;
      box-sizing:border-box;
      border-radius:clamp(18px,2vw,30px);
      background:rgba(255,255,255,.46);
      border:2px solid rgba(255,255,255,.72);
      box-shadow:0 14px 34px rgba(43,57,72,.18),inset 0 1px 0 rgba(255,255,255,.75);
      color:#17384d;
      font-family:var(--display,'Fredoka',sans-serif);
      font-size:clamp(3.2rem,8vw,7.4rem);
      font-weight:800;
      font-variant-numeric:tabular-nums;
      font-feature-settings:'tnum' 1;
      line-height:1;
      letter-spacing:0;
      white-space:nowrap;
      user-select:none;
      pointer-events:none;
      will-change:transform;
      z-index:3;
      backdrop-filter:blur(5px);
      -webkit-backdrop-filter:blur(5px);
    }
    .dvd-time-logo.corner-perfect{animation:dvdCornerPerfect .72s cubic-bezier(.2,.8,.2,1)}
    @keyframes dvdCornerPerfect{
      0%{filter:brightness(1);box-shadow:0 14px 34px rgba(43,57,72,.18),inset 0 1px 0 rgba(255,255,255,.75)}
      28%{filter:brightness(1.22);box-shadow:0 0 0 8px rgba(255,255,255,.38),0 18px 42px rgba(43,57,72,.24)}
      100%{filter:brightness(1);box-shadow:0 14px 34px rgba(43,57,72,.18),inset 0 1px 0 rgba(255,255,255,.75)}
    }

    html[data-theme="dark"] #scenicClock.dvd-scene{filter:saturate(.78) brightness(.78)}
    html[data-theme="dark"] .dvd-time-logo{
      background:rgba(15,30,43,.48);
      border-color:rgba(255,255,255,.28);
      color:#f7fbfd;
      box-shadow:0 16px 38px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.16);
    }
    @media(max-width:760px){
      #scenicClock.dvd-scene{min-height:390px!important}
      .dvd-time-logo{
        width:clamp(250px,64vw,320px);
        min-width:0;
        height:clamp(88px,25vw,125px);
        padding:0 18px;
        font-size:clamp(2.5rem,13vw,4.7rem)
      }
    }
    @media(prefers-reduced-motion:reduce){
      #scenicClock.dvd-scene{transition:background-color 7s linear!important}
      .dvd-time-logo{will-change:auto}
    }
  `;
  document.head.appendChild(style);

  scenic.classList.add('dvd-scene');
  scenic.querySelector('.dvd-time-logo')?.remove();
  scenic.querySelector('.dvd-corner-note')?.remove();

  const logo = document.createElement('div');
  logo.className = 'dvd-time-logo';
  logo.textContent = '--:--:--';
  scenic.appendChild(logo);

  const PASTELS = [
    '#f3c6d8', // rose pink
    '#ffd0c2', // peach
    '#ffe3a8', // warm yellow
    '#cdebbf', // mint green
    '#bdebdc', // aqua mint
    '#bcdff5', // sky blue
    '#c9d0f4', // periwinkle
    '#d9c6f2', // lavender
    '#efc7e8'  // lilac pink
  ];

  const state = {
    x:48,
    y:48,
    vx:152,
    vy:112,
    lastNow:0,
    raf:0,
    active:false,
    nextCornerAt:0,
    chaseStartAt:0,
    targetCorner:0,
    cornerHoldUntil:0,
    lastSecond:-1,
    colorTimer:0,
    pastelIndex:-1
  };

  const pad = n => String(n).padStart(2,'0');

  function updateTime(){
    const now = new Date();
    const sec = now.getSeconds();
    if(sec===state.lastSecond)return;
    state.lastSecond=sec;
    const hour=now.getHours()%12||12;
    logo.textContent=`${pad(hour)}:${pad(now.getMinutes())}:${pad(sec)}`;
  }

  function choosePastel(){
    let next=state.pastelIndex;
    while(next===state.pastelIndex&&PASTELS.length>1){
      next=Math.floor(Math.random()*PASTELS.length);
    }
    state.pastelIndex=next;
    scenic.style.setProperty('--dvd-bg',PASTELS[next]);
  }

  function scheduleCorner(now){
    const delay=(360+Math.random()*120)*1000;
    state.nextCornerAt=now+delay;
    state.chaseStartAt=state.nextCornerAt-7000;
    state.targetCorner=Math.floor(Math.random()*4);
  }

  function bounds(){
    const width=scenic.clientWidth;
    const height=scenic.clientHeight;
    const logoWidth=logo.offsetWidth;
    const logoHeight=logo.offsetHeight;
    return {maxX:Math.max(0,width-logoWidth),maxY:Math.max(0,height-logoHeight)};
  }

  function cornerPosition(corner,b){
    return {
      x:corner===1||corner===3?b.maxX:0,
      y:corner>=2?b.maxY:0
    };
  }

  function leaveCorner(corner){
    const sx=corner===1||corner===3?-1:1;
    const sy=corner>=2?-1:1;
    state.vx=sx*(145+Math.random()*28);
    state.vy=sy*(102+Math.random()*26);
  }

  function hitPerfectCorner(now,b){
    const target=cornerPosition(state.targetCorner,b);
    state.x=target.x;
    state.y=target.y;
    state.cornerHoldUntil=now+260;
    leaveCorner(state.targetCorner);
    logo.classList.remove('corner-perfect');
    void logo.offsetWidth;
    logo.classList.add('corner-perfect');
    setTimeout(()=>logo.classList.remove('corner-perfect'),760);
    choosePastel();
    scheduleCorner(now);
  }

  function isVisible(){
    return !scenic.hidden&&(scenic.classList.contains('clock-upgrade-visible')||getComputedStyle(scenic).display!=='none');
  }

  function render(now){
    if(!state.active||!isVisible()){
      state.raf=0;
      return;
    }

    updateTime();
    const b=bounds();
    state.x=Math.min(Math.max(0,state.x),b.maxX);
    state.y=Math.min(Math.max(0,state.y),b.maxY);

    if(!state.lastNow)state.lastNow=now;
    const dt=Math.min(.035,Math.max(0,(now-state.lastNow)/1000));
    state.lastNow=now;

    if(now<state.cornerHoldUntil){
      logo.style.transform=`translate3d(${state.x}px,${state.y}px,0)`;
      state.raf=requestAnimationFrame(render);
      return;
    }

    if(!state.nextCornerAt||state.nextCornerAt<now+1000)scheduleCorner(now);

    if(now>=state.nextCornerAt){
      hitPerfectCorner(now,b);
    }else if(now>=state.chaseStartAt){
      const target=cornerPosition(state.targetCorner,b);
      const remaining=Math.max(.018,(state.nextCornerAt-now)/1000);
      state.vx=(target.x-state.x)/remaining;
      state.vy=(target.y-state.y)/remaining;
      state.x+=state.vx*dt;
      state.y+=state.vy*dt;
    }else{
      state.x+=state.vx*dt;
      state.y+=state.vy*dt;

      if(state.x<=0){state.x=0;state.vx=Math.abs(state.vx)}
      else if(state.x>=b.maxX){state.x=b.maxX;state.vx=-Math.abs(state.vx)}

      if(state.y<=0){state.y=0;state.vy=Math.abs(state.vy)}
      else if(state.y>=b.maxY){state.y=b.maxY;state.vy=-Math.abs(state.vy)}
    }

    logo.style.transform=`translate3d(${state.x}px,${state.y}px,0)`;
    state.raf=requestAnimationFrame(render);
  }

  function start(){
    if(state.active)return;
    state.active=true;
    state.lastNow=performance.now();
    updateTime();
    choosePastel();
    if(!state.nextCornerAt||state.nextCornerAt<state.lastNow+1000)scheduleCorner(state.lastNow);
    if(!state.colorTimer)state.colorTimer=window.setInterval(choosePastel,8000);
    if(!state.raf)state.raf=requestAnimationFrame(render);
  }

  function stop(){
    state.active=false;
    state.lastNow=performance.now();
    if(state.raf){cancelAnimationFrame(state.raf);state.raf=0}
    if(state.colorTimer){clearInterval(state.colorTimer);state.colorTimer=0}
  }

  const visibilityObserver=new MutationObserver(()=>{
    if(isVisible())start();
    else stop();
  });
  visibilityObserver.observe(scenic,{attributes:true,attributeFilter:['class','hidden','style']});

  scenicButton?.addEventListener('click',()=>requestAnimationFrame(start));
  window.addEventListener('resize',()=>{
    const b=bounds();
    state.x=Math.min(Math.max(0,state.x),b.maxX);
    state.y=Math.min(Math.max(0,state.y),b.maxY);
  });

  choosePastel();
  updateTime();
  if(isVisible())start();
})();

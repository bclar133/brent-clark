(() => {
  'use strict';

  if (document.getElementById('snowmanStraightStartStyleV2')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'snowmanStraightStartStyleV2';
  style.textContent = `
    .snow2-bird{
      position:absolute;
      width:120px;
      height:82px;
      z-index:6;
      pointer-events:none;
      opacity:0;
      transform:translate(-50%,-50%);
      will-change:left,top,opacity,transform;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.15));
    }
    .snow2-bird-body{
      position:absolute;left:22px;top:26px;width:62px;height:43px;
      border-radius:53% 47% 50% 50%;
      background:linear-gradient(145deg,#5ab3ea,#2e79be);
      box-shadow:inset -6px -6px 10px rgba(0,0,0,.12);
    }
    .snow2-bird-belly{
      position:absolute;left:42px;top:38px;width:27px;height:22px;border-radius:50%;
      background:rgba(245,252,255,.92);
    }
    .snow2-bird-wing{
      position:absolute;left:49px;top:35px;width:26px;height:18px;
      border-radius:50% 50% 45% 45%;
      background:linear-gradient(145deg,#225d9e,#1c4f85);
      transform:rotate(20deg);
    }
    .snow2-bird-head{
      position:absolute;left:6px;top:19px;width:38px;height:38px;border-radius:50%;
      background:linear-gradient(145deg,#68c1f6,#3086cc);
      box-shadow:inset -4px -4px 8px rgba(0,0,0,.10);
      transform-origin:78% 72%;
      transform:rotate(var(--bird-peck,0deg));
    }
    .snow2-bird-eye{
      position:absolute;left:13px;top:11px;width:6px;height:6px;border-radius:50%;background:#1b2329;
    }
    .snow2-bird-beak{
      position:absolute;left:-17px;top:16px;width:23px;height:12px;
      background:#f0b13a;clip-path:polygon(100% 50%,0 0,0 100%);
      transform-origin:100% 50%;transform:rotate(var(--bird-beak,0deg));
    }
    .snow2-bird-crest,
    .snow2-bird-crest::before,
    .snow2-bird-crest::after{
      content:'';position:absolute;width:9px;height:11px;border-radius:50% 50% 0 50%;
      background:#f26f3d;transform-origin:bottom center;
    }
    .snow2-bird-crest{left:20px;top:-3px;transform:rotate(-18deg)}
    .snow2-bird-crest::before{left:5px;top:0;transform:rotate(18deg)}
    .snow2-bird-crest::after{left:10px;top:3px;transform:rotate(38deg)}
    .snow2-bird-leg{
      position:absolute;top:61px;width:3px;height:18px;background:#6d5237;border-radius:99px;
    }
    .snow2-bird-leg.l1{left:49px}
    .snow2-bird-leg.l2{left:63px}
    .snow2-bird-leg::after{
      content:'';position:absolute;left:-4px;bottom:-1px;width:12px;height:3px;border-radius:99px;background:#6d5237;
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let finishedAt = null;
  let activeScene = null;
  let raf = 0;

  function parseRemaining(){
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(v => !Number.isFinite(v))) return null;
    if (parts.length === 2) return parts[0]*60 + parts[1];
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60 + (Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current = parseRemaining();
    if (current === null) return 0;
    const status = stageStatus?.textContent.trim() || '';
    const running = status === 'Running';
    if (displayedRemaining === null || current !== displayedRemaining || status !== lastStatus){
      displayedRemaining = current;
      displayChangedAt = now;
      lastStatus = status;
    }
    let estimated = current;
    if (running && current > 0) estimated = Math.max(0,current - (now-displayChangedAt)/1000);
    return clamp(1 - estimated/totalSeconds(),0,1);
  }

  function setBall(el,x,y,sx,sy){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) scale(${sx},${sy})`;
  }

  function setAccessory(el,x,y,rotation,scale=1){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
  }

  function ensureBird(figure){
    let bird = figure.querySelector('.snow2-bird');
    if (bird) return bird;
    bird = document.createElement('div');
    bird.className = 'snow2-bird';
    bird.innerHTML = `
      <div class="snow2-bird-body"></div>
      <div class="snow2-bird-belly"></div>
      <div class="snow2-bird-wing"></div>
      <div class="snow2-bird-head">
        <div class="snow2-bird-eye"></div>
        <div class="snow2-bird-beak"></div>
        <div class="snow2-bird-crest"></div>
      </div>
      <div class="snow2-bird-leg l1"></div>
      <div class="snow2-bird-leg l2"></div>
    `;
    figure.appendChild(bird);
    return bird;
  }

  function render(scene,p,now,remaining){
    const figure = scene.querySelector('.snow2-figure');
    if(!figure) return;

    const bottom = figure.querySelector('.snow2-bottom');
    const middle = figure.querySelector('.snow2-middle');
    const head = figure.querySelector('.snow2-head');
    const leftArm = figure.querySelector('.snow2-arm-left');
    const rightArm = figure.querySelector('.snow2-arm-right');
    const leftEye = figure.querySelector('.snow2-eye-left');
    const rightEye = figure.querySelector('.snow2-eye-right');
    const nose = figure.querySelector('.snow2-nose');
    const hat = figure.querySelector('.snow2-hat');
    const puddle = figure.querySelector('.snow2-puddle');
    const bird = ensureBird(figure);

    // Ready state: centred and overlapping slightly, like real packed snowballs.
    const bottomStart = {x:220,y:366};
    const middleStart = {x:220,y:216};
    const headStart = {x:220,y:100};

    // Separation begins once progress starts and increases gradually.
    const separate = ease(clamp(p/.85,0,1));

    const bSX = lerp(1,.86,p), bSY = lerp(1,.34,p);
    const mSX = lerp(1,.68,p), mSY = lerp(1,.25,p);
    const hSX = lerp(1,.58,p), hSY = lerp(1,.22,p);

    const bottomTarget = {x:225,y:437-90*bSY};
    const middleTarget = {x:145,y:437-72.5*mSY};
    const headTarget = {x:292,y:437-56*hSY};

    const bx = lerp(bottomStart.x,bottomTarget.x,separate);
    const by = lerp(bottomStart.y,bottomTarget.y,separate);
    const mx = lerp(middleStart.x,middleTarget.x,separate);
    const my = lerp(middleStart.y,middleTarget.y,separate);
    const hx = lerp(headStart.x,headTarget.x,separate);
    const hy = lerp(headStart.y,headTarget.y,separate);

    setBall(bottom,bx,by,bSX,bSY);
    setBall(middle,mx,my,mSX,mSY);
    setBall(head,hx,hy,hSX,hSY);

    const midDX = mx-middleStart.x, midDY = my-middleStart.y;
    const headDX = hx-headStart.x, headDY = hy-headStart.y;

    const armDrop = ease(clamp((p-.75)/.10,0,1));
    const leftArmFollow = {x:146+midDX,y:212+midDY};
    const rightArmFollow = {x:294+midDX,y:212+midDY};
    if(leftArm){
      leftArm.style.left=`${lerp(leftArmFollow.x,72,armDrop)}px`;
      leftArm.style.top=`${lerp(leftArmFollow.y,424,armDrop)}px`;
      leftArm.style.transform=`rotate(${lerp(202,338,armDrop)}deg)`;
    }
    if(rightArm){
      rightArm.style.left=`${lerp(rightArmFollow.x,310,armDrop)}px`;
      rightArm.style.top=`${lerp(rightArmFollow.y,425,armDrop)}px`;
      rightArm.style.transform=`rotate(${lerp(-22,26,armDrop)}deg)`;
    }

    const faceDrop = ease(clamp((p-.82)/.10,0,1));
    const e1Follow = {x:201+headDX,y:96+headDY};
    const e2Follow = {x:239+headDX,y:96+headDY};
    const noseFollow = {x:223+headDX,y:108+headDY};
    setAccessory(leftEye,lerp(e1Follow.x,205,faceDrop),lerp(e1Follow.y,430,faceDrop),lerp(0,-125,faceDrop),1);
    setAccessory(rightEye,lerp(e2Follow.x,255,faceDrop),lerp(e2Follow.y,431,faceDrop),lerp(0,118,faceDrop),1);
    if(nose){
      nose.style.left=`${lerp(noseFollow.x,286,faceDrop)}px`;
      nose.style.top=`${lerp(noseFollow.y,423,faceDrop)}px`;
      nose.style.transform=`translate(0,-50%) rotate(${lerp(0,103,faceDrop)}deg)`;
    }

    const hatDrop = ease(clamp((p-.88)/.12,0,1));
    const hatFollow = {x:220+headDX,y:42+headDY};
    if(hat){
      hat.style.left=`${lerp(hatFollow.x,325,hatDrop)}px`;
      hat.style.top=`${lerp(hatFollow.y,375,hatDrop)}px`;
      hat.style.transform=`translate(-50%,-50%) rotate(${lerp(0,78,hatDrop)}deg)`;
    }

    if (puddle) {
      puddle.style.width = `${80 + 255*p}px`;
      puddle.style.height = `${14 + 35*p}px`;
      puddle.style.opacity = String(.3 + .7*p);
    }

    // Bird only arrives once the timer is actually finished, then repeatedly dips its head to drink.
    if (remaining === 0) {
      if (finishedAt === null) finishedAt = now;
      const elapsed = now - finishedAt;
      const enter = ease(clamp(elapsed/1050,0,1));
      bird.style.left = `${lerp(470,305,enter)}px`;
      bird.style.top = `${lerp(418,426,enter)}px`;
      bird.style.opacity = String(enter);
      bird.style.transform = `translate(-50%,-50%) scale(${.82 + .18*enter})`;
      const drinkPhase = Math.max(0,elapsed-1100);
      const sip = drinkPhase > 0 ? (Math.sin(drinkPhase/145)+1)/2 : 0;
      bird.style.setProperty('--bird-peck', `${(-8 - sip*31).toFixed(2)}deg`);
      bird.style.setProperty('--bird-beak', `${(3 + sip*8).toFixed(2)}deg`);
    } else {
      finishedAt = null;
      bird.style.opacity = '0';
      bird.style.left = '470px';
      bird.style.top = '418px';
      bird.style.setProperty('--bird-peck','0deg');
      bird.style.setProperty('--bird-beak','0deg');
    }
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-snowman.snowman-upgraded');
    if(scene !== activeScene){
      activeScene = scene || null;
      finishedAt = null;
      displayedRemaining = null;
    }
    if(scene){
      const remaining = parseRemaining();
      render(scene,progressNow(now),now,remaining);
    }
    raf = requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();
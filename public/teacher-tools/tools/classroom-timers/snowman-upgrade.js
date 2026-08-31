(() => {
  'use strict';

  if (document.getElementById('snowmanUpgradeStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !stage || !display) return;

  const style = document.createElement('style');
  style.id = 'snowmanUpgradeStyleV1';
  style.textContent = `
    .xt-snowman.snowman-upgraded{
      background:linear-gradient(#87cae9 0 69%,#e8f6fc 69% 72%,#f8fcff 72%)!important;
    }
    .snow2-hills{
      position:absolute;left:-6%;right:-6%;bottom:-8%;height:31%;border-radius:50% 50% 0 0;
      background:#f8fcff;box-shadow:0 -28px 0 -12px rgba(220,239,249,.78);
    }
    .snow2-shadow{
      position:absolute;left:72%;bottom:4.5%;width:390px;height:42px;transform:translateX(-50%);
      border-radius:50%;background:rgba(87,129,148,.12);filter:blur(4px);
    }
    .snow2-figure{
      position:absolute;right:4%;bottom:3%;width:430px;height:470px;
      transform-origin:bottom right;overflow:visible;
    }
    .snow2-ball{
      position:absolute;border-radius:50%;transform:translate(-50%,-50%);
      background:radial-gradient(circle at 32% 24%,#fff 0 20%,#f6fbfd 42%,#e3f1f7 68%,#c7dce6 100%);
      box-shadow:inset -15px -13px 22px rgba(91,133,151,.14),0 9px 13px rgba(57,91,106,.14);
      will-change:left,top,transform,opacity;
    }
    .snow2-bottom{width:210px;height:180px;z-index:2}
    .snow2-middle{width:165px;height:145px;z-index:3}
    .snow2-head{width:118px;height:112px;z-index:4}

    .snow2-arm{
      position:absolute;width:112px;height:7px;border-radius:99px;background:#704c32;
      box-shadow:0 2px 2px rgba(0,0,0,.13);transform-origin:8px 50%;z-index:1;
      will-change:left,top,transform;
    }
    .snow2-eye{
      position:absolute;width:10px;height:10px;border-radius:50%;background:#273239;
      box-shadow:0 1px 1px rgba(0,0,0,.2);transform:translate(-50%,-50%);z-index:7;
      will-change:left,top,transform;
    }
    .snow2-nose{
      position:absolute;width:65px;height:17px;background:#f47b2c;
      clip-path:polygon(0 12%,100% 50%,0 88%);transform-origin:7px 50%;z-index:7;
      filter:drop-shadow(0 1px 1px rgba(0,0,0,.1));will-change:left,top,transform;
    }
    .snow2-hat{
      position:absolute;width:132px;height:82px;z-index:8;transform-origin:52% 82%;will-change:left,top,transform;
    }
    .snow2-hat::before{
      content:'';position:absolute;left:29px;top:0;width:78px;height:63px;border-radius:8px 8px 3px 3px;
      background:linear-gradient(90deg,#202d36,#2d3941 52%,#17242c);
      box-shadow:inset -8px 0 9px rgba(0,0,0,.12);
    }
    .snow2-hat::after{
      content:'';position:absolute;left:0;bottom:5px;width:132px;height:18px;border-radius:50%;background:#1d2931;
      box-shadow:0 3px 3px rgba(0,0,0,.13);
    }
    .snow2-puddle{
      position:absolute;left:52%;bottom:4px;width:80px;height:14px;transform:translateX(-50%);
      border-radius:50%;background:rgba(151,211,237,.72);box-shadow:inset 0 3px 8px rgba(255,255,255,.72);
      z-index:1;will-change:width,height,opacity;
    }
    .snow2-ground-piece{filter:drop-shadow(0 2px 1px rgba(0,0,0,.1))}

    @media(max-width:760px){
      .snow2-figure{right:-5%;bottom:2%;transform:scale(.72);transform-origin:bottom right}
      .snow2-shadow{left:75%;width:280px}
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);

  let upgradedScene = null;
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
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

  function buildSnowman(scene){
    if (!scene || scene.dataset.snowmanUpgrade === 'true') return;
    scene.dataset.snowmanUpgrade = 'true';
    scene.classList.add('snowman-upgraded');
    scene.innerHTML = `
      <div class="snow2-hills"></div>
      <div class="snow2-shadow"></div>
      <div class="snow2-figure">
        <div class="snow2-puddle"></div>
        <div class="snow2-ball snow2-bottom"></div>
        <div class="snow2-ball snow2-middle"></div>
        <div class="snow2-ball snow2-head"></div>
        <div class="snow2-arm snow2-arm-left"></div>
        <div class="snow2-arm snow2-arm-right"></div>
        <div class="snow2-eye snow2-eye-left"></div>
        <div class="snow2-eye snow2-eye-right"></div>
        <div class="snow2-nose"></div>
        <div class="snow2-hat"></div>
      </div>`;
    upgradedScene = scene;
    displayedRemaining = parseRemaining();
    displayChangedAt = performance.now();
    lastStatus = stageStatus?.textContent.trim() || '';
  }

  function setBall(el,x,y,sx,sy,opacity=1){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) scale(${sx},${sy})`;
    el.style.opacity = String(opacity);
  }

  function setAccessory(el,x,y,rotation,scale=1){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
  }

  function render(scene,p){
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

    // Three tangent snowballs, deliberately offset like the supplied reference.
    const bottomStart = {x:220,y:364};
    const middleStart = {x:165,y:212};
    const headStart = {x:235,y:100};

    // Each section melts and settles independently rather than shrinking as one object.
    const bSX = lerp(1,.86,p), bSY = lerp(1,.34,p);
    const mSX = lerp(1,.68,p), mSY = lerp(1,.25,p);
    const hSX = lerp(1,.58,p), hSY = lerp(1,.22,p);
    const bx = lerp(bottomStart.x,225,p), by = lerp(bottomStart.y,437-90*bSY,p);
    const mx = lerp(middleStart.x,145,p), my = lerp(middleStart.y,437-72.5*mSY,p);
    const hx = lerp(headStart.x,292,p), hy = lerp(headStart.y,437-56*hSY,p);

    setBall(bottom,bx,by,bSX,bSY,1);
    setBall(middle,mx,my,mSX,mSY,1);
    setBall(head,hx,hy,hSX,hSY,1);

    if(puddle){
      puddle.style.width = `${80 + 255*p}px`;
      puddle.style.height = `${14 + 35*p}px`;
      puddle.style.opacity = String(.3 + .7*p);
    }

    // Accessories follow their section until their individual drop begins.
    const midDX = mx-middleStart.x, midDY = my-middleStart.y;
    const headDX = hx-headStart.x, headDY = hy-headStart.y;

    const armDrop = ease(clamp((p-.75)/.10,0,1));
    const leftArmFollow = {x:95+midDX,y:208+midDY};
    const rightArmFollow = {x:222+midDX,y:208+midDY};
    const lAx = lerp(leftArmFollow.x,72,armDrop), lAy = lerp(leftArmFollow.y,424,armDrop);
    const rAx = lerp(rightArmFollow.x,310,armDrop), rAy = lerp(rightArmFollow.y,425,armDrop);
    if(leftArm){leftArm.style.left=`${lAx}px`;leftArm.style.top=`${lAy}px`;leftArm.style.transform=`rotate(${lerp(202,338,armDrop)}deg)`;}
    if(rightArm){rightArm.style.left=`${rAx}px`;rightArm.style.top=`${rAy}px`;rightArm.style.transform=`rotate(${lerp(-22,26,armDrop)}deg)`;}

    const faceDrop = ease(clamp((p-.82)/.10,0,1));
    const e1Follow = {x:216+headDX,y:96+headDY};
    const e2Follow = {x:254+headDX,y:96+headDY};
    const noseFollow = {x:239+headDX,y:108+headDY};
    setAccessory(leftEye,lerp(e1Follow.x,205,faceDrop),lerp(e1Follow.y,430,faceDrop),lerp(0,-125,faceDrop),1);
    setAccessory(rightEye,lerp(e2Follow.x,255,faceDrop),lerp(e2Follow.y,431,faceDrop),lerp(0,118,faceDrop),1);
    if(nose){
      nose.style.left=`${lerp(noseFollow.x,286,faceDrop)}px`;
      nose.style.top=`${lerp(noseFollow.y,423,faceDrop)}px`;
      nose.style.transform=`translate(0,-50%) rotate(${lerp(0,103,faceDrop)}deg)`;
    }

    const hatDrop = ease(clamp((p-.88)/.12,0,1));
    // Hat is aligned to the head centre before it falls.
    const hatFollow = {x:235+headDX,y:42+headDY};
    if(hat){
      hat.style.left=`${lerp(hatFollow.x,325,hatDrop)}px`;
      hat.style.top=`${lerp(hatFollow.y,375,hatDrop)}px`;
      hat.style.transform=`translate(-50%,-50%) rotate(${lerp(0,78,hatDrop)}deg)`;
    }

    [leftArm,rightArm,leftEye,rightEye,nose,hat].forEach(el=>el?.classList.toggle('snow2-ground-piece',p>.76));
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-snowman');
    if(scene && scene.dataset.snowmanUpgrade !== 'true') buildSnowman(scene);
    if(scene){
      upgradedScene = scene;
      render(scene,progressNow(now));
    }else{
      upgradedScene = null;
      displayedRemaining = null;
    }
    raf = requestAnimationFrame(loop);
  }

  const observer = new MutationObserver(()=>{
    const scene = sceneLayer.querySelector('.xt-snowman');
    if(scene && scene.dataset.snowmanUpgrade !== 'true') queueMicrotask(()=>buildSnowman(scene));
  });
  observer.observe(sceneLayer,{childList:true,subtree:true});

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();

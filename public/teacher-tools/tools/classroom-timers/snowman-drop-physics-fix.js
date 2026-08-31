(() => {
  'use strict';

  if (document.getElementById('snowmanDropPhysicsStyleV2')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'snowmanDropPhysicsStyleV2';
  style.textContent = `
    .xt-snowman .snow2-arm-left,
    .xt-snowman .snow2-arm-right,
    .xt-snowman .snow2-eye,
    .xt-snowman .snow2-nose,
    .xt-snowman .snow2-hat {
      will-change:left,top,transform;
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const smooth = t => t*t*(3-2*t);

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastScene = null;
  let dropState = null;
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

  function position(el,x,y,angle=0,scale=1){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) rotate(${angle}deg) scale(${scale})`;
  }

  function positionNose(el,x,y,angle=-8){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(0,-50%) rotate(${angle}deg)`;
  }

  function positionArm(el,x,y,angle){
    if(!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `rotate(${angle}deg)`;
  }

  function makeState(){
    return {
      leftArmOrigin:null,
      rightArmOrigin:null,
      eye1Origin:null,
      eye2Origin:null,
      noseOrigin:null,
      hatOrigin:null
    };
  }

  function render(scene,p){
    const figure = scene.querySelector('.snow2-figure');
    if(!figure) return;

    const middle = figure.querySelector('.snow2-middle');
    const head = figure.querySelector('.snow2-head');
    const leftArm = figure.querySelector('.snow2-arm-left');
    const rightArm = figure.querySelector('.snow2-arm-right');
    const eye1 = figure.querySelector('.snow2-eye-left');
    const eye2 = figure.querySelector('.snow2-eye-right');
    const nose = figure.querySelector('.snow2-nose');
    const hat = figure.querySelector('.snow2-hat');
    if(!middle || !head || !leftArm || !rightArm || !eye1 || !eye2 || !nose || !hat) return;

    const mx = Number.parseFloat(middle.style.left) || 220;
    const my = Number.parseFloat(middle.style.top) || 216;
    const hx = Number.parseFloat(head.style.left) || 220;
    const hy = Number.parseFloat(head.style.top) || 100;

    const leftArmAttached = {x:146+(mx-220),y:212+(my-216)};
    const rightArmAttached = {x:294+(mx-220),y:212+(my-216)};
    const eye1Attached = {x:hx-19,y:hy-4};
    const eye2Attached = {x:hx+19,y:hy-4};
    const noseAttached = {x:hx+3,y:hy+8};
    const hatAttached = {x:hx,y:hy-76};

    // Own the final hat motion here, including its rotation.
    hat.style.setProperty('translate','0 0','important');
    hat.style.setProperty('rotate','0deg','important');

    // Arms drop much earlier: start at 55% and land by about 65%.
    if (p < .55) {
      dropState.leftArmOrigin = leftArmAttached;
      dropState.rightArmOrigin = rightArmAttached;
      positionArm(leftArm,leftArmAttached.x,leftArmAttached.y,202);
      positionArm(rightArm,rightArmAttached.x,rightArmAttached.y,-22);
    } else {
      const leftOrigin = dropState.leftArmOrigin || leftArmAttached;
      const rightOrigin = dropState.rightArmOrigin || rightArmAttached;
      const fall = clamp((p-.55)/.10,0,1);
      const g = fall*fall;
      const drift = smooth(fall);
      positionArm(leftArm,lerp(leftOrigin.x,72,drift),lerp(leftOrigin.y,424,g),lerp(202,338,drift));
      positionArm(rightArm,lerp(rightOrigin.x,310,drift),lerp(rightOrigin.y,425,g),lerp(-22,26,drift));
    }

    // Face pieces stay attached until the snowman has visibly melted, but no longer wait for the very end.
    if (p < .62) {
      dropState.eye1Origin = eye1Attached;
      dropState.eye2Origin = eye2Attached;
      position(eye1,eye1Attached.x,eye1Attached.y,0);
      position(eye2,eye2Attached.x,eye2Attached.y,0);
    }

    if (p < .64) {
      dropState.noseOrigin = noseAttached;
      positionNose(nose,noseAttached.x,noseAttached.y,-8);
    }

    // Hat remains attached only until 66%. The instant it separates, gravity takes over.
    if (p < .66) {
      dropState.hatOrigin = hatAttached;
      position(hat,hatAttached.x,hatAttached.y,-5);
    }

    // Eyes: fall quickly from 62-70%, then bounce/roll and finish settling by 82%.
    if (p >= .62) {
      const leftOrigin = dropState.eye1Origin || eye1Attached;
      const rightOrigin = dropState.eye2Origin || eye2Attached;
      const fall = clamp((p-.62)/.08,0,1);
      const g = fall*fall;

      const leftFallX = lerp(leftOrigin.x,leftOrigin.x-13,smooth(fall));
      const rightFallX = lerp(rightOrigin.x,rightOrigin.x+13,smooth(fall));
      const leftFallY = lerp(leftOrigin.y,430,g);
      const rightFallY = lerp(rightOrigin.y,430,g);

      if (p < .70) {
        position(eye1,leftFallX,leftFallY,-390*fall);
        position(eye2,rightFallX,rightFallY,390*fall);
      } else {
        const roll = clamp((p-.70)/.12,0,1);
        const r = smooth(roll);
        const bounce = Math.abs(Math.sin(roll*Math.PI*3))*7*(1-roll);
        position(eye1,leftFallX-64*r,430-bounce,-390-760*r);
        position(eye2,rightFallX+58*r,430-bounce,390+720*r);
      }
    }

    // Carrot: starts falling at 64% and is on the ground by roughly 74%.
    if (p >= .64) {
      const origin = dropState.noseOrigin || noseAttached;
      const fall = clamp((p-.64)/.10,0,1);
      const g = fall*fall;
      const x = lerp(origin.x,origin.x+48,smooth(fall));
      const y = lerp(origin.y,423,g);
      const angle = lerp(-8,112,smooth(fall));
      positionNose(nose,x,y,angle);
    }

    // Hat: once detached it falls down immediately instead of floating with the head.
    // It reaches the ground by roughly 76% of the countdown, leaving the final quarter settled.
    if (p >= .66) {
      const origin = dropState.hatOrigin || hatAttached;
      const fall = clamp((p-.66)/.10,0,1);
      const g = fall*fall;
      const drift = smooth(fall);
      const x = lerp(origin.x,origin.x+58,drift);
      const y = lerp(origin.y,357,g);
      const angle = lerp(-5,78,drift);
      position(hat,x,y,angle);
    }
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-snowman.snowman-upgraded');
    if(scene !== lastScene){
      lastScene = scene || null;
      dropState = makeState();
      displayedRemaining = null;
    }

    if(scene){
      const p = progressNow(now);
      if(p < .01 && lastStatus !== 'Running') dropState = makeState();
      render(scene,p);
    }

    raf = requestAnimationFrame(loop);
  }

  dropState = makeState();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();
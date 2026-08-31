(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  const display = document.getElementById('countdownDisplay');
  if (!sceneLayer || !display) return;

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);

  let finishedAt = null;
  let lastScene = null;
  let raf = 0;

  function remainingSeconds(){
    const parts = display.textContent.trim().split(':').map(Number);
    if (parts.some(v => !Number.isFinite(v))) return null;
    if (parts.length === 2) return parts[0]*60 + parts[1];
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

  function loop(now){
    const scene = sceneLayer.querySelector('.xt-snowman.snowman-upgraded');
    if (scene !== lastScene){
      lastScene = scene || null;
      finishedAt = null;
    }

    const bird = scene?.querySelector('.snow2-bird');
    const remaining = remainingSeconds();

    if (bird && remaining === 0){
      if (finishedAt === null) finishedAt = now;
      const elapsed = now - finishedAt;
      const enter = ease(clamp(elapsed/1050,0,1));

      // Enter from the left instead of the right and face toward the puddle.
      bird.style.left = `${lerp(-70,140,enter)}px`;
      bird.style.top = `${lerp(418,426,enter)}px`;
      bird.style.opacity = String(enter);
      bird.style.transform = `translate(-50%,-50%) scaleX(-1) scale(${.82 + .18*enter})`;
    } else if (remaining !== 0) {
      finishedAt = null;
    }

    raf = requestAnimationFrame(loop);
  }

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanDropPhysicsFixScript')) return;

  const physics = document.createElement('script');
  physics.id = 'snowmanDropPhysicsFixScript';
  physics.src = new URL('snowman-drop-physics-fix.js', current.src).href;
  physics.async = false;
  document.body.appendChild(physics);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanBirdFrontFixScript')) return;

  const frontFix = document.createElement('script');
  frontFix.id = 'snowmanBirdFrontFixScript';
  frontFix.src = new URL('snowman-bird-front-fix.js', current.src).href;
  frontFix.async = false;
  document.body.appendChild(frontFix);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanBirdRedrawScript')) return;

  const redraw = document.createElement('script');
  redraw.id = 'snowmanBirdRedrawScript';
  redraw.src = new URL('snowman-bird-redraw.js', current.src).href;
  redraw.async = false;
  document.body.appendChild(redraw);
})();

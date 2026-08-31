(() => {
  'use strict';

  if (document.getElementById('coasterFairgroundStyleV5')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'coasterFairgroundStyleV5';
  style.textContent = `
    .coaster-fairground{
      position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;
    }
    .coaster-fairground:before{
      content:'';position:absolute;left:-3%;right:-3%;bottom:13%;height:6%;
      background:linear-gradient(180deg,rgba(76,135,65,.15),rgba(54,116,48,.38));
      border-radius:50% 50% 0 0;
    }

    .coaster-circus-tent{
      position:absolute;left:7.2%;bottom:25.5%;width:168px;height:126px;
      transform:scale(.58);transform-origin:left bottom;
      opacity:.46;filter:brightness(.72) saturate(.62) contrast(.94) drop-shadow(0 2px 2px rgba(0,0,0,.10));
    }
    .coaster-circus-tent .tent-base{
      position:absolute;left:12px;right:12px;bottom:0;height:62px;
      background:repeating-linear-gradient(90deg,#ded2bd 0 18px,#9f5555 18px 36px);
      clip-path:polygon(5% 100%,14% 0,86% 0,95% 100%);
      border-radius:0 0 8px 8px;
    }
    .coaster-circus-tent .tent-roof{
      position:absolute;left:4px;right:4px;bottom:54px;height:58px;
      background:repeating-linear-gradient(90deg,#d8c59a 0 18px,#934b52 18px 36px);
      clip-path:polygon(50% 0,100% 100%,0 100%);
    }
    .coaster-circus-tent .tent-door{
      position:absolute;left:50%;bottom:0;width:38px;height:42px;transform:translateX(-50%);
      background:#49383a;border-radius:50% 50% 0 0;
    }
    .coaster-circus-tent .tent-pole{
      position:absolute;left:50%;bottom:106px;width:4px;height:23px;transform:translateX(-50%);background:#665740;
    }
    .coaster-circus-tent .tent-flag{
      position:absolute;left:50%;bottom:119px;width:27px;height:14px;transform:translateX(2px);
      background:#aa9c62;clip-path:polygon(0 0,100% 50%,0 100%);
    }

    .coaster-ferris{
      position:absolute;right:7%;bottom:14%;width:152px;height:152px;opacity:.7;
      filter:drop-shadow(0 4px 4px rgba(0,0,0,.13));
    }
    .coaster-ferris .wheel{
      position:absolute;inset:0;border:7px solid rgba(111,75,45,.84);border-radius:50%;box-sizing:border-box;
      animation:coasterFerrisSpin 24s linear infinite;
    }
    .coaster-ferris .wheel:before,.coaster-ferris .wheel:after{
      content:'';position:absolute;left:50%;top:50%;background:rgba(111,75,45,.64);transform:translate(-50%,-50%);
    }
    .coaster-ferris .wheel:before{width:5px;height:100%}
    .coaster-ferris .wheel:after{width:100%;height:5px}
    .coaster-ferris .diag{position:absolute;left:50%;top:50%;width:5px;height:100%;background:rgba(111,75,45,.54);transform-origin:center center}
    .coaster-ferris .diag.d1{transform:translate(-50%,-50%) rotate(45deg)}
    .coaster-ferris .diag.d2{transform:translate(-50%,-50%) rotate(-45deg)}
    .coaster-ferris .hub{position:absolute;left:50%;top:50%;width:18px;height:18px;border-radius:50%;transform:translate(-50%,-50%);background:#87603b;z-index:2}
    .coaster-ferris .stand{position:absolute;left:50%;bottom:-18px;width:82px;height:82px;transform:translateX(-50%)}
    .coaster-ferris .stand:before,.coaster-ferris .stand:after{content:'';position:absolute;bottom:0;width:7px;height:88px;background:#775233;transform-origin:bottom center}
    .coaster-ferris .stand:before{left:18px;transform:rotate(21deg)}
    .coaster-ferris .stand:after{right:18px;transform:rotate(-21deg)}
    @keyframes coasterFerrisSpin{to{transform:rotate(360deg)}}

    .coaster-carousel{
      position:absolute;right:27%;bottom:13%;width:102px;height:90px;opacity:.72;
      filter:drop-shadow(0 4px 4px rgba(0,0,0,.13));
    }
    .coaster-carousel .roof{
      position:absolute;left:3px;right:3px;top:0;height:35px;
      background:repeating-linear-gradient(90deg,#ffd45b 0 15px,#e95e48 15px 30px);
      clip-path:polygon(50% 0,100% 100%,0 100%);
    }
    .coaster-carousel .topbar{position:absolute;left:15px;right:15px;top:31px;height:7px;background:#8e5f3c;border-radius:6px}
    .coaster-carousel .pole{position:absolute;left:50%;top:31px;bottom:13px;width:4px;transform:translateX(-50%);background:#7b5636}
    .coaster-carousel .horse{position:absolute;bottom:18px;font-size:22px;animation:coasterHorseBob 1.6s ease-in-out infinite alternate}
    .coaster-carousel .horse.h1{left:15px}
    .coaster-carousel .horse.h2{right:14px;animation-delay:-.8s}
    .coaster-carousel .deck{position:absolute;left:5px;right:5px;bottom:0;height:14px;border-radius:12px;background:#b37846}
    @keyframes coasterHorseBob{from{transform:translateY(2px)}to{transform:translateY(-8px)}}

    .coaster-swing-ride{
      position:absolute;left:27%;bottom:14%;width:90px;height:110px;opacity:.62;
    }
    .coaster-swing-ride .mast{position:absolute;left:50%;bottom:0;width:6px;height:78px;transform:translateX(-50%);background:#73513b}
    .coaster-swing-ride .canopy{position:absolute;left:14px;right:14px;top:14px;height:29px;border-radius:50% 50% 30% 30%;background:repeating-linear-gradient(90deg,#ef6e55 0 11px,#ffd359 11px 22px)}
    .coaster-swing-ride .chain{position:absolute;top:39px;width:2px;height:42px;background:#60483b;transform-origin:top center;animation:coasterSwing 2.2s ease-in-out infinite alternate}
    .coaster-swing-ride .chain:after{content:'';position:absolute;left:-7px;bottom:-6px;width:16px;height:9px;border-radius:3px;background:#3e78a7}
    .coaster-swing-ride .chain.c1{left:24px}
    .coaster-swing-ride .chain.c2{right:24px;animation-delay:-1.1s}
    @keyframes coasterSwing{from{transform:rotate(-13deg)}to{transform:rotate(13deg)}}

    .coaster-effects-canvas{
      position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;
    }

    @media(max-width:760px){
      .coaster-circus-tent{left:4%;bottom:24.5%;width:122px;height:94px;transform:scale(.64);transform-origin:left bottom}
      .coaster-circus-tent .tent-base{height:47px}
      .coaster-circus-tent .tent-roof{bottom:40px;height:44px}
      .coaster-circus-tent .tent-pole{bottom:78px}
      .coaster-circus-tent .tent-flag{bottom:91px}
      .coaster-ferris{right:4%;bottom:14%;width:112px;height:112px}
      .coaster-carousel{right:24%;bottom:13%;width:76px;height:70px}
      .coaster-carousel .horse{font-size:17px}
      .coaster-swing-ride{left:28%;bottom:14%;transform:scale(.78);transform-origin:bottom left}
    }
  `;
  document.head.appendChild(style);

  let currentScene = null;
  let canvas = null;
  let ctx = null;
  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;
  let raf = 0;
  let lastFrame = performance.now();
  let nextBurstAt = lastFrame + 1500;
  const birds = [];
  const fireworks = [];
  const queuedBursts = [];

  const palettes = [
    ['#fff2a8','#ffbe36'],
    ['#ffd2eb','#ff5793'],
    ['#d6f7ff','#4fc5ff'],
    ['#e9dbff','#9568ff'],
    ['#dffff0','#64d66d']
  ];

  function fairgroundMarkup() {
    return `
      <div class="coaster-fairground" aria-hidden="true">
        <div class="coaster-circus-tent">
          <div class="tent-base"></div><div class="tent-roof"></div><div class="tent-door"></div><div class="tent-pole"></div><div class="tent-flag"></div>
        </div>
        <div class="coaster-swing-ride"><div class="mast"></div><div class="canopy"></div><i class="chain c1"></i><i class="chain c2"></i></div>
        <div class="coaster-carousel"><div class="roof"></div><div class="topbar"></div><div class="pole"></div><span class="horse h1">🎠</span><span class="horse h2">🎠</span><div class="deck"></div></div>
        <div class="coaster-ferris"><div class="wheel"></div><div class="diag d1"></div><div class="diag d2"></div><div class="hub"></div><div class="stand"></div></div>
      </div>`;
  }

  function seedBirds() {
    birds.length = 0;
    const seeds = [
      [0.22,0.14,.042,.78,0.6],
      [0.69,0.22,.035,.62,3.8]
    ];
    seeds.forEach(([x,y,speed,scale,phase]) => birds.push({ x,y,speed,scale,phase }));
  }

  function resizeCanvas() {
    if (!canvas || !currentScene) return;
    const rect = currentScene.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);
    if (Math.abs(width - cssWidth) < .5 && Math.abs(height - cssHeight) < .5 && nextDpr === dpr) return;

    cssWidth = width;
    cssHeight = height;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function attachFairground(scene) {
    if (!scene) return;

    if (!scene.querySelector('.coaster-fairground')) {
      scene.insertAdjacentHTML('afterbegin', fairgroundMarkup());
    }

    let effectsCanvas = scene.querySelector('.coaster-effects-canvas');
    if (!effectsCanvas) {
      effectsCanvas = document.createElement('canvas');
      effectsCanvas.className = 'coaster-effects-canvas';
      effectsCanvas.setAttribute('aria-hidden','true');
      scene.appendChild(effectsCanvas);
    }

    currentScene = scene;
    canvas = effectsCanvas;
    ctx = canvas.getContext('2d');
    cssWidth = 0;
    cssHeight = 0;
    seedBirds();
    fireworks.length = 0;
    queuedBursts.length = 0;
    nextBurstAt = performance.now() + 1400;
    resizeCanvas();
  }

  function resetBird(bird) {
    bird.x = -.06 - Math.random() * .12;
    bird.y = .08 + Math.random() * .22;
    bird.speed = .032 + Math.random() * .022;
    bird.scale = .55 + Math.random() * .35;
    bird.phase = Math.random() * Math.PI * 2;
  }

  function drawBird(bird, now) {
    const x = bird.x * cssWidth;
    const y = bird.y * cssHeight + Math.sin(now * .0013 + bird.phase) * 4;
    const size = 14 * bird.scale;
    const flap = Math.sin(now * .009 + bird.phase);
    const lift = 4 + flap * 4.5;

    ctx.save();
    ctx.translate(x,y);
    ctx.strokeStyle = 'rgba(42,58,68,.72)';
    ctx.lineWidth = Math.max(1.4, 2.2 * bird.scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(-size * .45,-lift,-size,1.5);
    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(size * .45,-lift,size,1.5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(42,58,68,.7)';
    ctx.beginPath();
    ctx.arc(0,0,Math.max(1.1,1.6 * bird.scale),0,Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnFirework(xNorm, yNorm, scale = 1) {
    if (!cssWidth || !cssHeight) return;
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const count = 28;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) + (Math.random() - .5) * .12;
      const speed = (48 + Math.random() * 52) * scale;
      particles.push({ angle, speed, radius:1.5 + Math.random() * 1.6 });
    }
    fireworks.push({
      x:xNorm * cssWidth,
      y:yNorm * cssHeight,
      born:performance.now(),
      duration:3000,
      scale,
      palette,
      particles
    });
  }

  function scheduleBurst(now) {
    const x = .34 + Math.random() * .48;
    const y = .12 + Math.random() * .22;
    spawnFirework(x,y,1 + Math.random() * .28);

    if (Math.random() < .72) {
      queuedBursts.push({
        at:now + 650 + Math.random() * 450,
        x:Math.max(.18,Math.min(.88,x + (Math.random() < .5 ? -1 : 1) * (.11 + Math.random() * .17))),
        y:.11 + Math.random() * .24,
        scale:.9 + Math.random() * .22
      });
    }
    if (Math.random() < .34) {
      queuedBursts.push({
        at:now + 1350 + Math.random() * 500,
        x:.27 + Math.random() * .56,
        y:.10 + Math.random() * .23,
        scale:.86 + Math.random() * .2
      });
    }
    nextBurstAt = now + 5600 + Math.random() * 3600;
  }

  function drawFirework(firework, now) {
    const age = now - firework.born;
    const t = Math.max(0, Math.min(1, age / firework.duration));
    const seconds = age / 1000;
    const fade = t < .62 ? 1 : Math.max(0,1 - (t - .62) / .38);
    const [core, edge] = firework.palette;

    if (age < 420) {
      const flash = Math.sin(Math.min(1, age / 420) * Math.PI);
      ctx.save();
      ctx.globalAlpha = .75 * flash;
      ctx.fillStyle = core;
      ctx.shadowColor = edge;
      ctx.shadowBlur = 22 * firework.scale;
      ctx.beginPath();
      ctx.arc(firework.x,firework.y,5 + 7 * flash * firework.scale,0,Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const particle of firework.particles) {
      const distance = particle.speed * seconds * (1 - .12 * t);
      const gravity = 24 * seconds * seconds;
      const dx = Math.cos(particle.angle) * distance;
      const dy = Math.sin(particle.angle) * distance + gravity;
      const px = firework.x + dx;
      const py = firework.y + dy;
      const tail = 8 + 14 * (1 - t);
      const mag = Math.max(1,Math.hypot(dx,dy));
      const tx = px - dx / mag * tail;
      const ty = py - dy / mag * tail;

      ctx.save();
      ctx.globalAlpha = fade * .92;
      ctx.strokeStyle = edge;
      ctx.fillStyle = core;
      ctx.shadowColor = edge;
      ctx.shadowBlur = 7 * (1 - t);
      ctx.lineWidth = Math.max(1.1,2.1 * (1 - t * .45));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx,ty);
      ctx.lineTo(px,py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px,py,particle.radius * (1 - t * .35),0,Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function render(now) {
    const scene = sceneLayer.querySelector('.coaster-scene');
    if (!scene) {
      currentScene = null;
      canvas = null;
      ctx = null;
      lastFrame = now;
      raf = requestAnimationFrame(render);
      return;
    }

    if (scene !== currentScene || !scene.querySelector('.coaster-effects-canvas')) {
      attachFairground(scene);
    }

    resizeCanvas();
    if (!ctx || !cssWidth || !cssHeight) {
      raf = requestAnimationFrame(render);
      return;
    }

    const dt = Math.min(.05,Math.max(0,(now - lastFrame) / 1000));
    lastFrame = now;
    ctx.clearRect(0,0,cssWidth,cssHeight);

    for (const bird of birds) {
      bird.x += bird.speed * dt;
      if (bird.x > 1.08) resetBird(bird);
      drawBird(bird,now);
    }

    while (queuedBursts.length && queuedBursts[0].at <= now) {
      const burst = queuedBursts.shift();
      spawnFirework(burst.x,burst.y,burst.scale);
    }
    if (now >= nextBurstAt) scheduleBurst(now);

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const firework = fireworks[i];
      if (now - firework.born > firework.duration) {
        fireworks.splice(i,1);
        continue;
      }
      drawFirework(firework,now);
    }

    raf = requestAnimationFrame(render);
  }

  const observer = new MutationObserver(() => {
    const scene = sceneLayer.querySelector('.coaster-scene');
    if (scene && (scene !== currentScene || !scene.querySelector('.coaster-effects-canvas'))) attachFairground(scene);
  });
  observer.observe(sceneLayer,{childList:true,subtree:true});
  window.addEventListener('resize',resizeCanvas);

  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(render);
})();
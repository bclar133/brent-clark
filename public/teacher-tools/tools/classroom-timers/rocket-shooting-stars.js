(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'rocketShootingStarsV1';
  style.textContent = `
    .rocket-shooting-layer {
      position:absolute;
      inset:0;
      z-index:3;
      overflow:hidden;
      pointer-events:none;
    }

    .rocket-shooting-star {
      position:absolute;
      width:var(--shoot-length,120px);
      height:2px;
      border-radius:999px;
      transform-origin:0 50%;
      transform:rotate(var(--shoot-angle,0deg));
      opacity:0;
      background:linear-gradient(90deg,
        rgba(255,255,255,.88) 0 2%,
        rgba(213,232,255,.48) 14%,
        rgba(181,211,245,.20) 48%,
        rgba(181,211,245,0) 100%);
      filter:drop-shadow(0 0 3px rgba(220,237,255,.26));
      animation:rocketShootingStar var(--shoot-duration,1.1s) ease-out forwards;
      will-change:transform,opacity;
    }

    .rocket-shooting-star::before {
      content:'';
      position:absolute;
      left:-1px;
      top:50%;
      width:4px;
      height:4px;
      transform:translateY(-50%);
      border-radius:50%;
      background:rgba(255,255,255,.92);
      box-shadow:0 0 6px rgba(226,240,255,.58);
    }

    @keyframes rocketShootingStar {
      0% {
        opacity:0;
        transform:rotate(var(--shoot-angle,0deg)) translateX(0);
      }
      12% { opacity:.66; }
      68% { opacity:.42; }
      100% {
        opacity:0;
        transform:rotate(var(--shoot-angle,0deg)) translateX(var(--shoot-distance,200px));
      }
    }

    @media (prefers-reduced-motion:reduce) {
      .rocket-shooting-star {
        animation-duration:.9s !important;
      }
    }
  `;
  document.head.appendChild(style);

  let active = null;

  function randomDelay() {
    return 10000 + Math.random() * 10000;
  }

  function buildLayer(scene) {
    const layer = document.createElement('div');
    layer.className = 'rocket-shooting-layer';
    layer.setAttribute('aria-hidden','true');
    scene.appendChild(layer);
    return layer;
  }

  function spawnShootingStar(instance) {
    if (!instance?.scene?.isConnected || !instance.layer?.isConnected) return;

    const rect = instance.scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const star = document.createElement('i');
    star.className = 'rocket-shooting-star';

    const startX = 6 + Math.random() * 82;
    const startY = 7 + Math.random() * 72;

    // Random direction, while avoiding almost-stationary-looking near-vertical streaks.
    let angleDeg;
    do {
      angleDeg = -165 + Math.random() * 330;
    } while (Math.abs(Math.cos(angleDeg * Math.PI / 180)) < .26);

    const distance = Math.min(rect.width * (.22 + Math.random() * .18), 330);
    const length = 78 + Math.random() * 74;
    const duration = .85 + Math.random() * .55;

    star.style.left = `${startX.toFixed(2)}%`;
    star.style.top = `${startY.toFixed(2)}%`;
    star.style.setProperty('--shoot-angle', `${angleDeg.toFixed(1)}deg`);
    star.style.setProperty('--shoot-distance', `${distance.toFixed(1)}px`);
    star.style.setProperty('--shoot-length', `${length.toFixed(1)}px`);
    star.style.setProperty('--shoot-duration', `${duration.toFixed(2)}s`);

    instance.layer.appendChild(star);
    star.addEventListener('animationend', () => star.remove(), { once:true });
    setTimeout(() => star.remove(), 1800);
  }

  function scheduleNext(instance) {
    clearTimeout(instance.timer);
    instance.timer = setTimeout(() => {
      if (!instance.scene.isConnected) return;
      spawnShootingStar(instance);
      scheduleNext(instance);
    }, randomDelay());
  }

  function install(scene) {
    if (!scene || scene.dataset.shootingStars === 'true') return;
    scene.dataset.shootingStars = 'true';
    const layer = buildLayer(scene);
    const instance = { scene, layer, timer:null };
    active = instance;
    scheduleNext(instance);
  }

  function scan() {
    const scene = sceneLayer.querySelector('.rocket-scene.rocket-flight-active');
    if (scene) {
      install(scene);
      return;
    }

    if (active && !active.scene.isConnected) {
      clearTimeout(active.timer);
      active = null;
    }
  }

  const observer = new MutationObserver(scan);
  observer.observe(sceneLayer, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  scan();
})();

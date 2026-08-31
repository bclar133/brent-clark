(() => {
  'use strict';

  if (window.__dayNightStarsUpgradeV1) return;
  window.__dayNightStarsUpgradeV1 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'dayNightStarsUpgradeStyleV1';
  style.textContent = `
    .sky-stars {
      background:none!important;
      pointer-events:none;
    }

    .sky-stars .random-sky-star {
      position:absolute;
      display:block;
      width:var(--star-size,2px);
      height:var(--star-size,2px);
      border-radius:50%;
      background:rgba(255,255,255,var(--star-brightness,.8));
      box-shadow:0 0 var(--star-glow,3px) rgba(225,239,255,var(--star-glow-alpha,.22));
      transform:translate(-50%,-50%);
      animation:randomStarTwinkle var(--twinkle-speed,5s) ease-in-out infinite;
      animation-delay:var(--twinkle-delay,0s);
    }

    @keyframes randomStarTwinkle {
      0%,100% { opacity:.72; }
      50% { opacity:1; }
    }

    @media (prefers-reduced-motion:reduce) {
      .sky-stars .random-sky-star { animation:none!important; }
    }
  `;
  document.head.appendChild(style);

  function buildStars(stars) {
    if (!stars || stars.dataset.randomStarsReady === 'true') return;
    stars.dataset.randomStarsReady = 'true';
    stars.innerHTML = '';

    const count = 72;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('i');
      star.className = 'random-sky-star';

      // Fully random placement rather than a repeating grid.
      star.style.left = `${(1 + Math.random() * 98).toFixed(2)}%`;
      star.style.top = `${(1 + Math.random() * 80).toFixed(2)}%`;

      // Mostly small stars, with occasional brighter/larger ones.
      const sizeRoll = Math.random();
      const size = sizeRoll > .9 ? 3.2 + Math.random() * 1.5 : sizeRoll > .62 ? 2.1 + Math.random() * 1.1 : 1.1 + Math.random() * 1.1;
      const brightness = .38 + Math.random() * .62;
      const glow = size > 3 ? 6 + Math.random() * 4 : 1.5 + Math.random() * 3;
      const glowAlpha = .10 + brightness * .28;

      star.style.setProperty('--star-size', `${size.toFixed(2)}px`);
      star.style.setProperty('--star-brightness', brightness.toFixed(2));
      star.style.setProperty('--star-glow', `${glow.toFixed(1)}px`);
      star.style.setProperty('--star-glow-alpha', glowAlpha.toFixed(2));
      star.style.setProperty('--twinkle-speed', `${(3.4 + Math.random() * 4.8).toFixed(2)}s`);
      star.style.setProperty('--twinkle-delay', `${(-Math.random() * 6).toFixed(2)}s`);

      stars.appendChild(star);
    }
  }

  function scan() {
    sceneLayer.querySelectorAll('.sky-stars').forEach(buildStars);
  }

  new MutationObserver(scan).observe(sceneLayer, { childList:true, subtree:true });
  scan();
})();

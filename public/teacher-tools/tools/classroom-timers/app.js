(() => {
  'use strict';

  const base = document.createElement('script');
  base.src = new URL('app-base.js?v=2', document.currentScript.src).href;
  base.async = false;

  base.addEventListener('load', () => {
    const fixStyle = document.createElement('style');
    fixStyle.id = 'roadRacerLiveSteeringFix';
    fixStyle.textContent = `
      .race-car {
        transform: translate(-50%, -50%) rotate(var(--car-angle, 0deg)) !important;
        transform-origin: 50% 50% !important;
        rotate: none !important;
        z-index: 6 !important;
      }
      .timer-stage.finished .race-car {
        transform: translate(-50%, -50%) rotate(var(--car-angle, 0deg)) !important;
        rotate: none !important;
      }

      .race-road { z-index: 3; }
      .finish-flag { z-index: 5 !important; }

      .race-scenery {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
      }

      .race-lake {
        position: absolute;
        border-radius: 55% 45% 58% 42% / 48% 60% 40% 52%;
        background:
          radial-gradient(ellipse at 30% 28%, rgba(255,255,255,.28) 0 7%, transparent 8%),
          radial-gradient(ellipse at 67% 66%, rgba(255,255,255,.13) 0 8%, transparent 9%),
          repeating-linear-gradient(165deg, rgba(255,255,255,.12) 0 3px, transparent 3px 22px),
          linear-gradient(145deg, #79d9e8 0%, #42b8d5 48%, #278baa 100%);
        box-shadow:
          0 0 0 8px rgba(210, 197, 137, .72),
          0 0 0 13px rgba(67, 123, 72, .28),
          inset 0 8px 18px rgba(255,255,255,.14),
          0 9px 18px rgba(23, 73, 82, .16);
        opacity: .98;
      }
      .race-lake::before {
        content: '';
        position: absolute;
        left: 13%; right: 20%; top: 24%;
        height: 7%;
        border-radius: 999px;
        background: rgba(255,255,255,.28);
        box-shadow: 34px 30px 0 rgba(255,255,255,.16), 79px 9px 0 rgba(255,255,255,.11);
        transform: rotate(-7deg);
      }
      .race-lake::after {
        content: '';
        position: absolute;
        right: 13%; bottom: 12%;
        width: 13%; height: 12%;
        border-radius: 50%;
        background: rgba(44, 129, 74, .72);
        box-shadow: -19px 7px 0 rgba(38,115,67,.62), 10px -11px 0 rgba(52,145,82,.54);
      }

      .race-palm {
        --palm-size: 56px;
        position: absolute;
        width: var(--palm-size);
        height: var(--palm-size);
        transform: translate(-50%, -50%) rotate(var(--palm-turn, 0deg)) scale(var(--palm-scale, 1));
        transform-origin: 50% 50%;
        filter: drop-shadow(2px 4px 3px rgba(24, 66, 34, .24));
      }
      .race-palm .palm-trunk {
        position: absolute;
        z-index: 3;
        left: 50%; top: 50%;
        width: 11px; height: 11px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #d49a58, #805126 72%);
        box-shadow: 0 0 0 2px rgba(88, 55, 27, .18);
      }
      .race-palm .palm-leaf {
        position: absolute;
        z-index: 2;
        left: 50%; top: 50%;
        width: 10px; height: 29px;
        margin-left: -5px;
        margin-top: -29px;
        transform-origin: 50% 100%;
        border-radius: 80% 18% 72% 18%;
        background: linear-gradient(90deg, #176c39, #34a95a 45%, #1f7f43);
      }
      .race-palm .palm-leaf:nth-child(1) { transform: rotate(0deg); }
      .race-palm .palm-leaf:nth-child(2) { transform: rotate(45deg); }
      .race-palm .palm-leaf:nth-child(3) { transform: rotate(90deg); }
      .race-palm .palm-leaf:nth-child(4) { transform: rotate(135deg); }
      .race-palm .palm-leaf:nth-child(5) { transform: rotate(180deg); }
      .race-palm .palm-leaf:nth-child(6) { transform: rotate(225deg); }
      .race-palm .palm-leaf:nth-child(7) { transform: rotate(270deg); }
      .race-palm .palm-leaf:nth-child(8) { transform: rotate(315deg); }

      .race-shrub {
        position: absolute;
        width: 22px; height: 22px;
        transform: translate(-50%, -50%) scale(var(--shrub-scale, 1));
        border-radius: 50%;
        background: radial-gradient(circle at 32% 30%, #68b665 0 18%, #3e9250 20% 56%, #2b733e 58%);
        box-shadow: 11px 4px 0 -4px #3c8d49, -9px 6px 0 -5px #367f45;
        opacity: .82;
      }
    `;
    document.head.appendChild(fixStyle);

    const sceneLayer = document.getElementById('sceneLayer');
    if (!sceneLayer) return;

    // Add a compact +10 second control beside the existing +1 minute button.
    const addMinuteButton = document.getElementById('countdownAddBtn');
    if (addMinuteButton && !document.getElementById('countdownAddTenBtn')) {
      const addTenButton = document.createElement('button');
      addTenButton.id = 'countdownAddTenBtn';
      addTenButton.className = 'control-button secondary';
      addTenButton.type = 'button';
      addTenButton.textContent = '+10 sec';
      addMinuteButton.parentElement?.insertBefore(addTenButton, addMinuteButton);

      addTenButton.addEventListener('click', () => {
        if (typeof window.__ttAddCountdownTime === 'function') {
          window.__ttAddCountdownTime(10);
          return;
        }

        const minutes = document.getElementById('countdownMinutes');
        const seconds = document.getElementById('countdownSeconds');
        if (!minutes || !seconds) return;
        let total = (Number(minutes.value) || 0) * 60 + (Number(seconds.value) || 0) + 10;
        total = Math.max(0, Math.min(180 * 60 + 59, Math.round(total)));
        minutes.value = String(Math.floor(total / 60));
        seconds.value = String(total % 60);
        seconds.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    // Use direct JS colour steps for the moon arrival so the effect remains visible even
    // when the browser/OS has reduced-motion enabled (which collapses CSS animations).
    let moonFlickerTimer = null;
    function runMoonColourFlicker() {
      const scene = sceneLayer.querySelector('.rocket-scene.rocket-arrived');
      const moon = scene?.querySelector('.rocket-moon');
      if (!moon || moon.dataset.jsColourFlicker === 'true') return;
      moon.dataset.jsColourFlicker = 'true';
      moon.getAnimations().forEach(animation => animation.cancel());

      const colours = [
        ['sepia(1) saturate(12) hue-rotate(292deg) brightness(1.35)', '255,70,170'],
        ['sepia(1) saturate(12) hue-rotate(150deg) brightness(1.28)', '65,190,255'],
        ['sepia(1) saturate(13) hue-rotate(5deg) brightness(1.4)', '255,220,65'],
        ['sepia(1) saturate(12) hue-rotate(72deg) brightness(1.3)', '80,255,130'],
        ['sepia(1) saturate(13) hue-rotate(222deg) brightness(1.32)', '180,95,255'],
        ['sepia(1) saturate(13) hue-rotate(328deg) brightness(1.38)', '255,105,65']
      ];

      let step = 0;
      clearInterval(moonFlickerTimer);
      const paint = () => {
        const [filter, glow] = colours[step % colours.length];
        moon.style.filter = filter;
        moon.style.boxShadow = `inset -15px -12px 20px rgba(75,90,108,.18), 0 0 50px rgba(${glow},.95), 0 0 100px rgba(${glow},.5)`;
        step++;
      };
      paint();
      moonFlickerTimer = setInterval(paint, 145);
      setTimeout(() => {
        clearInterval(moonFlickerTimer);
        moonFlickerTimer = null;
        moon.style.filter = '';
        moon.style.boxShadow = '';
      }, 2200);
    }

    const rocketArrivalObserver = new MutationObserver(() => {
      const scene = sceneLayer.querySelector('.rocket-scene');
      if (!scene) return;
      if (!scene.classList.contains('rocket-arrived')) {
        const moon = scene.querySelector('.rocket-moon');
        if (moon) delete moon.dataset.jsColourFlicker;
        return;
      }
      runMoonColourFlicker();
    });
    rocketArrivalObserver.observe(sceneLayer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    const tracked = new WeakSet();

    function attachSteering(car) {
      if (!car || tracked.has(car)) return;
      tracked.add(car);

      let lastX = null;
      let lastY = null;
      let angle = 0;
      let scheduled = false;

      const sync = () => {
        scheduled = false;
        const rect = sceneLayer.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const left = parseFloat(car.style.left);
        const top = parseFloat(car.style.top);
        if (!Number.isFinite(left) || !Number.isFinite(top)) return;

        const x = left / 100 * rect.width;
        const y = top / 100 * rect.height;

        if (lastX !== null && lastY !== null) {
          const dx = x - lastX;
          const dy = y - lastY;
          if (Math.hypot(dx, dy) > 0.12) {
            angle = Math.atan2(dy, dx) * 180 / Math.PI;
          }
        } else {
          const inlineAngle = parseFloat(car.style.rotate);
          if (Number.isFinite(inlineAngle)) angle = inlineAngle;
        }

        const next = `${angle}deg`;
        if (car.style.getPropertyValue('--car-angle') !== next) {
          car.style.setProperty('--car-angle', next);
        }

        lastX = x;
        lastY = y;
      };

      const styleObserver = new MutationObserver(() => {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(sync);
        }
      });
      styleObserver.observe(car, { attributes: true, attributeFilter: ['style'] });
      requestAnimationFrame(sync);
    }

    function roadSamples(path, rect, count = 96) {
      const len = path.getTotalLength();
      const samples = [];
      for (let i = 0; i <= count; i++) {
        const point = path.getPointAtLength(len * i / count);
        samples.push({
          x: point.x * rect.width / 1000,
          y: point.y * rect.height / 600
        });
      }
      return samples;
    }

    function nearestRoadDistance(samples, x, y) {
      let best = Infinity;
      for (const point of samples) {
        const d = Math.hypot(point.x - x, point.y - y);
        if (d < best) best = d;
      }
      return best;
    }

    function makePalm(xPct, yPct, scale) {
      const palm = document.createElement('div');
      palm.className = 'race-palm';
      palm.style.left = `${xPct}%`;
      palm.style.top = `${yPct}%`;
      palm.style.setProperty('--palm-scale', scale.toFixed(2));
      palm.style.setProperty('--palm-turn', `${Math.round(Math.random() * 360)}deg`);
      palm.innerHTML = `${'<i class="palm-leaf"></i>'.repeat(8)}<b class="palm-trunk"></b>`;
      return palm;
    }

    function makeShrub(xPct, yPct, scale) {
      const shrub = document.createElement('i');
      shrub.className = 'race-shrub';
      shrub.style.left = `${xPct}%`;
      shrub.style.top = `${yPct}%`;
      shrub.style.setProperty('--shrub-scale', scale.toFixed(2));
      return shrub;
    }

    function decorateRoad() {
      const scene = sceneLayer.querySelector('.race-scene');
      const svg = scene?.querySelector('.race-road svg');
      const path = svg?.querySelector('.race-path');
      if (!scene || !svg || !path || scene.dataset.sceneryReady === 'true') return;

      if (svg.dataset.racerV3 !== 'true') return;
      scene.dataset.sceneryReady = 'true';

      requestAnimationFrame(() => {
        const rect = sceneLayer.getBoundingClientRect();
        if (!rect.width || !rect.height || !scene.isConnected) {
          scene.dataset.sceneryReady = 'false';
          return;
        }

        const samples = roadSamples(path, rect);
        const scenery = document.createElement('div');
        scenery.className = 'race-scenery';

        const lakeCandidates = [
          { x: 12, y: 16, w: 20, h: 17 },
          { x: 88, y: 16, w: 20, h: 17 },
          { x: 12, y: 84, w: 20, h: 17 },
          { x: 88, y: 84, w: 20, h: 17 }
        ];

        const lakeChoice = lakeCandidates
          .map(candidate => {
            const px = candidate.x / 100 * rect.width;
            const py = candidate.y / 100 * rect.height;
            const radius = Math.hypot(candidate.w / 200 * rect.width, candidate.h / 200 * rect.height) * .82;
            return { ...candidate, score: nearestRoadDistance(samples, px, py) - radius };
          })
          .sort((a, b) => b.score - a.score)[0];

        const lake = document.createElement('div');
        lake.className = 'race-lake';
        lake.style.left = `${lakeChoice.x - lakeChoice.w / 2}%`;
        lake.style.top = `${lakeChoice.y - lakeChoice.h / 2}%`;
        lake.style.width = `${lakeChoice.w}%`;
        lake.style.height = `${lakeChoice.h}%`;
        scenery.appendChild(lake);

        const safeRoadDistance = Math.max(64, Math.min(112, rect.width * .105));
        const accepted = [];
        const lakeCx = lakeChoice.x / 100 * rect.width;
        const lakeCy = lakeChoice.y / 100 * rect.height;
        const lakeRx = lakeChoice.w / 200 * rect.width;
        const lakeRy = lakeChoice.h / 200 * rect.height;

        for (let attempt = 0; attempt < 90 && accepted.length < 12; attempt++) {
          const xPct = 4 + Math.random() * 92;
          const yPct = 7 + Math.random() * 86;
          const x = xPct / 100 * rect.width;
          const y = yPct / 100 * rect.height;

          if (nearestRoadDistance(samples, x, y) < safeRoadDistance) continue;

          const lakeNorm = Math.hypot((x - lakeCx) / (lakeRx * 1.2), (y - lakeCy) / (lakeRy * 1.25));
          if (lakeNorm < 1) continue;

          if (accepted.some(point => Math.hypot(point.x - x, point.y - y) < 48)) continue;

          accepted.push({ x, y, xPct, yPct });
          scenery.appendChild(makePalm(xPct, yPct, .72 + Math.random() * .44));
        }

        let shrubs = 0;
        for (let attempt = 0; attempt < 45 && shrubs < 9; attempt++) {
          const xPct = 3 + Math.random() * 94;
          const yPct = 8 + Math.random() * 84;
          const x = xPct / 100 * rect.width;
          const y = yPct / 100 * rect.height;
          if (nearestRoadDistance(samples, x, y) < safeRoadDistance * .82) continue;
          const lakeNorm = Math.hypot((x - lakeCx) / (lakeRx * 1.15), (y - lakeCy) / (lakeRy * 1.2));
          if (lakeNorm < 1) continue;
          scenery.appendChild(makeShrub(xPct, yPct, .7 + Math.random() * .55));
          shrubs++;
        }

        scene.insertBefore(scenery, scene.firstChild);
      });
    }

    function syncRoadExtras() {
      attachSteering(sceneLayer.querySelector('.race-car'));
      decorateRoad();
    }

    const sceneObserver = new MutationObserver(syncRoadExtras);
    sceneObserver.observe(sceneLayer, { childList: true, subtree: true });
    syncRoadExtras();
  });

  document.body.appendChild(base);
})();

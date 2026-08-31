(() => {
  'use strict';

  const theme = document.querySelector('.theme-storm');
  const levelNumber = document.getElementById('levelNumber');
  if (!theme || !levelNumber) return;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixRgb = (a, b, t) => {
    const p = clamp(t);
    return `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'storm-weather-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  theme.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let level = 0;
  let lastFrame = performance.now();
  let nextStrikeAt = lastFrame + 3000;
  let bolts = [];

  const drops = Array.from({ length: 150 }, (_, i) => ({
    x: ((i * 73 + 17) % 997) / 997,
    y: -0.08 + (((i * 47 + 9) % 101) / 101) * 1.16,
    speed: 0.36 + (((i * 61 + 21) % 97) / 97) * 0.72,
    length: 0.65 + (((i * 31 + 5) % 89) / 89) * 0.75,
    opacity: 0.72 + (((i * 19 + 11) % 83) / 83) * 0.28
  }));

  function isVisible() {
    return !theme.hidden && getComputedStyle(theme).display !== 'none';
  }

  function readLevel() {
    level = Math.max(0, Math.min(100, Number(levelNumber.textContent) || 0));
  }

  function resizeCanvas() {
    const rect = theme.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const newDpr = Math.min(window.devicePixelRatio || 1, 2);
    const newWidth = Math.round(rect.width);
    const newHeight = Math.round(rect.height);
    if (newWidth === width && newHeight === height && newDpr === dpr) return true;

    width = newWidth;
    height = newHeight;
    dpr = newDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function updateColours() {
    const sky = level / 100;
    const curve = Math.pow(sky, 1.1);

    theme.style.setProperty('--storm-sky-top', mixRgb([139, 204, 235], [48, 52, 59], curve));
    theme.style.setProperty('--storm-sky-bottom', mixRgb([216, 239, 248], [82, 87, 94], curve));

    /* Keep the cloud distinctly lighter than the dark storm sky. */
    theme.style.setProperty('--storm-cloud-colour', mixRgb([246, 249, 250], [174, 181, 188], Math.pow(sky, 1.08)));
    theme.style.setProperty('--storm-cloud-brightness', String(lerp(1.04, 1.0, curve).toFixed(3)));
  }

  function resetDrop(drop) {
    drop.x = 0.04 + Math.random() * 0.92;
    drop.y = -0.18 - Math.random() * 0.28;
    drop.speed = 0.36 + Math.random() * 0.72;
    drop.length = 0.65 + Math.random() * 0.75;
    drop.opacity = 0.72 + Math.random() * 0.28;
  }

  function drawRain(dt) {
    const intensity = clamp((level - 38) / 62);
    if (intensity <= 0) return;

    const activeCount = Math.max(2, Math.round(drops.length * intensity));
    const fallMultiplier = 0.72 + intensity * 2.15;
    const baseLength = 8 + intensity * 25;
    const slant = 2 + intensity * 8;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(192, 229, 249, ${0.28 + intensity * 0.62})`;
    ctx.lineWidth = 1 + intensity * 1.45;

    for (let i = 0; i < activeCount; i += 1) {
      const drop = drops[i];
      drop.y += drop.speed * fallMultiplier * dt;
      if (drop.y > 1.08) resetDrop(drop);

      const x = drop.x * width;
      const y = drop.y * height;
      const length = baseLength * drop.length;
      ctx.globalAlpha = drop.opacity * (0.46 + intensity * 0.54);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + slant, y + length);
      ctx.stroke();
    }
    ctx.restore();
  }

  function makeBolt(now, intensity, xShift = 0) {
    if (!width || !height) return;

    const startX = clamp(width * (0.28 + Math.random() * 0.44) + xShift, 24, width - 24);
    const startY = height * (0.40 + Math.random() * 0.07);
    const endX = clamp(startX + (Math.random() - 0.5) * width * (0.24 + intensity * 0.22), 18, width - 18);
    const endY = height * 0.985;
    const segments = 8 + Math.round(intensity * 6);
    const points = [{ x: startX, y: startY }];

    for (let i = 1; i < segments; i += 1) {
      const t = i / segments;
      points.push({
        x: lerp(startX, endX, t) + (Math.random() - 0.5) * (24 + intensity * 58),
        y: lerp(startY, endY, t)
      });
    }
    points.push({ x: endX, y: endY });

    bolts.push({ points, born: now, duration: 250 + Math.random() * 90, intensity });
  }

  function scheduleNextStrike(now, intensity) {
    const slow = 5200;
    const fast = 150;
    const interval = fast + (slow - fast) * Math.pow(1 - intensity, 2.35);
    nextStrikeAt = now + interval * (0.58 + Math.random() * 0.72);
  }

  function updateLightning(now) {
    const intensity = clamp((level - 58) / 42);
    if (intensity <= 0 || !isVisible()) {
      nextStrikeAt = Math.max(nextStrikeAt, now + 800);
      return intensity;
    }

    if (now >= nextStrikeAt) {
      makeBolt(now, intensity);
      if (intensity > 0.72 && Math.random() < intensity * 0.8) {
        makeBolt(now + 25, intensity, (Math.random() - 0.5) * width * 0.18);
      }
      if (intensity > 0.92 && Math.random() < 0.55) {
        makeBolt(now + 55, intensity, (Math.random() - 0.5) * width * 0.28);
      }
      scheduleNextStrike(now, intensity);
    }

    return intensity;
  }

  function drawBolts(now, lightningIntensity) {
    bolts = bolts.filter(bolt => now - bolt.born < bolt.duration);
    if (!bolts.length) return;

    let flash = 0;
    for (const bolt of bolts) {
      const age = Math.max(0, now - bolt.born);
      const p = age / bolt.duration;
      const flicker = p < 0.18 ? 1 : p < 0.36 ? 0.24 : p < 0.58 ? 0.9 : Math.max(0, (1 - p) * 1.45);
      flash = Math.max(flash, flicker * bolt.intensity);

      ctx.save();
      ctx.globalAlpha = flicker;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      bolt.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.strokeStyle = '#fff4a8';
      ctx.lineWidth = 4 + bolt.intensity * 4;
      ctx.shadowColor = 'rgba(235,245,255,.95)';
      ctx.shadowBlur = 18 + bolt.intensity * 18;
      ctx.stroke();

      ctx.beginPath();
      bolt.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3 + bolt.intensity * 1.5;
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();
    }

    if (flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(244,248,255,${Math.min(0.26, 0.035 + flash * 0.22 * lightningIntensity)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    readLevel();
    updateColours();

    if (resizeCanvas() && isVisible()) {
      ctx.clearRect(0, 0, width, height);
      drawRain(dt);
      const lightningIntensity = updateLightning(now);
      drawBolts(now, lightningIntensity);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(frame);
})();

/* Load the Pressure Gauge enhancement after the main theme scripts. */
(() => {
  if (!document.querySelector('link[data-pressure-upgrade]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'pressure-upgrade.css';
    link.dataset.pressureUpgrade = 'true';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-pressure-upgrade]')) {
    const script = document.createElement('script');
    script.src = 'pressure-upgrade.js';
    script.dataset.pressureUpgrade = 'true';
    document.body.appendChild(script);
  }
})();

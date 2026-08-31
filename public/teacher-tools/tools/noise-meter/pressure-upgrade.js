(() => {
  'use strict';

  const theme = document.querySelector('.theme-pressure');
  const levelNumber = document.getElementById('levelNumber');
  const needle = document.getElementById('gaugeNeedle');
  const leftPipe = theme?.querySelector('.left-pipe');
  const rightPipe = theme?.querySelector('.right-pipe');
  if (!theme || !levelNumber || !needle || !leftPipe || !rightPipe) return;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  const canvas = document.createElement('canvas');
  canvas.className = 'pressure-smoke-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  theme.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let level = 0;
  let lastFrame = performance.now();
  let emissionCarry = 0;
  let sideToggle = 0;
  const particles = [];

  function isVisible() {
    return !theme.hidden && getComputedStyle(theme).display !== 'none';
  }

  function readLevel() {
    level = Math.max(0, Math.min(100, Number(levelNumber.textContent) || 0));
  }

  function resizeCanvas() {
    const rect = theme.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const newWidth = Math.round(rect.width);
    const newHeight = Math.round(rect.height);
    const newDpr = Math.min(window.devicePixelRatio || 1, 2);
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

  function setNeedle() {
    /* Dial geometry from the visible colour arc: 0 = lower-left, 100 = lower-right. */
    const angle = 150 + (level / 100) * 240;
    needle.style.setProperty('--needle-angle', `${angle.toFixed(2)}deg`);
  }

  function sourcePoint(pipe) {
    const themeRect = theme.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();
    return {
      x: pipeRect.left - themeRect.left + pipeRect.width * 0.5,
      y: pipeRect.top - themeRect.top + Math.max(4, pipeRect.height * 0.08)
    };
  }

  function spawnParticle(source, intensity) {
    const baseSize = 12 + intensity * 16;
    particles.push({
      x: source.x + (Math.random() - 0.5) * (12 + intensity * 18),
      y: source.y + (Math.random() - 0.5) * 5,
      vx: (Math.random() - 0.5) * (12 + intensity * 24),
      vy: -(42 + Math.random() * 26 + intensity * 48),
      size: baseSize * (0.72 + Math.random() * 0.72),
      growth: 8 + intensity * 14 + Math.random() * 7,
      age: 0,
      life: 2.3 + Math.random() * 1.15,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 1.4 + Math.random() * 1.8,
      alpha: 0.28 + intensity * 0.42
    });
  }

  function emitSmoke(dt) {
    const intensity = clamp((level - 22) / 78);
    if (intensity <= 0 || !isVisible()) {
      emissionCarry = 0;
      return;
    }

    /* Roughly 1 puff/sec at low-mid levels, rising to ~22 puffs/sec at 100. */
    const rate = 0.8 + Math.pow(intensity, 1.7) * 21.2;
    emissionCarry += rate * dt;

    const left = sourcePoint(leftPipe);
    const right = sourcePoint(rightPipe);
    while (emissionCarry >= 1) {
      emissionCarry -= 1;
      const source = sideToggle++ % 2 === 0 ? left : right;
      spawnParticle(source, intensity);

      if (intensity > 0.82 && Math.random() < 0.42) {
        spawnParticle(source, intensity);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life || p.y < -p.size * 2) {
        particles.splice(i, 1);
        continue;
      }

      p.wobble += p.wobbleSpeed * dt;
      p.x += (p.vx + Math.sin(p.wobble) * 13) * dt;
      p.y += p.vy * dt;
      p.size += p.growth * dt;
      p.vy *= Math.pow(0.992, dt * 60);
    }
  }

  function drawSmoke() {
    ctx.clearRect(0, 0, width, height);
    if (!particles.length) return;

    for (const p of particles) {
      const progress = p.age / p.life;
      const fadeIn = clamp(progress / 0.14);
      const fadeOut = clamp((1 - progress) / 0.46);
      const alpha = p.alpha * Math.min(fadeIn, fadeOut);
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#eef5f3';
      ctx.shadowColor = 'rgba(235,244,242,.5)';
      ctx.shadowBlur = 9;

      const r = p.size * 0.42;
      const lobes = [
        [0, 0, 1],
        [-r * 0.75, r * 0.12, 0.72],
        [r * 0.72, r * 0.08, 0.78],
        [-r * 0.18, -r * 0.48, 0.68]
      ];

      for (const [dx, dy, scale] of lobes) {
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, r * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;

    readLevel();
    setNeedle();

    if (resizeCanvas()) {
      emitSmoke(dt);
      updateParticles(dt);
      drawSmoke();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(frame);
})();

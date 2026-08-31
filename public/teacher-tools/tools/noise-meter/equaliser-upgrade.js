(() => {
  'use strict';

  const theme = document.querySelector('.theme-equaliser');
  const equaliser = document.getElementById('equaliserBars');
  const levelNumber = document.getElementById('levelNumber');
  if (!theme || !equaliser || !levelNumber) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let bars = [];
  let motion = [];
  let lastTime = performance.now();

  function ensureBars() {
    const next = [...equaliser.children];
    if (!next.length) return false;

    if (next.length !== bars.length || next.some((bar, i) => bar !== bars[i])) {
      bars = next;
      motion = bars.map((_, i) => ({
        phaseA: ((i * 47) % 101) / 101 * Math.PI * 2,
        phaseB: ((i * 73 + 17) % 103) / 103 * Math.PI * 2,
        speedA: 0.75 + (((i * 31 + 9) % 89) / 89) * 1.35,
        speedB: 1.15 + (((i * 53 + 11) % 97) / 97) * 1.95,
        personality: 0.72 + (((i * 67 + 5) % 83) / 83) * 0.56,
        currentOffset: 0,
        kick: 0,
        nextKickAt: performance.now() + 180 + ((i * 41) % 700)
      }));
    }

    return true;
  }

  function visible() {
    return !theme.hidden && getComputedStyle(theme).display !== 'none';
  }

  function readBaseHeight(bar) {
    const inline = bar.style.getPropertyValue('--bar-height');
    const value = parseFloat(inline);
    return Number.isFinite(value) ? value : 12;
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (ensureBars() && visible()) {
      const level = clamp(Number(levelNumber.textContent) || 0, 0, 100);
      const intensity = level / 100;

      /* Slight independent flutter when quiet; increasingly wild motion as noise rises. */
      const flutterAmplitude = 1.25 + Math.pow(intensity, 1.25) * 17.5;
      const speedMultiplier = 0.8 + intensity * 4.0;
      const randomAmplitude = 0.28 + Math.pow(intensity, 1.55) * 8.2;
      const response = 0.13 + intensity * 0.23;

      bars.forEach((bar, i) => {
        const m = motion[i];
        const base = readBaseHeight(bar);

        m.phaseA += dt * m.speedA * speedMultiplier * Math.PI * 2;
        m.phaseB += dt * m.speedB * (0.72 + intensity * 2.4) * Math.PI * 2;

        if (now >= m.nextKickAt) {
          if (Math.random() < 0.08 + intensity * 0.62) {
            m.kick = (Math.random() - 0.42) * (2 + intensity * 17) * m.personality;
          }

          const minGap = 110 - intensity * 65;
          const extraGap = 620 - intensity * 470;
          m.nextKickAt = now + minGap + Math.random() * extraGap;
        }

        m.kick *= Math.pow(0.86 - intensity * 0.08, dt * 60);

        const waveA = Math.sin(m.phaseA) * flutterAmplitude * m.personality;
        const waveB = Math.sin(m.phaseB + i * 0.37) * flutterAmplitude * 0.42;
        const noise = (Math.random() - 0.5) * randomAmplitude * m.personality;
        const desiredOffset = waveA + waveB + noise + m.kick;

        m.currentOffset += (desiredOffset - m.currentOffset) * response;
        const finalHeight = clamp(base + m.currentOffset, 7, 100);
        bar.style.setProperty('--bar-height', `${finalHeight.toFixed(1)}%`);
      });
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

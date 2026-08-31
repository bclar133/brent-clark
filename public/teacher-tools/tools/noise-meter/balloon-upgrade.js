(() => {
  'use strict';

  const levelNumber = document.getElementById('levelNumber');
  const balloon = document.getElementById('balloonVisual');
  const balloonTheme = document.querySelector('.theme-balloon');
  const loudThreshold = document.getElementById('loudThreshold');

  if (!levelNumber || !balloon || !balloonTheme) return;

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

  function updateBalloon() {
    const manualToggle = document.getElementById('manualTestToggle');
    const manualSlider = document.getElementById('manualTestSlider');
    const manualActive = Boolean(manualToggle?.checked);

    const displayedLevel = clamp(Number(levelNumber.textContent) || 0);
    const manualLevel = clamp(Number(manualSlider?.value) || 0);
    const level = manualActive ? manualLevel : displayedLevel;
    const progress = level / 100;

    /* Start a little smaller than before, while keeping the same maximum size. */
    const scale = 0.48 + progress * 0.80;
    balloon.style.setProperty('--balloon-scale', scale.toFixed(3));

    /* Manual testing should make the burst easy to inspect: once the slider
       reaches the Too Loud threshold, keep the comic POP visible until the
       slider is lowered again. Live microphone mode keeps its normal transient
       pop behaviour from app.js. */
    const loud = Number(loudThreshold?.value) || 68;
    balloonTheme.classList.toggle('manual-pop', manualActive && level >= loud);

    requestAnimationFrame(updateBalloon);
  }

  requestAnimationFrame(updateBalloon);
})();

(() => {
  'use strict';

  const targetName = document.getElementById('gameTargetName');
  const livePrompt = document.getElementById('gameLivePrompt');
  const goWheelButton = document.getElementById('goToGameWheel');

  if (targetName && livePrompt && goWheelButton) {
    function syncLivePrompt() {
      const name = targetName.textContent.trim();
      if (!name || name === 'Ready?' || name === 'Paused' || goWheelButton.disabled) return;
      livePrompt.innerHTML = `<p>Named colour game: <strong>${name}</strong> — click the wheel where you think it belongs.</p>`;
      livePrompt.classList.add('show');
    }

    new MutationObserver(syncLivePrompt).observe(targetName, {
      childList:true,
      characterData:true,
      subtree:true
    });
  }

  /* Load the contrast-checker mini wheel after the dynamically-created checker exists. */
  if (!document.querySelector('link[href="contrast-picker.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'contrast-picker.css';
    document.head.append(stylesheet);
  }

  function syncContrastSwatches() {
    const backgroundInput = document.getElementById('contrastBgHex');
    const textInput = document.getElementById('contrastTextHex');
    const backgroundSwatch = document.getElementById('contrastBgSwatch');
    const textSwatch = document.getElementById('contrastTextSwatch');
    if (backgroundInput && backgroundSwatch) backgroundSwatch.style.background = backgroundInput.value;
    if (textInput && textSwatch) textSwatch.style.background = textInput.value;
  }

  if (!document.querySelector('script[src="contrast-picker.js"]')) {
    const script = document.createElement('script');
    script.src = 'contrast-picker.js';
    script.addEventListener('load', () => {
      const backgroundInput = document.getElementById('contrastBgHex');
      const textInput = document.getElementById('contrastTextHex');
      backgroundInput?.addEventListener('input', syncContrastSwatches);
      backgroundInput?.addEventListener('change', syncContrastSwatches);
      textInput?.addEventListener('input', syncContrastSwatches);
      textInput?.addEventListener('change', syncContrastSwatches);
      syncContrastSwatches();
    });
    document.body.append(script);
  }
})();

(() => {
  'use strict';

  const launchBtn = document.querySelector('#presentationBtn');
  const exitBtn = document.querySelector('#presentationExitBtn');
  const roomScroll = document.querySelector('#roomScroll');
  if (!launchBtn || !exitBtn || !roomScroll) return;

  let presentationActive = false;
  let requestedBrowserFullscreen = false;

  // Keep the exit control inside the element that actually enters browser fullscreen.
  roomScroll.append(exitBtn);

  function setPresentation(active) {
    presentationActive = active;
    document.documentElement.classList.toggle('presentation-mode', active);
    launchBtn.setAttribute('aria-pressed', String(active));
    launchBtn.textContent = active ? '↙ Exit full screen' : '⛶ Full screen';

    if (active) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }

  async function enterPresentation() {
    setPresentation(true);
    requestedBrowserFullscreen = false;

    // Fullscreen the room itself, not the whole document. This guarantees that
    // editing controls, class lists and toolbars cannot appear on the projector.
    if (document.fullscreenEnabled && roomScroll.requestFullscreen) {
      try {
        await roomScroll.requestFullscreen();
        requestedBrowserFullscreen = true;
      } catch (_) {
        // CSS fallback still turns the room into a fixed, viewport-sized overlay.
      }
    }
  }

  async function exitPresentation() {
    setPresentation(false);
    requestedBrowserFullscreen = false;

    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); }
      catch (_) {}
    }
  }

  launchBtn.addEventListener('click', () => {
    if (presentationActive) exitPresentation();
    else enterPresentation();
  });

  exitBtn.addEventListener('click', exitPresentation);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && presentationActive && requestedBrowserFullscreen) {
      setPresentation(false);
      requestedBrowserFullscreen = false;
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !presentationActive) return;
    if (!document.fullscreenElement) exitPresentation();
  });
})();

// Load the simplified editing UI after the core seating-plan scripts have initialised.
(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'interface-cleanup.css?v=2';
  document.head.append(style);

  const script = document.createElement('script');
  script.src = 'interface-cleanup.js?v=2';
  script.defer = true;
  document.body.append(script);
})();

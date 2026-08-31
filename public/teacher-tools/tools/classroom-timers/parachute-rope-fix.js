(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'parachuteRopeAttachmentFix';
  style.textContent = `
    /* Keep the character and rigging as one unit so the ropes cannot drift away. */
    .parachutist-v2 .fun-character {
      animation: none !important;
    }
    .timer-stage.finished .parachutist-v2 .fun-character {
      animation: none !important;
    }

    /* Remove the short vertical grip lines at the hands. */
    .parachutist-v2 .fun-hand::before {
      display: none !important;
      content: none !important;
    }
  `;
  document.head.appendChild(style);

  function attachRopes() {
    const parachutist = sceneLayer.querySelector('.parachutist-v2');
    const rigging = parachutist?.querySelector('.fun-rigging');
    if (!parachutist || !rigging || rigging.dataset.attached === 'true') return;

    rigging.dataset.attached = 'true';

    /*
      Character coordinates inside the 210 x 190 assembly:
      left hand centre  ≈ (64.5, 148)
      right hand centre ≈ (145.5, 148)
      harness/shoulder points ≈ (92, 143) and (118, 143)

      The line ends sit underneath the hands/harness so there is no visible gap.
    */
    rigging.innerHTML = `
      <path class="outer left" d="M 18 54 C 28 82, 42 118, 64.5 148" />
      <path class="outer right" d="M 192 54 C 182 82, 168 118, 145.5 148" />
      <path class="inner left" d="M 63 59 C 72 88, 82 119, 92 143" />
      <path class="inner right" d="M 147 59 C 138 88, 128 119, 118 143" />
    `;
  }

  const observer = new MutationObserver(attachRopes);
  observer.observe(sceneLayer, { childList: true, subtree: true });
  attachRopes();
})();

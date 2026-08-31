(() => {
  'use strict';

  if (document.getElementById('snowmanBirdRedrawStyleV1')) return;

  const style = document.createElement('style');
  style.id = 'snowmanBirdRedrawStyleV1';
  style.textContent = `
    .xt-snowman .snow2-bird {
      z-index: 999 !important;
    }

    .xt-snowman .snow2-bird-svg {
      display: block;
      width: 120px;
      height: 82px;
      overflow: visible;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,.14));
    }

    .xt-snowman .snow2-bird-head-group {
      transform-box: view-box;
      transform-origin: 48px 47px;
      transform: rotate(var(--bird-peck, 0deg));
    }

    .xt-snowman .snow2-bird-beak-svg {
      transform-box: fill-box;
      transform-origin: right center;
      transform: rotate(var(--bird-beak, 0deg));
    }
  `;
  document.head.appendChild(style);

  const birdMarkup = `
    <svg class="snow2-bird-svg" viewBox="0 0 120 82" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="snowBirdBodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#63bdf2"/>
          <stop offset="1" stop-color="#2f7fc4"/>
        </linearGradient>
        <linearGradient id="snowBirdHeadGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#72c9f7"/>
          <stop offset="1" stop-color="#3589cb"/>
        </linearGradient>
      </defs>

      <!-- tail and body -->
      <path d="M94 41 C108 35 115 37 118 43 C108 48 101 51 91 52 Z" fill="#2b70b2"/>
      <ellipse cx="70" cy="48" rx="34" ry="23" fill="url(#snowBirdBodyGradient)"/>
      <ellipse cx="67" cy="54" rx="18" ry="12" fill="#eef9ff" opacity="0.92"/>
      <path d="M67 39 C79 35 91 40 95 51 C85 57 74 57 64 51 C61 46 62 42 67 39 Z" fill="#205b9d"/>

      <!-- legs -->
      <path d="M61 65 L61 79 M77 65 L77 79" stroke="#6c5136" stroke-width="3" stroke-linecap="round"/>
      <path d="M55 79 L67 79 M71 79 L83 79" stroke="#6c5136" stroke-width="3" stroke-linecap="round"/>

      <!-- head, crest, eye and beak move as one unit -->
      <g class="snow2-bird-head-group">
        <circle cx="40" cy="38" r="21" fill="url(#snowBirdHeadGradient)"/>

        <!-- crest is physically attached to the head -->
        <ellipse cx="39" cy="17" rx="5.5" ry="9.5" fill="#f36f3f" transform="rotate(-14 39 17)"/>
        <ellipse cx="47" cy="18" rx="5.5" ry="9" fill="#f36f3f" transform="rotate(4 47 18)"/>
        <ellipse cx="54" cy="21" rx="5" ry="8" fill="#f36f3f" transform="rotate(22 54 21)"/>

        <circle cx="30" cy="34" r="4.2" fill="#1c252b"/>
        <circle cx="28.7" cy="32.7" r="1.15" fill="#ffffff" opacity="0.72"/>

        <g class="snow2-bird-beak-svg">
          <path d="M0 39 L20 32 L20 46 Z" fill="#f0ae32"/>
          <path d="M0 39 L20 39 L20 46 Z" fill="#df9220" opacity="0.48"/>
        </g>
      </g>
    </svg>
  `;

  function replaceBird(bird){
    if (!bird || bird.dataset.redrawnBird === '1') return;
    bird.innerHTML = birdMarkup;
    bird.dataset.redrawnBird = '1';
  }

  function scan(){
    document.querySelectorAll('.xt-snowman .snow2-bird').forEach(replaceBird);
  }

  scan();

  const observer = new MutationObserver(scan);
  observer.observe(document.body, {childList:true, subtree:true});
})();

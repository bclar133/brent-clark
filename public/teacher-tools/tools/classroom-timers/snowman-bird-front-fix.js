(() => {
  'use strict';

  if (document.getElementById('snowmanBirdFrontFixStyleV3')) return;

  const style = document.createElement('style');
  style.id = 'snowmanBirdFrontFixStyleV3';
  style.textContent = `
    .xt-snowman .snow2-bird {
      z-index: 999 !important;
    }

    /* The whole bird is mirrored when it enters from the left, so increasing
       local left moves the crest visually toward the back of its head. */
    .xt-snowman .snow2-bird-crest {
      left: 25px !important;
      top: 5px !important;
      transform: rotate(-8deg) !important;
    }

    .xt-snowman .snow2-bird-crest::before {
      left: 4px !important;
      top: 0 !important;
      transform: rotate(14deg) !important;
    }

    .xt-snowman .snow2-bird-crest::after {
      left: 8px !important;
      top: 2px !important;
      transform: rotate(28deg) !important;
    }
  `;

  document.head.appendChild(style);
})();

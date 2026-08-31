(() => {
  'use strict';

  if (document.getElementById('snowmanDetailFixStyleV2')) return;

  const style = document.createElement('style');
  style.id = 'snowmanDetailFixStyleV2';
  style.textContent = `
    .xt-snowman .snow2-hat {
      translate: 0 -18px !important;
      rotate: -5deg !important;
      transform-origin: 50% 100% !important;
    }

    .xt-snowman .snow2-bird-beak {
      clip-path: polygon(0 50%, 100% 0, 100% 100%) !important;
    }
  `;

  document.head.appendChild(style);
})();
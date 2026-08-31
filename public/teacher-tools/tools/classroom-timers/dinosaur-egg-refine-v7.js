(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV7')) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV7';
  style.textContent = `
    /* Keep HATCHED in its own top-right space so it never sits under the timer. */
    .xt-dino.dino-egg-upgraded .dino-up-pop {
      left:auto !important;
      right:4% !important;
      top:5% !important;
      bottom:auto !important;
      max-width:50% !important;
      white-space:nowrap !important;
      text-align:right !important;
      font-size:clamp(2rem,4.5vw,4rem) !important;
      transform:none !important;
      transform-origin:100% 0 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-pop.show {
      animation:dinoHatchedPopV7 .75s cubic-bezier(.2,.85,.25,1.15) forwards !important;
    }

    @keyframes dinoHatchedPopV7 {
      0%   { opacity:0;   transform:scale(.55) rotate(-4deg); }
      45%  { opacity:1;   transform:scale(1.08) rotate(2deg); }
      100% { opacity:.94; transform:scale(1) rotate(0deg); }
    }

    @media(max-width:760px){
      /* On narrow screens place HATCHED below the timer instead of beside it. */
      .xt-dino.dino-egg-upgraded .dino-up-pop {
        left:50% !important;
        right:auto !important;
        top:29% !important;
        max-width:92% !important;
        text-align:center !important;
        font-size:clamp(1.8rem,8vw,3rem) !important;
        transform:translateX(-50%) !important;
        transform-origin:50% 0 !important;
      }

      .xt-dino.dino-egg-upgraded .dino-up-pop.show {
        animation:dinoHatchedPopV7Mobile .75s cubic-bezier(.2,.85,.25,1.15) forwards !important;
      }

      @keyframes dinoHatchedPopV7Mobile {
        0%   { opacity:0;   transform:translateX(-50%) scale(.55) rotate(-4deg); }
        45%  { opacity:1;   transform:translateX(-50%) scale(1.08) rotate(2deg); }
        100% { opacity:.94; transform:translateX(-50%) scale(1) rotate(0deg); }
      }
    }
  `;

  document.head.appendChild(style);
})();

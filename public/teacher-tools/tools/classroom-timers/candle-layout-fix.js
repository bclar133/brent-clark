(() => {
  'use strict';

  if (document.getElementById('candleLayoutFixStyleV1')) return;

  const style = document.createElement('style');
  style.id = 'candleLayoutFixStyleV1';
  style.textContent = `
    #countdownStage.theme-candle .time-display-wrap {
      position:absolute!important;
      left:5%!important;
      right:auto!important;
      top:7%!important;
      bottom:auto!important;
      transform:none!important;
      width:min(36%,340px)!important;
      z-index:30!important;
      justify-items:start!important;
      text-align:left!important;
    }

    #countdownStage.theme-candle #countdownDisplay,
    #countdownStage.theme-candle .time-display {
      width:auto!important;
      max-width:100%!important;
      text-align:left!important;
      white-space:nowrap!important;
    }

    #countdownStage.theme-candle #countdownMessage,
    #countdownStage.theme-candle .timer-message {
      text-align:left!important;
      justify-self:start!important;
    }

    #countdownStage.theme-candle .candle {
      left:auto!important;
      right:18%!important;
      transform:none!important;
    }

    @media (max-width:760px) {
      #countdownStage.theme-candle .time-display-wrap {
        left:3%!important;
        top:4%!important;
        width:min(47%,235px)!important;
      }

      #countdownStage.theme-candle .candle {
        right:8%!important;
        transform:scale(.88)!important;
        transform-origin:bottom right!important;
      }
    }
  `;

  document.head.appendChild(style);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('candleEffectsScript')) return;

  const effects = document.createElement('script');
  effects.id = 'candleEffectsScript';
  effects.src = new URL('candle-effects.js', current.src).href;
  effects.async = false;
  document.body.appendChild(effects);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('candleNightlifeScript')) return;

  const nightlife = document.createElement('script');
  nightlife.id = 'candleNightlifeScript';
  nightlife.src = new URL('candle-nightlife.js', current.src).href;
  nightlife.async = false;
  document.body.appendChild(nightlife);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('expandedThemesScript')) return;

  const expanded = document.createElement('script');
  expanded.id = 'expandedThemesScript';
  expanded.src = new URL('expanded-themes.js', current.src).href;
  expanded.async = false;
  document.body.appendChild(expanded);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('expandedThemesHostFixScript')) return;

  const fix = document.createElement('script');
  fix.id = 'expandedThemesHostFixScript';
  fix.src = new URL('expanded-themes-host-fix.js', current.src).href;
  fix.async = false;
  document.body.appendChild(fix);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('bombFuseFixScript')) return;

  const bombFix = document.createElement('script');
  bombFix.id = 'bombFuseFixScript';
  bombFix.src = new URL('bomb-fuse-fix.js', current.src).href;
  bombFix.async = false;
  document.body.appendChild(bombFix);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('bombFuseV3Script')) return;

  const bombV3 = document.createElement('script');
  bombV3.id = 'bombFuseV3Script';
  bombV3.src = new URL('bomb-fuse-v3.js', current.src).href;
  bombV3.async = false;
  document.body.appendChild(bombV3);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('removeVolcanoScript')) return;

  const removeVolcano = document.createElement('script');
  removeVolcano.id = 'removeVolcanoScript';
  removeVolcano.src = new URL('remove-volcano.js', current.src).href;
  removeVolcano.async = false;
  document.body.appendChild(removeVolcano);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanUpgradeScript')) return;

  const snowman = document.createElement('script');
  snowman.id = 'snowmanUpgradeScript';
  snowman.src = new URL('snowman-upgrade.js', current.src).href;
  snowman.async = false;
  document.body.appendChild(snowman);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanStraightStartScript')) return;

  const snowmanStraight = document.createElement('script');
  snowmanStraight.id = 'snowmanStraightStartScript';
  snowmanStraight.src = new URL('snowman-straight-start.js', current.src).href;
  snowmanStraight.async = false;
  document.body.appendChild(snowmanStraight);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanDetailFixScript')) return;

  const snowmanDetail = document.createElement('script');
  snowmanDetail.id = 'snowmanDetailFixScript';
  snowmanDetail.src = new URL('snowman-detail-fix.js', current.src).href;
  snowmanDetail.async = false;
  document.body.appendChild(snowmanDetail);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('snowmanBirdDirectionFixScript')) return;

  const snowmanBirdDirection = document.createElement('script');
  snowmanBirdDirection.id = 'snowmanBirdDirectionFixScript';
  snowmanBirdDirection.src = new URL('snowman-bird-direction-fix.js', current.src).href;
  snowmanBirdDirection.async = false;
  document.body.appendChild(snowmanBirdDirection);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('moonPhasesSmoothScript')) return;

  const moonSmooth = document.createElement('script');
  moonSmooth.id = 'moonPhasesSmoothScript';
  moonSmooth.src = new URL('moon-phases-smooth.js', current.src).href;
  moonSmooth.async = false;
  document.body.appendChild(moonSmooth);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('moonUfoScript')) return;

  const moonUfo = document.createElement('script');
  moonUfo.id = 'moonUfoScript';
  moonUfo.src = new URL('moon-ufo.js', current.src).href;
  moonUfo.async = false;
  document.body.appendChild(moonUfo);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggUpgradeScript')) return;

  const dinoEgg = document.createElement('script');
  dinoEgg.id = 'dinosaurEggUpgradeScript';
  dinoEgg.src = new URL('dinosaur-egg-upgrade.js', current.src).href;
  dinoEgg.async = false;
  document.body.appendChild(dinoEgg);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineScript')) return;

  const dinoRefine = document.createElement('script');
  dinoRefine.id = 'dinosaurEggRefineScript';
  dinoRefine.src = new URL('dinosaur-egg-refine.js', current.src).href;
  dinoRefine.async = false;
  document.body.appendChild(dinoRefine);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV2Script')) return;

  const dinoRefineV2 = document.createElement('script');
  dinoRefineV2.id = 'dinosaurEggRefineV2Script';
  dinoRefineV2.src = new URL('dinosaur-egg-refine-v2.js', current.src).href;
  dinoRefineV2.async = false;
  document.body.appendChild(dinoRefineV2);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV3Script')) return;

  const dinoRefineV3 = document.createElement('script');
  dinoRefineV3.id = 'dinosaurEggRefineV3Script';
  dinoRefineV3.src = new URL('dinosaur-egg-refine-v3.js', current.src).href;
  dinoRefineV3.async = false;
  document.body.appendChild(dinoRefineV3);
})();

(() => {
  const current = document.currentScript;
  if (!current || document.getElementById('dinosaurEggRefineV4Script')) return;

  const dinoRefineV4 = document.createElement('script');
  dinoRefineV4.id = 'dinosaurEggRefineV4Script';
  dinoRefineV4.src = new URL('dinosaur-egg-refine-v4.js', current.src).href;
  dinoRefineV4.async = false;
  document.body.appendChild(dinoRefineV4);
})();
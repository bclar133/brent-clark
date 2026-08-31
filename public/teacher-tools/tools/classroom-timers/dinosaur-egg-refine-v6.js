(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV6')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV6';
  style.textContent = `
    /* Move the little drinker close enough that its muzzle reaches the pond. */
    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      left:15.8% !important;
      right:auto !important;
      bottom:22.3% !important;
      width:66px !important;
      height:41px !important;
      transform:none !important;
      animation:none !important;
    }

    /* v6 drives the neck/head from requestAnimationFrame instead of CSS keyframes. */
    .xt-dino.dino-egg-upgraded .dino-v5-drink-head {
      animation:none !important;
      transform-box:view-box !important;
      transform-origin:65px 48px !important;
      will-change:transform;
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        left:13.1% !important;
        bottom:23.1% !important;
        width:51px !important;
        height:32px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const smooth = t => t*t*(3-2*t);

  function ramp(t,a,b,from,to){
    const n = smooth(clamp((t-a)/(b-a),0,1));
    return from + (to-from)*n;
  }

  function drinkAngle(now){
    /* Two obvious sips in each cycle with quiet pauses between them. */
    const p = (now % 7600) / 7600;

    if (p < .12) return 0;
    if (p < .28) return ramp(p,.12,.28,0,48);
    if (p < .43) return 48 + Math.sin((p-.28)/.15*Math.PI*2)*1.8;
    if (p < .57) return ramp(p,.43,.57,48,0);
    if (p < .70) return 0;
    if (p < .80) return ramp(p,.70,.80,0,38);
    if (p < .89) return 38 + Math.sin((p-.80)/.09*Math.PI*2)*1.3;
    if (p < .98) return ramp(p,.89,.98,38,0);
    return 0;
  }

  function animate(now){
    const scene = sceneLayer.querySelector('.xt-dino[data-xt-theme="dino"]');
    if (scene) {
      const head = scene.querySelector('.dino-v5-drink-head');
      if (head) {
        const angle = drinkAngle(now);
        head.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      }
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();

(() => {
  'use strict';

  if (document.getElementById('candleNightlifeStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'candleNightlifeStyleV1';
  style.textContent = `
    .candle-night-stars{
      background:none!important;
      overflow:hidden;
    }
    .candle-random-star{
      position:absolute;
      left:var(--star-x);
      top:var(--star-y);
      width:var(--star-size);
      height:var(--star-size);
      border-radius:50%;
      background:rgba(255,255,255,var(--star-alpha));
      box-shadow:0 0 var(--star-glow) rgba(225,237,255,.58);
      animation:candleRandomStarTwinkle var(--star-speed) ease-in-out var(--star-delay) infinite;
      transform-origin:center;
    }
    .candle-random-star.sparkle::before,
    .candle-random-star.sparkle::after{
      content:'';
      position:absolute;
      left:50%;top:50%;
      background:rgba(255,255,255,.64);
      border-radius:999px;
      transform:translate(-50%,-50%);
    }
    .candle-random-star.sparkle::before{width:1px;height:calc(var(--star-size) * 3.2)}
    .candle-random-star.sparkle::after{height:1px;width:calc(var(--star-size) * 3.2)}
    @keyframes candleRandomStarTwinkle{
      0%,100%{opacity:.35;transform:scale(.78)}
      43%{opacity:1;transform:scale(1.2)}
      66%{opacity:.58;transform:scale(.92)}
    }

    .candle-witch{
      position:absolute;
      left:0;top:0;
      width:126px;height:76px;
      z-index:2;
      opacity:0;
      pointer-events:none;
      will-change:transform,opacity;
      filter:drop-shadow(0 3px 3px rgba(0,0,0,.30));
      transform-origin:center;
    }
    .candle-witch .witch-broom-stick{
      position:absolute;left:8px;top:48px;width:112px;height:4px;
      border-radius:999px;background:#4d3422;transform:rotate(5deg);
    }
    .candle-witch .witch-bristles{
      position:absolute;left:0;top:40px;width:31px;height:22px;
      background:#76502d;
      clip-path:polygon(100% 42%,18% 0,38% 36%,0 28%,31% 56%,6% 75%,43% 69%,24% 100%,100% 59%);
      transform:rotate(5deg);
    }
    .candle-witch .witch-cloak{
      position:absolute;left:57px;top:28px;width:34px;height:38px;
      background:#17131c;
      clip-path:polygon(44% 0,83% 15%,100% 100%,53% 80%,12% 100%,25% 29%);
      border-radius:44% 44% 18% 18%;
    }
    .candle-witch .witch-head{
      position:absolute;left:63px;top:15px;width:17px;height:17px;
      border-radius:50%;background:#1b161e;
    }
    .candle-witch .witch-nose{
      position:absolute;left:78px;top:21px;width:9px;height:5px;
      background:#1b161e;clip-path:polygon(0 0,100% 50%,0 100%);
    }
    .candle-witch .witch-hat-brim{
      position:absolute;left:53px;top:11px;width:37px;height:5px;
      border-radius:50%;background:#120f16;transform:rotate(-4deg);
    }
    .candle-witch .witch-hat{
      position:absolute;left:58px;top:-4px;width:27px;height:19px;
      background:#120f16;clip-path:polygon(16% 100%,51% 0,100% 100%);
      transform:rotate(-7deg);
    }
    .candle-witch .witch-arm{
      position:absolute;left:48px;top:36px;width:25px;height:5px;
      border-radius:999px;background:#17131c;transform:rotate(19deg);transform-origin:right center;
    }
    .candle-witch .witch-leg{
      position:absolute;left:80px;top:55px;width:23px;height:4px;
      border-radius:999px;background:#17131c;transform:rotate(8deg);
    }
    @media(max-width:760px){
      .candle-witch{width:105px;height:64px;transform-origin:center}
    }
  `;
  document.head.appendChild(style);

  let activeScene = null;
  let witchTimer = null;
  let witchAnimation = null;

  function random(min,max){ return min + Math.random() * (max-min); }

  function seedStars(scene){
    const layer = scene?.querySelector('.candle-night-stars');
    if (!layer || layer.dataset.randomStars === 'true') return;
    layer.dataset.randomStars = 'true';

    const count = 115;
    for (let i=0;i<count;i++){
      const star = document.createElement('i');
      star.className = 'candle-random-star' + (Math.random() < .13 ? ' sparkle' : '');
      const size = Math.random() < .12 ? random(2.7,3.8) : random(1.1,2.6);
      star.style.setProperty('--star-x', `${random(1.5,98.5).toFixed(2)}%`);
      star.style.setProperty('--star-y', `${random(2,66).toFixed(2)}%`);
      star.style.setProperty('--star-size', `${size.toFixed(2)}px`);
      star.style.setProperty('--star-alpha', random(.5,.98).toFixed(2));
      star.style.setProperty('--star-glow', `${random(2,7).toFixed(1)}px`);
      star.style.setProperty('--star-speed', `${random(2.1,5.8).toFixed(2)}s`);
      star.style.setProperty('--star-delay', `${(-random(0,5.5)).toFixed(2)}s`);
      layer.appendChild(star);
    }
  }

  function ensureWitch(scene){
    let witch = scene?.querySelector('.candle-witch');
    if (witch) return witch;
    witch = document.createElement('div');
    witch.className = 'candle-witch';
    witch.setAttribute('aria-hidden','true');
    witch.innerHTML = `
      <i class="witch-broom-stick"></i>
      <i class="witch-bristles"></i>
      <i class="witch-cloak"></i>
      <i class="witch-head"></i>
      <i class="witch-nose"></i>
      <i class="witch-hat-brim"></i>
      <i class="witch-hat"></i>
      <i class="witch-arm"></i>
      <i class="witch-leg"></i>`;
    scene.appendChild(witch);
    return witch;
  }

  function launchWitch(scene){
    if (!scene?.isConnected || scene !== activeScene) return;
    const witch = ensureWitch(scene);
    if (!witch) return;

    witchAnimation?.cancel();
    const rect = scene.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const rtl = Math.random() < .38;
    const startX = rtl ? rect.width + 145 : -150;
    const endX = rtl ? -150 : rect.width + 145;
    const y = random(rect.height * .10, rect.height * .38);
    const drift = random(-22,22);
    const scale = random(.72,1.05) * (rect.width < 700 ? .82 : 1);
    const flip = rtl ? -1 : 1;
    const duration = random(8500,13200);

    witch.style.opacity = '0';
    witchAnimation = witch.animate([
      { transform:`translate(${startX}px,${y}px) scale(${flip*scale},${scale}) rotate(-2deg)`, opacity:0 },
      { offset:.08, transform:`translate(${startX + (endX-startX)*.08}px,${y-5}px) scale(${flip*scale},${scale}) rotate(1deg)`, opacity:.82 },
      { offset:.28, transform:`translate(${startX + (endX-startX)*.28}px,${y-15}px) scale(${flip*scale},${scale}) rotate(-3deg)`, opacity:.88 },
      { offset:.53, transform:`translate(${startX + (endX-startX)*.53}px,${y+8}px) scale(${flip*scale},${scale}) rotate(2deg)`, opacity:.90 },
      { offset:.76, transform:`translate(${startX + (endX-startX)*.76}px,${y-11+drift*.35}px) scale(${flip*scale},${scale}) rotate(-2deg)`, opacity:.86 },
      { offset:.93, transform:`translate(${startX + (endX-startX)*.93}px,${y+drift}px) scale(${flip*scale},${scale}) rotate(1deg)`, opacity:.75 },
      { transform:`translate(${endX}px,${y+drift}px) scale(${flip*scale},${scale}) rotate(0deg)`, opacity:0 }
    ],{
      duration,
      easing:'linear',
      fill:'forwards'
    });

    witchAnimation.finished.catch(()=>{}).finally(()=>{
      if (witch.isConnected) witch.style.opacity = '0';
    });
  }

  function scheduleWitch(scene, first=false){
    clearTimeout(witchTimer);
    if (!scene?.isConnected || scene !== activeScene) return;
    const delay = first ? random(4500,8000) : random(10500,22000);
    witchTimer = setTimeout(()=>{
      if (!scene.isConnected || scene !== activeScene) return;
      launchWitch(scene);
      scheduleWitch(scene,false);
    },delay);
  }

  function attach(scene){
    if (!scene) return;
    seedStars(scene);
    ensureWitch(scene);
    if (scene !== activeScene){
      witchAnimation?.cancel();
      clearTimeout(witchTimer);
      activeScene = scene;
      scheduleWitch(scene,true);
    }
  }

  function syncScene(){
    const scene = sceneLayer.querySelector('.candle-scene');
    if (!scene){
      if (activeScene){
        witchAnimation?.cancel();
        clearTimeout(witchTimer);
      }
      activeScene = null;
      return;
    }
    attach(scene);
  }

  const observer = new MutationObserver(syncScene);
  observer.observe(sceneLayer,{childList:true,subtree:true});
  syncScene();
})();

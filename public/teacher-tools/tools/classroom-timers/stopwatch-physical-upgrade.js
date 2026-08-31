(() => {
  'use strict';

  if (window.__stopwatchPhysicalUpgradeV10) return;
  window.__stopwatchPhysicalUpgradeV10 = true;

  const style = document.createElement('style');
  style.id = 'stopwatchPhysicalUpgradeStyleV10';
  style.textContent = `
    /* Keep the legacy hand node only so older stopwatch code can still reference it safely. */
    .stopwatch-finger{display:none!important}

    /* There is now one stopwatch appearance only, so hide the old style selector. */
    #stopwatchWorkspace .mode-toolbar .select-label{display:none!important}

    /* Drop the entire watch assembly slightly so the crown/loop are not clipped. */
    .stopwatch-body{
      overflow:visible!important;
      top:28px!important;
    }

    /* Keep the dotted circular scale, but remove the horizontal/vertical crosshair lines. */
    .watch-track::before,
    .watch-track::after{
      content:none!important;
      display:none!important;
    }

    .stopwatch-crown{
      left:50%!important;
      top:-33px!important;
      width:88px!important;
      height:46px!important;
      transform:translateX(-50%) translateY(0)!important;
      transform-origin:50% 100%!important;
      border-radius:11px 11px 5px 5px!important;
      background:repeating-linear-gradient(90deg,#697279 0 6px,#bac3c8 6px 11px)!important;
      box-shadow:inset 0 2px 0 rgba(255,255,255,.3),0 6px 8px rgba(0,0,0,.25)!important;
      transition:transform .11s ease,box-shadow .11s ease!important;
    }
    .stopwatch-crown::after{
      content:"";
      position:absolute;
      left:50%;
      bottom:-20px;
      width:48px;
      height:22px;
      transform:translateX(-50%);
      border-radius:3px 3px 8px 8px;
      background:linear-gradient(90deg,#69737b,#c0c9ce 50%,#707a82);
      box-shadow:inset 0 -2px 3px rgba(0,0,0,.16);
    }

    /* Side pushers sit close to the case. Their stems overlap the case edge so there is no visible gap. */
    .stopwatch-side{
      top:24px!important;
      width:64px!important;
      height:30px!important;
      border-radius:9px!important;
      background:linear-gradient(180deg,#e0e5e8 0%,#aeb8be 48%,#727d84 100%)!important;
      box-shadow:inset 0 2px 0 rgba(255,255,255,.36),0 5px 7px rgba(0,0,0,.22)!important;
      transition:transform .11s ease,box-shadow .11s ease!important;
    }
    .stopwatch-side.side-left{
      left:18px!important;
      transform:rotate(-34deg) translateY(0)!important;
      transform-origin:100% 50%!important;
    }
    .stopwatch-side.side-right{
      right:18px!important;
      transform:rotate(34deg) translateY(0)!important;
      transform-origin:0 50%!important;
    }
    .stopwatch-side::after{
      content:"";
      position:absolute;
      top:8px;
      width:40px;
      height:14px;
      border-radius:5px;
      background:linear-gradient(180deg,#cbd3d7 0%,#9da8ae 48%,#778188 100%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.28);
    }
    .stopwatch-side.side-left::after{right:-34px}
    .stopwatch-side.side-right::after{left:-34px}

    .stopwatch-crown.sw-pressed{
      transform:translateX(-50%) translateY(8px)!important;
      box-shadow:inset 0 2px 4px rgba(0,0,0,.18),0 1px 3px rgba(0,0,0,.2)!important;
    }
    .stopwatch-side.side-left.sw-pressed{
      transform:rotate(-34deg) translateY(8px)!important;
      box-shadow:inset 0 2px 4px rgba(0,0,0,.16),0 1px 3px rgba(0,0,0,.18)!important;
    }
    .stopwatch-side.side-right.sw-pressed{
      transform:rotate(34deg) translateY(8px)!important;
      box-shadow:inset 0 2px 4px rgba(0,0,0,.16),0 1px 3px rgba(0,0,0,.18)!important;
    }

    /* Dark mode should affect the stopwatch scene as clearly as the rest of the app. */
    html[data-theme="dark"] .stopwatch-stage{
      background:radial-gradient(circle at 38% 42%,#314352 0%,#1a2733 48%,#0a1118 100%)!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 18px 45px rgba(0,0,0,.28)!important;
    }
    html[data-theme="dark"] .stopwatch-scene{filter:drop-shadow(0 20px 24px rgba(0,0,0,.28))}

    @media(max-width:760px){
      .stopwatch-finger{display:none!important}
      .stopwatch-body{top:24px!important}
    }
  `;
  document.head.appendChild(style);

  const normaliseStyle = () => {
    const selector = document.getElementById('stopwatchStyle');
    const stage = document.getElementById('stopwatchStage');
    if (selector) selector.value = 'classic';
    if (stage) {
      stage.classList.remove('style-track','style-mission','style-retro');
      stage.classList.add('style-classic');
    }
    try { localStorage.setItem('ttTimers.stopwatchStyle', JSON.stringify('classic')); } catch {}
  };

  normaliseStyle();
  requestAnimationFrame(normaliseStyle);
  window.addEventListener('load', normaliseStyle, {once:true});

  const press = selector => {
    const pusher = document.querySelector(selector);
    if (!pusher) return;
    pusher.classList.remove('sw-pressed');
    void pusher.offsetWidth;
    pusher.classList.add('sw-pressed');
    clearTimeout(pusher.__swPressTimer);
    pusher.__swPressTimer = setTimeout(() => pusher.classList.remove('sw-pressed'), 140);
  };

  document.getElementById('stopwatchStartBtn')?.addEventListener('click', () => press('.stopwatch-crown'), {capture:true});
  document.getElementById('stopwatchResetBtn')?.addEventListener('click', () => press('.stopwatch-side.side-left'), {capture:true});
  document.getElementById('lapBtn')?.addEventListener('click', () => press('.stopwatch-side.side-right'), {capture:true});

  document.addEventListener('keydown', event => {
    const workspace = document.getElementById('stopwatchWorkspace');
    if (!workspace?.classList.contains('active')) return;
    const tag = document.activeElement?.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    if (event.code === 'Space') press('.stopwatch-crown');
    else if (event.key.toLowerCase() === 'r') press('.stopwatch-side.side-left');
  }, {capture:true});

  const loadUpgrades = () => {
    if (!document.querySelector('script[data-clock-display-upgrade]')) {
      const clockScript = document.createElement('script');
      clockScript.src = 'analogue-clock-upgrade.js?v=4';
      clockScript.dataset.clockDisplayUpgrade = 'true';
      document.head.appendChild(clockScript);
    }
    if (!document.querySelector('script[data-scenic-dvd-upgrade]')) {
      const scenicScript = document.createElement('script');
      scenicScript.src = 'scenic-dvd-upgrade.js?v=4';
      scenicScript.dataset.scenicDvdUpgrade = 'true';
      document.head.appendChild(scenicScript);
    }
    if (!document.querySelector('script[data-presentation-fullscreen-upgrade]')) {
      const presentationScript = document.createElement('script');
      presentationScript.src = 'presentation-fullscreen-upgrade.js?v=2';
      presentationScript.dataset.presentationFullscreenUpgrade = 'true';
      document.head.appendChild(presentationScript);
    }
    if (!document.querySelector('script[data-pastel-workspace-upgrade]')) {
      const pastelScript = document.createElement('script');
      pastelScript.src = 'pastel-workspace-upgrade.js?v=1';
      pastelScript.dataset.pastelWorkspaceUpgrade = 'true';
      document.head.appendChild(pastelScript);
    }
  };
  if (document.readyState === 'complete') loadUpgrades();
  else window.addEventListener('load', loadUpgrades, {once:true});
})();

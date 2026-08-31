(() => {
  'use strict';

  if (window.__clockDisplayUpgradeV4) return;
  window.__clockDisplayUpgradeV4 = true;

  const stage = document.getElementById('clockStage');
  const digital = document.getElementById('digitalClock');
  const analogue = document.getElementById('analogueClock');
  const flip = document.getElementById('flipClock');
  const scenic = document.getElementById('scenicClock');
  const srcHour = document.getElementById('flipHour');
  const srcMinute = document.getElementById('flipMinute');
  const srcSecond = document.getElementById('flipSecond');
  if (!stage || !digital || !analogue || !flip || !scenic || !srcHour || !srcMinute || !srcSecond) return;

  const style = document.createElement('style');
  style.id = 'clockDisplayUpgradeStyleV4';
  style.textContent = `
    #clockStage .clock-view[hidden]{display:none!important}
    #clockStage .clock-view.clock-upgrade-visible{display:grid!important}

    /* Proper analogue clock */
    #analogueClock.clock-upgrade-visible{place-items:center!important;width:100%;height:100%}
    #analogueClock .clock-face{
      position:relative;width:min(72vw,520px)!important;aspect-ratio:1!important;border:22px solid #e3edf2!important;
      border-radius:50%!important;background:radial-gradient(circle at 50% 50%,#fff 0 58%,#f3f5f5 76%,#dce3e6 100%)!important;
      box-shadow:0 22px 50px rgba(0,0,0,.35),inset 0 0 22px rgba(0,0,0,.14),inset 0 0 0 3px #9aa8b1!important;color:#21313d
    }
    #analogueClock .clock-tick{position:absolute;left:50%;top:50%;width:2px;height:9px;margin-left:-1px;margin-top:-4px;border-radius:2px;background:#495761;transform-origin:1px 4px;opacity:.68;z-index:2;pointer-events:none}
    #analogueClock .clock-tick.major{width:4px;height:18px;margin-left:-2px;margin-top:-9px;background:#22323e;opacity:1}
    #analogueClock .clock-number{position:absolute!important;left:50%!important;top:50%!important;font-family:var(--display)!important;font-size:2.1rem!important;line-height:1!important;font-weight:800!important;color:#25343f!important;transform:translate(-50%,-50%)!important;z-index:4}
    #analogueClock .clock-hand{position:absolute!important;left:50%!important;bottom:50%!important;transform-origin:50% 100%!important;border-radius:999px 999px 5px 5px!important;z-index:6!important;box-shadow:0 2px 3px rgba(0,0,0,.18)}
    #analogueClock .clock-hand.hour{width:12px!important;height:27%!important;background:#26333c!important}
    #analogueClock .clock-hand.minute{width:8px!important;height:38%!important;background:#3b4d5a!important}
    #analogueClock .clock-hand.second{width:3px!important;height:42%!important;background:#e4574c!important;box-shadow:none!important}
    #analogueClock .clock-hand.second::after{content:"";position:absolute;left:50%;bottom:-17%;width:3px;height:20%;transform:translateX(-50%);background:#e4574c;border-radius:3px}
    #analogueClock .clock-pin{position:absolute!important;z-index:8!important;left:50%!important;top:50%!important;width:22px!important;height:22px!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;background:#e4574c!important;box-shadow:0 2px 4px rgba(0,0,0,.25),inset 0 2px 2px rgba(255,255,255,.25)!important}

    /* App-core keeps these source nodes updated; the custom renderer below owns the visible flip clock. */
    #flipClock > #flipHour,
    #flipClock > #flipMinute,
    #flipClock > #flipSecond,
    #flipClock > span{display:none!important}

    #flipClock.clock-upgrade-visible{
      display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;
      width:100%!important;height:100%!important;padding:32px 22px!important;box-sizing:border-box!important;overflow:hidden!important
    }
    .split-flap-row{
      display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;
      flex-wrap:nowrap!important;gap:clamp(7px,1.4vw,20px)!important;width:100%!important;max-width:1040px!important
    }
    .split-flap-sep{
      flex:0 0 auto;color:#f7f7f4;font-family:var(--display)!important;font-size:clamp(3.2rem,6.2vw,6.4rem)!important;
      font-weight:800;line-height:1;transform:translateY(-.06em);text-shadow:0 4px 12px rgba(0,0,0,.24)
    }
    .split-flap-card{
      --card-w:clamp(105px,18vw,205px);--card-h:clamp(140px,23vw,255px);
      position:relative;flex:0 1 var(--card-w);width:var(--card-w);height:var(--card-h);min-width:0;
      perspective:950px;transform-style:preserve-3d;border-radius:18px;
      box-shadow:0 20px 38px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.08);background:#142b3e
    }
    .split-flap-static-half,
    .split-flap-face{
      position:absolute;left:0;width:100%;height:50%;overflow:hidden;color:#f8f8f4;
      font-family:var(--display)!important;font-weight:800;letter-spacing:-.045em;text-shadow:0 4px 0 rgba(0,0,0,.15)
    }
    .split-flap-static-half.top,
    .split-flap-face.front{
      top:0;border-radius:18px 18px 0 0;background:linear-gradient(180deg,#304e66,#263f54);border-bottom:1px solid rgba(0,0,0,.58)
    }
    .split-flap-static-half.bottom,
    .split-flap-face.back{
      bottom:0;border-radius:0 0 18px 18px;background:linear-gradient(180deg,#1d374c,#152b3e);border-top:1px solid rgba(255,255,255,.05)
    }
    .split-flap-number{
      position:absolute;left:0;width:100%;height:200%;display:flex;align-items:center;justify-content:center;
      font-size:clamp(4.4rem,10vw,8.8rem)!important;line-height:1
    }
    .split-flap-static-half.top .split-flap-number,
    .split-flap-face.front .split-flap-number{top:0}
    .split-flap-static-half.bottom .split-flap-number,
    .split-flap-face.back .split-flap-number{top:-100%}

    /* One physical flap rotates continuously through 180 degrees around the centre hinge. */
    .split-flap-flipper{
      position:absolute;left:0;top:0;width:100%;height:50%;z-index:7;
      transform-origin:50% 100%;transform-style:preserve-3d;will-change:transform,filter
    }
    .split-flap-face{
      inset:0;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.07)
    }
    .split-flap-face.front{z-index:2}
    .split-flap-face.back{
      top:0;bottom:auto;transform:rotateX(180deg);z-index:1;
      border-radius:0 0 18px 18px
    }
    .split-flap-card::after{
      content:"";position:absolute;left:0;right:0;bottom:0;height:50%;z-index:5;pointer-events:none;
      border-radius:0 0 18px 18px;background:linear-gradient(180deg,rgba(0,0,0,.42),rgba(0,0,0,0));opacity:0
    }
    .split-flap-card.flipping::after{animation:splitFlapShadow .68s ease-out}
    @keyframes splitFlapShadow{
      0%{opacity:.04} 38%{opacity:.12} 52%{opacity:.36} 72%{opacity:.18} 100%{opacity:0}
    }
    .split-flap-hinge{
      position:absolute;left:0;right:0;top:50%;height:2px;transform:translateY(-1px);background:#091723;z-index:10;
      box-shadow:0 -1px 0 rgba(255,255,255,.07),0 1px 0 rgba(0,0,0,.38);pointer-events:none
    }
    .split-flap-hinge::before,.split-flap-hinge::after{content:"";position:absolute;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#0a1925;box-shadow:inset 0 1px 1px rgba(255,255,255,.08)}
    .split-flap-hinge::before{left:9px}.split-flap-hinge::after{right:9px}

    html[data-theme="dark"] #clockStage{background:linear-gradient(145deg,#101c27,#071019)!important}
    html[data-theme="dark"] #analogueClock .clock-face{border-color:#788792!important;background:radial-gradient(circle,#27333d 0 62%,#1d2730 78%,#121a21 100%)!important;color:#eef5f8!important;box-shadow:0 22px 50px rgba(0,0,0,.55),inset 0 0 24px rgba(0,0,0,.42),inset 0 0 0 3px #485761!important}
    html[data-theme="dark"] #analogueClock .clock-number{color:#eef5f8!important}
    html[data-theme="dark"] #analogueClock .clock-tick{background:#b9c7d0!important}
    html[data-theme="dark"] #analogueClock .clock-hand.hour,
    html[data-theme="dark"] #analogueClock .clock-hand.minute{background:#f0f5f7!important}

    @media(max-width:760px){
      #flipClock.clock-upgrade-visible{padding:18px 8px!important}
      .split-flap-row{gap:5px!important}
      .split-flap-card{--card-w:clamp(72px,24vw,112px);--card-h:clamp(98px,30vw,145px);border-radius:12px}
      .split-flap-static-half.top,.split-flap-face.front{border-radius:12px 12px 0 0}
      .split-flap-static-half.bottom,.split-flap-face.back{border-radius:0 0 12px 12px}
      .split-flap-number{font-size:clamp(3rem,14vw,5.1rem)!important}
      .split-flap-sep{font-size:clamp(2.1rem,7vw,3.2rem)!important}
      #analogueClock .clock-face{width:min(84vw,430px)!important;border-width:16px!important}
    }
  `;
  document.head.appendChild(style);

  /* Build full analogue face. */
  const face = analogue.querySelector('.clock-face');
  if (face && !face.dataset.fullAnalogueFace) {
    face.dataset.fullAnalogueFace = 'true';
    face.querySelectorAll('.clock-number').forEach(el => el.remove());
    const tickLayer = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) {
      const tick = document.createElement('i');
      tick.className = `clock-tick${i % 5 === 0 ? ' major' : ''}`;
      tick.style.transform = `rotate(${i * 6}deg) translateY(-226px)`;
      tickLayer.appendChild(tick);
    }
    face.prepend(tickLayer);
    for (let n = 1; n <= 12; n++) {
      const number = document.createElement('div');
      number.className = 'clock-number';
      number.textContent = String(n);
      const angle = n * Math.PI / 6;
      const radius = 39;
      number.style.left = `${50 + Math.sin(angle) * radius}%`;
      number.style.top = `${50 - Math.cos(angle) * radius}%`;
      face.appendChild(number);
    }
  }

  /* Dedicated split-flap renderer. */
  flip.querySelector('.split-flap-row')?.remove();
  const row = document.createElement('div');
  row.className = 'split-flap-row';
  row.innerHTML = `
    <div class="split-flap-card" data-flap="hour"></div>
    <div class="split-flap-sep">:</div>
    <div class="split-flap-card" data-flap="minute"></div>
    <div class="split-flap-sep">:</div>
    <div class="split-flap-card" data-flap="second"></div>`;
  flip.appendChild(row);

  function buildCard(root, value) {
    root.dataset.value = value;
    root.innerHTML = `
      <div class="split-flap-static-half top"><div class="split-flap-number">${value}</div></div>
      <div class="split-flap-static-half bottom"><div class="split-flap-number">${value}</div></div>
      <div class="split-flap-flipper">
        <div class="split-flap-face front"><div class="split-flap-number">${value}</div></div>
        <div class="split-flap-face back"><div class="split-flap-number">${value}</div></div>
      </div>
      <div class="split-flap-hinge"></div>`;
    return {
      root,
      staticTop: root.querySelector('.split-flap-static-half.top .split-flap-number'),
      staticBottom: root.querySelector('.split-flap-static-half.bottom .split-flap-number'),
      flipper: root.querySelector('.split-flap-flipper'),
      front: root.querySelector('.split-flap-face.front .split-flap-number'),
      back: root.querySelector('.split-flap-face.back .split-flap-number'),
      animation: null,
      queuedValue: null
    };
  }

  const cards = {
    hour: buildCard(row.querySelector('[data-flap="hour"]'), srcHour.textContent.trim() || '00'),
    minute: buildCard(row.querySelector('[data-flap="minute"]'), srcMinute.textContent.trim() || '00'),
    second: buildCard(row.querySelector('[data-flap="second"]'), srcSecond.textContent.trim() || '00')
  };

  function commitCard(card, value) {
    card.staticTop.textContent = value;
    card.staticBottom.textContent = value;
    card.front.textContent = value;
    card.back.textContent = value;
    card.root.dataset.value = value;
    card.root.classList.remove('flipping');
    card.flipper.style.transform = 'rotateX(0deg)';
  }

  function flipTo(card, nextValue) {
    const current = card.root.dataset.value || '';
    if (nextValue === current && !card.animation) return;

    if (card.animation) {
      card.queuedValue = nextValue;
      return;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      commitCard(card, nextValue);
      return;
    }

    /* Behind the moving flap: the new top is already waiting, while the old bottom stays put. */
    card.staticTop.textContent = nextValue;
    card.staticBottom.textContent = current;
    card.front.textContent = current;
    card.back.textContent = nextValue;
    card.root.classList.add('flipping');

    card.animation = card.flipper.animate([
      {transform:'rotateX(0deg)', filter:'brightness(1)', offset:0},
      {transform:'rotateX(-55deg)', filter:'brightness(.83)', offset:.30},
      {transform:'rotateX(-88deg)', filter:'brightness(.48)', offset:.47},
      {transform:'rotateX(-94deg)', filter:'brightness(.50)', offset:.53},
      {transform:'rotateX(-128deg)', filter:'brightness(.72)', offset:.72},
      {transform:'rotateX(-180deg)', filter:'brightness(1)', offset:1}
    ], {
      duration:680,
      easing:'cubic-bezier(.38,.04,.18,1)',
      fill:'forwards'
    });

    const finish = () => {
      const anim = card.animation;
      card.animation = null;
      anim?.cancel();
      commitCard(card, nextValue);

      const queued = card.queuedValue;
      card.queuedValue = null;
      if (queued && queued !== nextValue) requestAnimationFrame(() => flipTo(card, queued));
    };

    card.animation.finished.then(finish).catch(() => {
      card.animation = null;
      commitCard(card, nextValue);
    });
  }

  function syncFlip() {
    flipTo(cards.hour, srcHour.textContent.trim() || '00');
    flipTo(cards.minute, srcMinute.textContent.trim() || '00');
    flipTo(cards.second, srcSecond.textContent.trim() || '00');
  }

  const observer = new MutationObserver(syncFlip);
  [srcHour, srcMinute, srcSecond].forEach(source => observer.observe(source, {childList:true,subtree:true,characterData:true}));

  const views = {digital, analogue, flip, scenic};
  function show(styleName) {
    const name = Object.prototype.hasOwnProperty.call(views, styleName) ? styleName : 'digital';
    Object.entries(views).forEach(([key, view]) => {
      const active = key === name;
      view.hidden = !active;
      view.classList.toggle('clock-upgrade-visible', active);
      view.style.display = active ? (key === 'flip' ? 'flex' : 'grid') : 'none';
    });
    document.querySelectorAll('[data-clock-style]').forEach(button => button.classList.toggle('active', button.dataset.clockStyle === name));
    try { localStorage.setItem('ttTimers.clockStyle', JSON.stringify(name)); } catch {}
    if (name === 'flip') syncFlip();
  }

  document.querySelectorAll('[data-clock-style]').forEach(button => {
    button.addEventListener('click', () => requestAnimationFrame(() => show(button.dataset.clockStyle)));
  });

  let stored = 'digital';
  try { stored = JSON.parse(localStorage.getItem('ttTimers.clockStyle') || '"digital"'); } catch {}
  requestAnimationFrame(() => show(stored));
})();
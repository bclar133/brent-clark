(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const flipBtn = $('#flipCoinBtn');
  const flipAgainBtn = $('#flipCoinAgainBtn');
  const coinStage = $('.coin-stage');
  const originalScene = $('.coin-scene', coinStage);
  const coinResult = $('#coinResult');
  const coinStatus = $('#coinStatus');
  const headsLabel = $('#headsLabel');
  const tailsLabel = $('#tailsLabel');
  const controls = $('[data-panel="coin"] .controls-panel');
  const choiceNote = $('.coin-choice-note', controls);

  if (!flipBtn || !flipAgainBtn || !coinStage || !originalScene || !coinResult || !coinStatus || !controls) return;

  let busy = false;
  let audioContext = null;

  const countField = document.createElement('label');
  countField.className = 'field-label coin-count-field';
  countField.innerHTML = `
    Number of coins
    <span class="coin-count-stepper">
      <input id="coinCount" type="number" inputmode="numeric" min="1" max="10" value="1" step="1" aria-label="Number of coins">
      <span class="coin-step-buttons">
        <button id="coinCountUp" class="coin-step-button" type="button" aria-label="Increase number of coins">▲</button>
        <button id="coinCountDown" class="coin-step-button" type="button" aria-label="Decrease number of coins">▼</button>
      </span>
    </span>
  `;
  controls.insertBefore(countField, choiceNote || flipBtn);

  const coinCountInput = $('#coinCount');
  const coinCountUp = $('#coinCountUp');
  const coinCountDown = $('#coinCountDown');

  const coinResults = document.createElement('div');
  coinResults.id = 'coinResults';
  coinResults.className = 'coin-results';
  coinStage.insertBefore(coinResults, originalScene);
  originalScene.classList.add('multi-coin-scene');
  coinResults.append(originalScene);

  function clampCount(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 1;
  }

  function currentCount() {
    const count = clampCount(coinCountInput.value);
    coinCountInput.value = count;
    return count;
  }

  function cleanLabel(input, fallback) {
    const value = input?.value?.trim().slice(0, 24);
    return value || fallback;
  }

  function setCoinFace(coin, isHeads) {
    coin.style.transform = '';
    coin.classList.remove('flipping-to-heads', 'flipping-to-tails', 'show-heads', 'show-tails');
    coin.classList.add(isHeads ? 'show-heads' : 'show-tails');
    const scene = coin.closest('.coin-scene');
    const shadow = $('.coin-shadow', scene);
    if (shadow) {
      shadow.style.transform = '';
      shadow.style.opacity = '';
    }
  }

  function cloneScene() {
    const scene = originalScene.cloneNode(true);
    scene.classList.add('multi-coin-scene');
    $$('[id]', scene).forEach(node => node.removeAttribute('id'));
    const coin = $('.coin', scene);
    setCoinFace(coin, true);
    return scene;
  }

  function ensureCoins(count, reset = false) {
    while (coinResults.children.length < count) coinResults.append(cloneScene());
    while (coinResults.children.length > count) coinResults.lastElementChild.remove();
    coinResults.dataset.count = String(count);
    coinStage.classList.toggle('multi-coin-stage', count > 1);
    if (reset) {
      $$('.coin', coinResults).forEach(coin => setCoinFace(coin, true));
      coinResult.textContent = 'Ready to flip';
      coinStatus.textContent = 'Ready';
    }
  }

  function stepCount(delta) {
    if (busy) return;
    coinCountInput.value = Math.min(10, Math.max(1, currentCount() + delta));
    ensureCoins(currentCount(), true);
    coinCountInput.focus();
  }

  coinCountUp.addEventListener('click', () => stepCount(1));
  coinCountDown.addEventListener('click', () => stepCount(-1));
  coinCountInput.addEventListener('change', () => {
    if (busy) return;
    ensureCoins(currentCount(), true);
  });
  coinCountInput.addEventListener('blur', () => {
    if (!busy) ensureCoins(currentCount(), false);
  });

  function getAudioContext() {
    if (localStorage.getItem('chalkboxRandomiserMuted') === 'true') return null;
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function tone(freq, duration = .05, volume = .018, type = 'triangle', delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + .02);
  }

  function flipStartSound() {
    tone(720, .05, .018, 'triangle');
    tone(980, .05, .014, 'sine', .18);
  }

  function landingSound(index) {
    tone(560 + (index % 4) * 35, .08, .018, 'triangle');
  }

  function animateCoin(scene, isHeads, delayMs, index) {
    return new Promise(resolve => {
      setTimeout(() => {
        const coin = $('.coin', scene);
        const shadow = $('.coin-shadow', scene);
        const startsTails = coin.classList.contains('show-tails');
        const startAngle = startsTails ? 180 : 0;
        const targetAngle = isHeads ? 0 : 180;
        const delta = 1440 + targetAngle - startAngle;
        const endAngle = startAngle + delta;
        const duration = 1450;
        const size = Math.max(80, coin.getBoundingClientRect().width || 172);
        const liftAmount = Math.min(92, Math.max(48, size * .43));

        coin.classList.remove('show-heads', 'show-tails', 'flipping-to-heads', 'flipping-to-tails');
        const started = performance.now();

        function frame(now) {
          const progress = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - progress, 2.15);
          const angle = startAngle + (endAngle - startAngle) * eased;
          const arc = Math.sin(Math.PI * progress);
          const lift = -liftAmount * arc;
          const scale = 1 - (.075 * arc);

          coin.style.transform = `translateY(${lift.toFixed(1)}px) rotateX(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
          if (shadow) {
            const shadowScale = 1 - (.5 * arc);
            shadow.style.transform = `scale(${shadowScale.toFixed(3)})`;
            shadow.style.opacity = String((1 - (.7 * arc)).toFixed(3));
          }

          if (progress < 1) {
            requestAnimationFrame(frame);
          } else {
            setCoinFace(coin, isHeads);
            landingSound(index);
            resolve();
          }
        }

        requestAnimationFrame(frame);
      }, delayMs);
    });
  }

  function resultSummary(outcomes) {
    const heads = cleanLabel(headsLabel, 'Heads');
    const tails = cleanLabel(tailsLabel, 'Tails');
    if (outcomes.length === 1) return outcomes[0] ? heads : tails;
    const headsCount = outcomes.filter(Boolean).length;
    const tailsCount = outcomes.length - headsCount;
    const parts = [];
    if (headsCount) parts.push(`${heads} × ${headsCount}`);
    if (tailsCount) parts.push(`${tails} × ${tailsCount}`);
    return parts.join(' · ');
  }

  async function flipMany() {
    if (busy) return;
    const count = currentCount();
    if (count === 1) return;

    busy = true;
    coinCountInput.disabled = true;
    coinCountUp.disabled = true;
    coinCountDown.disabled = true;
    ensureCoins(count, false);

    const scenes = $$('.coin-scene', coinResults);
    const outcomes = Array.from({ length: count }, () => Math.random() < .5);
    coinStatus.textContent = `Flipping ${count} coins…`;
    coinResult.textContent = '…';
    flipStartSound();

    await Promise.all(outcomes.map((isHeads, index) => animateCoin(scenes[index], isHeads, index * 250, index)));

    const summary = resultSummary(outcomes);
    coinResult.textContent = summary;
    coinStatus.textContent = `${count} coins · ${summary}`;

    coinCountInput.disabled = false;
    coinCountUp.disabled = false;
    coinCountDown.disabled = false;
    busy = false;
  }

  function interceptFlip(event) {
    if (currentCount() === 1) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    flipMany();
  }

  flipBtn.addEventListener('click', interceptFlip, true);
  flipAgainBtn.addEventListener('click', interceptFlip, true);

  document.addEventListener('keydown', event => {
    if (currentCount() === 1 || busy) return;
    const activeMode = $('.workspace-tab.active')?.dataset.workspace;
    const tag = event.target?.tagName?.toLowerCase();
    if (activeMode !== 'coin' || ['input', 'select', 'textarea'].includes(tag)) return;
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopImmediatePropagation();
      flipMany();
    }
  }, true);

  const clearCoinBtn = $('[data-clear-mode="coin"]');
  clearCoinBtn?.addEventListener('click', () => {
    if (busy) return;
    ensureCoins(currentCount(), true);
  });

  ensureCoins(1, false);
})();

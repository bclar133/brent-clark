(() => {
  'use strict';

  const select = document.querySelector('#dieSides');
  const wrap = document.querySelector('#customSidesWrap');
  const customInput = document.querySelector('#customSides');
  const diceCount = document.querySelector('#diceCount');
  const diceResults = document.querySelector('#diceResults');
  const rollButtons = [document.querySelector('#rollDiceBtn'), document.querySelector('#rollDiceAgainBtn')].filter(Boolean);

  if (!select || !wrap || !customInput) return;

  /*
   * Dice controls: keep the custom-sided field visible, but only enable it
   * when Custom die is selected.
   */
  function syncCustomDieField() {
    const enabled = select.value === 'custom';
    wrap.hidden = false;
    wrap.classList.toggle('disabled', !enabled);
    customInput.disabled = !enabled;
    customInput.setAttribute('aria-disabled', String(!enabled));
  }

  select.addEventListener('change', syncCustomDieField);
  syncCustomDieField();

  /*
   * Add the control sizing here rather than relying on the cached stylesheet.
   * Also suppress the old tumbling animations so the dice can shake instead.
   */
  const style = document.createElement('style');
  style.textContent = `
    .controls-panel .field-label,
    .controls-panel .form-grid label {
      font-size: 1rem !important;
      line-height: 1.35;
    }

    #dieSides,
    #customSides,
    #diceCount {
      min-height: 60px !important;
      font-size: 1.18rem !important;
      padding-left: 16px !important;
      font-weight: 900 !important;
    }

    #dieSides {
      padding-right: 46px !important;
    }

    .custom-sides-field .field-help {
      font-size: .88rem !important;
      line-height: 1.45;
    }

    .custom-sides-field.disabled {
      opacity: .48;
    }

    .custom-sides-field.disabled input {
      background: color-mix(in srgb, var(--panel-strong) 76%, #c9cec9) !important;
      cursor: not-allowed;
    }

    .dice-count-stepper {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 54px;
      min-width: 0;
    }

    .dice-count-stepper #diceCount {
      grid-column: 1 / -1;
      grid-row: 1;
      padding-right: 66px !important;
      appearance: textfield;
      -moz-appearance: textfield;
    }

    .dice-count-stepper #diceCount::-webkit-inner-spin-button,
    .dice-count-stepper #diceCount::-webkit-outer-spin-button {
      appearance: none;
      margin: 0;
    }

    .dice-step-buttons {
      grid-column: 2;
      grid-row: 1;
      z-index: 2;
      display: grid;
      grid-template-rows: 1fr 1fr;
      margin: 4px 4px 4px 0;
      overflow: hidden;
      border-left: 1px solid var(--line);
      border-radius: 0 10px 10px 0;
    }

    .dice-step-button {
      min-width: 48px;
      min-height: 0;
      padding: 0;
      border: 0;
      background: color-mix(in srgb, var(--panel-strong) 90%, var(--gold-soft));
      color: var(--ink);
      font-size: 1.15rem;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
    }

    .dice-step-button + .dice-step-button {
      border-top: 1px solid var(--line);
    }

    .dice-step-button:hover {
      background: var(--gold-soft);
    }

    /* The old CSS tumble is deliberately removed. Movement is driven by JS. */
    #diceResults .die.rolling,
    #diceResults .die.landed {
      animation: none !important;
      transform-style: flat !important;
    }

    #diceResults .die.rolling {
      will-change: transform;
      transition: transform 45ms linear !important;
    }

    #diceResults .die.landed {
      transition: transform 150ms ease-out !important;
    }
  `;
  document.head.append(style);

  /*
   * Replace the tiny browser number spinners with larger, consistent controls.
   * The number itself remains directly editable.
   */
  if (diceCount && !diceCount.closest('.dice-count-stepper')) {
    const stepper = document.createElement('div');
    stepper.className = 'dice-count-stepper';
    diceCount.parentNode.insertBefore(stepper, diceCount);
    stepper.append(diceCount);

    const buttons = document.createElement('span');
    buttons.className = 'dice-step-buttons';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'dice-step-button';
    up.textContent = '▲';
    up.setAttribute('aria-label', 'Increase number of dice');

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'dice-step-button';
    down.textContent = '▼';
    down.setAttribute('aria-label', 'Decrease number of dice');

    function stepDiceCount(delta) {
      const current = Number.parseInt(diceCount.value, 10);
      const next = Math.min(12, Math.max(1, (Number.isFinite(current) ? current : 1) + delta));
      diceCount.value = String(next);
      diceCount.dispatchEvent(new Event('input', { bubbles: true }));
      diceCount.dispatchEvent(new Event('change', { bubbles: true }));
      diceCount.focus();
    }

    up.addEventListener('click', () => stepDiceCount(1));
    down.addEventListener('click', () => stepDiceCount(-1));
    buttons.append(up, down);
    stepper.append(buttons);
  }

  /*
   * The main app redraws the rolling dice every ~100 ms to change their face.
   * A MutationObserver catches each redraw immediately and applies a fresh,
   * small random X/Y offset and rotation. This produces a genuine irregular
   * shake rather than a repeated spin/tumble.
   */
  let shakeInterval = null;
  let shakeTimeout = null;
  let shakeObserver = null;
  let shaking = false;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function shakeCurrentDice() {
    if (!diceResults || !shaking) return;
    const dice = [...diceResults.querySelectorAll('.die.rolling')];
    dice.forEach((die, index) => {
      const x = randomBetween(-10, 10);
      const y = randomBetween(-7, 7);
      const rotation = randomBetween(-5.5, 5.5);
      /* Slight per-die variation stops multiple dice moving as one block. */
      const extraX = index % 2 === 0 ? -1.5 : 1.5;
      die.style.transform = `translate(${(x + extraX).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(1)}deg)`;
    });
  }

  function finishShake() {
    shaking = false;
    if (shakeInterval) clearInterval(shakeInterval);
    if (shakeTimeout) clearTimeout(shakeTimeout);
    shakeInterval = null;
    shakeTimeout = null;
    if (shakeObserver) shakeObserver.disconnect();
    shakeObserver = null;

    if (!diceResults) return;
    [...diceResults.querySelectorAll('.die')].forEach(die => {
      die.style.transform = 'translate(0px, 0px) rotate(0deg)';
    });
  }

  function beginShake() {
    if (!diceResults) return;
    finishShake();
    shaking = true;

    shakeObserver = new MutationObserver(() => {
      if (shaking) shakeCurrentDice();
    });
    shakeObserver.observe(diceResults, { childList: true });

    /* Use an intentionally uneven-feeling redraw cadence. */
    shakeCurrentDice();
    shakeInterval = setInterval(shakeCurrentDice, 58);
    shakeTimeout = setTimeout(finishShake, 835);
  }

  /* Capture starts the shake before the app's existing click handler rolls. */
  rollButtons.forEach(button => {
    button.addEventListener('click', beginShake, { capture: true });
  });

  /* Space-bar rolls should get the same animation. */
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    const tag = event.target?.tagName?.toLowerCase();
    if (['input', 'select', 'textarea'].includes(tag)) return;
    const diceTab = document.querySelector('.workspace-tab.active[data-workspace="dice"]');
    if (diceTab) beginShake();
  }, { capture: true });
})();

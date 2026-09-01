(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normHue = (h) => ((h % 360) + 360) % 360;

  function hexToRgb(hex) {
    const raw = String(hex || '').trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
      .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  function hsvToRgb(h, s, v) {
    h = normHue(h);
    s = clamp(Number(s), 0, 100) / 100;
    v = clamp(Number(v), 0, 100) / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rp = 0, gp = 0, bp = 0;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    return {
      r: Math.round((rp + m) * 255),
      g: Math.round((gp + m) * 255),
      b: Math.round((bp + m) * 255)
    };
  }

  function rgbToHsv(r, g, b) {
    r = clamp(Number(r), 0, 255) / 255;
    g = clamp(Number(g), 0, 255) / 255;
    b = clamp(Number(b), 0, 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * (((b - r) / d) + 2);
      else h = 60 * (((r - g) / d) + 4);
    }
    return { h: normHue(h), s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
  }

  /* ---------- Reliable gradient hand-off ---------- */
  const gradientButton = document.querySelector('.gradient-contrast-button');
  const gradientPreview = document.getElementById('gradientPreview');
  const contrastPreview = document.getElementById('contrastPreview');
  const contrastBgInput = document.getElementById('contrastBgHex');
  const contrastTextInput = document.getElementById('contrastTextHex');
  const contrastTextArea = document.getElementById('contrastPreviewText');
  const clearGradientButton = document.getElementById('clearContrastGradient');
  const bgCurrentButton = document.getElementById('contrastBgCurrent');
  const swapButton = document.getElementById('swapContrastColours');

  let forcedGradient = '';

  function readGradientImage() {
    if (!gradientPreview) return '';
    const computed = getComputedStyle(gradientPreview).backgroundImage;
    if (computed && computed !== 'none') return computed;
    const inline = gradientPreview.style.backgroundImage;
    return inline && inline !== 'none' ? inline : '';
  }

  function applyForcedGradient() {
    if (!contrastPreview || !forcedGradient) return;
    contrastPreview.dataset.gradientApplied = 'true';
    contrastPreview.style.setProperty('background-image', forcedGradient, 'important');
    contrastPreview.style.setProperty('background-color', 'transparent', 'important');
  }

  function clearForcedGradient() {
    forcedGradient = '';
    if (!contrastPreview) return;
    delete contrastPreview.dataset.gradientApplied;
    contrastPreview.style.removeProperty('background-image');
    contrastPreview.style.removeProperty('background-color');
  }

  if (gradientButton && gradientPreview && contrastPreview) {
    gradientButton.textContent = '◐ Apply gradient to contrast background';
    gradientButton.addEventListener('click', () => {
      const image = readGradientImage();
      if (!image) return;
      forcedGradient = image;
      requestAnimationFrame(applyForcedGradient);
      setTimeout(applyForcedGradient, 20);
    });
  }

  [contrastTextInput, contrastTextArea].forEach((control) => {
    control?.addEventListener('input', () => {
      if (forcedGradient) setTimeout(applyForcedGradient, 0);
    });
  });

  contrastBgInput?.addEventListener('input', clearForcedGradient);
  clearGradientButton?.addEventListener('click', clearForcedGradient);
  bgCurrentButton?.addEventListener('click', clearForcedGradient);
  swapButton?.addEventListener('click', clearForcedGradient);

  /* ---------- Explain WCAG cards ---------- */
  const contrastSection = document.getElementById('contrast-checker');
  const contrastResults = document.getElementById('contrastResults');
  const explanations = {
    'Normal AA': 'WCAG means Web Content Accessibility Guidelines. AA is the standard target for most websites. Normal-sized text should have at least 4.5:1 contrast.',
    'Normal AAA': 'AAA is the stricter enhanced WCAG level. Normal-sized text needs at least 7:1 contrast to pass.',
    'Large AA': 'For large text, WCAG AA requires at least 3:1 contrast. Large text is roughly 18 pt regular or 14 pt bold and above.',
    'Large AAA': 'For large text, the stricter WCAG AAA level requires at least 4.5:1 contrast.'
  };

  if (contrastSection) {
    const headingText = contrastSection.querySelector('.feature-heading > div');
    if (headingText && !headingText.querySelector('.wcag-explainer')) {
      const explainer = document.createElement('p');
      explainer.className = 'wcag-explainer';
      explainer.textContent = 'WCAG = Web Content Accessibility Guidelines. Hover or focus the ? beside each result to see what that standard means.';
      headingText.append(explainer);
    }
  }

  function enhanceWcagCards() {
    if (!contrastResults) return;
    contrastResults.querySelectorAll('.contrast-result').forEach((card) => {
      if (card.querySelector('.wcag-help')) return;
      const labelNode = card.querySelector('strong');
      const label = labelNode?.textContent?.trim();
      const text = explanations[label];
      if (!labelNode || !text) return;
      const help = document.createElement('button');
      help.type = 'button';
      help.className = 'wcag-help';
      help.textContent = '?';
      help.dataset.tip = text;
      help.title = text;
      help.setAttribute('aria-label', text);
      labelNode.append(help);
    });
  }

  if (contrastResults) {
    enhanceWcagCards();
    new MutationObserver(enhanceWcagCards).observe(contrastResults, { childList:true, subtree:true });
  }

  /* ---------- Self-contained RGB named-colour game ---------- */
  const gameSection = document.getElementById('named-colour-game');
  if (!gameSection) return;

  const capturedNamedColours = [...document.querySelectorAll('.named-colour-card')]
    .map((card) => {
      const name = card.dataset.name || card.querySelector('.named-colour-name')?.textContent?.trim();
      const hex = card.dataset.hex || card.querySelector('.named-colour-hex')?.textContent?.trim();
      const rgb = hexToRgb(hex);
      return name && rgb ? { name, hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb } : null;
    })
    .filter(Boolean);

  const fallbackColours = [
    ['Crimson','#DC143C'],['Tomato','#FF6347'],['Orange','#FFA500'],['Gold','#FFD700'],
    ['LimeGreen','#32CD32'],['SeaGreen','#2E8B57'],['Teal','#008080'],['Turquoise','#40E0D0'],
    ['DodgerBlue','#1E90FF'],['RoyalBlue','#4169E1'],['Navy','#000080'],['Indigo','#4B0082'],
    ['Violet','#EE82EE'],['HotPink','#FF69B4'],['Chocolate','#D2691E'],['SlateGray','#708090']
  ].map(([name, hex]) => ({ name, hex, rgb:hexToRgb(hex) }));

  const gameColours = capturedNamedColours.length ? capturedNamedColours : fallbackColours;

  document.getElementById('gameLivePrompt')?.remove();

  gameSection.innerHTML = `
    <div class="feature-heading">
      <div>
        <p class="kicker">Colour challenge</p>
        <h2>Named colour game</h2>
        <p>Use this wheel to match a named colour. Your score is based on how close your final RGB values are to the real colour.</p>
      </div>
    </div>
    <div class="game-v2-grid">
      <div class="game-v2-play">
        <div class="game-v2-target">
          <span class="label">Find this named colour</span>
          <strong id="gameV2Target">Press Start</strong>
          <p id="gameV2Instruction">Start a round, adjust brightness if you want, then click the wheel where you think the colour belongs.</p>
        </div>
        <div class="game-v2-wheel-wrap">
          <div class="game-v2-wheel" id="gameV2Wheel" role="application" aria-label="Named colour game wheel">
            <div class="game-v2-wheel-colours" id="gameV2WheelColours" aria-hidden="true"></div>
            <div class="game-v2-guess-marker" id="gameV2GuessMarker" aria-hidden="true"></div>
            <div class="game-v2-target-marker" id="gameV2TargetMarker" aria-hidden="true">★</div>
          </div>
          <label class="game-v2-brightness">
            <span class="game-v2-brightness-head"><b>Brightness</b><output id="gameV2BrightnessOutput">100%</output></span>
            <input id="gameV2Brightness" type="range" min="0" max="100" step="1" value="100" aria-label="Game brightness">
          </label>
        </div>
        <div class="game-v2-actions">
          <button class="primary-button" id="gameV2Start" type="button">Start game</button>
          <button class="secondary-button" id="gameV2Next" type="button" disabled>Next colour</button>
        </div>
        <div class="game-v2-stats">
          <div class="game-v2-stat"><span>Rounds</span><strong id="gameV2Rounds">0</strong></div>
          <div class="game-v2-stat"><span>Total</span><strong id="gameV2Total">0</strong></div>
          <div class="game-v2-stat"><span>Average</span><strong id="gameV2Average">0</strong></div>
        </div>
      </div>
      <div class="game-v2-results">
        <div class="game-v2-result-card" id="gameV2Result">
          <div class="game-v2-result-empty">Your RGB result will appear here after you make a guess.</div>
        </div>
      </div>
    </div>
  `;

  const targetName = document.getElementById('gameV2Target');
  const instruction = document.getElementById('gameV2Instruction');
  const gameWheel = document.getElementById('gameV2Wheel');
  const gameWheelColours = document.getElementById('gameV2WheelColours');
  const guessMarker = document.getElementById('gameV2GuessMarker');
  const targetMarker = document.getElementById('gameV2TargetMarker');
  const brightness = document.getElementById('gameV2Brightness');
  const brightnessOutput = document.getElementById('gameV2BrightnessOutput');
  const startButton = document.getElementById('gameV2Start');
  const nextButton = document.getElementById('gameV2Next');
  const result = document.getElementById('gameV2Result');
  const roundsOut = document.getElementById('gameV2Rounds');
  const totalOut = document.getElementById('gameV2Total');
  const averageOut = document.getElementById('gameV2Average');

  let target = null;
  let roundOpen = false;
  let rounds = 0;
  let total = 0;
  let guessH = 0;
  let guessS = 0;
  let previousKey = '';

  function positionMarker(marker, hsv) {
    marker.style.left = `${50 + Math.cos(hsv.h * Math.PI / 180) * hsv.s * 0.5}%`;
    marker.style.top = `${50 + Math.sin(hsv.h * Math.PI / 180) * hsv.s * 0.5}%`;
  }

  function currentGuessRgb() {
    return hsvToRgb(guessH, guessS, Number(brightness.value));
  }

  function renderGameBrightness() {
    const value = Number(brightness.value);
    brightnessOutput.textContent = `${value}%`;
    gameWheelColours.style.filter = `brightness(${value / 100})`;
    const full = hsvToRgb(guessH, guessS, 100);
    brightness.style.background = `linear-gradient(90deg,#000000,${rgbToHex(full.r, full.g, full.b)})`;
  }

  function chooseTarget() {
    if (!gameColours.length) return;
    let next = gameColours[Math.floor(Math.random() * gameColours.length)];
    if (gameColours.length > 1) {
      while (`${next.name}|${next.hex}` === previousKey) {
        next = gameColours[Math.floor(Math.random() * gameColours.length)];
      }
    }
    target = next;
    previousKey = `${next.name}|${next.hex}`;
    roundOpen = true;
    guessH = 0;
    guessS = 0;
    brightness.value = '100';
    brightness.disabled = false;
    targetName.textContent = target.name;
    instruction.textContent = 'Adjust brightness if needed, then click the wheel to make your guess. The round scores immediately.';
    nextButton.disabled = true;
    guessMarker.style.left = '50%';
    guessMarker.style.top = '50%';
    targetMarker.classList.remove('show');
    result.innerHTML = '<div class="game-v2-result-empty">Make your guess on the wheel. The target colour stays hidden until you score.</div>';
    renderGameBrightness();
  }

  function channelRow(letter, guess, actual, cls) {
    const difference = Math.abs(guess - actual);
    return `
      <div class="game-v2-channel ${cls}">
        <span class="game-v2-channel-letter">${letter}</span>
        <div class="game-v2-channel-values">
          <strong>Your ${guess} · Target ${actual}</strong>
          <span>${difference === 0 ? 'Exact match' : `${difference} value${difference === 1 ? '' : 's'} away`}</span>
        </div>
        <span class="game-v2-channel-diff">${difference === 0 ? '✓ exact' : `±${difference}`}</span>
      </div>
    `;
  }

  function scoreGuess(event) {
    if (!roundOpen || !target) return;
    const rect = gameWheel.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = event.clientX - (rect.left + radius);
    let dy = event.clientY - (rect.top + radius);
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      const scale = radius / distance;
      dx *= scale;
      dy *= scale;
    }

    guessH = normHue(Math.atan2(dy, dx) * 180 / Math.PI);
    guessS = clamp(Math.hypot(dx, dy) / radius * 100, 0, 100);
    positionMarker(guessMarker, { h:guessH, s:guessS });

    const guess = currentGuessRgb();
    const dr = Math.abs(guess.r - target.rgb.r);
    const dg = Math.abs(guess.g - target.rgb.g);
    const db = Math.abs(guess.b - target.rgb.b);
    const score = Math.round(100 * (1 - (dr + dg + db) / 765));

    rounds += 1;
    total += score;
    roundsOut.textContent = String(rounds);
    totalOut.textContent = String(total);
    averageOut.textContent = String(Math.round(total / rounds));
    roundOpen = false;
    brightness.disabled = true;
    nextButton.disabled = false;

    const targetHsv = rgbToHsv(target.rgb.r, target.rgb.g, target.rgb.b);
    positionMarker(targetMarker, targetHsv);
    targetMarker.classList.add('show');

    const guessHex = rgbToHex(guess.r, guess.g, guess.b);
    result.innerHTML = `
      <p class="game-v2-score">${score}<span>/100</span></p>
      <div class="game-v2-summary">
        <div class="game-v2-colour-summary">
          <span class="game-v2-swatch" style="background:${guessHex}"></span>
          <div><span>Your guess</span><strong>${guessHex}</strong><strong>RGB (${guess.r}, ${guess.g}, ${guess.b})</strong></div>
        </div>
        <div class="game-v2-colour-summary">
          <span class="game-v2-swatch" style="background:${target.hex}"></span>
          <div><span>${target.name}</span><strong>${target.hex}</strong><strong>RGB (${target.rgb.r}, ${target.rgb.g}, ${target.rgb.b})</strong></div>
        </div>
      </div>
      <p class="game-v2-rgb-title">How far off were you?</p>
      <div class="game-v2-rgb-grid">
        ${channelRow('R', guess.r, target.rgb.r, 'r')}
        ${channelRow('G', guess.g, target.rgb.g, 'g')}
        ${channelRow('B', guess.b, target.rgb.b, 'b')}
      </div>
      <p class="game-v2-help">Score = the average closeness of your Red, Green and Blue values. An exact RGB match scores 100. The ★ shows the target position on the wheel.</p>
    `;
    instruction.textContent = `You scored ${score}/100. Compare the R, G and B differences, then try the next colour.`;
  }

  startButton.addEventListener('click', () => {
    rounds = 0;
    total = 0;
    roundsOut.textContent = '0';
    totalOut.textContent = '0';
    averageOut.textContent = '0';
    startButton.textContent = 'Restart game';
    chooseTarget();
  });

  nextButton.addEventListener('click', chooseTarget);
  brightness.addEventListener('input', renderGameBrightness);
  gameWheel.addEventListener('pointerup', scoreGuess);
  renderGameBrightness();
})();

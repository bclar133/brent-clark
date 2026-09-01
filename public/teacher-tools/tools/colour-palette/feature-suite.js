(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hexInput = $('#hexInput');
  const wheel = $('#colourWheel');
  const wheelPanel = $('.wheel-panel');
  const palettePanel = $('.palette-panel');
  const schemePanel = $('.scheme-panel');
  const gradientPanel = $('.gradient-panel');
  const cssOutput = $('#cssOutput');
  const toast = $('#toast');
  let toastTimer = 0;

  if (!hexInput || !wheel || !wheelPanel || !palettePanel || !schemePanel || !gradientPanel) return;

  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function normaliseHex(value) {
    let raw = String(value || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(raw)) raw = raw.split('').map((c) => c + c).join('');
    return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw.toUpperCase()}` : '';
  }

  function hexToRgb(hex) {
    const valid = normaliseHex(hex);
    if (!valid) return null;
    return {
      r: parseInt(valid.slice(1, 3), 16),
      g: parseInt(valid.slice(3, 5), 16),
      b: parseInt(valid.slice(5, 7), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * (((b - r) / d) + 2);
      else h = 60 * (((r - g) / d) + 4);
    }
    h = ((h % 360) + 360) % 360;
    return { h, s: max === 0 ? 0 : d / max * 100, v: max * 100 };
  }

  function relativeLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channel = (v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  async function copyText(text, message = 'Copied to clipboard') {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {}
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      try { copied = document.execCommand('copy'); } catch (_) {}
      textarea.remove();
    }
    showToast(copied ? message : 'Copy failed — select and copy manually');
    return copied;
  }

  /* ---------- Section anchors ---------- */
  wheelPanel.id = 'picker';
  palettePanel.id = 'saved-colours';
  schemePanel.id = 'schemes';
  gradientPanel.id = 'gradients';

  const nav = document.createElement('nav');
  nav.className = 'section-jump-nav';
  nav.setAttribute('aria-label', 'Colour Palette sections');
  nav.innerHTML = `
    <a href="#picker">🎨 Picker</a>
    <a href="#saved-colours">▦ Saved colours</a>
    <a href="#schemes">◈ Schemes</a>
    <a href="#gradients">◒ Gradients</a>
    <a href="#contrast-checker">◐ Contrast</a>
    <a href="#named-colour-game">★ Colour game</a>
  `;
  document.querySelector('.topbar')?.insertAdjacentElement('afterend', nav);

  /* ---------- Palette export ---------- */
  function paletteHexes() {
    return $$('.palette-meta strong', palettePanel)
      .map((node) => normaliseHex(node.textContent))
      .filter(Boolean);
  }

  const paletteActions = $('.panel-actions', palettePanel);
  if (paletteActions) {
    const exportWrap = document.createElement('div');
    exportWrap.className = 'palette-export-actions';

    const exportStripBtn = document.createElement('button');
    exportStripBtn.type = 'button';
    exportStripBtn.className = 'ghost-button';
    exportStripBtn.textContent = '🖼 Export strip';

    const copyCssBtn = document.createElement('button');
    copyCssBtn.type = 'button';
    copyCssBtn.className = 'ghost-button';
    copyCssBtn.textContent = '</> Copy CSS variables';

    exportWrap.append(exportStripBtn, copyCssBtn);
    paletteActions.prepend(exportWrap);

    copyCssBtn.addEventListener('click', () => {
      const colours = paletteHexes();
      if (!colours.length) {
        showToast('Add some saved colours first');
        return;
      }
      const lines = colours.map((hex, index) => `  --palette-${index + 1}: ${hex};`);
      copyText(`:root {\n${lines.join('\n')}\n}`, 'CSS variables copied');
    });

    exportStripBtn.addEventListener('click', () => {
      const colours = paletteHexes();
      if (!colours.length) {
        showToast('Add some saved colours first');
        return;
      }

      const width = 1200;
      const height = 220;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const blockWidth = width / colours.length;
      colours.forEach((hex, index) => {
        const x = index * blockWidth;
        ctx.fillStyle = hex;
        ctx.fillRect(x, 0, Math.ceil(blockWidth), height);

        const rgb = hexToRgb(hex);
        const luminance = rgb ? (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 : 0;
        ctx.fillStyle = luminance > 0.6 ? '#17231F' : '#FFFFFF';
        ctx.font = '700 30px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex, x + blockWidth / 2, height / 2);
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'chalkbox-palette.png';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Palette strip exported');
      }, 'image/png');
    });
  }

  /* ---------- Accessibility / contrast checker ---------- */
  const contrastSection = document.createElement('section');
  contrastSection.className = 'feature-panel panel';
  contrastSection.id = 'contrast-checker';
  contrastSection.innerHTML = `
    <div class="feature-heading">
      <div>
        <p class="kicker">Accessibility</p>
        <h2>Contrast checker</h2>
        <p>Check text readability against a solid colour or the gradient you build above.</p>
      </div>
      <div class="feature-actions">
        <button class="ghost-button" id="swapContrastColours" type="button">⇄ Swap colours</button>
      </div>
    </div>
    <div class="contrast-layout">
      <div class="contrast-controls">
        <div class="contrast-colour-control">
          <label for="contrastBgHex">Background</label>
          <div class="contrast-colour-row">
            <span class="contrast-swatch" id="contrastBgSwatch" aria-hidden="true"></span>
            <input class="contrast-hex" id="contrastBgHex" type="text" value="#FFFFFF" maxlength="7" spellcheck="false" autocomplete="off">
            <button class="ghost-button use-current-button" id="contrastBgCurrent" type="button">Use current</button>
          </div>
        </div>
        <div class="contrast-colour-control">
          <label for="contrastTextHex">Text</label>
          <div class="contrast-colour-row">
            <span class="contrast-swatch" id="contrastTextSwatch" aria-hidden="true"></span>
            <input class="contrast-hex" id="contrastTextHex" type="text" value="#000000" maxlength="7" spellcheck="false" autocomplete="off">
            <button class="ghost-button use-current-button" id="contrastTextCurrent" type="button">Use current</button>
          </div>
        </div>
        <label class="contrast-text-field" for="contrastPreviewText">
          Preview text
          <textarea id="contrastPreviewText">The quick brown fox jumps over the lazy dog.</textarea>
        </label>
        <div class="contrast-control-actions">
          <span class="gradient-active-badge" id="contrastGradientBadge">Gradient background active</span>
          <button class="ghost-button" id="clearContrastGradient" type="button" hidden>Use solid background</button>
        </div>
      </div>
      <div class="contrast-preview-wrap">
        <div class="contrast-preview" id="contrastPreview">
          <p class="contrast-preview-text" id="contrastPreviewCopy">The quick brown fox jumps over the lazy dog.</p>
        </div>
        <div class="contrast-summary">
          <div class="contrast-ratio-card">
            <span id="contrastRatioLabel">Contrast ratio</span>
            <strong id="contrastRatio">21.00:1</strong>
          </div>
          <div class="contrast-results" id="contrastResults"></div>
          <p class="contrast-note" id="contrastNote">WCAG thresholds: normal text AA 4.5:1 / AAA 7:1; large text AA 3:1 / AAA 4.5:1.</p>
        </div>
      </div>
    </div>
  `;

  document.querySelector('.lower-grid')?.insertAdjacentElement('afterend', contrastSection);

  const bgHex = $('#contrastBgHex');
  const textHex = $('#contrastTextHex');
  const bgSwatch = $('#contrastBgSwatch');
  const textSwatch = $('#contrastTextSwatch');
  const preview = $('#contrastPreview');
  const previewTextInput = $('#contrastPreviewText');
  const previewCopy = $('#contrastPreviewCopy');
  const ratioOutput = $('#contrastRatio');
  const ratioLabel = $('#contrastRatioLabel');
  const resultGrid = $('#contrastResults');
  const contrastNote = $('#contrastNote');
  const gradientBadge = $('#contrastGradientBadge');
  const clearGradientBtn = $('#clearContrastGradient');
  let activeContrastGradient = '';
  let gradientSamples = [];

  function interpolateHex(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return a;
    return rgbToHex(
      ca.r + (cb.r - ca.r) * t,
      ca.g + (cb.g - ca.g) * t,
      ca.b + (cb.b - ca.b) * t
    );
  }

  function samplesFromGradient(css) {
    const matches = [...String(css).matchAll(/(#[0-9A-Fa-f]{6})\s*(\d+(?:\.\d+)?)?%?/g)]
      .map((match, index, all) => ({
        hex: normaliseHex(match[1]),
        pos: match[2] !== undefined ? Number(match[2]) : (all.length <= 1 ? 0 : index * 100 / (all.length - 1))
      }))
      .filter((item) => item.hex);

    if (!matches.length) return [];
    matches.sort((a, b) => a.pos - b.pos);
    const samples = [];
    for (let i = 0; i < matches.length - 1; i += 1) {
      const start = matches[i];
      const end = matches[i + 1];
      for (let step = 0; step <= 20; step += 1) {
        samples.push(interpolateHex(start.hex, end.hex, step / 20));
      }
    }
    if (matches.length === 1) samples.push(matches[0].hex);
    return [...new Set(samples)];
  }

  function setContrastStatus(label, threshold, ratio) {
    const item = document.createElement('div');
    const pass = ratio >= threshold;
    item.className = `contrast-result ${pass ? 'pass' : 'fail'}`;
    item.innerHTML = `<strong>${label}</strong><span>${pass ? 'Pass' : 'Fail'} · ${threshold}:1</span>`;
    resultGrid.append(item);
  }

  function updateContrast() {
    const bg = normaliseHex(bgHex.value) || '#FFFFFF';
    const text = normaliseHex(textHex.value) || '#000000';
    bgSwatch.style.background = bg;
    textSwatch.style.background = text;
    preview.style.color = text;
    previewCopy.textContent = previewTextInput.value || ' ';

    let ratio;
    if (activeContrastGradient && gradientSamples.length) {
      preview.style.background = activeContrastGradient;
      ratio = Math.min(...gradientSamples.map((sample) => contrastRatio(text, sample)));
      ratioLabel.textContent = 'Worst sampled contrast';
      contrastNote.textContent = 'For gradients, the result uses the lowest sampled contrast across the colour transitions. WCAG thresholds remain the same.';
    } else {
      preview.style.background = bg;
      ratio = contrastRatio(text, bg);
      ratioLabel.textContent = 'Contrast ratio';
      contrastNote.textContent = 'WCAG thresholds: normal text AA 4.5:1 / AAA 7:1; large text AA 3:1 / AAA 4.5:1.';
    }

    ratioOutput.textContent = `${ratio.toFixed(2)}:1`;
    resultGrid.innerHTML = '';
    setContrastStatus('Normal AA', 4.5, ratio);
    setContrastStatus('Normal AAA', 7, ratio);
    setContrastStatus('Large AA', 3, ratio);
    setContrastStatus('Large AAA', 4.5, ratio);
  }

  function useSolidBackground() {
    activeContrastGradient = '';
    gradientSamples = [];
    gradientBadge.classList.remove('show');
    clearGradientBtn.hidden = true;
    updateContrast();
  }

  [bgHex, textHex].forEach((input) => {
    input.addEventListener('input', () => {
      if (input === bgHex && normaliseHex(input.value)) useSolidBackground();
      updateContrast();
    });
    input.addEventListener('blur', () => {
      const valid = normaliseHex(input.value);
      if (valid) input.value = valid;
      updateContrast();
    });
  });
  previewTextInput.addEventListener('input', updateContrast);
  $('#contrastBgCurrent').addEventListener('click', () => {
    bgHex.value = normaliseHex(hexInput.value) || '#FFFFFF';
    useSolidBackground();
  });
  $('#contrastTextCurrent').addEventListener('click', () => {
    textHex.value = normaliseHex(hexInput.value) || '#000000';
    updateContrast();
  });
  $('#swapContrastColours').addEventListener('click', () => {
    if (activeContrastGradient) useSolidBackground();
    const oldBg = bgHex.value;
    bgHex.value = textHex.value;
    textHex.value = oldBg;
    updateContrast();
  });
  clearGradientBtn.addEventListener('click', useSolidBackground);

  const gradientHeading = $('.panel-heading', gradientPanel);
  if (gradientHeading) {
    let headingActions = $('.gradient-feature-actions', gradientHeading);
    if (!headingActions) {
      headingActions = document.createElement('div');
      headingActions.className = 'feature-actions gradient-feature-actions';
      const existingUsePalette = $('#loadPaletteBtn');
      if (existingUsePalette) headingActions.append(existingUsePalette);
      gradientHeading.append(headingActions);
    }
    const applyGradientBtn = document.createElement('button');
    applyGradientBtn.type = 'button';
    applyGradientBtn.className = 'secondary-button small-button gradient-contrast-button';
    applyGradientBtn.textContent = '◐ Use in contrast checker';
    headingActions.append(applyGradientBtn);
    applyGradientBtn.addEventListener('click', () => {
      const css = cssOutput?.value?.trim();
      if (!css) {
        showToast('Build a gradient first');
        return;
      }
      const samples = samplesFromGradient(css);
      if (!samples.length) {
        showToast('Could not read the gradient colours');
        return;
      }
      activeContrastGradient = css;
      gradientSamples = samples;
      gradientBadge.classList.add('show');
      clearGradientBtn.hidden = false;
      updateContrast();
      showToast('Gradient applied to contrast checker');
    });
  }

  updateContrast();

  /* ---------- Named colour game ---------- */
  const gameSection = document.createElement('section');
  gameSection.className = 'feature-panel panel';
  gameSection.id = 'named-colour-game';
  gameSection.innerHTML = `
    <div class="feature-heading">
      <div>
        <p class="kicker">Colour challenge</p>
        <h2>Named colour game</h2>
        <p>A named colour appears. Click where you think it belongs on the main colour wheel — the closer you are, the higher your score.</p>
      </div>
    </div>
    <div class="game-panel-inner">
      <div class="game-card">
        <p class="game-target-label">Find this colour</p>
        <h3 class="game-target-name" id="gameTargetName">Ready?</h3>
        <p class="game-instruction" id="gameInstruction">Press Start game. Each guess is worth up to 100 points. Scoring is based on how close your click is to the colour's position on the hue/saturation wheel.</p>
        <div class="game-buttons">
          <button class="primary-button" id="startColourGame" type="button">Start game</button>
          <button class="secondary-button" id="nextColourGame" type="button" disabled>Next colour</button>
          <button class="ghost-button" id="goToGameWheel" type="button" disabled>Go to wheel ↑</button>
        </div>
        <div class="game-stats">
          <div class="game-stat"><span>Rounds</span><strong id="gameRounds">0</strong></div>
          <div class="game-stat"><span>Total</span><strong id="gameTotal">0</strong></div>
          <div class="game-stat"><span>Average</span><strong id="gameAverage">0</strong></div>
        </div>
      </div>
      <div class="game-result-card empty" id="gameResult">
        <p>Your result will appear here after you click the wheel.</p>
      </div>
    </div>
  `;
  contrastSection.insertAdjacentElement('afterend', gameSection);

  const livePrompt = document.createElement('div');
  livePrompt.className = 'game-live-prompt';
  livePrompt.id = 'gameLivePrompt';
  livePrompt.innerHTML = '<p>Named colour game: <strong id="gameLiveName"></strong> — click the wheel where you think it belongs.</p>';
  $('.wheel-layout', wheelPanel)?.insertAdjacentElement('beforebegin', livePrompt);

  function readNamedColours() {
    const seen = new Set();
    return $$('.named-colour-card').map((card) => {
      const name = card.dataset.name || $('.named-colour-name', card)?.textContent || '';
      const hex = normaliseHex(card.dataset.hex || $('.named-colour-hex', card)?.textContent || '');
      if (!name || !hex) return null;
      const rgb = hexToRgb(hex);
      const hsv = rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b) : null;
      if (!hsv || hsv.s < 24 || hsv.v < 16) return null;
      const key = `${name}|${hex}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { name, hex, hsv };
    }).filter(Boolean);
  }

  let gameColours = readNamedColours();
  let currentTarget = null;
  let previousTargetKey = '';
  let roundOpen = false;
  let rounds = 0;
  let total = 0;

  const targetName = $('#gameTargetName');
  const gameInstruction = $('#gameInstruction');
  const gameResult = $('#gameResult');
  const roundsOutput = $('#gameRounds');
  const totalOutput = $('#gameTotal');
  const averageOutput = $('#gameAverage');
  const startGameBtn = $('#startColourGame');
  const nextGameBtn = $('#nextColourGame');
  const goWheelBtn = $('#goToGameWheel');
  const liveName = $('#gameLiveName');

  function clearTargetMarker() {
    $('.game-target-marker', wheel)?.remove();
  }

  function newGameRound(scrollToWheel = false) {
    if (!gameColours.length) gameColours = readNamedColours();
    if (!gameColours.length) {
      showToast('Named colours are still loading — try again');
      return;
    }
    let next = gameColours[Math.floor(Math.random() * gameColours.length)];
    if (gameColours.length > 1) {
      while (`${next.name}|${next.hex}` === previousTargetKey) {
        next = gameColours[Math.floor(Math.random() * gameColours.length)];
      }
    }
    currentTarget = next;
    previousTargetKey = `${next.name}|${next.hex}`;
    roundOpen = true;
    clearTargetMarker();
    targetName.textContent = next.name;
    gameInstruction.textContent = 'Click the main colour wheel where you think this named colour belongs. Brightness is ignored — this is a hue and saturation challenge.';
    gameResult.className = 'game-result-card empty';
    gameResult.innerHTML = '<p>Make your guess on the main colour wheel.</p>';
    nextGameBtn.disabled = true;
    goWheelBtn.disabled = false;
    liveName.textContent = next.name;
    livePrompt.classList.add('show');
    if (scrollToWheel) wheelPanel.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function targetPoint(hsv) {
    return {
      x: 50 + Math.cos(hsv.h * Math.PI / 180) * hsv.s * 0.5,
      y: 50 + Math.sin(hsv.h * Math.PI / 180) * hsv.s * 0.5
    };
  }

  function scoreGuess(event) {
    if (!roundOpen || !currentTarget) return;
    const rect = wheel.getBoundingClientRect();
    const radius = rect.width / 2;
    const cx = rect.left + radius;
    const cy = rect.top + radius;
    let gx = event.clientX - cx;
    let gy = event.clientY - cy;
    const guessDistance = Math.hypot(gx, gy);
    if (guessDistance > radius) {
      gx *= radius / guessDistance;
      gy *= radius / guessDistance;
    }

    const tx = Math.cos(currentTarget.hsv.h * Math.PI / 180) * currentTarget.hsv.s / 100 * radius;
    const ty = Math.sin(currentTarget.hsv.h * Math.PI / 180) * currentTarget.hsv.s / 100 * radius;
    const distance = Math.hypot(gx - tx, gy - ty);
    const closeness = clamp(1 - distance / (radius * 2), 0, 1);
    const score = Math.round(100 * closeness * closeness);
    const guessHex = normaliseHex(hexInput.value) || '#000000';

    rounds += 1;
    total += score;
    roundsOutput.textContent = rounds;
    totalOutput.textContent = total;
    averageOutput.textContent = Math.round(total / rounds);
    roundOpen = false;
    nextGameBtn.disabled = false;
    goWheelBtn.disabled = true;

    const point = targetPoint(currentTarget.hsv);
    const marker = document.createElement('div');
    marker.className = 'game-target-marker';
    marker.style.left = `${point.x}%`;
    marker.style.top = `${point.y}%`;
    marker.title = `Target: ${currentTarget.name} ${currentTarget.hex}`;
    wheel.append(marker);

    gameResult.className = 'game-result-card';
    gameResult.innerHTML = `
      <p class="game-score-big">${score}<span>/100</span></p>
      <div class="game-result-colours">
        <div class="game-result-colour">
          <span class="game-result-swatch" style="background:${guessHex}"></span>
          <div><span>Your guess</span><strong>${guessHex}</strong></div>
        </div>
        <div class="game-result-colour">
          <span class="game-result-swatch" style="background:${currentTarget.hex}"></span>
          <div><span>${currentTarget.name}</span><strong>${currentTarget.hex}</strong></div>
        </div>
      </div>
    `;
    gameInstruction.textContent = `You scored ${score}/100. The star on the wheel shows the target position.`;
    livePrompt.innerHTML = `<p><strong>${score}/100</strong> for ${currentTarget.name}. The ★ shows the target. Use “Next colour” below for another round.</p>`;
    showToast(`${score}/100 — ${currentTarget.name}`);
  }

  startGameBtn.addEventListener('click', () => {
    rounds = 0;
    total = 0;
    roundsOutput.textContent = '0';
    totalOutput.textContent = '0';
    averageOutput.textContent = '0';
    startGameBtn.textContent = 'Restart game';
    newGameRound(true);
  });
  nextGameBtn.addEventListener('click', () => newGameRound(true));
  goWheelBtn.addEventListener('click', () => wheelPanel.scrollIntoView({ behavior:'smooth', block:'start' }));
  wheel.addEventListener('pointerup', scoreGuess);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && roundOpen) {
      roundOpen = false;
      currentTarget = null;
      livePrompt.classList.remove('show');
      clearTargetMarker();
      nextGameBtn.disabled = true;
      goWheelBtn.disabled = true;
      targetName.textContent = 'Paused';
      gameInstruction.textContent = 'Press Start game to begin again.';
    }
  });
})();

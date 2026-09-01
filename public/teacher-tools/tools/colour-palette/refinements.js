(() => {
  'use strict';

  const wheel = document.getElementById('colourWheel');
  const brightnessControl = document.querySelector('.brightness-control');
  const rgbFieldset = document.querySelector('.rgb-fieldset');
  const rgbReadout = document.getElementById('rgbReadout');
  const mainHexInput = document.getElementById('hexInput');
  const schemePanel = document.querySelector('.scheme-panel');
  const schemeTabs = document.getElementById('schemeTabs');
  const schemeDescription = document.getElementById('schemeDescription');
  const gradientStops = document.getElementById('gradientStops');
  const toast = document.getElementById('toast');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normHue = (h) => ((h % 360) + 360) % 360;
  let toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1450);
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

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
      .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  function hexToRgb(hex) {
    const raw = String(hex || '').trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  }

  function normaliseHex(hex) {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : null;
  }

  function setMainColour(hex) {
    const valid = normaliseHex(hex);
    if (!valid || !mainHexInput) return false;
    mainHexInput.value = valid;
    mainHexInput.dispatchEvent(new Event('input', { bubbles:true }));
    return true;
  }

  /* Slightly smaller main wheel. CSS handles the final responsive size, while these
     inline values protect the layout if the refinement stylesheet is slow to load. */
  if (wheel) wheel.style.width = 'min(100%, 590px)';
  if (brightnessControl) brightnessControl.style.maxWidth = '590px';

  /* Copyable RGB code in the requested compact format: (255,0,0). */
  if (rgbFieldset && rgbReadout && !document.getElementById('rgbCopyInput')) {
    const row = document.createElement('div');
    row.className = 'format-row rgb-copy-row';
    row.innerHTML = `
      <label for="rgbCopyInput">RGB code</label>
      <div class="input-with-action">
        <input id="rgbCopyInput" type="text" readonly aria-label="RGB code">
        <button class="copy-button" id="copyRgbBtn" type="button" aria-label="Copy RGB value">Copy</button>
      </div>
    `;
    rgbFieldset.insertAdjacentElement('afterend', row);

    const rgbCopyInput = document.getElementById('rgbCopyInput');
    const copyRgbBtn = document.getElementById('copyRgbBtn');

    function updateRgbCopy() {
      const parts = rgbReadout.textContent.split(',').map((part) => part.trim());
      rgbCopyInput.value = parts.length === 3 ? `(${parts.join(',')})` : rgbReadout.textContent.trim();
    }

    async function copyRgb() {
      const value = rgbCopyInput.value;
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          copied = true;
        }
      } catch (_) {}
      if (!copied) {
        rgbCopyInput.focus();
        rgbCopyInput.select();
        try { copied = document.execCommand('copy'); } catch (_) {}
      }
      if (copied) {
        const original = copyRgbBtn.textContent;
        copyRgbBtn.textContent = 'Copied';
        showToast('RGB copied to clipboard');
        setTimeout(() => { copyRgbBtn.textContent = original; }, 900);
      } else {
        showToast('Select the RGB value and copy it manually');
      }
    }

    new MutationObserver(updateRgbCopy).observe(rgbReadout, {
      childList:true,
      characterData:true,
      subtree:true
    });
    copyRgbBtn.addEventListener('click', copyRgb);
    updateRgbCopy();
  }

  /* Colour scheme generator controls. The active harmony tab is respected. */
  if (schemePanel && schemeTabs && schemeDescription && !document.getElementById('schemeBaseInput')) {
    const controls = document.createElement('div');
    controls.className = 'scheme-generator-controls';
    controls.innerHTML = `
      <label class="scheme-base-field" for="schemeBaseInput">
        <span>Base colour</span>
        <span class="scheme-base-input-wrap">
          <span class="scheme-base-swatch" id="schemeBaseSwatch" aria-hidden="true"></span>
          <input class="scheme-base-input" id="schemeBaseInput" type="text" maxlength="7" value="#2F80ED" spellcheck="false" autocomplete="off" aria-label="Base colour HEX code">
        </span>
      </label>
      <button class="secondary-button" id="generateFromColourBtn" type="button">Generate from colour</button>
      <button class="ghost-button" id="randomSchemeBtn" type="button">🎲 Randomise palette</button>
    `;
    schemeDescription.insertAdjacentElement('beforebegin', controls);

    const baseInput = document.getElementById('schemeBaseInput');
    const baseSwatch = document.getElementById('schemeBaseSwatch');
    const generateBtn = document.getElementById('generateFromColourBtn');
    const randomBtn = document.getElementById('randomSchemeBtn');

    function updateBaseDisplay(hex) {
      const valid = normaliseHex(hex);
      if (!valid) return;
      baseInput.value = valid;
      baseSwatch.style.background = valid;
    }

    function syncFromMain() {
      if (mainHexInput) updateBaseDisplay(mainHexInput.value);
    }

    function generateFromBase() {
      const valid = normaliseHex(baseInput.value);
      if (!valid) {
        showToast('Enter a 6-digit HEX colour, for example #2F80ED');
        baseInput.focus();
        return;
      }
      updateBaseDisplay(valid);
      setMainColour(valid);
      const active = schemeTabs.querySelector('.scheme-tab.active');
      if (active) active.click();
      showToast(`Harmony generated from ${valid}`);
    }

    function randomiseHarmony() {
      const hue = Math.random() * 360;
      const saturation = 42 + Math.random() * 53;
      const brightness = 58 + Math.random() * 42;
      const rgb = hsvToRgb(hue, saturation, brightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      updateBaseDisplay(hex);
      setMainColour(hex);
      const active = schemeTabs.querySelector('.scheme-tab.active');
      if (active) active.click();
      showToast('New palette generated for this harmony');
    }

    baseInput.addEventListener('input', () => {
      const valid = normaliseHex(baseInput.value);
      if (valid) baseSwatch.style.background = valid;
    });
    baseInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        generateFromBase();
      }
    });
    generateBtn.addEventListener('click', generateFromBase);
    randomBtn.addEventListener('click', randomiseHarmony);

    if (mainHexInput) {
      mainHexInput.addEventListener('input', syncFromMain);
      const previewHex = document.getElementById('previewHex');
      if (previewHex) new MutationObserver(syncFromMain).observe(previewHex, { childList:true, characterData:true, subtree:true });
    }
    syncFromMain();
  }

  /* Custom gradient colour picker: mini wheel + 48 basic colours. */
  const basicColours = [
    '#F4CCCC','#FCE5CD','#FFF2CC','#D9EAD3','#D0E0E3','#CFE2F3','#D9D2E9','#EAD1DC',
    '#EA9999','#F9CB9C','#FFE599','#B6D7A8','#A2C4C9','#9FC5E8','#B4A7D6','#D5A6BD',
    '#FF0000','#FF9900','#FFFF00','#00FF00','#00FFFF','#0000FF','#9900FF','#FF00FF',
    '#CC0000','#E69138','#F1C232','#6AA84F','#45818E','#3D85C6','#674EA7','#A64D79',
    '#990000','#B45F06','#BF9000','#38761D','#134F5C','#0B5394','#351C75','#741B47',
    '#FFFFFF','#D9D9D9','#B7B7B7','#999999','#666666','#434343','#1C1C1C','#000000'
  ];

  let activeGradientInput = null;
  let pickerHsv = { h:214, s:80, v:93 };
  let miniDragging = false;

  const dialog = document.createElement('dialog');
  dialog.id = 'gradientColourDialog';
  dialog.className = 'gradient-colour-dialog';
  dialog.innerHTML = `
    <div class="gradient-picker-shell">
      <div class="gradient-picker-header">
        <div>
          <h3>Choose gradient colour</h3>
          <p>Use the mini wheel or pick from 48 basic colours.</p>
        </div>
        <button class="gradient-picker-close" id="gradientPickerClose" type="button" aria-label="Close colour picker">×</button>
      </div>
      <div class="gradient-picker-grid">
        <div class="mini-wheel-wrap">
          <div class="mini-colour-wheel" id="miniColourWheel" role="application" aria-label="Mini colour wheel">
            <div class="mini-wheel-colours" id="miniWheelColours" aria-hidden="true"></div>
            <div class="mini-wheel-marker" id="miniWheelMarker" aria-hidden="true"></div>
          </div>
          <label class="mini-brightness">
            <span class="mini-brightness-label"><b>Brightness</b><output id="miniBrightnessOutput">100%</output></span>
            <input id="miniBrightnessSlider" type="range" min="0" max="100" step="1" value="100" aria-label="Mini picker brightness">
          </label>
          <div class="mini-picker-value">
            <span class="mini-picker-preview" id="miniPickerPreview" aria-hidden="true"></span>
            <input id="miniPickerHex" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Gradient colour HEX code">
          </div>
        </div>
        <div class="basic-colours-panel">
          <h4>Basic colours</h4>
          <p>48 quick choices</p>
          <div class="basic-colour-grid" id="basicColourGrid"></div>
        </div>
      </div>
      <div class="gradient-picker-footer">
        <button class="ghost-button" id="gradientPickerCancel" type="button">Cancel</button>
        <button class="primary-button" id="gradientPickerUse" type="button">Use colour</button>
      </div>
    </div>
  `;
  document.body.append(dialog);

  const miniWheel = document.getElementById('miniColourWheel');
  const miniWheelColours = document.getElementById('miniWheelColours');
  const miniMarker = document.getElementById('miniWheelMarker');
  const miniBrightness = document.getElementById('miniBrightnessSlider');
  const miniBrightnessOutput = document.getElementById('miniBrightnessOutput');
  const miniPreview = document.getElementById('miniPickerPreview');
  const miniHex = document.getElementById('miniPickerHex');
  const basicGrid = document.getElementById('basicColourGrid');
  const closePickerBtn = document.getElementById('gradientPickerClose');
  const cancelPickerBtn = document.getElementById('gradientPickerCancel');
  const usePickerBtn = document.getElementById('gradientPickerUse');

  basicColours.forEach((hex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'basic-colour';
    button.style.background = hex;
    button.title = hex;
    button.setAttribute('aria-label', `Choose ${hex}`);
    button.dataset.colour = hex;
    button.addEventListener('click', () => setMiniPickerFromHex(hex));
    basicGrid.append(button);
  });

  function currentMiniColour() {
    const rgb = hsvToRgb(pickerHsv.h, pickerHsv.s, pickerHsv.v);
    return { ...rgb, hex:rgbToHex(rgb.r, rgb.g, rgb.b) };
  }

  function renderMiniPicker() {
    const colour = currentMiniColour();
    const x = 50 + Math.cos(pickerHsv.h * Math.PI / 180) * pickerHsv.s * .5;
    const y = 50 + Math.sin(pickerHsv.h * Math.PI / 180) * pickerHsv.s * .5;
    miniMarker.style.left = `${x}%`;
    miniMarker.style.top = `${y}%`;
    miniWheelColours.style.filter = `brightness(${pickerHsv.v / 100})`;
    miniBrightness.value = Math.round(pickerHsv.v);
    miniBrightnessOutput.textContent = `${Math.round(pickerHsv.v)}%`;
    const full = hsvToRgb(pickerHsv.h, pickerHsv.s, 100);
    miniBrightness.style.accentColor = colour.hex;
    miniBrightness.style.background = `linear-gradient(90deg,#000000,${rgbToHex(full.r, full.g, full.b)})`;
    miniPreview.style.background = colour.hex;
    if (document.activeElement !== miniHex) miniHex.value = colour.hex;
    basicGrid.querySelectorAll('.basic-colour').forEach((button) => {
      button.classList.toggle('selected', button.dataset.colour === colour.hex);
    });
  }

  function setMiniPickerFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    pickerHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    miniHex.value = rgbToHex(rgb.r, rgb.g, rgb.b);
    renderMiniPicker();
    return true;
  }

  function miniPointFromEvent(event) {
    const rect = miniWheel.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = event.clientX - (rect.left + radius);
    let dy = event.clientY - (rect.top + radius);
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      const scale = radius / distance;
      dx *= scale;
      dy *= scale;
    }
    return {
      h:normHue(Math.atan2(dy, dx) * 180 / Math.PI),
      s:clamp(Math.hypot(dx, dy) / radius * 100, 0, 100)
    };
  }

  function updateMiniFromPointer(event) {
    const point = miniPointFromEvent(event);
    pickerHsv.h = point.h;
    pickerHsv.s = point.s;
    renderMiniPicker();
  }

  miniWheel.addEventListener('pointerdown', (event) => {
    miniDragging = true;
    miniWheel.setPointerCapture?.(event.pointerId);
    updateMiniFromPointer(event);
  });
  miniWheel.addEventListener('pointermove', (event) => {
    if (miniDragging) updateMiniFromPointer(event);
  });
  const endMiniDrag = (event) => {
    miniDragging = false;
    try { miniWheel.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  miniWheel.addEventListener('pointerup', endMiniDrag);
  miniWheel.addEventListener('pointercancel', endMiniDrag);

  miniBrightness.addEventListener('input', () => {
    pickerHsv.v = Number(miniBrightness.value);
    renderMiniPicker();
  });

  miniHex.addEventListener('input', () => {
    const valid = normaliseHex(miniHex.value);
    if (valid) setMiniPickerFromHex(valid);
  });
  miniHex.addEventListener('blur', () => {
    miniHex.value = currentMiniColour().hex;
  });

  function openGradientPicker(input) {
    activeGradientInput = input;
    setMiniPickerFromHex(input.value || '#2F80ED');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeGradientPicker() {
    activeGradientInput = null;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  closePickerBtn.addEventListener('click', closeGradientPicker);
  cancelPickerBtn.addEventListener('click', closeGradientPicker);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeGradientPicker();
  });

  usePickerBtn.addEventListener('click', () => {
    if (!activeGradientInput) return closeGradientPicker();
    const hex = currentMiniColour().hex;
    activeGradientInput.value = hex.toLowerCase();
    activeGradientInput.dispatchEvent(new Event('input', { bubbles:true }));
    showToast(`Gradient colour set to ${hex}`);
    closeGradientPicker();
  });

  function decorateGradientInputs() {
    if (!gradientStops) return;
    gradientStops.querySelectorAll('input[type="color"]:not([data-custom-picker-ready])').forEach((input) => {
      input.dataset.customPickerReady = 'true';
      input.classList.add('native-gradient-colour');
      input.tabIndex = -1;
      input.setAttribute('aria-hidden', 'true');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gradient-colour-button';
      button.style.background = input.value;
      button.setAttribute('aria-label', 'Choose gradient stop colour');
      button.title = 'Choose colour';
      button.addEventListener('click', () => openGradientPicker(input));
      input.addEventListener('input', () => { button.style.background = input.value; });
      input.insertAdjacentElement('beforebegin', button);
    });
  }

  if (gradientStops) {
    new MutationObserver(decorateGradientInputs).observe(gradientStops, { childList:true, subtree:true });
    decorateGradientInputs();
  }
})();

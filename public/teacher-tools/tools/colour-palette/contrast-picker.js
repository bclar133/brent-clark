(() => {
  'use strict';

  const bgInput = document.getElementById('contrastBgHex');
  const textInput = document.getElementById('contrastTextHex');
  const bgSwatch = document.getElementById('contrastBgSwatch');
  const textSwatch = document.getElementById('contrastTextSwatch');
  if (!bgInput || !textInput || !bgSwatch || !textSwatch) return;

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

  function normaliseHex(hex) {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : null;
  }

  const basicColours = [
    '#F4CCCC','#FCE5CD','#FFF2CC','#D9EAD3','#D0E0E3','#CFE2F3','#D9D2E9','#EAD1DC',
    '#EA9999','#F9CB9C','#FFE599','#B6D7A8','#A2C4C9','#9FC5E8','#B4A7D6','#D5A6BD',
    '#FF0000','#FF9900','#FFFF00','#00FF00','#00FFFF','#0000FF','#9900FF','#FF00FF',
    '#CC0000','#E69138','#F1C232','#6AA84F','#45818E','#3D85C6','#674EA7','#A64D79',
    '#990000','#B45F06','#BF9000','#38761D','#134F5C','#0B5394','#351C75','#741B47',
    '#FFFFFF','#D9D9D9','#B7B7B7','#999999','#666666','#434343','#1C1C1C','#000000'
  ];

  let activeInput = null;
  let pickerHsv = { h: 0, s: 100, v: 100 };
  let dragging = false;

  function makeSwatchButton(oldSwatch, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = oldSwatch.id;
    button.className = `${oldSwatch.className} contrast-picker-trigger`;
    button.style.background = oldSwatch.style.background;
    button.setAttribute('aria-label', `Choose ${label.toLowerCase()} colour`);
    button.title = `Choose ${label.toLowerCase()} colour`;
    oldSwatch.replaceWith(button);
    return button;
  }

  const bgButton = makeSwatchButton(bgSwatch, 'Background');
  const textButton = makeSwatchButton(textSwatch, 'Text');

  const dialog = document.createElement('dialog');
  dialog.className = 'gradient-colour-dialog contrast-mini-dialog';
  dialog.id = 'contrastMiniColourDialog';
  dialog.innerHTML = `
    <div class="gradient-picker-shell">
      <div class="gradient-picker-header">
        <div>
          <h3 id="contrastMiniTitle">Choose colour</h3>
          <p>Use the mini wheel or pick from 48 basic colours.</p>
        </div>
        <button class="gradient-picker-close" id="contrastMiniClose" type="button" aria-label="Close colour picker">×</button>
      </div>
      <div class="gradient-picker-grid">
        <div class="mini-wheel-wrap">
          <div class="mini-colour-wheel" id="contrastMiniWheel" role="application" aria-label="Mini colour wheel">
            <div class="mini-wheel-colours" id="contrastMiniWheelColours" aria-hidden="true"></div>
            <div class="mini-wheel-marker" id="contrastMiniMarker" aria-hidden="true"></div>
          </div>
          <label class="mini-brightness">
            <span class="mini-brightness-label"><b>Brightness</b><output id="contrastMiniBrightnessOutput">100%</output></span>
            <input id="contrastMiniBrightness" type="range" min="0" max="100" step="1" value="100" aria-label="Mini picker brightness">
          </label>
          <div class="mini-picker-value">
            <span class="mini-picker-preview" id="contrastMiniPreview" aria-hidden="true"></span>
            <input id="contrastMiniHex" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Colour HEX code">
          </div>
        </div>
        <div class="basic-colours-panel">
          <h4>Basic colours</h4>
          <p>48 quick choices</p>
          <div class="basic-colour-grid" id="contrastBasicColourGrid"></div>
        </div>
      </div>
      <div class="gradient-picker-footer">
        <button class="ghost-button" id="contrastMiniCancel" type="button">Cancel</button>
        <button class="primary-button" id="contrastMiniUse" type="button">Use colour</button>
      </div>
    </div>
  `;
  document.body.append(dialog);

  const title = document.getElementById('contrastMiniTitle');
  const miniWheel = document.getElementById('contrastMiniWheel');
  const miniWheelColours = document.getElementById('contrastMiniWheelColours');
  const marker = document.getElementById('contrastMiniMarker');
  const brightness = document.getElementById('contrastMiniBrightness');
  const brightnessOutput = document.getElementById('contrastMiniBrightnessOutput');
  const preview = document.getElementById('contrastMiniPreview');
  const hexField = document.getElementById('contrastMiniHex');
  const basicGrid = document.getElementById('contrastBasicColourGrid');
  const closeBtn = document.getElementById('contrastMiniClose');
  const cancelBtn = document.getElementById('contrastMiniCancel');
  const useBtn = document.getElementById('contrastMiniUse');

  function currentColour() {
    const rgb = hsvToRgb(pickerHsv.h, pickerHsv.s, pickerHsv.v);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function render() {
    const hex = currentColour();
    const x = 50 + Math.cos(pickerHsv.h * Math.PI / 180) * pickerHsv.s * 0.5;
    const y = 50 + Math.sin(pickerHsv.h * Math.PI / 180) * pickerHsv.s * 0.5;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    miniWheelColours.style.filter = `brightness(${pickerHsv.v / 100})`;
    brightness.value = String(Math.round(pickerHsv.v));
    brightnessOutput.textContent = `${Math.round(pickerHsv.v)}%`;
    preview.style.background = hex;
    hexField.value = hex;

    document.querySelectorAll('#contrastBasicColourGrid .basic-colour').forEach((button) => {
      button.classList.toggle('selected', button.dataset.colour === hex);
    });
  }

  function setFromHex(hex) {
    const valid = normaliseHex(hex);
    if (!valid) return false;
    const rgb = hexToRgb(valid);
    pickerHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    render();
    return true;
  }

  function updateFromPointer(event) {
    const rect = miniWheel.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - (rect.left + radius);
    const dy = event.clientY - (rect.top + radius);
    const distance = Math.min(Math.hypot(dx, dy), radius);
    pickerHsv.h = normHue(Math.atan2(dy, dx) * 180 / Math.PI);
    pickerHsv.s = radius ? distance / radius * 100 : 0;
    render();
  }

  function openPicker(input, label) {
    activeInput = input;
    title.textContent = `Choose ${label.toLowerCase()} colour`;
    setFromHex(input.value) || setFromHex('#FFFFFF');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closePicker() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function applyColour() {
    if (!activeInput) return;
    activeInput.value = currentColour();
    activeInput.dispatchEvent(new Event('input', { bubbles:true }));
    activeInput.dispatchEvent(new Event('change', { bubbles:true }));
    closePicker();
  }

  basicColours.forEach((hex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'basic-colour';
    button.dataset.colour = hex;
    button.style.background = hex;
    button.title = hex;
    button.setAttribute('aria-label', `Choose ${hex}`);
    button.addEventListener('click', () => setFromHex(hex));
    button.addEventListener('dblclick', applyColour);
    basicGrid.append(button);
  });

  bgButton.addEventListener('click', () => openPicker(bgInput, 'Background'));
  textButton.addEventListener('click', () => openPicker(textInput, 'Text'));

  miniWheel.addEventListener('pointerdown', (event) => {
    dragging = true;
    miniWheel.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  });
  miniWheel.addEventListener('pointermove', (event) => {
    if (dragging) updateFromPointer(event);
  });
  const endDrag = (event) => {
    dragging = false;
    try { miniWheel.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  miniWheel.addEventListener('pointerup', endDrag);
  miniWheel.addEventListener('pointercancel', endDrag);

  brightness.addEventListener('input', () => {
    pickerHsv.v = Number(brightness.value);
    render();
  });

  hexField.addEventListener('input', () => {
    const valid = normaliseHex(hexField.value);
    if (valid) setFromHex(valid);
  });
  hexField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (setFromHex(hexField.value)) applyColour();
    }
  });
  hexField.addEventListener('blur', () => render());

  closeBtn.addEventListener('click', closePicker);
  cancelBtn.addEventListener('click', closePicker);
  useBtn.addEventListener('click', applyColour);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closePicker();
  });
})();

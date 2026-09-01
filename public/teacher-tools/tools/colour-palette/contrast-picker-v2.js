(() => {
  'use strict';

  const bgInput = document.getElementById('contrastBgHex');
  const textInput = document.getElementById('contrastTextHex');
  const bgSwatch = document.getElementById('contrastBgSwatch');
  const textSwatch = document.getElementById('contrastTextSwatch');
  if (!bgInput || !textInput || !bgSwatch || !textSwatch) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normHue = (h) => ((h % 360) + 360) % 360;

  const basicColours = [
    '#F4CCCC','#FCE5CD','#FFF2CC','#D9EAD3','#D0E0E3','#CFE2F3','#D9D2E9','#EAD1DC',
    '#EA9999','#F9CB9C','#FFE599','#B6D7A8','#A2C4C9','#9FC5E8','#B4A7D6','#D5A6BD',
    '#FF0000','#FF9900','#FFFF00','#00FF00','#00FFFF','#0000FF','#9900FF','#FF00FF',
    '#CC0000','#E69138','#F1C232','#6AA84F','#45818E','#3D85C6','#674EA7','#A64D79',
    '#990000','#B45F06','#BF9000','#38761D','#134F5C','#0B5394','#351C75','#741B47',
    '#FFFFFF','#D9D9D9','#B7B7B7','#999999','#666666','#434343','#1C1C1C','#000000'
  ];

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
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  function normaliseHex(hex) {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : '';
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
    return { h: normHue(h), s: max === 0 ? 0 : d / max * 100, v: max * 100 };
  }

  let activeInput = null;
  let activeLabel = '';
  let hsv = { h: 0, s: 0, v: 100 };
  let dragging = false;

  const dialog = document.createElement('dialog');
  dialog.id = 'contrastColourPickerV2';
  dialog.className = 'contrast-picker-v2';
  dialog.innerHTML = `
    <div class="contrast-picker-v2-shell">
      <div class="contrast-picker-v2-header">
        <div>
          <h3 id="contrastPickerV2Title">Choose colour</h3>
          <p>Use the mini wheel or choose from 48 basic colours.</p>
        </div>
        <button id="contrastPickerV2Close" class="contrast-picker-v2-close" type="button" aria-label="Close colour picker">×</button>
      </div>

      <div class="contrast-picker-v2-grid">
        <div class="contrast-picker-v2-wheel-column">
          <div id="contrastPickerV2Wheel" class="contrast-picker-v2-wheel" role="application" aria-label="Mini colour wheel">
            <div id="contrastPickerV2Colours" class="contrast-picker-v2-colours" aria-hidden="true"></div>
            <div id="contrastPickerV2Marker" class="contrast-picker-v2-marker" aria-hidden="true"></div>
          </div>

          <label class="contrast-picker-v2-brightness">
            <span><b>Brightness</b><output id="contrastPickerV2BrightnessOutput">100%</output></span>
            <input id="contrastPickerV2Brightness" type="range" min="0" max="100" value="100" step="1">
          </label>

          <div class="contrast-picker-v2-value">
            <span id="contrastPickerV2Preview" class="contrast-picker-v2-preview" aria-hidden="true"></span>
            <input id="contrastPickerV2Hex" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Colour HEX code">
          </div>
        </div>

        <div class="contrast-picker-v2-basic-panel">
          <h4>Basic colours</h4>
          <p>48 quick choices</p>
          <div id="contrastPickerV2BasicGrid" class="contrast-picker-v2-basic-grid"></div>
        </div>
      </div>

      <div class="contrast-picker-v2-footer">
        <button id="contrastPickerV2Cancel" class="ghost-button" type="button">Cancel</button>
        <button id="contrastPickerV2Done" class="primary-button" type="button">Done</button>
      </div>
    </div>
  `;
  document.body.append(dialog);

  const title = document.getElementById('contrastPickerV2Title');
  const wheel = document.getElementById('contrastPickerV2Wheel');
  const wheelColours = document.getElementById('contrastPickerV2Colours');
  const marker = document.getElementById('contrastPickerV2Marker');
  const brightness = document.getElementById('contrastPickerV2Brightness');
  const brightnessOutput = document.getElementById('contrastPickerV2BrightnessOutput');
  const preview = document.getElementById('contrastPickerV2Preview');
  const hexField = document.getElementById('contrastPickerV2Hex');
  const basicGrid = document.getElementById('contrastPickerV2BasicGrid');
  const doneButton = document.getElementById('contrastPickerV2Done');
  const cancelButton = document.getElementById('contrastPickerV2Cancel');
  const closeButton = document.getElementById('contrastPickerV2Close');

  function currentHex() {
    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function render() {
    const hex = currentHex();
    const radians = hsv.h * Math.PI / 180;
    marker.style.left = `${50 + Math.cos(radians) * hsv.s * 0.5}%`;
    marker.style.top = `${50 + Math.sin(radians) * hsv.s * 0.5}%`;
    wheelColours.style.filter = `brightness(${hsv.v / 100})`;
    brightness.value = String(Math.round(hsv.v));
    brightnessOutput.textContent = `${Math.round(hsv.v)}%`;
    preview.style.background = hex;
    if (document.activeElement !== hexField) hexField.value = hex;

    const full = hsvToRgb(hsv.h, hsv.s, 100);
    brightness.style.background = `linear-gradient(90deg,#000000,${rgbToHex(full.r, full.g, full.b)})`;

    basicGrid.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('selected', button.dataset.colour === hex);
    });
  }

  function setFromHex(hex) {
    const valid = normaliseHex(hex);
    if (!valid) return false;
    const rgb = hexToRgb(valid);
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    render();
    return true;
  }

  function updateFromPointer(event) {
    const rect = wheel.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = event.clientX - (rect.left + radius);
    let dy = event.clientY - (rect.top + radius);
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      const scale = radius / distance;
      dx *= scale;
      dy *= scale;
    }
    hsv.h = normHue(Math.atan2(dy, dx) * 180 / Math.PI);
    hsv.s = radius ? Math.hypot(dx, dy) / radius * 100 : 0;
    render();
  }

  function openPicker(input, label) {
    activeInput = input;
    activeLabel = label;
    title.textContent = `Choose ${label.toLowerCase()} colour`;
    setFromHex(input.value) || setFromHex('#FFFFFF');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closePicker() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function applyColour() {
    if (!activeInput) return;
    const hex = currentHex();
    activeInput.value = hex;
    activeInput.dispatchEvent(new Event('input', { bubbles:true }));
    activeInput.dispatchEvent(new Event('change', { bubbles:true }));
    closePicker();
  }

  basicColours.forEach((hex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'contrast-picker-v2-basic';
    button.dataset.colour = hex;
    button.style.backgroundColor = hex;
    button.title = hex;
    button.setAttribute('aria-label', `Choose ${hex}`);
    button.addEventListener('click', () => setFromHex(hex));
    button.addEventListener('dblclick', applyColour);
    basicGrid.append(button);
  });

  function makeSwatchInteractive(swatch, input, label) {
    swatch.classList.add('contrast-picker-v2-trigger');
    swatch.setAttribute('role', 'button');
    swatch.setAttribute('tabindex', '0');
    swatch.setAttribute('aria-label', `Choose ${label.toLowerCase()} colour`);
    swatch.title = `Choose ${label.toLowerCase()} colour`;
    swatch.addEventListener('click', () => openPicker(input, label));
    swatch.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPicker(input, label);
      }
    });
  }

  makeSwatchInteractive(bgSwatch, bgInput, 'Background');
  makeSwatchInteractive(textSwatch, textInput, 'Text');

  wheel.addEventListener('pointerdown', (event) => {
    dragging = true;
    wheel.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  });
  wheel.addEventListener('pointermove', (event) => {
    if (dragging) updateFromPointer(event);
  });
  const endDrag = (event) => {
    dragging = false;
    try { wheel.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  brightness.addEventListener('input', () => {
    hsv.v = Number(brightness.value);
    render();
  });

  hexField.addEventListener('input', () => {
    const valid = normaliseHex(hexField.value);
    if (valid) {
      const rgb = hexToRgb(valid);
      hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      preview.style.background = valid;
      render();
    }
  });
  hexField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (setFromHex(hexField.value)) applyColour();
    }
  });
  hexField.addEventListener('blur', () => {
    if (!setFromHex(hexField.value)) render();
  });

  doneButton.addEventListener('click', applyColour);
  cancelButton.addEventListener('click', closePicker);
  closeButton.addEventListener('click', closePicker);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePicker();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closePicker();
  });
})();

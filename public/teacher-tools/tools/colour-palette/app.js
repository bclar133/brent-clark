(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const normHue = (h) => ((h % 360) + 360) % 360;

  const wheel = $('#colourWheel');
  const wheelColours = $('#wheelColours');
  const markerLayer = $('#markerLayer');
  const selectionMarker = $('#selectionMarker');
  const brightnessSlider = $('#brightnessSlider');
  const brightnessOutput = $('#brightnessOutput');
  const currentPreview = $('#currentPreview');
  const previewHex = $('#previewHex');
  const hexInput = $('#hexInput');
  const redInput = $('#redInput');
  const greenInput = $('#greenInput');
  const blueInput = $('#blueInput');
  const rgbReadout = $('#rgbReadout');
  const hslReadout = $('#hslReadout');
  const hsvReadout = $('#hsvReadout');
  const addPaletteBtn = $('#addPaletteBtn');
  const randomColourBtn = $('#randomColourBtn');
  const surprisePaletteBtn = $('#surprisePaletteBtn');
  const clearPaletteBtn = $('#clearPaletteBtn');
  const paletteStrip = $('#paletteStrip');
  const paletteEmpty = $('#paletteEmpty');
  const schemeTabs = $('#schemeTabs');
  const schemeSwatches = $('#schemeSwatches');
  const schemeDescription = $('#schemeDescription');
  const addSchemeBtn = $('#addSchemeBtn');
  const gradientPreview = $('#gradientPreview');
  const gradientType = $('#gradientType');
  const gradientAngle = $('#gradientAngle');
  const angleOutput = $('#angleOutput');
  const angleRow = $('#angleRow');
  const gradientStops = $('#gradientStops');
  const addStopBtn = $('#addStopBtn');
  const loadPaletteBtn = $('#loadPaletteBtn');
  const cssOutput = $('#cssOutput');
  const fullscreenBtn = $('#fullscreenBtn');
  const toast = $('#toast');

  const MAX_PALETTE = 10;
  const MAX_STOPS = 5;
  let selected = rgbToHsv(47, 128, 237);
  let palette = [];
  let activeScheme = 'analogous';
  let currentScheme = [];
  let dragging = false;
  let dragPaletteIndex = -1;
  let toastTimer = 0;
  let gradientStopState = [
    { colour: '#2F80ED', position: 0 },
    { colour: '#9B51E0', position: 100 }
  ];

  const schemeInfo = {
    analogous: 'Neighbouring hues create a smooth, cohesive palette with gentle colour variation.',
    complementary: 'Opposite hues give strong contrast and make each other feel more vivid.',
    triadic: 'Three evenly spaced hues produce a balanced scheme with plenty of colour separation.',
    split: 'A base colour plus the two neighbours of its complement: lively contrast that is easier to balance.',
    tetradic: 'Four hues arranged as two complementary pairs for a broad, energetic palette.',
    monochromatic: 'One hue with different saturation and brightness levels for a calm, unified look.'
  };

  function hsvToRgb(h, s, v) {
    h = normHue(h);
    s = clamp(s, 0, 100) / 100;
    v = clamp(v, 0, 100) / 100;
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

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * (((b - r) / d) + 2);
      else h = 60 * (((r - g) / d) + 4);
    }
    return { h: normHue(h), s: s * 100, l: l * 100 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function hexToRgb(hex) {
    const raw = String(hex).trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  }

  function colourFromHsv(hsv) {
    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    return {
      h: hsv.h,
      s: hsv.s,
      v: hsv.v,
      ...rgb,
      hex: rgbToHex(rgb.r, rgb.g, rgb.b)
    };
  }

  function cloneColour(colour) {
    return colourFromHsv({ h: colour.h, s: colour.s, v: colour.v });
  }

  function contrastText(rgb) {
    const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luminance > 0.61 ? '#1F2C27' : '#FFFFFF';
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1450);
  }

  function selectedColour() {
    return colourFromHsv(selected);
  }

  function setSelectedHsv(h, s, v = selected.v, options = {}) {
    selected = { h: normHue(h), s: clamp(s, 0, 100), v: clamp(v, 0, 100) };
    if (options.paletteIndex >= 0 && palette[options.paletteIndex]) {
      palette[options.paletteIndex] = selectedColour();
      renderPalette();
    }
    renderSelection(options.keepInputFocus);
    renderScheme();
  }

  function setSelectedRgb(r, g, b, keepInputFocus = false) {
    selected = rgbToHsv(r, g, b);
    brightnessSlider.value = Math.round(selected.v);
    renderSelection(keepInputFocus);
    renderScheme();
  }

  function renderSelection(keepInputFocus = false) {
    const colour = selectedColour();
    const hsl = rgbToHsl(colour.r, colour.g, colour.b);
    const x = 50 + Math.cos(selected.h * Math.PI / 180) * selected.s * 0.5;
    const y = 50 + Math.sin(selected.h * Math.PI / 180) * selected.s * 0.5;
    selectionMarker.style.left = `${x}%`;
    selectionMarker.style.top = `${y}%`;
    wheelColours.style.filter = `brightness(${selected.v / 100})`;
    brightnessOutput.textContent = `${Math.round(selected.v)}%`;
    brightnessSlider.value = Math.round(selected.v);

    const fullValueRgb = hsvToRgb(selected.h, selected.s, 100);
    brightnessSlider.style.background = `linear-gradient(90deg, #000000, ${rgbToHex(fullValueRgb.r, fullValueRgb.g, fullValueRgb.b)})`;

    currentPreview.style.background = colour.hex;
    currentPreview.style.color = contrastText(colour);
    previewHex.textContent = colour.hex;
    rgbReadout.textContent = `${colour.r}, ${colour.g}, ${colour.b}`;
    hslReadout.textContent = `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;
    hsvReadout.textContent = `${Math.round(selected.h)}°, ${Math.round(selected.s)}%, ${Math.round(selected.v)}%`;

    const focused = document.activeElement;
    if (!keepInputFocus || focused !== hexInput) hexInput.value = colour.hex;
    if (!keepInputFocus || focused !== redInput) redInput.value = colour.r;
    if (!keepInputFocus || focused !== greenInput) greenInput.value = colour.g;
    if (!keepInputFocus || focused !== blueInput) blueInput.value = colour.b;
  }

  function wheelPositionFor(colour) {
    return {
      x: 50 + Math.cos(colour.h * Math.PI / 180) * colour.s * 0.5,
      y: 50 + Math.sin(colour.h * Math.PI / 180) * colour.s * 0.5
    };
  }

  function renderMarkers() {
    markerLayer.innerHTML = '';
    palette.forEach((colour, index) => {
      const pos = wheelPositionFor(colour);
      const marker = document.createElement('div');
      marker.className = 'palette-marker';
      marker.style.left = `${pos.x}%`;
      marker.style.top = `${pos.y}%`;
      marker.style.background = colour.hex;
      marker.style.color = contrastText(colour);
      marker.textContent = index + 1;
      markerLayer.append(marker);
    });
  }

  function renderPalette() {
    paletteStrip.innerHTML = '';
    paletteEmpty.hidden = palette.length > 0;
    paletteStrip.hidden = palette.length === 0;

    palette.forEach((colour, index) => {
      const item = document.createElement('article');
      item.className = 'palette-swatch';

      const colourButton = document.createElement('button');
      colourButton.type = 'button';
      colourButton.className = 'palette-colour';
      colourButton.style.background = colour.hex;
      colourButton.style.color = contrastText(colour);
      colourButton.innerHTML = `<span>${index + 1}</span>`;
      colourButton.title = `Select ${colour.hex}`;
      colourButton.addEventListener('click', () => {
        selected = { h: colour.h, s: colour.s, v: colour.v };
        renderSelection();
        renderScheme();
      });

      const meta = document.createElement('div');
      meta.className = 'palette-meta';
      meta.innerHTML = `<strong>${colour.hex}</strong><span>rgb(${colour.r}, ${colour.g}, ${colour.b})</span>`;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-colour';
      remove.setAttribute('aria-label', `Remove ${colour.hex} from palette`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        palette.splice(index, 1);
        renderPalette();
      });

      item.append(colourButton, meta, remove);
      paletteStrip.append(item);
    });

    renderMarkers();
  }

  function addColourToPalette(colour, quiet = false) {
    if (palette.some((item) => item.hex === colour.hex)) {
      if (!quiet) showToast(`${colour.hex} is already in the palette`);
      return false;
    }
    if (palette.length >= MAX_PALETTE) {
      if (!quiet) showToast(`Palette limit is ${MAX_PALETTE} colours`);
      return false;
    }
    palette.push(cloneColour(colour));
    renderPalette();
    if (!quiet) showToast(`${colour.hex} added to palette`);
    return true;
  }

  function colourAtWheelEvent(event) {
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
    return {
      h: normHue(Math.atan2(dy, dx) * 180 / Math.PI),
      s: clamp((Math.hypot(dx, dy) / radius) * 100, 0, 100),
      dx,
      dy,
      radius
    };
  }

  function nearestPalettePoint(event) {
    if (!palette.length) return -1;
    const rect = wheel.getBoundingClientRect();
    const radius = rect.width / 2;
    const ex = event.clientX - (rect.left + radius);
    const ey = event.clientY - (rect.top + radius);
    let nearest = -1;
    let nearestDistance = 22;
    palette.forEach((colour, index) => {
      const px = Math.cos(colour.h * Math.PI / 180) * colour.s / 100 * radius;
      const py = Math.sin(colour.h * Math.PI / 180) * colour.s / 100 * radius;
      const distance = Math.hypot(ex - px, ey - py);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    return nearest;
  }

  function updateFromWheel(event) {
    const point = colourAtWheelEvent(event);
    if (dragPaletteIndex >= 0 && palette[dragPaletteIndex]) {
      const v = palette[dragPaletteIndex].v;
      selected = { h: point.h, s: point.s, v };
      palette[dragPaletteIndex] = selectedColour();
      renderPalette();
      renderSelection();
      renderScheme();
    } else {
      setSelectedHsv(point.h, point.s);
    }
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomColour() {
    return colourFromHsv({ h: Math.random() * 360, s: randomInt(35, 100), v: randomInt(45, 100) });
  }

  function makeScheme(type = activeScheme) {
    const h = selected.h;
    const s = Math.max(selected.s, 28);
    const v = Math.max(selected.v, 32);
    const hueColour = (offset, sat = s, val = v) => colourFromHsv({ h: h + offset, s: sat, v: val });

    switch (type) {
      case 'complementary':
        return [hueColour(0), hueColour(180)];
      case 'triadic':
        return [hueColour(0), hueColour(120), hueColour(240)];
      case 'split':
        return [hueColour(0), hueColour(150), hueColour(210)];
      case 'tetradic':
        return [hueColour(0), hueColour(60), hueColour(180), hueColour(240)];
      case 'monochromatic':
        return [
          hueColour(0, Math.max(15, s * .45), Math.min(100, v + 25)),
          hueColour(0, Math.max(22, s * .7), Math.min(100, v + 12)),
          hueColour(0, s, v),
          hueColour(0, Math.min(100, s + 8), Math.max(25, v - 18)),
          hueColour(0, Math.min(100, s + 14), Math.max(14, v - 34))
        ];
      case 'analogous':
      default:
        return [-60, -30, 0, 30, 60].map((offset) => hueColour(offset));
    }
  }

  function renderScheme() {
    currentScheme = makeScheme(activeScheme);
    schemeDescription.textContent = schemeInfo[activeScheme];
    schemeSwatches.innerHTML = '';
    currentScheme.forEach((colour) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scheme-swatch';
      button.style.background = colour.hex;
      button.style.color = contrastText(colour);
      button.textContent = colour.hex;
      button.title = `Select ${colour.hex}`;
      button.addEventListener('click', () => {
        selected = { h: colour.h, s: colour.s, v: colour.v };
        renderSelection();
        renderScheme();
      });
      schemeSwatches.append(button);
    });
  }

  function generateSurprisePalette() {
    const modes = ['analogous', 'complementary', 'triadic', 'split', 'tetradic', 'monochromatic'];
    selected = { h: Math.random() * 360, s: randomInt(48, 88), v: randomInt(68, 98) };
    activeScheme = modes[randomInt(0, modes.length - 1)];
    $$('.scheme-tab', schemeTabs).forEach((tab) => tab.classList.toggle('active', tab.dataset.scheme === activeScheme));
    renderSelection();
    renderScheme();
    palette = currentScheme.slice(0, MAX_PALETTE).map(cloneColour);
    renderPalette();
    showToast(`${activeScheme[0].toUpperCase() + activeScheme.slice(1)} palette generated`);
  }

  function gradientCss() {
    const sorted = [...gradientStopState].sort((a, b) => a.position - b.position);
    const stops = sorted.map((stop) => `${stop.colour.toUpperCase()} ${Math.round(stop.position)}%`).join(', ');
    if (gradientType.value === 'radial') return `radial-gradient(circle, ${stops})`;
    return `linear-gradient(${Math.round(Number(gradientAngle.value))}deg, ${stops})`;
  }

  function renderGradient() {
    const css = gradientCss();
    gradientPreview.style.background = css;
    cssOutput.value = `background: ${css};`;
    angleOutput.textContent = `${gradientAngle.value}°`;
    angleRow.hidden = gradientType.value === 'radial';
    addStopBtn.disabled = gradientStopState.length >= MAX_STOPS;
    addStopBtn.textContent = gradientStopState.length >= MAX_STOPS ? 'Maximum 5 colour stops' : '＋ Add colour stop';
  }

  function renderGradientStops() {
    gradientStops.innerHTML = '';
    gradientStopState.forEach((stop, index) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop';

      const colourInput = document.createElement('input');
      colourInput.type = 'color';
      colourInput.value = stop.colour;
      colourInput.setAttribute('aria-label', `Gradient stop ${index + 1} colour`);
      colourInput.addEventListener('input', () => {
        stop.colour = colourInput.value.toUpperCase();
        renderGradient();
      });

      const main = document.createElement('div');
      main.className = 'gradient-stop-main';
      const topline = document.createElement('div');
      topline.className = 'gradient-stop-topline';
      const label = document.createElement('span');
      label.textContent = `Stop ${index + 1}`;
      const output = document.createElement('output');
      output.textContent = `${Math.round(stop.position)}%`;
      topline.append(label, output);

      const positionInput = document.createElement('input');
      positionInput.type = 'range';
      positionInput.min = '0';
      positionInput.max = '100';
      positionInput.step = '1';
      positionInput.value = String(stop.position);
      positionInput.setAttribute('aria-label', `Gradient stop ${index + 1} position`);
      positionInput.addEventListener('input', () => {
        stop.position = Number(positionInput.value);
        output.textContent = `${stop.position}%`;
        renderGradient();
      });
      main.append(topline, positionInput);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'gradient-stop-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove gradient stop ${index + 1}`);
      remove.disabled = gradientStopState.length <= 2;
      remove.addEventListener('click', () => {
        gradientStopState.splice(index, 1);
        renderGradientStops();
        renderGradient();
      });

      row.append(colourInput, main, remove);
      gradientStops.append(row);
    });
    renderGradient();
  }

  function loadPaletteIntoGradient() {
    const source = palette.length >= 2 ? palette : currentScheme;
    if (source.length < 2) return;
    const colours = source.slice(0, MAX_STOPS);
    gradientStopState = colours.map((colour, index) => ({
      colour: colour.hex,
      position: colours.length === 1 ? 0 : Math.round(index * 100 / (colours.length - 1))
    }));
    renderGradientStops();
    showToast(palette.length >= 2 ? 'Palette loaded into gradient' : 'Current scheme loaded into gradient');
  }

  async function copyValue(elementId, button) {
    const input = document.getElementById(elementId);
    if (!input) return;
    const value = input.value;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch (_) {}
    if (!copied) {
      input.focus();
      input.select();
      try { copied = document.execCommand('copy'); } catch (_) {}
    }
    if (copied) {
      const original = button.textContent;
      button.textContent = 'Copied';
      showToast('Copied to clipboard');
      setTimeout(() => { button.textContent = original; }, 900);
    } else {
      showToast('Select the value and copy it manually');
    }
  }

  wheel.tabIndex = 0;
  wheel.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragPaletteIndex = nearestPalettePoint(event);
    wheel.setPointerCapture?.(event.pointerId);
    updateFromWheel(event);
  });
  wheel.addEventListener('pointermove', (event) => {
    if (dragging) updateFromWheel(event);
  });
  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    dragPaletteIndex = -1;
    try { wheel.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  wheel.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 5 : 1;
    if (event.key === 'ArrowLeft') { event.preventDefault(); setSelectedHsv(selected.h - step, selected.s); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setSelectedHsv(selected.h + step, selected.s); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedHsv(selected.h, selected.s + step); }
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedHsv(selected.h, selected.s - step); }
  });

  brightnessSlider.addEventListener('input', () => setSelectedHsv(selected.h, selected.s, Number(brightnessSlider.value)));

  hexInput.addEventListener('input', () => {
    const rgb = hexToRgb(hexInput.value);
    if (rgb) setSelectedRgb(rgb.r, rgb.g, rgb.b, true);
  });
  hexInput.addEventListener('blur', () => { hexInput.value = selectedColour().hex; });

  const rgbInputs = [redInput, greenInput, blueInput];
  function updateFromRgbInputs() {
    const values = rgbInputs.map((input) => Number(input.value));
    if (values.every((value) => Number.isFinite(value) && value >= 0 && value <= 255)) {
      setSelectedRgb(values[0], values[1], values[2], true);
    }
  }
  rgbInputs.forEach((input) => {
    input.addEventListener('input', updateFromRgbInputs);
    input.addEventListener('blur', () => {
      const value = clamp(Number(input.value) || 0, 0, 255);
      input.value = Math.round(value);
      updateFromRgbInputs();
    });
  });

  addPaletteBtn.addEventListener('click', () => addColourToPalette(selectedColour()));
  randomColourBtn.addEventListener('click', () => {
    const colour = randomColour();
    selected = { h: colour.h, s: colour.s, v: colour.v };
    renderSelection();
    renderScheme();
  });
  surprisePaletteBtn.addEventListener('click', generateSurprisePalette);
  clearPaletteBtn.addEventListener('click', () => {
    palette = [];
    renderPalette();
    showToast('Palette cleared');
  });

  schemeTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-scheme]');
    if (!tab) return;
    activeScheme = tab.dataset.scheme;
    $$('.scheme-tab', schemeTabs).forEach((button) => button.classList.toggle('active', button === tab));
    renderScheme();
  });

  addSchemeBtn.addEventListener('click', () => {
    let added = 0;
    currentScheme.forEach((colour) => { if (addColourToPalette(colour, true)) added += 1; });
    if (added) showToast(`${added} scheme colour${added === 1 ? '' : 's'} added`);
    else showToast(palette.length >= MAX_PALETTE ? `Palette limit is ${MAX_PALETTE} colours` : 'Those colours are already in the palette');
  });

  gradientType.addEventListener('change', renderGradient);
  gradientAngle.addEventListener('input', renderGradient);
  addStopBtn.addEventListener('click', () => {
    if (gradientStopState.length >= MAX_STOPS) return;
    const positions = [...gradientStopState].sort((a, b) => a.position - b.position);
    let bestGap = -1;
    let insertPosition = 50;
    for (let i = 0; i < positions.length - 1; i += 1) {
      const gap = positions[i + 1].position - positions[i].position;
      if (gap > bestGap) {
        bestGap = gap;
        insertPosition = Math.round((positions[i].position + positions[i + 1].position) / 2);
      }
    }
    gradientStopState.push({ colour: selectedColour().hex, position: insertPosition });
    gradientStopState.sort((a, b) => a.position - b.position);
    renderGradientStops();
  });
  loadPaletteBtn.addEventListener('click', loadPaletteIntoGradient);

  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => copyValue(button.dataset.copy, button));
  });

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      showToast('Fullscreen is not available in this browser');
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    fullscreenBtn.title = active ? 'Exit fullscreen' : 'Fullscreen';
  });

  renderSelection();
  renderPalette();
  renderScheme();
  renderGradientStops();
})();

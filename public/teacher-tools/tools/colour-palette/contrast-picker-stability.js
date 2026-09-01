(() => {
  'use strict';

  const dialog = document.getElementById('contrastMiniColourDialog');
  const bgInput = document.getElementById('contrastBgHex');
  const textInput = document.getElementById('contrastTextHex');
  const bgTrigger = document.getElementById('contrastBgSwatch');
  const textTrigger = document.getElementById('contrastTextSwatch');
  if (!dialog || !bgInput || !textInput || !bgTrigger || !textTrigger) return;

  const grid = document.getElementById('contrastBasicColourGrid');
  const hexField = document.getElementById('contrastMiniHex');
  const preview = document.getElementById('contrastMiniPreview');
  const title = document.getElementById('contrastMiniTitle');

  function cleanButton(id) {
    const oldButton = document.getElementById(id);
    if (!oldButton) return null;
    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);
    return button;
  }

  // Remove any earlier click handlers from the footer controls so there is one
  // authoritative action for Apply/Cancel/Close.
  const useButton = cleanButton('contrastMiniUse');
  const cancelButton = cleanButton('contrastMiniCancel');
  const closeButton = cleanButton('contrastMiniClose');

  const basicColours = [
    '#F4CCCC','#FCE5CD','#FFF2CC','#D9EAD3','#D0E0E3','#CFE2F3','#D9D2E9','#EAD1DC',
    '#EA9999','#F9CB9C','#FFE599','#B6D7A8','#A2C4C9','#9FC5E8','#B4A7D6','#D5A6BD',
    '#FF0000','#FF9900','#FFFF00','#00FF00','#00FFFF','#0000FF','#9900FF','#FF00FF',
    '#CC0000','#E69138','#F1C232','#6AA84F','#45818E','#3D85C6','#674EA7','#A64D79',
    '#990000','#B45F06','#BF9000','#38761D','#134F5C','#0B5394','#351C75','#741B47',
    '#FFFFFF','#D9D9D9','#B7B7B7','#999999','#666666','#434343','#1C1C1C','#000000'
  ];

  let activeInput = bgInput;

  function normaliseHex(value) {
    const raw = String(value || '').trim().replace(/^#/, '').toUpperCase();
    return /^[0-9A-F]{6}$/.test(raw) ? `#${raw}` : '';
  }

  function closeDialog() {
    try {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    } catch (_) {
      dialog.removeAttribute('open');
    }
  }

  function syncPreview(hex) {
    const valid = normaliseHex(hex);
    if (!valid) return;
    if (hexField) hexField.value = valid;
    if (preview) preview.style.background = valid;
    grid?.querySelectorAll('.basic-colour').forEach((button) => {
      button.classList.toggle('selected', button.dataset.colour === valid);
    });
  }

  function rebuildGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    basicColours.forEach((hex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'basic-colour';
      button.dataset.colour = hex;
      button.style.setProperty('background-color', hex, 'important');
      button.title = hex;
      button.setAttribute('aria-label', `Choose ${hex}`);
      grid.append(button);
    });
  }

  function openFor(input, label) {
    activeInput = input;
    if (title) title.textContent = `Choose ${label.toLowerCase()} colour`;
    syncPreview(input.value || '#FFFFFF');
    if (!dialog.open) {
      try {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } catch (_) {
        dialog.setAttribute('open', '');
      }
    }
  }

  function applyChoice() {
    const valid = normaliseHex(hexField?.value);
    if (!valid || !activeInput) return;
    activeInput.value = valid;
    activeInput.dispatchEvent(new Event('input', { bubbles:true }));
    activeInput.dispatchEvent(new Event('change', { bubbles:true }));
    closeDialog();
  }

  rebuildGrid();

  grid?.addEventListener('click', (event) => {
    const button = event.target.closest('.basic-colour');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    syncPreview(button.dataset.colour);
  });

  grid?.addEventListener('dblclick', (event) => {
    const button = event.target.closest('.basic-colour');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    syncPreview(button.dataset.colour);
    applyChoice();
  });

  bgTrigger.addEventListener('click', () => {
    activeInput = bgInput;
    if (title) title.textContent = 'Choose background colour';
  }, true);
  textTrigger.addEventListener('click', () => {
    activeInput = textInput;
    if (title) title.textContent = 'Choose text colour';
  }, true);

  // Fallback open handlers in case the earlier picker wiring failed.
  bgTrigger.addEventListener('click', () => openFor(bgInput, 'Background'));
  textTrigger.addEventListener('click', () => openFor(textInput, 'Text'));

  if (useButton) {
    useButton.type = 'button';
    useButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyChoice();
    });
  }
  if (cancelButton) {
    cancelButton.type = 'button';
    cancelButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog();
    });
  }
  if (closeButton) {
    closeButton.type = 'button';
    closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog();
    });
  }

  hexField?.addEventListener('input', () => {
    const valid = normaliseHex(hexField.value);
    if (valid && preview) preview.style.background = valid;
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
})();

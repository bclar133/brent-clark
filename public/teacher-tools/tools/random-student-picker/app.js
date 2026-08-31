(() => {
  'use strict';

  const MAX_STUDENTS = 28;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const randomFloat = () => {
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  };
  const randomInt = max => {
    if (!Number.isFinite(max) || max <= 0) return 0;
    if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * max);
    const limit = Math.floor(4294967296 / max) * max;
    const values = new Uint32Array(1);
    do { window.crypto.getRandomValues(values); } while (values[0] >= limit);
    return values[0] % max;
  };
  const randomItem = array => array[randomInt(array.length)];
  const shuffled = array => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const refs = {
    namesInput: $('#namesInput'), groupNamesInput: $('#groupNamesInput'),
    studentCount: $('#studentCount'), groupStudentCount: $('#groupStudentCount'), remainingCount: $('#remainingCount'),
    cleanBtn: $('#cleanBtn'), sortBtn: $('#sortBtn'), clearBtn: $('#clearBtn'),
    groupCleanBtn: $('#groupCleanBtn'), groupSortBtn: $('#groupSortBtn'),
    resetCycleBtn: $('#resetCycleBtn'), historySection: $('#historySection'), historyList: $('#historyList'), clearHistoryBtn: $('#clearHistoryBtn'),
    modeStrip: $('#modeStrip'), modeHint: $('#modeHint'), stage: $('#stage'), idleStage: $('#idleStage'),
    wheelCanvas: $('#wheelCanvas'), dynamicStage: $('#dynamicStage'), winnerOverlay: $('#winnerOverlay'), winnerName: $('#winnerName'), winnerSub: $('#winnerSub'), winnerCelebration: $('#winnerCelebration'),
    startBtn: $('#startBtn'), settingsBtn: $('#settingsBtn'), settingsDialog: $('#settingsDialog'), fullscreenBtn: $('#fullscreenBtn'),
    muteBtn: $('#muteBtn'), themeBtn: $('#themeBtn'),
    removeAfterPick: $('#removeAfterPick'), nextSpinRemove: $('#nextSpinRemove'), nextSpinKeep: $('#nextSpinKeep'),
    soundEffects: $('#soundEffects'), celebrationEffects: $('#celebrationEffects'),
    showHistory: $('#showHistory'), autoNext: $('#autoNext'), speedSelect: $('#speedSelect'),
    toast: $('#toast'), confettiLayer: $('#confettiLayer'), pickerWorkspace: $('#pickerWorkspace'), groupsWorkspace: $('#groupsWorkspace'),
    groupValue: $('#groupValue'), groupValueLabel: $('#groupValueLabel'), animateGroups: $('#animateGroups'),
    makeGroupsBtn: $('#makeGroupsBtn'), reshuffleGroupsBtn: $('#reshuffleGroupsBtn'), groupsGrid: $('#groupsGrid'),
    rosterWarning: $('#rosterWarning'), groupRosterWarning: $('#groupRosterWarning'), winnerStatus: $('#winnerStatus'),
    savedClassSelect: $('#savedClassSelect'), groupSavedClassSelect: $('#groupSavedClassSelect'),
    classNameInput: $('#classNameInput'), groupClassNameInput: $('#groupClassNameInput'),
    saveClassBtn: $('#saveClassBtn'), groupSaveClassBtn: $('#groupSaveClassBtn'), loadClassBtn: $('#loadClassBtn'), groupLoadClassBtn: $('#groupLoadClassBtn'), deleteClassBtn: $('#deleteClassBtn'), groupDeleteClassBtn: $('#groupDeleteClassBtn'),
    copyGroupsBtn: $('#copyGroupsBtn'), printGroupsBtn: $('#printGroupsBtn'),
    presentationToolbar: $('#presentationToolbar'), presentationMuteBtn: $('#presentationMuteBtn'), presentationExitBtn: $('#presentationExitBtn'),
    mobilePickerBtn: $('#mobilePickerBtn'), mobileNamesBtn: $('#mobileNamesBtn')
  };

  const modeMeta = {
    slots: ['🎰', 'Classic arcade reveal'],
    wheel: ['🎡', 'Spin the colourful class wheel'],
    pointer: ['👉', 'Round-and-round pointer pick'],
    shuffle: ['🔀', 'Rapid-fire name shuffle'],
    race: ['🏁', '3, 2, 1 — race for the line'],
    duck: ['🦆', '3, 2, 1 — duck race!'],
    boxes: ['🎁', 'Open the winning mystery box'],
    rocket: ['🚀', 'Slow-burn launch into orbit'],
    elimination: ['🏆', 'Names disappear until one remains']
  };

  const speedMs = { quick: 1700, normal: 3000, dramatic: 4700 };
  const brightPalette = ['#ff4d6d','#ff7a3d','#ffb000','#ffd60a','#84d343','#29c76f','#20c4b6','#13b5d1','#40a5f5','#5873ff','#7654f6','#a94be8','#d646c8','#f14fa3','#ff69c5','#ff6f61','#ff934f','#27c2ff'];
  const pastelPalette = ['#dff7ef','#fde4ef','#fff0c9','#dff1ff','#e8e0ff','#ffe3d2','#d9f4f1','#f3dcff','#dfe8ff','#f8e6c4','#e0f5d7','#ffdce8'];

  const state = {
    students: [], available: [], history: [], groups: [], mode: 'slots', busy: false,
    suppressSync: false, overLimit: false, detectedCount: 0, lastWinner: '',
    activeDrawPool: null, presentationMode: false
  };

  function normalizeLine(line) {
    return line.trim().replace(/\s+/g, ' ');
  }

  function rawRosterEntries(raw, applyLimit = true) {
    const lines = raw
      .split(/[\n\r\t;]+/)
      .map(normalizeLine)
      .filter(Boolean);

    const entries = [];
    for (const line of lines) {
      let first = '';
      let surname = '';
      if (line.includes(',')) {
        const parts = line.split(',').map(normalizeLine).filter(Boolean);
        surname = parts[0] || '';
        first = (parts[1] || '').split(' ')[0] || surname;
      } else {
        const words = line.split(' ').filter(Boolean);
        first = words[0] || '';
        surname = words.length > 1 ? words[words.length - 1] : '';
      }
      if (!first) continue;
      const key = `${first}|${surname}`.toLocaleLowerCase();
      if (!entries.some(e => e.key === key)) entries.push({ first, surname, original: line, key });
    }
    return applyLimit ? entries.slice(0, MAX_STUDENTS) : entries;
  }

  function cleanedDisplayNames(raw, applyLimit = true) {
    const entries = rawRosterEntries(raw, applyLimit);
    const byFirst = new Map();
    entries.forEach(entry => {
      const key = entry.first.toLocaleLowerCase();
      if (!byFirst.has(key)) byFirst.set(key, []);
      byFirst.get(key).push(entry);
    });

    const display = [];
    for (const entry of entries) {
      const sameFirst = byFirst.get(entry.first.toLocaleLowerCase()) || [];
      if (sameFirst.length === 1) {
        display.push(entry.first);
        continue;
      }

      if (!entry.surname) {
        const position = sameFirst.indexOf(entry) + 1;
        display.push(`${entry.first} ${position}`);
        continue;
      }

      let prefixLength = 1;
      const surnames = sameFirst.map(e => e.surname || '');
      while (prefixLength < entry.surname.length) {
        const candidate = entry.surname.slice(0, prefixLength).toLocaleLowerCase();
        const clashes = surnames.filter(s => s.slice(0, prefixLength).toLocaleLowerCase() === candidate).length;
        if (clashes === 1) break;
        prefixLength++;
      }
      display.push(`${entry.first} ${entry.surname.slice(0, prefixLength)}`);
    }
    return display;
  }

  function parseNames(raw) {
    // Keep commas together so surname-first lists never become two students.
    return cleanedDisplayNames(raw, true).slice(0, MAX_STUDENTS);
  }

  function pastelForName(name) {
    let hash = 0;
    for (const char of name) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return pastelPalette[Math.abs(hash) % pastelPalette.length];
  }

  function detectedRosterCount(raw) {
    return rawRosterEntries(raw, false).length;
  }

  function eligiblePool() {
    return refs.removeAfterPick?.checked ? [...state.available] : [...state.students];
  }

  function visualPool() {
    if (state.busy && Array.isArray(state.activeDrawPool)) return [...state.activeDrawPool];
    return eligiblePool();
  }

  function updateRosterValidation(raw) {
    state.detectedCount = detectedRosterCount(raw);
    state.overLimit = state.detectedCount > MAX_STUDENTS;
    const extra = Math.max(0, state.detectedCount - MAX_STUDENTS);
    const message = state.overLimit
      ? `${state.detectedCount} students detected — maximum ${MAX_STUDENTS}. Remove ${extra} ${extra === 1 ? 'student' : 'students'} to continue.`
      : '';
    [refs.rosterWarning, refs.groupRosterWarning].forEach(el => {
      if (!el) return;
      el.textContent = message;
      el.hidden = !state.overLimit;
    });
    [refs.namesInput, refs.groupNamesInput].forEach(input => input.setAttribute('aria-invalid', String(state.overLimit)));
  }

  function updateStartButton() {
    if (!refs.startBtn) return;
    const icon = state.lastWinner ? '↻' : '▶';
    const label = state.lastWinner ? 'SPIN AGAIN' : 'START';
    refs.startBtn.innerHTML = `<span>${icon}</span> ${label}`;
  }

  function updateWinnerStatus() {
    if (!refs.winnerStatus) return;
    if (!state.lastWinner) {
      refs.winnerStatus.textContent = '';
      return;
    }
    if (refs.removeAfterPick.checked) {
      const remaining = state.available.length;
      refs.winnerStatus.textContent = remaining > 0
        ? `${state.lastWinner} removed · ${remaining} remaining`
        : `${state.lastWinner} removed · everyone has had a turn`;
    } else {
      refs.winnerStatus.textContent = `${state.lastWinner} remains eligible · whole class stays in the draw`;
    }
  }

  function setBothNameInputs(value, source) {
    state.suppressSync = true;
    if (source !== refs.namesInput) refs.namesInput.value = value;
    if (source !== refs.groupNamesInput) refs.groupNamesInput.value = value;
    state.suppressSync = false;
  }

  function syncStudents({ source = refs.namesInput, preserveCycle = true, render = true } = {}) {
    const raw = source.value;
    setBothNameInputs(raw, source);
    updateRosterValidation(raw);
    const next = parseNames(raw);
    const previous = state.students;
    const changed = next.join('\u0001') !== previous.join('\u0001');
    state.students = next;

    if (!preserveCycle || previous.length === 0 || (changed && !state.history.length)) {
      state.available = [...next];
    } else {
      const available = new Set(state.available.map(n => n.toLocaleLowerCase()));
      const previousSet = new Set(previous.map(n => n.toLocaleLowerCase()));
      state.available = next.filter(name => !previousSet.has(name.toLocaleLowerCase()) || available.has(name.toLocaleLowerCase()));
    }
    if (!refs.removeAfterPick.checked) state.available = [...next];

    if (changed) {
      state.lastWinner = '';
      state.activeDrawPool = null;
      updateStartButton();
      updateWinnerStatus();
    }

    refs.studentCount.textContent = state.detectedCount;
    refs.groupStudentCount.textContent = state.detectedCount;
    refs.remainingCount.textContent = refs.removeAfterPick.checked ? state.available.length : next.length;
    updateButtons();
    if (render && !state.busy) renderPreview();
  }

  function updateButtons() {
    const hasNames = state.students.length > 0;
    const canRun = hasNames && !state.overLimit;
    refs.startBtn.disabled = state.busy || !canRun;
    refs.makeGroupsBtn.disabled = !canRun;
    refs.reshuffleGroupsBtn.disabled = !canRun;
    if (refs.copyGroupsBtn) refs.copyGroupsBtn.disabled = !state.groups.length;
    if (refs.printGroupsBtn) refs.printGroupsBtn.disabled = !state.groups.length;
  }

  function cleanRoster(source) {
    const cleaned = cleanedDisplayNames(source.value, false);
    const value = cleaned.join('\n');
    source.value = value;
    setBothNameInputs(value, source);
    syncStudents({ source, preserveCycle: false });
    const warning = cleaned.length > MAX_STUDENTS ? ` Maximum is ${MAX_STUDENTS}; remove ${cleaned.length - MAX_STUDENTS} to continue.` : '';
    toast(`Cleaned ${cleaned.length} student name${cleaned.length === 1 ? '' : 's'}.${warning}`);
  }

  function sortRoster(source) {
    const names = cleanedDisplayNames(source.value, false).sort((a,b) => a.localeCompare(b));
    const value = names.join('\n');
    source.value = value;
    setBothNameInputs(value, source);
    syncStudents({ source, preserveCycle: false });
  }

  function clearAll() {
    refs.namesInput.value = '';
    refs.groupNamesInput.value = '';
    state.students = [];
    state.available = [];
    state.history = [];
    state.groups = [];
    state.lastWinner = '';
    state.activeDrawPool = null;
    renderHistory();
    updateStartButton();
    updateWinnerStatus();
    syncStudents({ source: refs.namesInput, preserveCycle: false });
    refs.groupsGrid.innerHTML = '<div class="groups-empty"><div aria-hidden="true">👥</div><p>Make some groups and they’ll appear here.</p></div>';
  }

  function setRemoveAfterPick(removeWinner, { resetPool = true, announce = false } = {}) {
    refs.removeAfterPick.checked = removeWinner;
    refs.nextSpinRemove.checked = removeWinner;
    refs.nextSpinKeep.checked = !removeWinner;

    if (resetPool) state.available = [...state.students];
    refs.remainingCount.textContent = removeWinner ? state.available.length : state.students.length;
    state.activeDrawPool = null;
    updateWinnerStatus();
    if (!state.busy) renderPreview();

    if (announce) {
      toast(removeWinner
        ? 'Next spin: previous winners are removed until the class resets.'
        : 'Next spin: the whole class is eligible again.');
    }
  }

  function resetCycle({ announce = true } = {}) {
    state.available = [...state.students];
    state.lastWinner = '';
    state.activeDrawPool = null;
    refs.remainingCount.textContent = state.available.length;
    hideWinner();
    updateStartButton();
    updateWinnerStatus();
    if (!state.busy) renderPreview();
    if (announce) toast('Class reset — everyone is available again.');
  }

  function renderHistory() {
    refs.historySection.hidden = !refs.showHistory.checked;
    refs.historyList.innerHTML = '';
    if (!state.history.length) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No selections yet.';
      refs.historyList.append(li);
      return;
    }
    [...state.history].reverse().forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      refs.historyList.append(li);
    });
  }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => refs.toast.classList.remove('show'), 2300);
  }

  function hideWinner() { refs.winnerOverlay.hidden = true; }

  function resetWheelCanvas() {
    const canvas = refs.wheelCanvas;
    const width = canvas.width;
    const height = canvas.height;
    // Reassigning the bitmap dimensions guarantees that no previous wheel
    // segments, transforms or clipping state can survive a roster change.
    canvas.width = width;
    canvas.height = height;
  }

  function clearStage() {
    refs.dynamicStage.innerHTML = '';
    refs.dynamicStage.classList.remove('active');
    refs.wheelCanvas.classList.remove('active');
    resetWheelCanvas();
  }

  function showIdle() {
    clearStage();
    refs.idleStage.style.display = 'grid';
    $('.idle-icon', refs.idleStage).textContent = modeMeta[state.mode][0];
    $('.idle-title', refs.idleStage).textContent = 'Add your class first';
    $('.idle-copy', refs.idleStage).textContent = 'Paste or type student names on the left and the randomiser will appear here.';
  }

  function activateDynamic() {
    refs.idleStage.style.display = 'none';
    refs.wheelCanvas.classList.remove('active');
    refs.dynamicStage.classList.add('active');
    refs.dynamicStage.innerHTML = '';
  }

  function activateWheel() {
    refs.idleStage.style.display = 'none';
    refs.dynamicStage.classList.remove('active');
    refs.dynamicStage.innerHTML = '';
    refs.wheelCanvas.classList.add('active');
  }

  function setStage(mode) {
    hideWinner();
    if (mode === 'wheel') activateWheel();
    else activateDynamic();
  }

  function renderPreview() {
    hideWinner();
    if (!state.students.length) {
      showIdle();
      return;
    }
    const pool = visualPool();
    if (!pool.length && refs.removeAfterPick.checked) {
      clearStage();
      refs.idleStage.style.display = 'grid';
      $('.idle-icon', refs.idleStage).textContent = '✅';
      $('.idle-title', refs.idleStage).textContent = 'Everyone has had a turn';
      $('.idle-copy', refs.idleStage).textContent = 'Press Reset class to start a fresh no-repeat cycle.';
      return;
    }
    const previewers = {
      slots: renderSlotsPreview,
      wheel: renderWheelPreview,
      pointer: renderPointerPreview,
      shuffle: renderShufflePreview,
      race: () => renderRacePreview(false),
      duck: () => renderRacePreview(true),
      boxes: renderBoxesPreview,
      rocket: renderRocketPreview,
      elimination: renderEliminationPreview
    };
    previewers[state.mode]();
  }

  function renderSlotsPreview() {
    activateDynamic();
    const names = visualPool().map(name => `<div class="slot-preview-name" style="background:${pastelForName(name)}">${escapeHtml(name)}</div>`).join('');
    refs.dynamicStage.innerHTML = `<div class="slot-machine"><div class="slot-window"><div class="slot-label">LUCKY STUDENT</div><div class="slot-preview-pool">${names}</div></div></div>`;
  }

  function polarPoint(cx, cy, radius, angleDeg) {
    const angle = angleDeg * Math.PI / 180;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  function wheelWedgePath(cx, cy, radius, startDeg, endDeg) {
    const start = polarPoint(cx, cy, radius, startDeg);
    const end = polarPoint(cx, cy, radius, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
  }

  function buildWheelSvg() {
    activateDynamic();
    const names = visualPool().filter(name => String(name).trim());
    const size = 600;
    const cx = 300, cy = 300, radius = 255;
    const arcDeg = 360 / names.length;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'wheel-svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Random student wheel with ${names.length} students`);

    const wheelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wheelGroup.setAttribute('class', 'wheel-rotor');
    wheelGroup.style.transformOrigin = `${cx}px ${cy}px`;

    names.forEach((name, i) => {
      const startDeg = -90 + i * arcDeg;
      const endDeg = startDeg + arcDeg;
      const midDeg = startDeg + arcDeg / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', wheelWedgePath(cx, cy, radius, startDeg, endDeg));
      path.setAttribute('fill', brightPalette[i % brightPalette.length]);
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '3');
      wheelGroup.append(path);

      const labelRadius = radius * .73;
      const point = polarPoint(cx, cy, labelRadius, midDeg);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const maxChars = names.length > 22 ? 10 : names.length > 16 ? 12 : 15;
      text.textContent = name.length > maxChars ? `${name.slice(0,maxChars-1)}…` : name;
      text.setAttribute('x', point.x.toFixed(2));
      text.setAttribute('y', point.y.toFixed(2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'wheel-label');
      text.setAttribute('font-size', names.length > 24 ? '13' : names.length > 18 ? '15' : names.length > 12 ? '17' : '20');
      let labelRotation = midDeg;
      const normalized = ((midDeg % 360) + 360) % 360;
      if (normalized > 90 && normalized < 270) labelRotation += 180;
      text.setAttribute('transform', `rotate(${labelRotation} ${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
      wheelGroup.append(text);
    });

    const hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', '43');
    hub.setAttribute('fill', '#fff'); hub.setAttribute('stroke', '#172033'); hub.setAttribute('stroke-width', '8');
    wheelGroup.append(hub);
    svg.append(wheelGroup);

    const pointer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pointer.setAttribute('d', 'M 300 36 L 274 0 L 326 0 Z');
    pointer.setAttribute('fill', '#172033');
    svg.append(pointer);
    const pointerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pointerDot.setAttribute('cx', '300'); pointerDot.setAttribute('cy', '9'); pointerDot.setAttribute('r', '8'); pointerDot.setAttribute('fill', '#ffb13b');
    svg.append(pointerDot);

    refs.dynamicStage.append(svg);
    return { svg, wheelGroup, names, arcDeg };
  }

  function renderWheelPreview() {
    buildWheelSvg();
  }

  function pointerPlacement(poolLength, index, stageSize) {
    const compactTwoRing = stageSize < 380 && poolLength > 16;
    if (!compactTwoRing) {
      return {
        angle: index / poolLength * 360,
        radius: Math.max(105, stageSize / 2 - (poolLength > 20 ? 39 : 31))
      };
    }
    const ring = index % 2;
    const position = Math.floor(index / 2);
    const perRing = Math.ceil(poolLength / 2);
    return {
      angle: position / perRing * 360 + (ring ? 180 / perRing : 0),
      radius: Math.max(76, stageSize / 2 - (ring ? 72 : 34))
    };
  }

  function buildPointer() {
    activateDynamic();
    const pool = visualPool();
    const dense = pool.length > 20 ? ' dense-pointer' : '';
    refs.dynamicStage.innerHTML = `<div class="pointer-stage${dense}"><div class="pointer-ring"></div><div class="pointer-arm"></div><div class="pointer-hub"></div></div>`;
    const stage = $('.pointer-stage', refs.dynamicStage);
    const stageSize = stage.getBoundingClientRect().width || 490;
    pool.forEach((name, i) => {
      const el = document.createElement('div');
      el.className = 'pointer-name';
      el.textContent = name;
      el.style.background = pastelForName(name);
      const placement = pointerPlacement(pool.length, i, stageSize);
      el.dataset.pointerAngle = String(placement.angle);
      el.style.transform = `translate(-50%,-50%) rotate(${placement.angle}deg) translateY(-${placement.radius}px) rotate(90deg)`;
      stage.append(el);
    });
    return stage;
  }

  function renderPointerPreview() { buildPointer(); }

  function renderShufflePreview() {
    activateDynamic();
    const tiles = visualPool().map(name => `<div class="name-tile" style="background:${pastelForName(name)}">${escapeHtml(name)}</div>`).join('');
    refs.dynamicStage.innerHTML = `<div class="preview-grid shuffle-preview">${tiles}</div>`;
  }

  function buildRaceBoard(isDuck, preview = false) {
    const board = document.createElement('div');
    const pool = visualPool();
    board.className = `race-board${isDuck ? ' duck-race' : ''}${pool.length > 20 ? ' dense-race' : ''}`;
    pool.forEach(name => {
      const lane = document.createElement('div');
      lane.className = 'race-lane';
      const track = document.createElement('div');
      track.className = 'race-track';
      const racer = document.createElement('div');
      racer.className = `racer ${isDuck ? 'ducking' : 'running'}${preview ? ' preview-racer' : ''}`;
      racer.dataset.name = name;
      const label = document.createElement('span');
      label.className = 'racer-name';
      label.textContent = name;
      const character = document.createElement('span');
      character.className = 'racer-character';
      character.textContent = isDuck ? '🦆' : '🏃';
      racer.append(label, character);
      track.append(racer);
      lane.append(track);
      board.append(lane);
    });
    return board;
  }

  function renderRacePreview(isDuck) {
    activateDynamic();
    refs.dynamicStage.append(buildRaceBoard(isDuck, true));
  }

  function renderBoxesPreview() {
    const pool = visualPool();
    activateDynamic();
    const grid = document.createElement('div');
    grid.className = 'box-grid';
    pool.forEach((name, i) => {
      const box = document.createElement('div');
      box.className = 'mystery-box';
      box.style.background = pastelPalette[i % pastelPalette.length];
      box.innerHTML = `<span>🎁</span><span class="box-name">${escapeHtml(name)}</span>`;
      grid.append(box);
    });
    refs.dynamicStage.append(grid);
  }

  function rocketMarkup(name, preview = false, colorIndex = 0) {
    const color = brightPalette[colorIndex % brightPalette.length];
    return `<div class="rocket-ship${preview ? ' preview-rocket' : ''}" style="--rocket-color:${color}"><span class="rocket-fin left"></span><span class="rocket-fin right"></span><span class="rocket-flame"></span></div>`;
  }

  function renderRocketPreview() {
    const pool = visualPool();
    activateDynamic();
    const lineCapacity = window.innerWidth <= 600 ? 8 : 16;
    if (pool.length > lineCapacity) {
      const wrap = document.createElement('div');
      wrap.className = 'rocket-preview-summary';
      wrap.innerHTML = '<div class="rocket-target-demo"><span>🎯 TARGET</span></div>';
      const grid = document.createElement('div');
      grid.className = 'rocket-preview-grid';
      pool.forEach((name, i) => {
        const item = document.createElement('div');
        item.className = 'rocket-preview-item';
        item.innerHTML = `${rocketMarkup(name, true, i)}<span class="rocket-preview-name" style="background:${pastelForName(name)}">${escapeHtml(name)}</span>`;
        grid.append(item);
      });
      wrap.append(grid);
      refs.dynamicStage.append(wrap);
      return;
    }

    const board = document.createElement('div');
    board.className = 'rocket-board preview-board';
    board.innerHTML = '<div class="rocket-target-line"></div><div class="rocket-target-badge">🎯 TARGET</div><div class="rocket-ground"></div>';
    pool.forEach((name, i) => {
      const racer = document.createElement('div');
      racer.className = 'rocket-racer preview-rocket-racer';
      racer.style.left = `${(i + .5) / pool.length * 100}%`;
      racer.style.bottom = '18px';
      racer.innerHTML = `${rocketMarkup(name, true, i)}<span class="rocket-racer-name" style="background:${pastelForName(name)}">${escapeHtml(name)}</span>`;
      board.append(racer);
    });
    refs.dynamicStage.append(board);
  }

  function renderEliminationPreview() {
    const pool = visualPool();
    activateDynamic();
    const grid = document.createElement('div');
    grid.className = 'elimination-grid';
    pool.forEach((name, i) => {
      const el = document.createElement('div');
      el.className = 'elim-name';
      el.textContent = name;
      el.style.background = pastelPalette[i % pastelPalette.length];
      grid.append(el);
    });
    refs.dynamicStage.append(grid);
  }

  function showWinner(name) {
    refs.winnerName.textContent = name;
    refs.winnerSub.textContent = randomItem(['Nice one!', 'You’re up!', 'Your turn!', 'The randomiser has spoken.', 'Ready to go?']);
    refs.winnerOverlay.hidden = false;
    if (refs.celebrationEffects.checked) celebrate();
    if (refs.soundEffects.checked) playWinnerSound();
  }

  function celebrate() {
    const layer = refs.winnerCelebration;
    if (!layer) return;
    layer.innerHTML = '';

    const colors = brightPalette;
    const overlayRect = refs.winnerOverlay.getBoundingClientRect();
    const nameRect = refs.winnerName.getBoundingClientRect();
    const nameCenterX = nameRect.left - overlayRect.left + nameRect.width / 2;
    const nameCenterY = nameRect.top - overlayRect.top + nameRect.height / 2;

    // Fireworks burst around the actual winning name.
    const burstOffsets = [
      [-nameRect.width * .55, -nameRect.height * .75],
      [ nameRect.width * .55, -nameRect.height * .65],
      [-nameRect.width * .65,  nameRect.height * .55],
      [ nameRect.width * .65,  nameRect.height * .5],
      [0, -nameRect.height * 1.05]
    ];

    burstOffsets.forEach(([ox, oy], burstIndex) => {
      const originX = nameCenterX + ox;
      const originY = nameCenterY + oy;
      const particleCount = 22;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('span');
        particle.className = 'winner-firework-particle';
        particle.style.background = colors[(i + burstIndex * 3) % colors.length];
        particle.style.boxShadow = `0 0 10px ${colors[(i + burstIndex * 3) % colors.length]}`;
        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        layer.append(particle);

        const angle = (i / particleCount) * Math.PI * 2 + randomFloat() * .12;
        const distance = 58 + randomFloat() * 82;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const delay = burstIndex * 110 + randomFloat() * 80;

        particle.animate([
          { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: .14 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.18)`, opacity: 0 }
        ], {
          duration: 900 + randomFloat() * 320,
          delay,
          easing: 'cubic-bezier(.12,.62,.25,1)',
          fill: 'forwards'
        });
      }
    });

    // Confetti is created inside the winner overlay so it cannot sit behind it.
    const overlayWidth = Math.max(overlayRect.width, 320);
    const overlayHeight = Math.max(overlayRect.height, 260);
    for (let i = 0; i < 120; i++) {
      const piece = document.createElement('span');
      piece.className = 'winner-confetti';
      const color = colors[i % colors.length];
      const x = randomFloat() * overlayWidth;
      const startY = -20 - randomFloat() * 100;
      const drift = -130 + randomFloat() * 260;
      const rotation = 540 + randomFloat() * 720;
      piece.style.left = `${x}px`;
      piece.style.top = `${startY}px`;
      piece.style.background = color;
      if (i % 4 === 0) piece.classList.add('round');
      layer.append(piece);

      piece.animate([
        { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate3d(${drift * .35}px,${overlayHeight * .45}px,0) rotate(${rotation * .45}deg)`, opacity: 1, offset: .55 },
        { transform: `translate3d(${drift}px,${overlayHeight + 140}px,0) rotate(${rotation}deg)`, opacity: .95 }
      ], {
        duration: 1900 + randomFloat() * 1000,
        delay: randomFloat() * 450,
        easing: 'cubic-bezier(.18,.55,.32,1)',
        fill: 'forwards'
      });
    }

    // Add a bright expanding ring behind the winning name for extra visibility.
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('span');
      ring.className = 'winner-celebration-ring';
      ring.style.left = `${nameCenterX}px`;
      ring.style.top = `${nameCenterY}px`;
      ring.style.borderColor = colors[(i * 5 + 2) % colors.length];
      layer.append(ring);
      ring.animate([
        { transform: 'translate(-50%,-50%) scale(.25)', opacity: .9 },
        { transform: `translate(-50%,-50%) scale(${2.2 + i * .45})`, opacity: 0 }
      ], {
        duration: 950 + i * 180,
        delay: 120 + i * 140,
        easing: 'ease-out',
        fill: 'forwards'
      });
    }

    clearTimeout(celebrate.timer);
    celebrate.timer = setTimeout(() => { layer.innerHTML = ''; }, 3600);
  }

  const audioState = { ctx: null, noiseBuffer: null };

  function applyMuteState(muted, { persist = true } = {}) {
    refs.soundEffects.checked = !muted;
    refs.muteBtn.textContent = muted ? '🔇' : '🔊';
    refs.muteBtn.setAttribute('aria-pressed', String(muted));
    refs.muteBtn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
    refs.muteBtn.title = muted ? 'Unmute sounds' : 'Mute sounds';

    if (audioState.ctx) {
      if (muted && audioState.ctx.state === 'running') audioState.ctx.suspend().catch(() => {});
      if (!muted && audioState.ctx.state === 'suspended') audioState.ctx.resume().catch(() => {});
    }

    syncPresentationMuteButton();
    if (persist) {
      try { localStorage.setItem('teacherToolsMuted', muted ? '1' : '0'); } catch (_) {}
    }
  }

  function applyTheme(theme, { persist = true } = {}) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    refs.themeBtn.textContent = dark ? '☀️' : '🌙';
    refs.themeBtn.setAttribute('aria-pressed', String(dark));
    refs.themeBtn.setAttribute('aria-label', dark ? 'Turn on light mode' : 'Turn on dark mode');
    refs.themeBtn.title = dark ? 'Turn on light mode' : 'Turn on dark mode';
    if (persist) {
      try { localStorage.setItem('teacherToolsTheme', dark ? 'dark' : 'light'); } catch (_) {}
    }
  }

  function loadSitePreferences() {
    let muted = false;
    let theme = 'light';
    try {
      muted = localStorage.getItem('teacherToolsMuted') === '1';
      theme = localStorage.getItem('teacherToolsTheme') || 'light';
    } catch (_) {}
    applyMuteState(muted, { persist: false });
    applyTheme(theme, { persist: false });
  }

  function getAudioContext() {
    if (!refs.soundEffects.checked) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioState.ctx) audioState.ctx = new AudioCtx();
    if (audioState.ctx.state === 'suspended') audioState.ctx.resume().catch(() => {});
    return audioState.ctx;
  }

  function getNoiseBuffer(ctx) {
    if (audioState.noiseBuffer && audioState.noiseBuffer.sampleRate === ctx.sampleRate) return audioState.noiseBuffer;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = randomFloat() * 2 - 1;
    audioState.noiseBuffer = buffer;
    return buffer;
  }

  function tone(frequency, duration = .1, options = {}) {
    const ctx = getAudioContext();
    if (!ctx) return null;
    const {
      type = 'sine', volume = .025, when = 0, attack = .006,
      release = .07, endFrequency = null, detune = 0
    } = options;
    const start = ctx.currentTime + when;
    const end = start + duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), end);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(attack, duration * .35));
    gain.gain.setValueAtTime(Math.max(.0002, volume), Math.max(start + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + .02);
    return osc;
  }

  function noiseBurst(duration = .08, options = {}) {
    const ctx = getAudioContext();
    if (!ctx) return null;
    const {
      volume = .03, frequency = 1200, q = .7,
      type = 'bandpass', when = 0, attack = .002
    } = options;
    const start = ctx.currentTime + when;
    const end = start + duration;
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start);
    source.stop(end + .02);
    return source;
  }

  function beep(frequency = 440, duration = .06, volume = .02) {
    return tone(frequency, duration, { type: 'sine', volume });
  }

  function soothingTone(index = 0) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 987.77];
    const f = scale[Math.abs(index) % scale.length];
    tone(f, .2, { type: 'sine', volume: .018, release: .13 });
    tone(f * 2, .14, { type: 'triangle', volume: .006, when: .015, release: .1 });
  }

  function slotTick(progress = 0) {
    noiseBurst(.026, { volume: .015, frequency: 1500 + progress * 1300, q: 1.8 });
    tone(150 + progress * 120, .022, { type: 'square', volume: .006 });
  }

  function startSlotMotor() {
    const ctx = getAudioContext();
    if (!ctx) return () => {};
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 950;
    filter.Q.value = .65;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.012, ctx.currentTime + .06);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    return () => {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .1);
      try { source.stop(now + .12); } catch (_) {}
    };
  }

  function playSlotStop() {
    tone(1046.5, .1, { type: 'triangle', volume: .025 });
    tone(1318.5, .12, { type: 'triangle', volume: .022, when: .09 });
    tone(1568, .22, { type: 'sine', volume: .026, when: .18, release: .18 });
  }

  function startCarnivalMusic() {
    if (!getAudioContext()) return () => {};
    const melody = [659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 587.33];
    let i = 0;
    const playNote = () => {
      const f = melody[i++ % melody.length];
      tone(f, .16, { type: 'square', volume: .012, release: .08 });
      tone(f * 2, .1, { type: 'triangle', volume: .004, when: .01 });
    };
    playNote();
    const id = setInterval(playNote, 180);
    return () => clearInterval(id);
  }

  function pointerTick(strength = 1) {
    noiseBurst(.035, { volume: .014 * strength, frequency: 2600, q: 5 });
    tone(980, .025, { type: 'square', volume: .004 * strength });
  }

  function playStartGun() {
    // Layer a very short high-frequency crack, a body hit and a brief echo tail.
    // This produces a starter-pistol style transient without needing an audio file.
    const ctx = getAudioContext();
    if (!ctx) return;

    noiseBurst(.045, { volume: .105, frequency: 4200, q: .42, type: 'highpass', attack: .0005 });
    noiseBurst(.085, { volume: .085, frequency: 1550, q: .55, type: 'bandpass', attack: .0005 });
    noiseBurst(.13, { volume: .045, frequency: 520, q: .45, type: 'lowpass', attack: .001 });
    tone(118, .09, { type: 'square', volume: .025, endFrequency: 62, release: .075, attack: .001 });

    // Short reflections make the crack read more like a real outdoor starter gun.
    noiseBurst(.035, { volume: .025, frequency: 3100, q: .5, type: 'highpass', when: .075, attack: .0005 });
    noiseBurst(.05, { volume: .013, frequency: 2100, q: .55, type: 'bandpass', when: .145, attack: .0005 });
  }

  function playFootstep(strength = 1, pan = 0, delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const start = ctx.currentTime + Math.max(0, delay);

    const output = ctx.createGain();
    output.gain.value = 1.25;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      output.connect(panner).connect(ctx.destination);
    } else {
      output.connect(ctx.destination);
    }

    // Heel impact: strong and short enough to read as a footfall, not a bass drone.
    const heel = ctx.createOscillator();
    const heelGain = ctx.createGain();
    heel.type = 'sine';
    heel.frequency.setValueAtTime(145 + randomFloat() * 25, start);
    heel.frequency.exponentialRampToValueAtTime(62 + randomFloat() * 10, start + .085);
    heelGain.gain.setValueAtTime(.0001, start);
    heelGain.gain.exponentialRampToValueAtTime(.060 * strength, start + .003);
    heelGain.gain.exponentialRampToValueAtTime(.0001, start + .115);
    heel.connect(heelGain).connect(output);

    // Shoe contact: a discrete track slap, much louder than the old effect.
    const contact = ctx.createBufferSource();
    contact.buffer = getNoiseBuffer(ctx);
    const contactFilter = ctx.createBiquadFilter();
    contactFilter.type = 'bandpass';
    contactFilter.frequency.value = 1250 + randomFloat() * 500;
    contactFilter.Q.value = 1.4;
    const contactGain = ctx.createGain();
    contactGain.gain.setValueAtTime(.0001, start);
    contactGain.gain.exponentialRampToValueAtTime(.032 * strength, start + .002);
    contactGain.gain.exponentialRampToValueAtTime(.0001, start + .07);
    contact.connect(contactFilter).connect(contactGain).connect(output);

    // Toe-off gives a second tiny impact so each stride has a recognisable rhythm.
    const toe = ctx.createOscillator();
    const toeGain = ctx.createGain();
    toe.type = 'triangle';
    toe.frequency.setValueAtTime(310 + randomFloat() * 70, start + .055);
    toe.frequency.exponentialRampToValueAtTime(185 + randomFloat() * 35, start + .105);
    toeGain.gain.setValueAtTime(.0001, start + .05);
    toeGain.gain.exponentialRampToValueAtTime(.020 * strength, start + .058);
    toeGain.gain.exponentialRampToValueAtTime(.0001, start + .115);
    toe.connect(toeGain).connect(output);

    heel.start(start);
    heel.stop(start + .125);
    contact.start(start);
    contact.stop(start + .08);
    toe.start(start + .05);
    toe.stop(start + .125);
  }

  function startFootsteps(duration = 6000) {
    if (!getAudioContext()) return () => {};
    const started = performance.now();
    let stopped = false;
    let timeoutId = null;
    let left = true;

    const step = () => {
      if (stopped) return;
      const progress = clamp((performance.now() - started) / Math.max(1, duration), 0, 1);
      // Audible sprint cadence that builds slightly toward the finish.
      const cadence = 238 - progress * 48 + randomFloat() * 20;
      playFootstep(1.05 + randomFloat() * .30, left ? -.28 : .28);
      left = !left;

      // Offset runners make it sound like a field of runners without a white-noise bed.
      if (randomFloat() > .18) {
        playFootstep(.58 + randomFloat() * .22, -.65 + randomFloat() * 1.3, .055 + randomFloat() * .035);
      }
      if (randomFloat() > .52) {
        playFootstep(.42 + randomFloat() * .18, -.8 + randomFloat() * 1.6, .11 + randomFloat() * .045);
      }

      timeoutId = setTimeout(step, Math.max(165, cadence));
    };

    step();
    return () => {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }

  function playQuack() {
    const f = 520 + randomFloat() * 90;
    tone(f, .11, { type: 'sawtooth', volume: .012, endFrequency: f * .65, release: .07 });
    tone(f * .72, .08, { type: 'square', volume: .0045, when: .035, endFrequency: f * .52, release: .05 });
  }

  function startDuckQuacks() {
    if (!getAudioContext()) return () => {};
    playQuack();
    const id = setInterval(() => {
      playQuack();
      if (randomFloat() > .58) setTimeout(playQuack, 90 + randomFloat() * 120);
    }, 420 + randomFloat() * 180);
    return () => clearInterval(id);
  }

  function startRocketThrust() {
    const ctx = getAudioContext();
    if (!ctx) return () => {};
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 1.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.04, ctx.currentTime + .32);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(55, ctx.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(95, ctx.currentTime + 1.5);
    rumbleGain.gain.value = .01;
    rumble.connect(rumbleGain).connect(ctx.destination);
    rumble.start();
    return () => {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .35);
      rumbleGain.gain.setValueAtTime(.01, now);
      rumbleGain.gain.exponentialRampToValueAtTime(.0001, now + .35);
      try { source.stop(now + .38); rumble.stop(now + .38); } catch (_) {}
    };
  }

  function playWinnerSound() {
    tone(523.25,.1,{type:'triangle',volume:.016});
    tone(659.25,.1,{type:'triangle',volume:.016,when:.1});
    tone(783.99,.22,{type:'sine',volume:.02,when:.2,release:.16});
  }

  function easeOutQuint(t) { return 1 - Math.pow(1 - clamp(t,0,1),5); }
  function easeInOutCubic(t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

  function chooseWinner() {
    if (!state.students.length || state.overLimit) return null;
    if (refs.removeAfterPick.checked && !state.available.length) resetCycle({ announce: false });
    const pool = eligiblePool();
    if (!pool.length) return null;
    state.activeDrawPool = [...pool];
    return randomItem(pool);
  }

  function commitWinner(name) {
    state.history.push(name);
    state.lastWinner = name;
    if (refs.removeAfterPick.checked) {
      const key = name.toLocaleLowerCase();
      state.available = state.available.filter(n => n.toLocaleLowerCase() !== key);
    }
    refs.remainingCount.textContent = refs.removeAfterPick.checked ? state.available.length : state.students.length;
    renderHistory();
    updateStartButton();
    updateWinnerStatus();
  }

  async function startPick() {
    if (state.busy) return;
    syncStudents({ source: refs.namesInput, render: false });
    if (!state.students.length) {
      toast('Add at least one student first.');
      refs.namesInput.focus();
      return;
    }
    if (state.overLimit) {
      toast(`Maximum ${MAX_STUDENTS} students. Remove ${state.detectedCount - MAX_STUDENTS} to continue.`);
      refs.namesInput.focus();
      return;
    }

    state.activeDrawPool = null;
    const winner = chooseWinner();
    if (!winner) return;
    state.busy = true;
    updateButtons();
    hideWinner();
    if (refs.soundEffects.checked) getAudioContext();

    const base = speedMs[refs.speedSelect.value] || speedMs.normal;
    let duration = base;
    if (state.mode === 'rocket') duration = Math.round(base * 1.6);
    else if (state.mode === 'race' || state.mode === 'duck') duration = Math.round(base * 2.0);
    const runner = {
      slots: animateSlots,
      wheel: animateWheel,
      pointer: animatePointer,
      shuffle: animateShuffle,
      race: (w,d) => animateRace(w,d,false),
      duck: (w,d) => animateRace(w,d,true),
      boxes: animateBoxes,
      rocket: animateRockets,
      elimination: animateElimination
    }[state.mode];

    try {
      await runner(winner, duration);
      await sleep(450);
      commitWinner(winner);
      showWinner(winner);
    } finally {
      state.busy = false;
      state.activeDrawPool = null;
      updateButtons();
    }

    const cycleComplete = refs.removeAfterPick.checked && state.available.length === 0;
    if (cycleComplete) toast('Everyone has had a turn — reset the class when you’re ready.');
    if (refs.autoNext.checked && state.students.length > 1 && !cycleComplete) {
      setTimeout(() => {
        if (!state.busy && refs.pickerWorkspace.classList.contains('active')) {
          hideWinner();
          startPick();
        }
      }, 2600);
    }
  }

  async function animateSlots(winner, duration) {
    setStage('slots');
    const stopMotor = refs.soundEffects.checked ? startSlotMotor() : () => {};
    refs.dynamicStage.innerHTML = `<div class="slot-machine"><div class="slot-window"><div class="slot-label">LUCKY STUDENT</div><div class="slot-reel-viewport"><div class="slot-center-line"></div><div class="slot-strip"></div></div></div></div>`;
    const strip = $('.slot-strip', refs.dynamicStage);
    const loops = refs.speedSelect.value === 'dramatic' ? 8 : refs.speedSelect.value === 'quick' ? 5 : 7;
    const pool = visualPool();
    const sequence = [];
    for (let l = 0; l < loops; l++) sequence.push(...shuffled(pool));
    sequence.push(...shuffled(pool.filter(n => n !== winner)).slice(0,2), winner, ...shuffled(pool).slice(0,2));
    strip.innerHTML = sequence.map(name => `<div class="slot-cell">${escapeHtml(name)}</div>`).join('');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const cellHeight = $('.slot-cell', strip)?.getBoundingClientRect().height || 64;
    const targetIndex = sequence.length - 3;
    const startY = -cellHeight / 2;
    const endY = -targetIndex * cellHeight - cellHeight / 2;
    const startTime = performance.now();
    let lastTick = -1;

    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now-startTime)/duration,0,1);
        const eased = easeOutQuint(t);
        const y = startY + (endY-startY) * eased;
        strip.style.transform = `translateY(${y}px)`;
        const current = Math.floor(Math.abs((y-startY)/cellHeight));
        if (refs.soundEffects.checked && current !== lastTick && current < targetIndex) {
          slotTick(current / Math.max(1, targetIndex));
          lastTick = current;
        }
        if (t < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    stopMotor();
    if (refs.soundEffects.checked) playSlotStop();
  }

  async function animateWheel(winner, duration) {
    setStage('wheel');
    const { wheelGroup, names, arcDeg } = buildWheelSvg();
    const stopCarnival = refs.soundEffects.checked ? startCarnivalMusic() : () => {};
    const winnerIndex = names.indexOf(winner);
    const winnerCenterDeg = winnerIndex * arcDeg + arcDeg / 2;
    const spins = refs.speedSelect.value === 'dramatic' ? 8 : refs.speedSelect.value === 'quick' ? 5 : 7;
    const targetRotation = spins * 360 - winnerCenterDeg;
    const startTime = performance.now();

    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now - startTime) / duration, 0, 1);
        const rotation = targetRotation * easeOutQuint(t);
        wheelGroup.style.transform = `rotate(${rotation}deg)`;
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    stopCarnival();
    if (refs.soundEffects.checked) tone(1046.5, .16, { type: 'triangle', volume: .018 });
  }

  async function animatePointer(winner, duration) {
    setStage('pointer');
    const stage = buildPointer();
    const arm = $('.pointer-arm', stage);
    const pool = visualPool();
    const winnerLabel = $$('.pointer-name', stage).find(el => el.textContent === winner);
    const winnerAngle = Number(winnerLabel?.dataset.pointerAngle ?? (pool.indexOf(winner) / pool.length * 360));
    const targetAngle = winnerAngle - 90;
    const spins = refs.speedSelect.value === 'dramatic' ? 7 : 5;
    const total = spins*360 + targetAngle;
    const tickStep = 360 / Math.max(1, pool.length);
    let lastTickIndex = -1;
    const startTime = performance.now();
    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now-startTime)/duration,0,1);
        const rotation = total * easeOutQuint(t);
        arm.style.transform = `rotate(${rotation}deg)`;
        if (refs.soundEffects.checked) {
          const tickIndex = Math.floor(rotation / tickStep);
          if (tickIndex !== lastTickIndex) {
            pointerTick(.65 + .35 * (1 - t));
            lastTickIndex = tickIndex;
          }
        }
        if (t < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  async function animateShuffle(winner, duration) {
    setStage('shuffle');
    refs.dynamicStage.innerHTML = `<div class="shuffle-stage"><div class="shuffle-stack"><div class="shuffle-back-card"></div><div class="shuffle-back-card"></div><div class="shuffle-back-card"></div><div class="shuffle-card"></div></div></div>`;
    const card = $('.shuffle-card', refs.dynamicStage);
    const start = performance.now();
    let tick = 0;
    let lastSound = 0;
    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now-start)/duration,0,1);
        const interval = 48 + Math.pow(t,4)*330;
        if (now-tick > interval) {
          const name = t > .9 ? winner : randomItem(visualPool());
          card.textContent = name;
          card.style.background = pastelForName(name);
          card.style.transform = `translate(${randomFloat()*10-5}px,${randomFloat()*10-5}px) rotate(${-5+randomFloat()*10}deg)`;
          if (refs.soundEffects.checked && now - lastSound > 115) {
            soothingTone(visualPool().indexOf(name));
            lastSound = now;
          }
          tick = now;
        }
        if (t < 1) requestAnimationFrame(frame);
        else {
          card.textContent = winner;
          card.style.background = pastelForName(winner);
          card.style.transform = 'none';
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  async function runCountdown(board) {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    board.append(overlay);
    const steps = ['3','2','1','GO!'];
    for (const value of steps) {
      overlay.innerHTML = `<div class="countdown-text${value === 'GO!' ? ' go' : ''}">${value}</div>`;
      if (refs.soundEffects.checked) {
        if (value === 'GO!') playStartGun();
        else tone(330, .07, { type: 'square', volume: .008 });
      }
      await sleep(value === 'GO!' ? 520 : 600);
    }
    overlay.remove();
  }

  async function animateRace(winner, duration, isDuck) {
    setStage(isDuck ? 'duck' : 'race');
    const board = buildRaceBoard(isDuck, false);
    refs.dynamicStage.append(board);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await runCountdown(board);
    const stopRaceSound = refs.soundEffects.checked
      ? (isDuck ? startDuckQuacks() : startFootsteps(duration))
      : () => {};

    const racers = $$('.racer', board);
    const data = racers.map((racer, index) => {
      const track = racer.parentElement;
      return {
        racer,
        name: racer.dataset.name,
        maxX: Math.max(0, track.clientWidth - racer.offsetWidth - 1),
        isWinner: racer.dataset.name === winner,
        index,
        phase: randomFloat() * Math.PI * 2,
        role: 'field',
        finalFraction: 0,
        profile: []
      };
    });

    const winnerEntry = data.find(entry => entry.isWinner);
    const field = shuffled(data.filter(entry => !entry.isWinner));

    // Give the field a much broader spread so the finish resembles a real race:
    // a close challenger, a front pack, a midfield and some clear back-markers.
    const finishBands = [];
    field.forEach((entry, index) => {
      const ratio = field.length <= 1 ? 0 : index / (field.length - 1);
      let fraction;
      if (index === 0) fraction = .94 + randomFloat() * .025;           // runner-up
      else if (ratio < .22) fraction = .83 + randomFloat() * .08;      // front pack
      else if (ratio < .58) fraction = .64 + randomFloat() * .16;      // midfield
      else fraction = .42 + randomFloat() * .19;                        // back markers
      finishBands.push(fraction);
      entry.finalFraction = fraction;
    });
    winnerEntry.finalFraction = 1;

    // Roles create visible but fluid lead changes. The eventual winner gets a
    // late surge; other racers are deliberately favoured earlier in the race.
    const earlyLeader = field[0] || winnerEntry;
    const midLeader = field[1] || earlyLeader;
    const lateDecoy = field[2] || earlyLeader;
    earlyLeader.role = 'early';
    midLeader.role = 'mid';
    lateDecoy.role = 'late-decoy';
    winnerEntry.role = 'winner';

    const gaussian = (t, center, width) => {
      const z = (t - center) / width;
      return Math.exp(-0.5 * z * z);
    };

    function speedAt(entry, t) {
      // Always-positive velocity with gentle individual rhythm.
      let speed = .78 + .12 * Math.sin((t * Math.PI * 2 * 1.35) + entry.phase);
      speed += .08 * Math.sin((t * Math.PI * 2 * 2.15) + entry.phase * .63);

      // Small individual bursts keep the entire field alive without jitter.
      speed += .32 * gaussian(t, .18 + (entry.index % 5) * .035, .105);
      speed += .26 * gaussian(t, .48 + (entry.index % 4) * .04, .13);

      if (entry.role === 'early') {
        speed += 1.05 * gaussian(t, .20, .10);
        speed -= .18 * gaussian(t, .72, .16);
      } else if (entry.role === 'mid') {
        speed += .92 * gaussian(t, .47, .11);
      } else if (entry.role === 'late-decoy') {
        speed += 1.02 * gaussian(t, .72, .105);
      } else if (entry.role === 'winner') {
        speed -= .10 * gaussian(t, .35, .18);
        speed += 1.62 * gaussian(t, .88, .09);
      }

      return Math.max(.18, speed);
    }

    // Pre-integrate each smooth velocity curve, then normalise it to that
    // racer's chosen finishing distance. This guarantees continuous forward
    // motion while preserving the wide finish spread above.
    const SAMPLES = 360;
    data.forEach(entry => {
      const cumulative = new Array(SAMPLES + 1).fill(0);
      let total = 0;
      for (let i = 1; i <= SAMPLES; i++) {
        const t0 = (i - 1) / SAMPLES;
        const t1 = i / SAMPLES;
        const tm = (t0 + t1) / 2;
        total += speedAt(entry, tm) / SAMPLES;
        cumulative[i] = total;
      }
      entry.profile = cumulative.map(value => total ? (value / total) * entry.finalFraction : 0);
    });

    function sampleProfile(entry, t) {
      const scaled = clamp(t, 0, 1) * SAMPLES;
      const i = Math.floor(scaled);
      const next = Math.min(SAMPLES, i + 1);
      const mix = scaled - i;
      return entry.profile[i] + (entry.profile[next] - entry.profile[i]) * mix;
    }

    const start = performance.now();
    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now - start) / duration, 0, 1);
        data.forEach(entry => {
          const fraction = sampleProfile(entry, t);
          entry.racer.style.transform = `translate3d(${entry.maxX * fraction}px,-50%,0)`;
        });
        if (t < 1) requestAnimationFrame(frame);
        else {
          data.forEach(entry => {
            entry.racer.style.transform = `translate3d(${entry.maxX * entry.finalFraction}px,-50%,0)`;
          });
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
    stopRaceSound();
  }

  async function animateBoxes(winner, duration) {
    setStage('boxes');
    renderBoxesPreview();
    const boxes = $$('.mystery-box', refs.dynamicStage);
    const rounds = Math.min(32, boxes.length*2);
    const step = duration/rounds;
    for (let i = 0; i < rounds; i++) {
      const box = boxes[i % boxes.length];
      box.style.transform = 'scale(1.08)';
      if (refs.soundEffects.checked) soothingTone(i);
      await sleep(step*.62);
      box.style.transform = '';
      await sleep(step*.38);
    }
    const win = boxes.find(b => $('.box-name',b)?.textContent === winner);
    if (win) {
      win.classList.add('revealed');
      win.querySelector('span').textContent = '✨';
    }
  }

  async function animateRockets(winner, duration) {
    setStage('rocket');
    const stopThrust = refs.soundEffects.checked ? startRocketThrust() : () => {};
    const pool = visualPool();
    const mobileMax = window.innerWidth <= 600 ? 10 : 16;
    const maxVisible = Math.min(mobileMax, pool.length);
    let visible = pool;
    if (pool.length > maxVisible) {
      visible = shuffled([winner, ...shuffled(pool.filter(n => n !== winner)).slice(0,maxVisible-1)]);
      toast(`All ${pool.length} students were eligible; ${maxVisible} rockets are shown during the launch.`);
    }

    const board = document.createElement('div');
    board.className = 'rocket-board';
    board.innerHTML = '<div class="rocket-target-line"></div><div class="rocket-target-badge">🎯 TARGET</div><div class="rocket-ground"></div>';
    visible.forEach((name,i) => {
      const racer = document.createElement('div');
      racer.className = 'rocket-racer';
      racer.dataset.name = name;
      racer.style.left = `${(i+.5)/visible.length*100}%`;
      racer.innerHTML = `${rocketMarkup(name,false,i)}<span class="rocket-racer-name">${escapeHtml(name)}</span>`;
      board.append(racer);
    });
    refs.dynamicStage.append(board);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const targetLine = $('.rocket-target-line', board);
    const targetY = targetLine ? targetLine.offsetTop : 64;
    const boardHeight = board.clientHeight;

    const rockets = $$('.rocket-racer',board).map((racer,i) => {
      const isWinner = racer.dataset.name === winner;
      // racer top is the rocket nose. Put the winner's nose just beyond the
      // actual target line, rather than approximating with a percentage.
      const winnerTop = Math.max(8, targetY - 10);
      const winnerBottom = Math.max(18, boardHeight - winnerTop - racer.offsetHeight);
      const maxUsefulBottom = winnerBottom;
      const finishRatio = isWinner ? 1 : .42 + randomFloat() * .43;
      return {
        racer,
        isWinner,
        targetBottom: isWinner ? winnerBottom : 18 + (maxUsefulBottom - 18) * finishRatio,
        sway: 3 + randomFloat()*7,
        phase: randomFloat()*Math.PI*2,
        pace: .90 + randomFloat()*.12,
        i
      };
    });

    const start = performance.now();
    await new Promise(resolve => {
      const frame = now => {
        const t = clamp((now-start)/duration,0,1);
        rockets.forEach(entry => {
          const p = clamp(t*entry.pace,0,1);
          let eased = easeInOutCubic(p);
          if (entry.isWinner && t > .72) {
            const finalT = (t-.72)/.28;
            eased = Math.max(eased, .68 + .32*easeOutQuint(finalT));
          }
          const bottom = 18 + (entry.targetBottom - 18) * eased;
          const sway = Math.sin(t*11 + entry.phase) * entry.sway * (1-t*.25);
          entry.racer.style.bottom = `${bottom}px`;
          entry.racer.style.transform = `translateX(calc(-50% + ${sway}px))`;
        });
        if (t < 1) requestAnimationFrame(frame);
        else {
          rockets.forEach(entry => {
            entry.racer.style.bottom = `${entry.targetBottom}px`;
            entry.racer.style.transform = 'translateX(-50%)';
          });
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
    stopThrust();
  }

  async function animateElimination(winner, duration) {
    setStage('elimination');
    renderEliminationPreview();
    const order = shuffled(visualPool().filter(n => n !== winner));
    const step = duration/Math.max(order.length,1);
    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      const el = $$('.elim-name',refs.dynamicStage).find(tile => tile.textContent === name);
      if (el) el.classList.add('out');
      if (refs.soundEffects.checked) soothingTone(i);
      await sleep(step);
    }
    const final = $$('.elim-name',refs.dynamicStage).find(tile => tile.textContent === winner);
    if (final) final.classList.add('finalist');
  }

  function setMode(mode) {
    if (state.busy) return;
    state.mode = mode;
    $$('.mode-chip').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
    });
    refs.modeHint.textContent = modeMeta[mode][1];
    renderPreview();
  }

  function setWorkspace(name) {
    $$('.workspace-tab').forEach(tab => {
      const active = tab.dataset.workspace === name;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',String(active));
    });
    refs.pickerWorkspace.classList.toggle('active',name === 'picker');
    refs.groupsWorkspace.classList.toggle('active',name === 'groups');
    if (name === 'groups') syncStudents({ source: refs.groupNamesInput, render: false });
    if (name === 'picker' && !state.busy) renderPreview();
  }

  const SAVED_CLASSES_KEY = 'teacherToolsRandomPickerSavedClasses';

  function readSavedClasses() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_CLASSES_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) { return {}; }
  }

  function writeSavedClasses(classes) {
    try { localStorage.setItem(SAVED_CLASSES_KEY, JSON.stringify(classes)); return true; }
    catch (_) { toast('This browser could not save the class locally.'); return false; }
  }

  function refreshSavedClassControls(selected = '') {
    const classes = readSavedClasses();
    const names = Object.keys(classes).sort((a,b) => a.localeCompare(b));
    [refs.savedClassSelect, refs.groupSavedClassSelect].forEach(select => {
      if (!select) return;
      const current = selected || select.value;
      select.innerHTML = '<option value="">Choose saved class…</option>';
      names.forEach(name => {
        const option = document.createElement('option');
        option.value = name; option.textContent = name;
        select.append(option);
      });
      if (names.includes(current)) select.value = current;
    });
  }

  function saveCurrentClass(nameInput, sourceInput) {
    const name = nameInput.value.trim();
    if (!name) { toast('Enter a class name first.'); nameInput.focus(); return; }
    const rawCount = detectedRosterCount(sourceInput.value);
    if (!rawCount) { toast('Add some student names before saving the class.'); sourceInput.focus(); return; }
    if (rawCount > MAX_STUDENTS) { toast(`Maximum ${MAX_STUDENTS} students. Remove ${rawCount - MAX_STUDENTS} before saving.`); return; }
    const names = cleanedDisplayNames(sourceInput.value, false);
    const classes = readSavedClasses();
    classes[name] = names;
    if (!writeSavedClasses(classes)) return;
    refreshSavedClassControls(name);
    refs.classNameInput.value = name;
    refs.groupClassNameInput.value = name;
    toast(`Saved ${name} locally in this browser.`);
  }

  function loadSavedClass(select) {
    const name = select.value;
    if (!name) { toast('Choose a saved class first.'); return; }
    const classes = readSavedClasses();
    const names = classes[name];
    if (!Array.isArray(names)) { refreshSavedClassControls(); toast('That saved class could not be found.'); return; }
    const value = names.join('\n');
    refs.namesInput.value = value;
    refs.groupNamesInput.value = value;
    refs.classNameInput.value = name;
    refs.groupClassNameInput.value = name;
    state.history = [];
    state.lastWinner = '';
    renderHistory();
    syncStudents({ source: refs.namesInput, preserveCycle: false });
    refreshSavedClassControls(name);
    toast(`Loaded ${name}.`);
  }

  function deleteSavedClass() {
    const name = refs.savedClassSelect.value || refs.groupSavedClassSelect.value;
    if (!name) { toast('Choose a saved class to delete.'); return; }
    const classes = readSavedClasses();
    if (!(name in classes)) return;
    delete classes[name];
    if (!writeSavedClasses(classes)) return;
    refreshSavedClassControls();
    if (refs.classNameInput.value === name) refs.classNameInput.value = '';
    if (refs.groupClassNameInput.value === name) refs.groupClassNameInput.value = '';
    toast(`Deleted saved class ${name}.`);
  }

  function groupsAsText() {
    return state.groups.map((group, i) => `Group ${i + 1}\n${group.join('\n')}`).join('\n\n');
  }

  async function copyGroups() {
    if (!state.groups.length) return;
    const text = groupsAsText();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error('clipboard unavailable');
      toast('Groups copied to clipboard.');
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly',''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.append(area); area.select();
      try { document.execCommand('copy'); toast('Groups copied to clipboard.'); }
      catch (__) { toast('Could not copy automatically.'); }
      area.remove();
    }
  }

  function printGroups() {
    if (!state.groups.length) return;
    document.body.classList.add('printing-groups');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-groups'), 500);
  }

  function syncPresentationMuteButton() {
    if (!refs.presentationMuteBtn) return;
    const muted = !refs.soundEffects.checked;
    refs.presentationMuteBtn.textContent = muted ? '🔇' : '🔊';
    refs.presentationMuteBtn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
  }

  async function enterPresentationMode() {
    state.presentationMode = true;
    document.documentElement.classList.add('presentation-mode');
    refs.presentationToolbar.hidden = false;
    syncPresentationMuteButton();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (_) { /* CSS presentation still works. */ }
    }
    if (!state.busy) renderPreview();
  }

  async function exitPresentationMode({ exitFullscreen = true } = {}) {
    state.presentationMode = false;
    document.documentElement.classList.remove('presentation-mode');
    refs.presentationToolbar.hidden = true;
    if (exitFullscreen && document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch (_) {}
    }
    if (!state.busy) renderPreview();
  }

  function groupMethod() { return $('input[name="groupMethod"]:checked').value; }
  function updateGroupMethodUI() {
    const byGroups = groupMethod() === 'groups';
    refs.groupValueLabel.textContent = byGroups ? 'Number of groups' : 'Students per group';
    refs.groupValue.max = byGroups ? 20 : 14;
    refs.groupValue.value = byGroups ? clamp(Number(refs.groupValue.value)||4,2,20) : clamp(Number(refs.groupValue.value)||4,2,14);
  }

  function makeGroups() {
    syncStudents({ source: refs.groupNamesInput, render: false });
    if (!state.students.length) { toast('Add some student names first.'); refs.groupNamesInput.focus(); return; }
    if (state.overLimit) { toast(`Maximum ${MAX_STUDENTS} students. Remove ${state.detectedCount - MAX_STUDENTS} to continue.`); refs.groupNamesInput.focus(); return; }
    const value = Math.max(2,Number(refs.groupValue.value)||2);
    const names = shuffled(state.students);
    const count = groupMethod() === 'groups' ? Math.min(value,names.length) : Math.ceil(names.length/value);
    state.groups = Array.from({length:Math.max(1,count)},()=>[]);
    names.forEach((name,i) => state.groups[i%state.groups.length].push(name));
    renderGroups();
  }

  function renderGroups() {
    refs.groupsGrid.innerHTML = '';
    state.groups.forEach((group,i) => {
      const card = document.createElement('section');
      card.className = 'group-card';
      if (refs.animateGroups.checked) card.style.animationDelay = `${i*75}ms`;
      const title = document.createElement('h3');
      title.className = 'group-title';
      title.textContent = `Group ${i+1}`;
      title.style.background = pastelPalette[i % pastelPalette.length];
      const list = document.createElement('ul');
      list.className = 'group-list';
      group.forEach(name => { const li = document.createElement('li'); li.textContent = name; list.append(li); });
      card.append(title,list);
      refs.groupsGrid.append(card);
    });
    updateButtons();
  }

  refs.namesInput.addEventListener('input', () => {
    if (state.suppressSync) return;
    syncStudents({ source: refs.namesInput });
  });
  refs.groupNamesInput.addEventListener('input', () => {
    if (state.suppressSync) return;
    syncStudents({ source: refs.groupNamesInput, render: !refs.groupsWorkspace.classList.contains('active') });
  });
  refs.cleanBtn.addEventListener('click', () => cleanRoster(refs.namesInput));
  refs.groupCleanBtn.addEventListener('click', () => cleanRoster(refs.groupNamesInput));
  refs.sortBtn.addEventListener('click', () => sortRoster(refs.namesInput));
  refs.groupSortBtn.addEventListener('click', () => sortRoster(refs.groupNamesInput));
  refs.saveClassBtn.addEventListener('click', () => saveCurrentClass(refs.classNameInput, refs.namesInput));
  refs.groupSaveClassBtn.addEventListener('click', () => saveCurrentClass(refs.groupClassNameInput, refs.groupNamesInput));
  refs.loadClassBtn.addEventListener('click', () => loadSavedClass(refs.savedClassSelect));
  refs.groupLoadClassBtn.addEventListener('click', () => loadSavedClass(refs.groupSavedClassSelect));
  refs.deleteClassBtn.addEventListener('click', deleteSavedClass);
  refs.groupDeleteClassBtn.addEventListener('click', deleteSavedClass);
  refs.savedClassSelect.addEventListener('change', () => {
    refs.groupSavedClassSelect.value = refs.savedClassSelect.value;
    if (refs.savedClassSelect.value) refs.classNameInput.value = refs.savedClassSelect.value;
  });
  refs.groupSavedClassSelect.addEventListener('change', () => {
    refs.savedClassSelect.value = refs.groupSavedClassSelect.value;
    if (refs.groupSavedClassSelect.value) refs.groupClassNameInput.value = refs.groupSavedClassSelect.value;
  });
  refs.copyGroupsBtn.addEventListener('click', copyGroups);
  refs.printGroupsBtn.addEventListener('click', printGroups);
  refs.clearBtn.addEventListener('click', clearAll);
  refs.mobilePickerBtn.addEventListener('click', () => document.querySelector('.randomiser-panel')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
  refs.mobileNamesBtn.addEventListener('click', () => document.querySelector('.class-panel')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
  refs.resetCycleBtn.addEventListener('click', () => resetCycle());
  refs.clearHistoryBtn.addEventListener('click', () => { state.history = []; renderHistory(); toast('Selection history cleared.'); });
  refs.startBtn.addEventListener('click', startPick);
  refs.modeStrip.addEventListener('click', e => { const btn = e.target.closest('[data-mode]'); if (btn) setMode(btn.dataset.mode); });
  $$('.workspace-tab').forEach(tab => tab.addEventListener('click', () => setWorkspace(tab.dataset.workspace)));
  refs.settingsBtn.addEventListener('click', () => refs.settingsDialog.showModal());
  refs.muteBtn.addEventListener('click', () => applyMuteState(refs.soundEffects.checked));
  refs.themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  refs.soundEffects.addEventListener('change', () => applyMuteState(!refs.soundEffects.checked));
  refs.removeAfterPick.addEventListener('change', () => setRemoveAfterPick(refs.removeAfterPick.checked, { announce: true }));
  refs.nextSpinRemove.addEventListener('change', () => {
    if (refs.nextSpinRemove.checked) setRemoveAfterPick(true, { announce: true });
  });
  refs.nextSpinKeep.addEventListener('change', () => {
    if (refs.nextSpinKeep.checked) setRemoveAfterPick(false, { announce: true });
  });
  refs.showHistory.addEventListener('change', renderHistory);
  $$('input[name="groupMethod"]').forEach(r => r.addEventListener('change', updateGroupMethodUI));
  refs.makeGroupsBtn.addEventListener('click', makeGroups);
  refs.reshuffleGroupsBtn.addEventListener('click', makeGroups);
  refs.fullscreenBtn.addEventListener('click', () => {
    if (state.presentationMode) exitPresentationMode();
    else enterPresentationMode();
  });
  refs.presentationExitBtn.addEventListener('click', () => exitPresentationMode());
  refs.presentationMuteBtn.addEventListener('click', () => applyMuteState(refs.soundEffects.checked));
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && state.presentationMode) exitPresentationMode({ exitFullscreen: false });
  });
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const typing = ['TEXTAREA','INPUT','SELECT'].includes(tag);
    if (e.code === 'Space' && !typing && refs.pickerWorkspace.classList.contains('active')) { e.preventDefault(); startPick(); }
    if (e.key.toLocaleLowerCase() === 'r' && !typing && !state.busy) resetCycle();
    if (e.key === 'Escape' && state.presentationMode && !document.fullscreenElement) exitPresentationMode({ exitFullscreen: false });
  });

  loadSitePreferences();
  refreshSavedClassControls();
  updateStartButton();
  updateWinnerStatus();
  syncStudents({ source: refs.namesInput, preserveCycle: false });
  renderHistory();
  updateGroupMethodUI();
  setRemoveAfterPick(refs.removeAfterPick.checked, { resetPool: false });
  setMode('slots');
})();

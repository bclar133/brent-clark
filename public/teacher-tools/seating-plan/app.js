(() => {
  'use strict';

  const MAX_STUDENTS = 28;
  const MIN_GRID = 4;
  const MAX_GRID = 12;
  const DEFAULT_ROWS = 8;
  const DEFAULT_COLS = 8;
  const SAVED_CLASSES_KEY = 'teacherToolsRandomPickerSavedClasses';
  const SAVED_LAYOUTS_KEY = 'teacherToolsSeatingPlanLayoutsV1';
  const SAVED_ROOMS_KEY = 'teacherToolsSeatingPlanRoomsV1';
  const CURRENT_KEY = 'teacherToolsSeatingPlanCurrentV1';
  const THEME_KEY = 'teacherToolsTheme';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const refs = {
    namesInput: $('#namesInput'),
    studentCount: $('#studentCount'),
    rosterWarning: $('#rosterWarning'),
    savedClassSelect: $('#savedClassSelect'),
    classNameInput: $('#classNameInput'),
    saveClassBtn: $('#saveClassBtn'),
    loadClassBtn: $('#loadClassBtn'),
    deleteClassBtn: $('#deleteClassBtn'),
    cleanBtn: $('#cleanBtn'),
    sortBtn: $('#sortBtn'),
    clearBtn: $('#clearBtn'),
    arrangementSelect: $('#arrangementSelect'),
    groupSizeWrap: $('#groupSizeWrap'),
    groupSize: $('#groupSize'),
    arrangeBtn: $('#arrangeBtn'),
    gridCols: $('#gridCols'),
    gridRows: $('#gridRows'),
    applyGridBtn: $('#applyGridBtn'),
    gridStatus: $('#gridStatus'),
    schemeSelect: $('#schemeSelect'),
    singleColour: $('#singleColour'),
    applySchemeBtn: $('#applySchemeBtn'),
    classroomGrid: $('#classroomGrid'),
    topRail: $('#topRail'),
    bottomRail: $('#bottomRail'),
    leftRail: $('#leftRail'),
    rightRail: $('#rightRail'),
    placedCount: $('#placedCount'),
    clearFixturesBtn: $('#clearFixturesBtn'),
    resetRoomBtn: $('#resetRoomBtn'),
    clearPositionsBtn: $('#clearPositionsBtn'),
    selectionBar: $('#selectionBar'),
    selectedStudentName: $('#selectedStudentName'),
    studentColour: $('#studentColour'),
    closeSelectionBtn: $('#closeSelectionBtn'),
    fixtureSelectionBar: $('#fixtureSelectionBar'),
    selectedFixtureName: $('#selectedFixtureName'),
    teacherSizeControls: $('#teacherSizeControls'),
    teacherDeskWidth: $('#teacherDeskWidth'),
    teacherDeskHeight: $('#teacherDeskHeight'),
    applyTeacherSizeBtn: $('#applyTeacherSizeBtn'),
    windowSizeControls: $('#windowSizeControls'),
    windowSpan: $('#windowSpan'),
    applyWindowSizeBtn: $('#applyWindowSizeBtn'),
    removeSelectedFixtureBtn: $('#removeSelectedFixtureBtn'),
    closeFixtureSelectionBtn: $('#closeFixtureSelectionBtn'),
    savedRoomSelect: $('#savedRoomSelect'),
    roomNameInput: $('#roomNameInput'),
    saveRoomBtn: $('#saveRoomBtn'),
    loadRoomBtn: $('#loadRoomBtn'),
    deleteRoomBtn: $('#deleteRoomBtn'),
    printBtn: $('#printBtn'),
    themeBtn: $('#themeBtn'),
    showPlanBtn: $('#showPlanBtn'),
    planPanel: $('#planPanel'),
    toast: $('#toast')
  };

  const palettes = {
    pastel: ['#fde4ef','#fff0c9','#dff1ff','#dff7ef','#e8e0ff','#ffe3d2','#d9f4f1','#f3dcff','#dfe8ff','#f8e6c4','#e0f5d7','#ffdce8'],
    bright: ['#ff5d73','#ff8c42','#ffd166','#69d278','#3bc9db','#4dabf7','#748ffc','#9775fa','#e66bdb','#f06595'],
    cool: ['#b8f2e6','#aed9e0','#a9def9','#cdb4db','#d0c4ff','#bde0fe','#bee1e6','#c3f0ca'],
    warm: ['#ffd6a5','#fdffb6','#ffc6a8','#ffadad','#fbc4ab','#f8edeb','#fec89a','#ffe5d9'],
    rainbow: ['#ff6b6b','#ff922b','#ffd43b','#69db7c','#38d9a9','#4dabf7','#748ffc','#9775fa','#da77f2','#f06595']
  };

  const fixtureMeta = {
    teacher: { label: 'Teacher desk', icon: '🧑‍🏫', placement: 'interior' },
    door: { label: 'Door', icon: '🚪', placement: 'perimeter' },
    whiteboard: { label: 'Whiteboard', icon: '▭', placement: 'perimeter' },
    screen: { label: 'Screen', icon: '🖥️', placement: 'perimeter' },
    window: { label: 'Window', icon: '🪟', placement: 'perimeter' }
  };

  const state = {
    students: [],
    fixtures: [],
    selected: null,
    dragItem: null,
    scheme: 'pastel',
    arrangement: 'rows',
    groupSize: 4,
    gridRows: DEFAULT_ROWS,
    gridCols: DEFAULT_COLS,
    overLimit: false,
    fixtureCounter: 1
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function normalizeLine(line) {
    return line.trim().replace(/\s+/g, ' ');
  }

  function rawRosterEntries(raw, applyLimit = true) {
    const lines = raw.split(/[\n\r\t;]+/).map(normalizeLine).filter(Boolean);
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
      if (!entries.some(entry => entry.key === key)) entries.push({ first, surname, key });
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

    return entries.map(entry => {
      const sameFirst = byFirst.get(entry.first.toLocaleLowerCase()) || [];
      if (sameFirst.length === 1) return entry.first;
      if (!entry.surname) return `${entry.first} ${sameFirst.indexOf(entry) + 1}`;
      let prefixLength = 1;
      const surnames = sameFirst.map(item => item.surname || '');
      while (prefixLength < entry.surname.length) {
        const prefix = entry.surname.slice(0, prefixLength).toLocaleLowerCase();
        if (surnames.filter(s => s.slice(0, prefixLength).toLocaleLowerCase() === prefix).length === 1) break;
        prefixLength += 1;
      }
      return `${entry.first} ${entry.surname.slice(0, prefixLength)}`;
    });
  }

  function hashString(value) {
    let hash = 0;
    for (const char of value) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }

  function randomInt(max) {
    if (max <= 0) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffled(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function textColour(hex) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return '#243046';
    const r = parseInt(clean.slice(0,2), 16);
    const g = parseInt(clean.slice(2,4), 16);
    const b = parseInt(clean.slice(4,6), 16);
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > .63 ? '#243046' : '#ffffff';
  }

  function colourFor(name, index, scheme = state.scheme) {
    if (scheme === 'single') return refs.singleColour.value;
    const palette = palettes[scheme] || palettes.pastel;
    if (scheme === 'rainbow') return palette[index % palette.length];
    return palette[(hashString(name) + index * 3) % palette.length];
  }

  function cellCount() {
    return state.gridRows * state.gridCols;
  }

  function cellIndex(row, col) {
    return row * state.gridCols + col;
  }

  function rowCol(cell) {
    return { row: Math.floor(cell / state.gridCols), col: cell % state.gridCols };
  }

  function uniqueCells(values) {
    const seen = new Set();
    return values.filter(value => Number.isInteger(value) && value >= 0 && value < cellCount() && !seen.has(value) && seen.add(value));
  }

  function footprintForTeacher(item, targetCell = item.cell, width = item.w || 1, height = item.h || 1) {
    if (!Number.isInteger(targetCell)) return null;
    const { row, col } = rowCol(targetCell);
    if (row < 0 || col < 0 || row + height > state.gridRows || col + width > state.gridCols) return null;
    const cells = [];
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) cells.push(cellIndex(r,c));
    }
    return cells;
  }

  function occupiedInteriorMap({ excludeStudentId = null, excludeFixtureId = null } = {}) {
    const map = new Map();
    state.students.forEach(student => {
      if (student.id === excludeStudentId || !Number.isInteger(student.cell)) return;
      map.set(student.cell, { kind: 'student', id: student.id });
    });
    state.fixtures.forEach(item => {
      if (item.id === excludeFixtureId || item.type !== 'teacher') return;
      const cells = footprintForTeacher(item) || [];
      cells.forEach(cell => map.set(cell, { kind: 'fixture', id: item.id }));
    });
    return map;
  }

  function perimeterSlots(zone) {
    return zone === 'top' || zone === 'bottom' ? state.gridCols : state.gridRows;
  }

  function perimeterSpan(item, zone = item.zone) {
    if (item.type !== 'window') return 1;
    return clamp(parseInt(item.span, 10) || 3, 1, Math.max(1, perimeterSlots(zone)));
  }

  function perimeterRange(zone, slot, span = 1) {
    const max = perimeterSlots(zone);
    if (!Number.isInteger(slot) || slot < 0 || span < 1 || slot + span > max) return null;
    return [...Array(span).keys()].map(offset => slot + offset);
  }

  function perimeterConflicts(zone, slot, span = 1, excludeId = null) {
    const target = new Set(perimeterRange(zone, slot, span) || []);
    if (!target.size) return [];
    return state.fixtures.filter(item => {
      if (item.id === excludeId || fixtureMeta[item.type]?.placement !== 'perimeter' || item.zone !== zone) return false;
      const covered = perimeterRange(item.zone, item.slot, perimeterSpan(item)) || [];
      return covered.some(value => target.has(value));
    });
  }

  function perimeterFixtureAt(zone, slot, excludeId = null) {
    return perimeterConflicts(zone, slot, 1, excludeId)[0] || null;
  }

  function firstFreePerimeter(preferredZones = ['top','right','bottom','left'], excludeId = null, requestedSpan = 1) {
    for (const zone of preferredZones) {
      const span = clamp(requestedSpan, 1, perimeterSlots(zone));
      const maxStart = perimeterSlots(zone) - span;
      for (let slot = 0; slot <= maxStart; slot++) {
        if (!perimeterConflicts(zone, slot, span, excludeId).length) return { zone, slot, span };
      }
    }
    return null;
  }

  function defaultPerimeterPosition(type, requestedSpan = type === 'window' ? 3 : 1) {
    const spanFor = zone => clamp(requestedSpan, 1, perimeterSlots(zone));
    const candidate = (zone, slot) => {
      const span = spanFor(zone);
      const start = clamp(slot, 0, Math.max(0, perimeterSlots(zone) - span));
      return perimeterConflicts(zone, start, span).length ? null : { zone, slot: start, span };
    };

    if (type === 'door') {
      return candidate('left', state.gridRows - 1) || candidate('right', state.gridRows - 1) || firstFreePerimeter(['left','right','bottom','top'], null, 1);
    }

    if (type === 'window') {
      const sideSpan = spanFor('left');
      const sideStart = Math.max(0, Math.floor((state.gridRows - sideSpan) / 2));
      return candidate('left', sideStart) || candidate('right', sideStart) || firstFreePerimeter(['left','right','bottom','top'], null, requestedSpan);
    }

    const center = Math.floor(state.gridCols / 2);
    if (type === 'whiteboard') {
      return candidate('top', center) || candidate('top', center - 1) || firstFreePerimeter(['top','bottom','right','left'], null, 1);
    }
    return candidate('top', center + 2) || candidate('bottom', center) || firstFreePerimeter(['top','bottom','right','left'], null, 1);
  }

  function findFirstFreeCell(order = null) {
    const occupied = occupiedInteriorMap();
    const preferred = order || seatingOrder(state.arrangement, state.students.length);
    return preferred.find(cell => !occupied.has(cell)) ?? [...Array(cellCount()).keys()].find(cell => !occupied.has(cell)) ?? null;
  }

  function createDefaultFixtures() {
    state.fixtures = [];
    const boardPos = defaultPerimeterPosition('whiteboard');
    if (boardPos) state.fixtures.push({ id: 'fixture-default-board', type: 'whiteboard', zone: boardPos.zone, slot: boardPos.slot });

    const deskWidth = Math.min(2, state.gridCols);
    const deskCol = Math.max(0, state.gridCols - deskWidth);
    state.fixtures.push({ id: 'fixture-default-desk', type: 'teacher', cell: cellIndex(0, deskCol), w: deskWidth, h: 1 });

    const doorPos = defaultPerimeterPosition('door');
    if (doorPos) state.fixtures.push({ id: 'fixture-default-door', type: 'door', zone: doorPos.zone, slot: doorPos.slot });
    state.fixtureCounter = 1;
  }

  function spreadIndices(count, total, startAtOne = false) {
    if (count <= 0 || total <= 0) return [];
    const start = startAtOne && total > count ? 1 : 0;
    const end = total - 1;
    if (count === 1) return [Math.round((start + end) / 2)];
    const values = [];
    for (let i = 0; i < count; i++) values.push(Math.round(start + (i * (end - start)) / (count - 1)));
    return [...new Set(values)];
  }

  function appendFallbackCells(order) {
    const seen = new Set(order);
    for (let i = 0; i < cellCount(); i++) if (!seen.has(i)) order.push(i);
    return order;
  }

  function rowsOrder(studentCount) {
    if (!studentCount) return appendFallbackCells([]);
    const idealPerRow = Math.min(state.gridCols, state.gridCols >= 5 ? 5 : state.gridCols);
    let rowsNeeded = Math.ceil(studentCount / Math.max(1, idealPerRow));
    rowsNeeded = Math.min(state.gridRows, Math.max(1, rowsNeeded));
    const perRow = Math.ceil(studentCount / rowsNeeded);
    rowsNeeded = Math.min(state.gridRows, Math.ceil(studentCount / Math.max(1, perRow)));

    const rowIndices = spreadIndices(rowsNeeded, state.gridRows, true);
    const base = Math.floor(studentCount / rowsNeeded);
    let remainder = studentCount % rowsNeeded;
    const order = [];
    rowIndices.forEach(row => {
      const count = Math.min(state.gridCols, base + (remainder-- > 0 ? 1 : 0));
      spreadIndices(count, state.gridCols).forEach(col => order.push(cellIndex(row, col)));
    });
    return appendFallbackCells(uniqueCells(order));
  }

  function pairColumns() {
    const cols = [];
    for (let c = 0; c < state.gridCols; c += 3) {
      cols.push(c);
      if (c + 1 < state.gridCols) cols.push(c + 1);
    }
    return cols.length ? cols : [...Array(state.gridCols).keys()];
  }

  function pairsOrder(studentCount) {
    const cols = pairColumns();
    const rowsNeeded = Math.min(state.gridRows, Math.max(1, Math.ceil(studentCount / Math.max(1, cols.length))));
    const rows = spreadIndices(rowsNeeded, state.gridRows, true);
    const order = [];
    rows.forEach(row => cols.forEach(col => order.push(cellIndex(row,col))));
    return appendFallbackCells(uniqueCells(order));
  }

  function groupsOrder(studentCount, groupSize) {
    const size = clamp(parseInt(groupSize, 10) || 4, 2, 8);
    const groupCount = Math.ceil(studentCount / size);
    const blockW = Math.min(state.gridCols, Math.ceil(Math.sqrt(size)));
    const blockH = Math.min(state.gridRows, Math.ceil(size / blockW));
    const gapCol = state.gridCols >= blockW * 2 + 1 ? 1 : 0;
    const gapRow = state.gridRows >= blockH * 2 + 1 ? 1 : 0;
    const origins = [];

    for (let r = 0; r <= state.gridRows - blockH; r += blockH + gapRow) {
      for (let c = 0; c <= state.gridCols - blockW; c += blockW + gapCol) origins.push({ row:r, col:c });
    }
    if (origins.length < groupCount) {
      for (let r = 0; r <= state.gridRows - blockH; r++) {
        for (let c = 0; c <= state.gridCols - blockW; c++) {
          if (!origins.some(origin => origin.row === r && origin.col === c)) origins.push({ row:r, col:c });
        }
      }
    }

    const order = [];
    let remaining = studentCount;
    for (let g = 0; g < groupCount && g < origins.length; g++) {
      const origin = origins[g];
      const thisGroup = Math.min(size, remaining);
      let added = 0;
      for (let r = 0; r < blockH && added < thisGroup; r++) {
        for (let c = 0; c < blockW && added < thisGroup; c++) {
          order.push(cellIndex(origin.row + r, origin.col + c));
          added += 1;
        }
      }
      remaining -= thisGroup;
    }
    return appendFallbackCells(uniqueCells(order));
  }

  function uPath(inset = 0) {
    const left = inset;
    const right = state.gridCols - 1 - inset;
    const bottom = state.gridRows - 1 - inset;
    const top = Math.min(bottom, inset + (state.gridRows - inset * 2 > 4 ? 1 : 0));
    if (left > right || top > bottom) return [];
    const path = [];
    for (let r = top; r <= bottom; r++) path.push(cellIndex(r,left));
    for (let c = left + 1; c <= right; c++) path.push(cellIndex(bottom,c));
    for (let r = bottom - 1; r >= top; r--) path.push(cellIndex(r,right));
    return uniqueCells(path);
  }

  function sampleEvenly(path, count) {
    if (count >= path.length) return [...path];
    if (count <= 0) return [];
    if (count === 1) return [path[Math.floor(path.length / 2)]];
    const picks = [];
    for (let i = 0; i < count; i++) picks.push(path[Math.round(i * (path.length - 1) / (count - 1))]);
    return uniqueCells(picks);
  }

  function uShapeOrder(studentCount) {
    const outer = uPath(0);
    const order = [];
    if (studentCount <= outer.length) {
      order.push(...sampleEvenly(outer, studentCount));
    } else {
      order.push(...outer);
      let remaining = studentCount - outer.length;
      let inset = 1;
      while (remaining > 0 && inset < Math.min(state.gridRows, state.gridCols) / 2) {
        const inner = uPath(inset);
        if (!inner.length) break;
        const picks = sampleEvenly(inner, Math.min(remaining, inner.length));
        order.push(...picks);
        remaining -= picks.length;
        inset += 1;
      }
    }
    return appendFallbackCells(uniqueCells(order));
  }

  function seatingOrder(type = state.arrangement, studentCount = state.students.length) {
    let order;
    if (type === 'pairs') order = pairsOrder(studentCount);
    else if (type === 'groups') order = groupsOrder(studentCount, state.groupSize);
    else if (type === 'ushape') order = uShapeOrder(studentCount);
    else if (type === 'random') order = shuffled([...Array(cellCount()).keys()]);
    else order = rowsOrder(studentCount);

    const occupied = occupiedInteriorMap();
    return order.filter(cell => occupied.get(cell)?.kind !== 'fixture');
  }

  function labelForArrangement(type) {
    if (type === 'groups') return `Groups of ${state.groupSize}`;
    return ({ rows:'Rows', pairs:'Pairs + aisles', ushape:'U-shape', random:'Random seating' })[type] || 'Layout';
  }

  function arrangeStudents(type = refs.arrangementSelect.value, announce = true) {
    state.arrangement = type;
    state.groupSize = clamp(parseInt(refs.groupSize.value, 10) || state.groupSize || 4, 2, 8);
    refs.groupSize.value = state.groupSize;
    const cells = seatingOrder(type, state.students.length);
    state.students.forEach((student, index) => { student.cell = cells[index] ?? null; });
    state.selected = null;
    render();
    saveCurrent();
    if (announce) {
      const unseated = state.students.filter(student => student.cell == null).length;
      toast(unseated ? `${labelForArrangement(type)} applied. ${unseated} student${unseated === 1 ? '' : 's'} could not fit — increase the grid size.` : `${labelForArrangement(type)} applied.`);
    }
  }

  function syncStudents({ keepPositions = true } = {}) {
    const detected = rawRosterEntries(refs.namesInput.value, false).length;
    state.overLimit = detected > MAX_STUDENTS;
    refs.studentCount.textContent = detected;
    refs.rosterWarning.hidden = !state.overLimit;
    refs.rosterWarning.textContent = state.overLimit ? `${detected} students detected — maximum ${MAX_STUDENTS}. Remove ${detected - MAX_STUDENTS} to continue.` : '';
    refs.namesInput.setAttribute('aria-invalid', String(state.overLimit));

    const names = cleanedDisplayNames(refs.namesInput.value, true);
    const oldByName = new Map(state.students.map(student => [student.name.toLocaleLowerCase(), student]));
    state.students = names.map((name, index) => {
      const old = oldByName.get(name.toLocaleLowerCase());
      return old ? { ...old, name } : {
        id: `student-${Date.now()}-${index}-${hashString(name)}`,
        name,
        cell: null,
        colour: colourFor(name, index),
        customColour: false
      };
    });

    state.students.forEach(student => {
      if (!Number.isInteger(student.cell) || student.cell < 0 || student.cell >= cellCount()) student.cell = null;
    });

    if (!keepPositions) {
      arrangeStudents(state.arrangement, false);
    } else {
      const order = seatingOrder(state.arrangement, state.students.length);
      state.students.forEach(student => {
        if (student.cell == null) student.cell = findFirstFreeCell(order);
      });
      render();
      saveCurrent();
    }
  }

  function gridPositionStyle(element, cell, width = 1, height = 1) {
    const { row, col } = rowCol(cell);
    element.style.gridColumn = `${col + 1} / span ${width}`;
    element.style.gridRow = `${row + 1} / span ${height}`;
  }

  function attachInteriorTargetEvents(cellElement, cell) {
    cellElement.addEventListener('dragover', event => {
      if (!state.dragItem) return;
      event.preventDefault();
      cellElement.classList.add('drag-over');
    });
    cellElement.addEventListener('dragleave', () => cellElement.classList.remove('drag-over'));
    cellElement.addEventListener('drop', event => {
      event.preventDefault();
      cellElement.classList.remove('drag-over');
      if (!state.dragItem) return;
      if (state.dragItem.kind === 'student') moveStudentToCell(state.dragItem.id, cell);
      else moveFixtureToInterior(state.dragItem.id, cell);
    });
    cellElement.addEventListener('click', () => {
      if (!state.selected) return;
      if (state.selected.kind === 'student') moveStudentToCell(state.selected.id, cell);
      else moveFixtureToInterior(state.selected.id, cell);
    });
    cellElement.addEventListener('keydown', event => {
      if ((event.key !== 'Enter' && event.key !== ' ') || !state.selected) return;
      event.preventDefault();
      if (state.selected.kind === 'student') moveStudentToCell(state.selected.id, cell);
      else moveFixtureToInterior(state.selected.id, cell);
    });
  }

  function renderGrid() {
    refs.classroomGrid.innerHTML = '';
    refs.classroomGrid.setAttribute('aria-label', `${state.gridRows} by ${state.gridCols} classroom seating grid`);

    for (let i = 0; i < cellCount(); i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.cell = String(i);
      cell.setAttribute('role', 'gridcell');
      cell.tabIndex = 0;
      gridPositionStyle(cell, i);
      attachInteriorTargetEvents(cell, i);
      refs.classroomGrid.append(cell);
    }

    state.students.forEach(student => {
      if (!Number.isInteger(student.cell) || student.cell < 0 || student.cell >= cellCount()) return;
      const card = createStudentCard(student);
      gridPositionStyle(card, student.cell);
      refs.classroomGrid.append(card);
    });

    state.fixtures.filter(item => item.type === 'teacher').forEach(item => {
      const footprint = footprintForTeacher(item);
      if (!footprint?.length) return;
      const card = createFixtureCard(item);
      card.classList.add('teacher-card');
      gridPositionStyle(card, item.cell, item.w || 1, item.h || 1);
      refs.classroomGrid.append(card);
    });

    refs.placedCount.textContent = state.students.filter(student => Number.isInteger(student.cell) && student.cell >= 0 && student.cell < cellCount()).length;
  }

  function railElement(zone) {
    return ({ top:refs.topRail, bottom:refs.bottomRail, left:refs.leftRail, right:refs.rightRail })[zone];
  }

  function attachPerimeterTargetEvents(cellElement, zone, slot) {
    cellElement.addEventListener('dragover', event => {
      if (state.dragItem?.kind !== 'fixture') return;
      event.preventDefault();
      cellElement.classList.add('drag-over');
    });
    cellElement.addEventListener('dragleave', () => cellElement.classList.remove('drag-over'));
    cellElement.addEventListener('drop', event => {
      event.preventDefault();
      cellElement.classList.remove('drag-over');
      if (state.dragItem?.kind === 'fixture') moveFixtureToPerimeter(state.dragItem.id, zone, slot);
    });
    cellElement.addEventListener('click', event => {
      if (event.target.closest('.room-item')) return;
      if (state.selected?.kind === 'fixture') moveFixtureToPerimeter(state.selected.id, zone, slot);
    });
    cellElement.addEventListener('keydown', event => {
      if ((event.key !== 'Enter' && event.key !== ' ') || state.selected?.kind !== 'fixture') return;
      event.preventDefault();
      moveFixtureToPerimeter(state.selected.id, zone, slot);
    });
  }

  function renderPerimeterRail(zone) {
    const rail = railElement(zone);
    rail.innerHTML = '';
    const count = perimeterSlots(zone);

    for (let slot = 0; slot < count; slot++) {
      const cell = document.createElement('div');
      cell.className = 'perimeter-cell';
      cell.tabIndex = 0;
      cell.dataset.zone = zone;
      cell.dataset.slot = String(slot);
      attachPerimeterTargetEvents(cell, zone, slot);
      rail.append(cell);
    }

    state.fixtures
      .filter(item => fixtureMeta[item.type]?.placement === 'perimeter' && item.zone === zone && Number.isInteger(item.slot))
      .forEach(item => {
        const span = perimeterSpan(item, zone);
        const card = createFixtureCard(item);
        if (zone === 'top' || zone === 'bottom') {
          card.style.gridColumn = `${item.slot + 1} / span ${span}`;
          card.style.gridRow = '1';
        } else {
          card.style.gridColumn = '1';
          card.style.gridRow = `${item.slot + 1} / span ${span}`;
        }
        rail.append(card);
      });
  }

  function createStudentCard(student) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-item student-card';
    if (state.selected?.kind === 'student' && state.selected.id === student.id) button.classList.add('selected');
    button.draggable = true;
    button.dataset.kind = 'student';
    button.dataset.id = student.id;
    button.style.setProperty('--student-colour', student.colour);
    button.style.setProperty('--student-ink', textColour(student.colour));
    button.innerHTML = `<span>${escapeHtml(student.name)}</span>`;
    button.title = `${student.name} — drag to move, or tap to select`;
    button.addEventListener('dragstart', event => {
      state.dragItem = { kind:'student', id:student.id };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', student.id);
    });
    button.addEventListener('dragend', () => { state.dragItem = null; });
    button.addEventListener('click', event => {
      event.stopPropagation();
      selectItem('student', student.id);
    });
    return button;
  }

  function createFixtureCard(item) {
    const meta = fixtureMeta[item.type];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `room-item fixture-card ${item.type}-fixture-card`;
    if (state.selected?.kind === 'fixture' && state.selected.id === item.id) button.classList.add('selected');
    button.draggable = true;
    button.dataset.kind = 'fixture';
    button.dataset.id = item.id;
    button.innerHTML = `<span class="fixture-icon" aria-hidden="true">${meta.icon}</span><span class="fixture-label">${escapeHtml(meta.label)}</span><span class="fixture-remove" aria-hidden="true">×</span>`;
    button.title = item.type === 'window'
      ? `${meta.label} — spans ${perimeterSpan(item)} border spaces; drag to move or tap to resize`
      : `${meta.label} — drag to move, tap to select, or double-click to remove`;
    button.addEventListener('dragstart', event => {
      state.dragItem = { kind:'fixture', id:item.id };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    });
    button.addEventListener('dragend', () => { state.dragItem = null; });
    button.addEventListener('click', event => {
      event.stopPropagation();
      if (event.target.closest('.fixture-remove')) { removeFixture(item.id); return; }
      selectItem('fixture', item.id);
    });
    button.addEventListener('dblclick', event => { event.preventDefault(); removeFixture(item.id); });
    return button;
  }

  function selectItem(kind, id) {
    const same = state.selected?.kind === kind && state.selected?.id === id;
    state.selected = same ? null : { kind, id };
    render();
  }

  function moveStudentToCell(id, targetCell) {
    const student = state.students.find(item => item.id === id);
    if (!student || !Number.isInteger(targetCell) || targetCell < 0 || targetCell >= cellCount()) return;
    if (student.cell === targetCell) { state.selected = null; render(); return; }

    const occupied = occupiedInteriorMap({ excludeStudentId:id }).get(targetCell);
    const oldCell = student.cell;
    if (occupied?.kind === 'fixture') {
      toast('That square is occupied by the teacher desk.');
      return;
    }
    if (occupied?.kind === 'student') {
      const other = state.students.find(item => item.id === occupied.id);
      if (other) other.cell = oldCell;
    }
    student.cell = targetCell;
    state.selected = { kind:'student', id };
    render();
    saveCurrent();
  }

  function moveFixtureToInterior(id, targetCell) {
    const item = state.fixtures.find(fixture => fixture.id === id);
    if (!item) return;
    if (fixtureMeta[item.type]?.placement !== 'interior') {
      toast(`${fixtureMeta[item.type].label} belongs on the outside border.`);
      return;
    }
    const footprint = footprintForTeacher(item, targetCell, item.w || 1, item.h || 1);
    if (!footprint) {
      toast('The teacher desk would extend outside the student grid.');
      return;
    }
    const occupied = occupiedInteriorMap({ excludeFixtureId:id });
    if (footprint.some(cell => occupied.has(cell))) {
      toast('Move the students out of those squares before placing the teacher desk there.');
      return;
    }
    item.cell = targetCell;
    state.selected = { kind:'fixture', id };
    render();
    saveCurrent();
  }

  function moveFixtureToPerimeter(id, zone, droppedSlot) {
    const item = state.fixtures.find(fixture => fixture.id === id);
    if (!item) return;
    if (fixtureMeta[item.type]?.placement !== 'perimeter') {
      toast('The teacher desk belongs inside the student grid.');
      return;
    }
    if (!['top','bottom','left','right'].includes(zone)) return;

    const span = perimeterSpan(item, zone);
    const slot = clamp(droppedSlot, 0, Math.max(0, perimeterSlots(zone) - span));
    if (item.zone === zone && item.slot === slot && perimeterSpan(item) === span) {
      state.selected = null;
      render();
      return;
    }

    const conflicts = perimeterConflicts(zone, slot, span, id);
    if (conflicts.length) {
      const other = conflicts[0];
      const oldSpan = perimeterSpan(item);
      const otherSpan = perimeterSpan(other);
      if (conflicts.length === 1 && span === 1 && otherSpan === 1 && Number.isInteger(item.slot) && item.zone) {
        other.zone = item.zone;
        other.slot = item.slot;
      } else {
        toast('That section of the wall is already occupied.');
        return;
      }
    }

    item.zone = zone;
    item.slot = slot;
    if (item.type === 'window') item.span = span;
    state.selected = { kind:'fixture', id };
    render();
    saveCurrent();
  }

  function addFixture(type) {
    const meta = fixtureMeta[type];
    if (!meta) return;
    let item;

    if (meta.placement === 'interior') {
      const width = Math.min(2, state.gridCols);
      const cell = findFirstFreeCell();
      if (cell == null) { toast('No empty squares left in the student grid.'); return; }
      item = { id:`fixture-${type}-${Date.now()}-${state.fixtureCounter++}`, type, cell, w:width, h:1 };
      const footprint = footprintForTeacher(item);
      if (!footprint || footprint.some(c => occupiedInteriorMap().has(c))) item.w = 1;
    } else {
      const requestedSpan = type === 'window' ? Math.min(3, Math.max(state.gridRows, state.gridCols)) : 1;
      const pos = defaultPerimeterPosition(type, requestedSpan);
      if (!pos) { toast('No empty border positions left.'); return; }
      item = { id:`fixture-${type}-${Date.now()}-${state.fixtureCounter++}`, type, zone:pos.zone, slot:pos.slot };
      if (type === 'window') item.span = pos.span;
    }

    state.fixtures.push(item);
    state.selected = { kind:'fixture', id:item.id };
    render();
    saveCurrent();
    toast(`${meta.label} added — move it where you want.`);
  }

  function removeFixture(id) {
    state.fixtures = state.fixtures.filter(item => item.id !== id);
    if (state.selected?.id === id) state.selected = null;
    render();
    saveCurrent();
  }

  function resizeSelectedTeacher() {
    if (state.selected?.kind !== 'fixture') return;
    const item = state.fixtures.find(fixture => fixture.id === state.selected.id && fixture.type === 'teacher');
    if (!item) return;
    const width = clamp(parseInt(refs.teacherDeskWidth.value, 10) || 1, 1, Math.min(4, state.gridCols));
    const height = clamp(parseInt(refs.teacherDeskHeight.value, 10) || 1, 1, Math.min(3, state.gridRows));
    const footprint = footprintForTeacher(item, item.cell, width, height);
    const occupied = occupiedInteriorMap({ excludeFixtureId:item.id });
    if (!footprint || footprint.some(cell => occupied.has(cell))) {
      refs.teacherDeskWidth.value = item.w || 1;
      refs.teacherDeskHeight.value = item.h || 1;
      toast('That desk size would overlap students or extend outside the grid.');
      return;
    }
    item.w = width;
    item.h = height;
    render();
    saveCurrent();
    toast(`Teacher desk resized to ${width} × ${height}.`);
  }

  function resizeSelectedWindow() {
    if (state.selected?.kind !== 'fixture') return;
    const item = state.fixtures.find(fixture => fixture.id === state.selected.id && fixture.type === 'window');
    if (!item || !item.zone) return;
    const max = perimeterSlots(item.zone);
    const span = clamp(parseInt(refs.windowSpan.value, 10) || 1, 1, max);
    const slot = clamp(item.slot, 0, Math.max(0, max - span));
    if (perimeterConflicts(item.zone, slot, span, item.id).length) {
      refs.windowSpan.value = perimeterSpan(item);
      toast('That window size would overlap another wall item.');
      return;
    }
    item.slot = slot;
    item.span = span;
    render();
    saveCurrent();
    toast(`Window resized to ${span} border space${span === 1 ? '' : 's'}.`);
  }

  function applyScheme() {
    state.scheme = refs.schemeSelect.value;
    state.students.forEach((student, index) => {
      student.colour = colourFor(student.name, index, state.scheme);
      student.customColour = false;
    });
    render();
    saveCurrent();
    toast('Student colours updated.');
  }

  function setSelectedStudentColour(colour) {
    if (state.selected?.kind !== 'student') return;
    const student = state.students.find(item => item.id === state.selected.id);
    if (!student) return;
    student.colour = colour;
    student.customColour = true;
    render();
    saveCurrent();
  }

  function renderSelectionBars() {
    refs.selectionBar.hidden = true;
    refs.fixtureSelectionBar.hidden = true;
    refs.teacherSizeControls.hidden = true;
    refs.windowSizeControls.hidden = true;

    if (state.selected?.kind === 'student') {
      const student = state.students.find(item => item.id === state.selected.id);
      if (!student) return;
      refs.selectionBar.hidden = false;
      refs.selectedStudentName.textContent = student.name;
      refs.studentColour.value = student.colour;
      return;
    }

    if (state.selected?.kind === 'fixture') {
      const item = state.fixtures.find(fixture => fixture.id === state.selected.id);
      if (!item) return;
      refs.fixtureSelectionBar.hidden = false;
      refs.selectedFixtureName.textContent = fixtureMeta[item.type].label;

      if (item.type === 'teacher') {
        refs.teacherSizeControls.hidden = false;
        refs.teacherDeskWidth.value = item.w || 1;
        refs.teacherDeskHeight.value = item.h || 1;
        refs.teacherDeskWidth.max = String(Math.min(4, state.gridCols));
        refs.teacherDeskHeight.max = String(Math.min(3, state.gridRows));
      }

      if (item.type === 'window') {
        refs.windowSizeControls.hidden = false;
        refs.windowSpan.max = String(perimeterSlots(item.zone));
        refs.windowSpan.value = perimeterSpan(item);
      }
    }
  }

  function renderGroupSizeControl() {
    refs.groupSizeWrap.hidden = state.arrangement !== 'groups';
  }

  function render() {
    const root = document.documentElement;
    root.style.setProperty('--grid-cols', state.gridCols);
    root.style.setProperty('--grid-rows', state.gridRows);
    root.style.setProperty('--room-ratio', String(Math.max(.85, state.gridCols / (state.gridRows * .62))));
    refs.gridCols.value = state.gridCols;
    refs.gridRows.value = state.gridRows;
    refs.gridStatus.textContent = `${state.gridCols} × ${state.gridRows}`;
    renderGrid();
    renderPerimeterRail('top');
    renderPerimeterRail('bottom');
    renderPerimeterRail('left');
    renderPerimeterRail('right');
    renderSelectionBars();
    renderGroupSizeControl();
  }

  function cleanRoster() {
    const cleaned = cleanedDisplayNames(refs.namesInput.value, false);
    refs.namesInput.value = cleaned.join('\n');
    syncStudents({ keepPositions:true });
    const extra = Math.max(0, cleaned.length - MAX_STUDENTS);
    toast(extra ? `Cleaned ${cleaned.length} names. Remove ${extra} to use the plan.` : `Cleaned ${cleaned.length} student name${cleaned.length === 1 ? '' : 's'}.`);
  }

  function sortRoster() {
    const names = cleanedDisplayNames(refs.namesInput.value, false).sort((a,b) => a.localeCompare(b));
    refs.namesInput.value = names.join('\n');
    syncStudents({ keepPositions:true });
  }

  function clearRoster() {
    refs.namesInput.value = '';
    state.students = [];
    state.selected = null;
    refs.studentCount.textContent = '0';
    render();
    saveCurrent();
    toast('Student list cleared.');
  }

  function rebuildPerimeterAfterResize(items) {
    const interior = state.fixtures.filter(item => fixtureMeta[item.type]?.placement === 'interior');
    state.fixtures = [...interior];

    items.forEach(item => {
      let desiredSpan = item.type === 'window' ? clamp(parseInt(item.span, 10) || 3, 1, MAX_GRID) : 1;
      let zone = ['top','bottom','left','right'].includes(item.zone) ? item.zone : null;
      let placed = false;

      if (zone) {
        desiredSpan = clamp(desiredSpan, 1, perimeterSlots(zone));
        const slot = clamp(parseInt(item.slot, 10) || 0, 0, Math.max(0, perimeterSlots(zone) - desiredSpan));
        if (!perimeterConflicts(zone, slot, desiredSpan, item.id).length) {
          item.zone = zone;
          item.slot = slot;
          if (item.type === 'window') item.span = desiredSpan;
          state.fixtures.push(item);
          placed = true;
        }
      }

      if (!placed) {
        let span = desiredSpan;
        let pos = firstFreePerimeter(['top','right','bottom','left'], item.id, span);
        while (!pos && item.type === 'window' && span > 1) {
          span -= 1;
          pos = firstFreePerimeter(['top','right','bottom','left'], item.id, span);
        }
        if (pos) {
          item.zone = pos.zone;
          item.slot = pos.slot;
          if (item.type === 'window') item.span = pos.span;
          state.fixtures.push(item);
        }
      }
    });
  }

  function applyGridSize({ announce = true } = {}) {
    const rows = clamp(parseInt(refs.gridRows.value, 10) || state.gridRows, MIN_GRID, MAX_GRID);
    const cols = clamp(parseInt(refs.gridCols.value, 10) || state.gridCols, MIN_GRID, MAX_GRID);
    refs.gridRows.value = rows;
    refs.gridCols.value = cols;
    if (rows === state.gridRows && cols === state.gridCols) return;

    const oldRows = state.gridRows;
    const oldCols = state.gridCols;
    const oldToNewCell = cell => {
      if (!Number.isInteger(cell)) return null;
      const row = Math.floor(cell / oldCols);
      const col = cell % oldCols;
      return row < rows && col < cols ? row * cols + col : null;
    };

    state.students.forEach(student => { student.cell = oldToNewCell(student.cell); });
    state.fixtures.filter(item => item.type === 'teacher').forEach(item => { item.cell = oldToNewCell(item.cell); });
    const perimeterItems = state.fixtures.filter(item => fixtureMeta[item.type]?.placement === 'perimeter').map(item => ({ ...item }));

    state.gridRows = rows;
    state.gridCols = cols;

    state.fixtures.filter(item => item.type === 'teacher').forEach(item => {
      item.w = clamp(item.w || 1, 1, Math.min(4, cols));
      item.h = clamp(item.h || 1, 1, Math.min(3, rows));
      if (!Number.isInteger(item.cell) || !footprintForTeacher(item)) item.cell = 0;
    });

    rebuildPerimeterAfterResize(perimeterItems);
    arrangeStudents(state.arrangement, false);
    if (announce) toast(`Grid resized to ${cols} × ${rows}. Students re-arranged to fit.`);
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { toast('This browser could not save changes locally.'); return false; }
  }

  function readSavedClasses() {
    const classes = readJson(SAVED_CLASSES_KEY, {});
    return classes && typeof classes === 'object' && !Array.isArray(classes) ? classes : {};
  }

  function readSavedLayouts() {
    const layouts = readJson(SAVED_LAYOUTS_KEY, {});
    return layouts && typeof layouts === 'object' && !Array.isArray(layouts) ? layouts : {};
  }

  function readSavedRooms() {
    const rooms = readJson(SAVED_ROOMS_KEY, {});
    return rooms && typeof rooms === 'object' && !Array.isArray(rooms) ? rooms : {};
  }

  function refreshSavedClasses(selected = '') {
    const classes = readSavedClasses();
    const names = Object.keys(classes).sort((a,b) => a.localeCompare(b));
    refs.savedClassSelect.innerHTML = '<option value="">Choose saved class…</option>';
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      refs.savedClassSelect.append(option);
    });
    if (names.includes(selected)) refs.savedClassSelect.value = selected;
  }

  function refreshSavedRooms(selected = '') {
    const rooms = readSavedRooms();
    const names = Object.keys(rooms).sort((a,b) => a.localeCompare(b));
    refs.savedRoomSelect.innerHTML = '<option value="">Choose saved layout…</option>';
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      refs.savedRoomSelect.append(option);
    });
    if (names.includes(selected)) refs.savedRoomSelect.value = selected;
  }

  function serialiseFixtures() {
    return state.fixtures.map(item => ({ ...item }));
  }

  function serialiseRoomLayout() {
    return { gridRows:state.gridRows, gridCols:state.gridCols, fixtures:serialiseFixtures() };
  }

  function serialiseLayout() {
    return {
      names: state.students.map(student => student.name),
      students: state.students.map(student => ({ name:student.name, cell:student.cell, colour:student.colour, customColour:!!student.customColour })),
      fixtures: serialiseFixtures(),
      scheme: state.scheme,
      arrangement: state.arrangement,
      groupSize: state.groupSize,
      gridRows: state.gridRows,
      gridCols: state.gridCols,
      singleColour: refs.singleColour.value
    };
  }

  function saveCurrent() {
    writeJson(CURRENT_KEY, serialiseLayout());
  }

  function saveClass() {
    const name = refs.classNameInput.value.trim();
    if (!name) { toast('Enter a class name first.'); refs.classNameInput.focus(); return; }
    const detected = rawRosterEntries(refs.namesInput.value, false).length;
    if (!detected) { toast('Add some student names before saving the class.'); return; }
    if (detected > MAX_STUDENTS) { toast(`Maximum ${MAX_STUDENTS} students. Remove ${detected - MAX_STUDENTS} before saving.`); return; }

    const classes = readSavedClasses();
    classes[name] = state.students.map(student => student.name);
    if (!writeJson(SAVED_CLASSES_KEY, classes)) return;
    const layouts = readSavedLayouts();
    layouts[name] = serialiseLayout();
    writeJson(SAVED_LAYOUTS_KEY, layouts);
    refreshSavedClasses(name);
    refs.savedClassSelect.value = name;
    toast(`${name} saved with its seating layout.`);
  }

  function saveRoomLayout() {
    const name = refs.roomNameInput.value.trim();
    if (!name) { toast('Enter a classroom layout name first.'); refs.roomNameInput.focus(); return; }
    const rooms = readSavedRooms();
    rooms[name] = serialiseRoomLayout();
    if (!writeJson(SAVED_ROOMS_KEY, rooms)) return;
    refreshSavedRooms(name);
    refs.savedRoomSelect.value = name;
    toast(`${name} classroom layout saved.`);
  }

  function normaliseFixture(raw, index = 0, assumeLegacy = false) {
    if (!raw || !fixtureMeta[raw.type]) return null;
    const id = raw.id || `fixture-restored-${raw.type}-${Date.now()}-${index}`;

    if (raw.type === 'teacher') {
      const cell = Number.isInteger(raw.cell) ? clamp(raw.cell, 0, Math.max(0, cellCount() - 1)) : 0;
      return {
        id,
        type:'teacher',
        cell,
        w:clamp(parseInt(raw.w, 10) || 1, 1, Math.min(4, state.gridCols)),
        h:clamp(parseInt(raw.h, 10) || 1, 1, Math.min(3, state.gridRows))
      };
    }

    const desiredSpan = raw.type === 'window' ? clamp(parseInt(raw.span, 10) || 3, 1, MAX_GRID) : 1;
    if (!assumeLegacy && ['top','bottom','left','right'].includes(raw.zone) && Number.isInteger(raw.slot)) {
      const span = clamp(desiredSpan, 1, perimeterSlots(raw.zone));
      const slot = clamp(raw.slot, 0, Math.max(0, perimeterSlots(raw.zone) - span));
      const item = { id, type:raw.type, zone:raw.zone, slot };
      if (raw.type === 'window') item.span = span;
      return item;
    }

    const pos = defaultPerimeterPosition(raw.type, desiredSpan) || firstFreePerimeter(['top','right','bottom','left'], null, desiredSpan);
    if (!pos) return null;
    const item = { id, type:raw.type, zone:pos.zone, slot:pos.slot };
    if (raw.type === 'window') item.span = pos.span;
    return item;
  }

  function restoreFixtures(fixtures, { legacy = false } = {}) {
    state.fixtures = [];
    if (!Array.isArray(fixtures) || !fixtures.length) {
      createDefaultFixtures();
      return;
    }

    fixtures.forEach((raw, index) => {
      const item = normaliseFixture(raw, index, legacy);
      if (!item) return;

      if (fixtureMeta[item.type].placement === 'perimeter') {
        let span = perimeterSpan(item);
        if (perimeterConflicts(item.zone, item.slot, span, item.id).length) {
          let pos = firstFreePerimeter(['top','right','bottom','left'], item.id, span);
          while (!pos && item.type === 'window' && span > 1) {
            span -= 1;
            pos = firstFreePerimeter(['top','right','bottom','left'], item.id, span);
          }
          if (!pos) return;
          item.zone = pos.zone;
          item.slot = pos.slot;
          if (item.type === 'window') item.span = pos.span;
        }
      }
      state.fixtures.push(item);
    });

    if (!state.fixtures.length) createDefaultFixtures();
  }

  function restoreLayout(layout, fallbackNames = []) {
    if (!layout || typeof layout !== 'object') {
      refs.namesInput.value = fallbackNames.join('\n');
      syncStudents({ keepPositions:false });
      return;
    }

    const legacyGrid = !Number.isInteger(layout.gridRows) || !Number.isInteger(layout.gridCols);
    state.gridRows = clamp(parseInt(layout.gridRows, 10) || (legacyGrid ? 10 : DEFAULT_ROWS), MIN_GRID, MAX_GRID);
    state.gridCols = clamp(parseInt(layout.gridCols, 10) || (legacyGrid ? 10 : DEFAULT_COLS), MIN_GRID, MAX_GRID);
    refs.gridRows.value = state.gridRows;
    refs.gridCols.value = state.gridCols;

    const names = Array.isArray(layout.names) ? layout.names : fallbackNames;
    refs.namesInput.value = names.join('\n');
    const savedStudents = Array.isArray(layout.students) ? layout.students : [];
    const byName = new Map(savedStudents.map(student => [String(student.name).toLocaleLowerCase(), student]));
    state.scheme = layout.scheme || 'pastel';
    state.arrangement = layout.arrangement || 'rows';
    state.groupSize = clamp(parseInt(layout.groupSize, 10) || 4, 2, 8);
    refs.schemeSelect.value = state.scheme;
    refs.arrangementSelect.value = state.arrangement;
    refs.groupSize.value = state.groupSize;
    if (layout.singleColour) refs.singleColour.value = layout.singleColour;

    restoreFixtures(layout.fixtures, { legacy:legacyGrid });

    state.students = names.slice(0, MAX_STUDENTS).map((name, index) => {
      const saved = byName.get(String(name).toLocaleLowerCase());
      const cell = Number.isInteger(saved?.cell) && saved.cell >= 0 && saved.cell < cellCount() ? saved.cell : null;
      return {
        id:`student-${Date.now()}-${index}-${hashString(name)}`,
        name,
        cell,
        colour:saved?.colour || colourFor(name, index, state.scheme),
        customColour:!!saved?.customColour
      };
    });
    syncStudents({ keepPositions:true });
  }

  function loadClass() {
    const name = refs.savedClassSelect.value;
    if (!name) { toast('Choose a saved class first.'); return; }
    const classes = readSavedClasses();
    const names = Array.isArray(classes[name]) ? classes[name] : [];
    const layouts = readSavedLayouts();
    refs.classNameInput.value = name;
    restoreLayout(layouts[name], names);
    toast(layouts[name] ? `${name} and its seating layout loaded.` : `${name} loaded — ready to arrange.`);
  }

  function deleteClass() {
    const name = refs.savedClassSelect.value;
    if (!name) { toast('Choose a saved class first.'); return; }
    const classes = readSavedClasses();
    const layouts = readSavedLayouts();
    delete classes[name];
    delete layouts[name];
    writeJson(SAVED_CLASSES_KEY, classes);
    writeJson(SAVED_LAYOUTS_KEY, layouts);
    refreshSavedClasses();
    if (refs.classNameInput.value === name) refs.classNameInput.value = '';
    toast(`${name} deleted from saved classes.`);
  }

  function loadRoomLayout() {
    const name = refs.savedRoomSelect.value;
    if (!name) { toast('Choose a saved classroom layout first.'); return; }
    const rooms = readSavedRooms();
    const room = rooms[name];
    if (!room) { toast('That classroom layout could not be found.'); return; }
    state.gridRows = clamp(parseInt(room.gridRows, 10) || DEFAULT_ROWS, MIN_GRID, MAX_GRID);
    state.gridCols = clamp(parseInt(room.gridCols, 10) || DEFAULT_COLS, MIN_GRID, MAX_GRID);
    restoreFixtures(room.fixtures);
    refs.roomNameInput.value = name;
    arrangeStudents(state.arrangement, false);
    saveCurrent();
    toast(`${name} classroom layout loaded.`);
  }

  function deleteRoomLayout() {
    const name = refs.savedRoomSelect.value;
    if (!name) { toast('Choose a saved classroom layout first.'); return; }
    const rooms = readSavedRooms();
    delete rooms[name];
    writeJson(SAVED_ROOMS_KEY, rooms);
    refreshSavedRooms();
    if (refs.roomNameInput.value === name) refs.roomNameInput.value = '';
    toast(`${name} classroom layout deleted.`);
  }

  function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    refs.themeBtn.textContent = dark ? '☀️' : '🌙';
    refs.themeBtn.setAttribute('aria-pressed', String(dark));
    refs.themeBtn.setAttribute('aria-label', dark ? 'Turn on light mode' : 'Turn on dark mode');
    refs.themeBtn.title = dark ? 'Turn on light mode' : 'Turn on dark mode';
    if (persist) {
      try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (_) {}
    }
  }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => refs.toast.classList.remove('show'), 2400);
  }

  function initialiseGridState() {
    const current = readJson(CURRENT_KEY, null);
    if (current?.names?.length || current?.fixtures?.length) restoreLayout(current, current.names || []);
    else {
      createDefaultFixtures();
      render();
    }
  }

  refs.namesInput.addEventListener('input', () => syncStudents({ keepPositions:true }));
  refs.cleanBtn.addEventListener('click', cleanRoster);
  refs.sortBtn.addEventListener('click', sortRoster);
  refs.clearBtn.addEventListener('click', clearRoster);
  refs.saveClassBtn.addEventListener('click', saveClass);
  refs.loadClassBtn.addEventListener('click', loadClass);
  refs.deleteClassBtn.addEventListener('click', deleteClass);
  refs.savedClassSelect.addEventListener('change', () => { if (refs.savedClassSelect.value) refs.classNameInput.value = refs.savedClassSelect.value; });

  refs.arrangeBtn.addEventListener('click', () => arrangeStudents(refs.arrangementSelect.value));
  refs.arrangementSelect.addEventListener('change', () => {
    state.arrangement = refs.arrangementSelect.value;
    renderGroupSizeControl();
    saveCurrent();
  });
  refs.groupSize.addEventListener('change', () => {
    state.groupSize = clamp(parseInt(refs.groupSize.value, 10) || 4, 2, 8);
    refs.groupSize.value = state.groupSize;
    if (state.arrangement === 'groups') arrangeStudents('groups');
  });

  refs.applyGridBtn.addEventListener('click', () => applyGridSize());
  [refs.gridRows, refs.gridCols].forEach(input => input.addEventListener('keydown', event => {
    if (event.key === 'Enter') applyGridSize();
  }));

  refs.applySchemeBtn.addEventListener('click', applyScheme);
  refs.schemeSelect.addEventListener('change', () => { state.scheme = refs.schemeSelect.value; });
  refs.singleColour.addEventListener('input', () => { if (refs.schemeSelect.value === 'single') applyScheme(); });

  $$('.fixture-button').forEach(button => button.addEventListener('click', () => addFixture(button.dataset.fixture)));
  refs.clearFixturesBtn.addEventListener('click', () => {
    state.fixtures = [];
    state.selected = null;
    render();
    saveCurrent();
    toast('Room items cleared.');
  });
  refs.resetRoomBtn.addEventListener('click', () => {
    createDefaultFixtures();
    arrangeStudents(state.arrangement, false);
    toast('Default classroom restored.');
  });
  refs.clearPositionsBtn.addEventListener('click', () => arrangeStudents(state.arrangement));

  $$('.colour-swatch').forEach(button => button.addEventListener('click', () => setSelectedStudentColour(button.dataset.colour)));
  refs.studentColour.addEventListener('input', () => setSelectedStudentColour(refs.studentColour.value));
  refs.closeSelectionBtn.addEventListener('click', () => { state.selected = null; render(); });

  refs.applyTeacherSizeBtn.addEventListener('click', resizeSelectedTeacher);
  refs.applyWindowSizeBtn.addEventListener('click', resizeSelectedWindow);
  refs.windowSpan.addEventListener('keydown', event => { if (event.key === 'Enter') resizeSelectedWindow(); });
  refs.removeSelectedFixtureBtn.addEventListener('click', () => {
    if (state.selected?.kind === 'fixture') removeFixture(state.selected.id);
  });
  refs.closeFixtureSelectionBtn.addEventListener('click', () => { state.selected = null; render(); });

  refs.saveRoomBtn.addEventListener('click', saveRoomLayout);
  refs.loadRoomBtn.addEventListener('click', loadRoomLayout);
  refs.deleteRoomBtn.addEventListener('click', deleteRoomLayout);
  refs.savedRoomSelect.addEventListener('change', () => { if (refs.savedRoomSelect.value) refs.roomNameInput.value = refs.savedRoomSelect.value; });

  refs.printBtn.addEventListener('click', () => window.print());
  refs.themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  refs.showPlanBtn.addEventListener('click', () => refs.planPanel.scrollIntoView({ behavior:'smooth', block:'start' }));

  try { applyTheme(localStorage.getItem(THEME_KEY) || 'light', false); } catch (_) { applyTheme('light', false); }
  refreshSavedClasses();
  refreshSavedRooms();
  initialiseGridState();
})();

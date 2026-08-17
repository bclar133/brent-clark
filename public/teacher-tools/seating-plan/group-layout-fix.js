(() => {
  'use strict';

  const arrangementSelect = document.querySelector('#arrangementSelect');
  const groupSizeInput = document.querySelector('#groupSize');
  const arrangeBtn = document.querySelector('#arrangeBtn');
  const applyGridBtn = document.querySelector('#applyGridBtn');
  const gridColsInput = document.querySelector('#gridCols');
  const gridRowsInput = document.querySelector('#gridRows');

  if (!arrangementSelect || !groupSizeInput || !arrangeBtn || !applyGridBtn || !gridColsInput || !gridRowsInput) return;

  let running = false;
  let queued = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function spread(count, min, max) {
    if (count <= 0) return [];
    if (count === 1) return [Math.round((min + max) / 2)];
    const values = [];
    for (let i = 0; i < count; i += 1) {
      values.push(Math.round(min + (i * (max - min)) / (count - 1)));
    }
    return values;
  }

  function parseGridPart(value) {
    const start = parseInt(String(value || '').split('/')[0], 10);
    const spanMatch = String(value || '').match(/span\s+(\d+)/i);
    return {
      start: Number.isInteger(start) ? start : 1,
      span: spanMatch ? Math.max(1, parseInt(spanMatch[1], 10) || 1) : 1
    };
  }

  function teacherBlockedCells(cols, rows) {
    const blocked = new Set();
    document.querySelectorAll('.teacher-card, .teacher-fixture-card').forEach(card => {
      const col = parseGridPart(card.style.gridColumn);
      const row = parseGridPart(card.style.gridRow);
      for (let r = row.start - 1; r < row.start - 1 + row.span; r += 1) {
        for (let c = col.start - 1; c < col.start - 1 + col.span; c += 1) {
          if (r >= 0 && r < rows && c >= 0 && c < cols) blocked.add(r * cols + c);
        }
      }
    });
    return blocked;
  }

  function balancedRowCounts(groupCount, rowCount) {
    const counts = Array(rowCount).fill(Math.floor(groupCount / rowCount));
    let remainder = groupCount % rowCount;

    if (remainder && rowCount % 2 === 1 && remainder % 2 === 1) {
      counts[Math.floor(rowCount / 2)] += 1;
      remainder -= 1;
    }

    let left = 0;
    let right = rowCount - 1;
    while (remainder >= 2 && left <= right) {
      counts[left] += 1;
      counts[right] += 1;
      remainder -= 2;
      left += 1;
      right -= 1;
    }

    if (remainder === 1) counts[Math.floor((rowCount - 1) / 2)] += 1;
    return counts;
  }

  function compactOffsets(count, blockW, blockH) {
    const offsets = [];
    for (let r = 0; r < blockH && offsets.length < count; r += 1) {
      for (let c = 0; c < blockW && offsets.length < count; c += 1) offsets.push({ r, c });
    }
    return offsets;
  }

  function blockCells(originRow, originCol, blockW, blockH, cols) {
    const cells = [];
    for (let r = 0; r < blockH; r += 1) {
      for (let c = 0; c < blockW; c += 1) cells.push((originRow + r) * cols + originCol + c);
    }
    return cells;
  }

  function nearestFreeOrigin(preferredRow, preferredCol, blockW, blockH, cols, rows, blocked, reserved) {
    const candidates = [];
    const maxRow = rows - blockH;
    const maxCol = cols - blockW;

    for (let r = 0; r <= maxRow; r += 1) {
      for (let c = 0; c <= maxCol; c += 1) {
        const footprint = blockCells(r, c, blockW, blockH, cols);
        if (footprint.some(cell => blocked.has(cell) || reserved.has(cell))) continue;
        const distance = Math.pow(r - preferredRow, 2) + Math.pow(c - preferredCol, 2);
        candidates.push({ r, c, footprint, distance });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance || a.r - b.r || a.c - b.c);
    return candidates[0] || null;
  }

  function desiredGroupCells(studentCount, groupSize, cols, rows) {
    const groupCount = Math.ceil(studentCount / groupSize);
    if (!groupCount) return [];

    const blockW = Math.min(cols, Math.ceil(Math.sqrt(groupSize)));
    const blockH = Math.min(rows, Math.ceil(groupSize / blockW));
    const effectiveCols = Math.max(1, cols / blockW);
    const effectiveRows = Math.max(1, rows / blockH);
    const maxGroupRows = Math.max(1, Math.floor(rows / blockH));

    let groupRows = Math.round(Math.sqrt(groupCount * (effectiveRows / effectiveCols)));
    groupRows = clamp(groupRows, 1, Math.min(groupCount, maxGroupRows));
    while (Math.ceil(groupCount / groupRows) > Math.max(1, Math.floor(cols / blockW)) && groupRows < maxGroupRows) groupRows += 1;

    const rowCounts = balancedRowCounts(groupCount, groupRows);
    const maxOriginRow = Math.max(0, rows - blockH);
    const topMargin = maxOriginRow >= 2 ? 1 : 0;
    const originRows = spread(groupRows, topMargin, maxOriginRow);
    const blocked = teacherBlockedCells(cols, rows);
    const reserved = new Set();
    const cells = [];
    let remainingStudents = studentCount;

    rowCounts.forEach((groupsInRow, rowIndex) => {
      if (!groupsInRow) return;
      const preferredCols = spread(groupsInRow, 0, Math.max(0, cols - blockW));

      preferredCols.forEach(preferredCol => {
        if (remainingStudents <= 0) return;
        const origin = nearestFreeOrigin(originRows[rowIndex], preferredCol, blockW, blockH, cols, rows, blocked, reserved);
        if (!origin) return;

        origin.footprint.forEach(cell => reserved.add(cell));
        const thisGroupSize = Math.min(groupSize, remainingStudents);
        compactOffsets(thisGroupSize, blockW, blockH).forEach(offset => {
          cells.push((origin.r + offset.r) * cols + origin.c + offset.c);
        });
        remainingStudents -= thisGroupSize;
      });
    });

    return cells;
  }

  function cardById(id) {
    return [...document.querySelectorAll('.student-card')].find(card => card.dataset.id === id) || null;
  }

  function applyEvenGroups() {
    queued = false;
    if (running || arrangementSelect.value !== 'groups') return;

    const cols = clamp(parseInt(gridColsInput.value, 10) || 8, 1, 50);
    const rows = clamp(parseInt(gridRowsInput.value, 10) || 8, 1, 50);
    const groupSize = clamp(parseInt(groupSizeInput.value, 10) || 4, 2, 8);
    const cards = [...document.querySelectorAll('.student-card')];
    if (!cards.length) return;

    const studentIds = cards.map(card => card.dataset.id).filter(Boolean);
    const targets = desiredGroupCells(studentIds.length, groupSize, cols, rows);
    if (targets.length < studentIds.length) return;

    running = true;
    try {
      studentIds.forEach((id, index) => {
        const card = cardById(id);
        if (!card) return;
        const destinationCell = targets[index];
        const current = card.style.gridRow && card.style.gridColumn
          ? (parseInt(card.style.gridRow, 10) - 1) * cols + (parseInt(card.style.gridColumn, 10) - 1)
          : null;
        if (current === destinationCell) return;

        card.click();
        const destination = document.querySelector(`.grid-cell[data-cell="${destinationCell}"]`);
        if (destination) destination.click();
      });
    } finally {
      running = false;
    }
  }

  function scheduleEvenGroups() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(applyEvenGroups));
  }

  arrangeBtn.addEventListener('click', scheduleEvenGroups);
  groupSizeInput.addEventListener('change', scheduleEvenGroups);
  applyGridBtn.addEventListener('click', scheduleEvenGroups);

  window.addEventListener('load', () => {
    if (arrangementSelect.value === 'groups') scheduleEvenGroups();
  });

  /* Keep perimeter drop-zones in exactly one wall row/column. Without explicit
     placement, CSS Grid treats fixture cards as occupied tracks and pushes
     some drop-zone cells into an unwanted second row. */
  function fixPerimeterRails() {
    document.querySelectorAll('.perimeter-rail').forEach(rail => {
      const horizontal = rail.classList.contains('horizontal');
      rail.querySelectorAll('.perimeter-cell').forEach(cell => {
        const slot = parseInt(cell.dataset.slot, 10);
        if (!Number.isInteger(slot)) return;
        if (horizontal) {
          cell.style.gridColumn = String(slot + 1);
          cell.style.gridRow = '1';
        } else {
          cell.style.gridColumn = '1';
          cell.style.gridRow = String(slot + 1);
        }
      });
    });
  }

  const perimeterStyle = document.createElement('style');
  perimeterStyle.textContent = `
    .perimeter-rail.horizontal {
      grid-template-rows: minmax(0, 1fr) !important;
      grid-auto-rows: 0 !important;
    }
    .perimeter-rail.vertical {
      grid-template-columns: minmax(0, 1fr) !important;
      grid-auto-columns: 0 !important;
    }

    /* The base stylesheet hides every label on side walls. Door and Window
       are exceptions: keep their names visible and rotate the word as a unit. */
    .perimeter-rail.vertical .door-fixture-card .fixture-label,
    .perimeter-rail.vertical .window-fixture-card .fixture-label {
      display: block !important;
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: max-content !important;
      max-width: none !important;
      max-height: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: nowrap !important;
      writing-mode: horizontal-tb !important;
      text-orientation: mixed !important;
      transform: translate(-50%, -50%) rotate(-90deg) !important;
      transform-origin: center !important;
      font-size: clamp(.54rem, .72vw, .68rem) !important;
      line-height: 1 !important;
      z-index: 2 !important;
    }
    .perimeter-rail.vertical .door-fixture-card,
    .perimeter-rail.vertical .window-fixture-card {
      overflow: hidden !important;
    }
    .perimeter-rail.vertical .door-fixture-card .fixture-icon,
    .perimeter-rail.vertical .window-fixture-card .fixture-icon {
      display: none !important;
    }
  `;
  document.head.append(perimeterStyle);

  let perimeterRepairQueued = false;
  function schedulePerimeterRepair() {
    if (perimeterRepairQueued) return;
    perimeterRepairQueued = true;
    requestAnimationFrame(() => {
      perimeterRepairQueued = false;
      fixPerimeterRails();
    });
  }

  const rails = ['#topRail', '#bottomRail', '#leftRail', '#rightRail']
    .map(selector => document.querySelector(selector))
    .filter(Boolean);
  const perimeterObserver = new MutationObserver(schedulePerimeterRepair);
  rails.forEach(rail => perimeterObserver.observe(rail, { childList: true }));
  schedulePerimeterRepair();
})();

(() => {
  'use strict';

  let drag = null;
  let redirecting = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function parseSpan(value) {
    const match = String(value || '').match(/span\s+(\d+)/i);
    return match ? Math.max(1, parseInt(match[1], 10) || 1) : 1;
  }

  function gridDimensions() {
    const styles = getComputedStyle(document.documentElement);
    return {
      cols: Math.max(1, parseInt(styles.getPropertyValue('--grid-cols'), 10) || 1),
      rows: Math.max(1, parseInt(styles.getPropertyValue('--grid-rows'), 10) || 1)
    };
  }

  function clearPreview() {
    document.querySelectorAll('.footprint-preview').forEach(element => element.classList.remove('footprint-preview'));
  }

  function pointerFraction(position, start, length) {
    if (!Number.isFinite(position) || length <= 0 || position < start || position > start + length) return 0.5;
    return clamp((position - start) / length, 0, 0.999999);
  }

  function teacherAnchor(targetCell) {
    const { cols, rows } = gridDimensions();
    const width = Math.min(drag.width, cols);
    const height = Math.min(drag.height, rows);
    const targetRow = Math.floor(targetCell / cols);
    const targetCol = targetCell % cols;
    const offsetCol = clamp(drag.offsetCol, 0, width - 1);
    const offsetRow = clamp(drag.offsetRow, 0, height - 1);
    const anchorCol = clamp(targetCol - offsetCol, 0, Math.max(0, cols - width));
    const anchorRow = clamp(targetRow - offsetRow, 0, Math.max(0, rows - height));
    return {
      cell: anchorRow * cols + anchorCol,
      row: anchorRow,
      col: anchorCol,
      width,
      height,
      cols,
      rows
    };
  }

  function previewTeacher(targetCell) {
    clearPreview();
    const anchor = teacherAnchor(targetCell);
    for (let row = anchor.row; row < anchor.row + anchor.height; row += 1) {
      for (let col = anchor.col; col < anchor.col + anchor.width; col += 1) {
        const cell = row * anchor.cols + col;
        document.querySelector(`.grid-cell[data-cell="${cell}"]`)?.classList.add('footprint-preview');
      }
    }
    return anchor.cell;
  }

  function railInfo(cell) {
    const rail = cell?.closest('.perimeter-rail');
    if (!rail) return null;
    const zone = ({ topRail: 'top', bottomRail: 'bottom', leftRail: 'left', rightRail: 'right' })[rail.id];
    if (!zone) return null;
    return {
      rail,
      zone,
      count: rail.querySelectorAll('.perimeter-cell').length,
      slot: parseInt(cell.dataset.slot, 10)
    };
  }

  function windowAnchor(cell) {
    const info = railInfo(cell);
    if (!info || !Number.isInteger(info.slot)) return null;
    const span = Math.min(Math.max(1, drag.span), Math.max(1, info.count));
    const offset = clamp(drag.offsetSlot, 0, span - 1);
    const start = clamp(info.slot - offset, 0, Math.max(0, info.count - span));
    return { ...info, span, start };
  }

  function previewWindow(cell) {
    clearPreview();
    const anchor = windowAnchor(cell);
    if (!anchor) return null;
    for (let slot = anchor.start; slot < anchor.start + anchor.span; slot += 1) {
      anchor.rail.querySelector(`.perimeter-cell[data-slot="${slot}"]`)?.classList.add('footprint-preview');
    }
    return anchor;
  }

  function redirectDrop(destination) {
    if (!destination) return;
    redirecting = true;
    try {
      destination.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    } finally {
      redirecting = false;
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    .grid-cell.footprint-preview,
    .perimeter-cell.footprint-preview {
      border-color: var(--accent) !important;
      background: rgba(91, 75, 219, .16) !important;
      box-shadow: inset 0 0 0 1px var(--accent);
    }
    html[data-theme="dark"] .grid-cell.footprint-preview,
    html[data-theme="dark"] .perimeter-cell.footprint-preview {
      background: rgba(141, 124, 255, .20) !important;
    }
  `;
  document.head.append(style);

  document.addEventListener('dragstart', event => {
    const card = event.target.closest('.fixture-card');
    if (!card) {
      drag = null;
      return;
    }

    const rect = card.getBoundingClientRect();

    if (card.classList.contains('teacher-fixture-card')) {
      const width = parseSpan(card.style.gridColumn);
      const height = parseSpan(card.style.gridRow);
      const x = pointerFraction(event.clientX, rect.left, rect.width);
      const y = pointerFraction(event.clientY, rect.top, rect.height);
      drag = {
        type: 'teacher',
        width,
        height,
        offsetCol: Math.min(width - 1, Math.floor(x * width)),
        offsetRow: Math.min(height - 1, Math.floor(y * height))
      };
      return;
    }

    if (card.classList.contains('window-fixture-card')) {
      const rail = card.closest('.perimeter-rail');
      const horizontal = rail?.classList.contains('horizontal');
      const span = parseSpan(horizontal ? card.style.gridColumn : card.style.gridRow);
      const fraction = horizontal
        ? pointerFraction(event.clientX, rect.left, rect.width)
        : pointerFraction(event.clientY, rect.top, rect.height);
      drag = {
        type: 'window',
        span,
        offsetSlot: Math.min(span - 1, Math.floor(fraction * span))
      };
      return;
    }

    drag = null;
  }, true);

  document.addEventListener('dragover', event => {
    if (!drag) return;

    if (drag.type === 'teacher') {
      const cell = event.target.closest('.grid-cell');
      if (cell) {
        const targetCell = parseInt(cell.dataset.cell, 10);
        if (Number.isInteger(targetCell)) previewTeacher(targetCell);
      }
      return;
    }

    if (drag.type === 'window') {
      const cell = event.target.closest('.perimeter-cell');
      if (cell) previewWindow(cell);
    }
  }, true);

  document.addEventListener('drop', event => {
    if (redirecting || !drag) return;

    if (drag.type === 'teacher') {
      const cell = event.target.closest('.grid-cell');
      if (!cell) return;
      const targetCell = parseInt(cell.dataset.cell, 10);
      if (!Number.isInteger(targetCell)) return;
      const anchorCell = previewTeacher(targetCell);
      clearPreview();
      if (anchorCell === targetCell) return;

      const destination = document.querySelector(`.grid-cell[data-cell="${anchorCell}"]`);
      if (!destination) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      redirectDrop(destination);
      return;
    }

    if (drag.type === 'window') {
      const cell = event.target.closest('.perimeter-cell');
      if (!cell) return;
      const anchor = previewWindow(cell);
      clearPreview();
      if (!anchor || anchor.start === anchor.slot) return;

      const destination = anchor.rail.querySelector(`.perimeter-cell[data-slot="${anchor.start}"]`);
      if (!destination) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      redirectDrop(destination);
    }
  }, true);

  document.addEventListener('dragend', () => {
    clearPreview();
    drag = null;
  }, true);

  document.addEventListener('drop', () => {
    clearPreview();
    setTimeout(() => { drag = null; }, 0);
  });
})();

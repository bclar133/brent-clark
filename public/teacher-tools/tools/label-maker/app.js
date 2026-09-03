(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const makeTheme = (id, name, thumb) => ({
    id,
    name,
    thumb,
    art: Array.from({ length: 7 }, (_, index) => `assets/themes/${id}/${index + 1}.webp`),
    frames: Array.from({ length: 7 }, (_, index) => `assets/frames/${id}/${index + 1}.webp?v=3`)
  });

  const themes = [
    makeTheme('woodland', 'Woodland Friends', '#dfead7'),
    makeTheme('treats', 'Tasty Treats', '#ffe0d6'),
    makeTheme('space', 'Outer Space', '#172766'),
    makeTheme('ocean', 'Under the Sea', '#d7f3f6'),
    makeTheme('dino', 'Dinosaur Days', '#e8eccb'),
    makeTheme('sports', 'Sports', '#e2edff'),
    makeTheme('celebration', 'Celebration', '#ffedc2'),
    makeTheme('science', 'Science Lab', '#deeffa'),
    makeTheme('garden', 'Flower Garden', '#ffe1eb'),
    makeTheme('robots', 'Robot Workshop', '#e1e9ee'),
    makeTheme('maths', 'Maths', '#e8f1ff'),
    makeTheme('digital', 'Digital Technologies', '#e7f4ff'),
    makeTheme('construction', 'Mining & Construction', '#fff0c9'),
    makeTheme('music', 'Music', '#f2e7ff'),
    makeTheme('art', 'Art', '#fff0db'),
    makeTheme('literature', 'Literature', '#f4eadf'),
    makeTheme('geography', 'Geography', '#e3f4df'),
    makeTheme('ancient', 'Ancient History', '#f2e3c4'),
    makeTheme('surf', 'Surf & Beach', '#dff7fa'),
    makeTheme('workshop', 'Workshop', '#edf0f2')
  ];

  const layouts = {
    standard24: { label: 'Standard 24', cols: 3, rows: 8, width: 64, height: 33.9, marginX: 7, marginTop: 12.9, gapX: 2, gapY: 0, font: 5.4 },
    address21: { label: 'Medium · 3 per row', cols: 3, rows: 7, width: 63.5, height: 38.1, marginX: 7.25, marginTop: 15.15, gapX: 2.5, gapY: 0, font: 6 },
    shipping14: { label: 'Wide 14', cols: 2, rows: 7, width: 99.1, height: 38.1, marginX: 4.7, marginTop: 15.15, gapX: 2.4, gapY: 0, font: 6.5 },
    large8: { label: 'Extra large 8', cols: 2, rows: 4, width: 99.1, height: 67.7, marginX: 4.7, marginTop: 13.1, gapX: 2.4, gapY: 0, font: 9 },
    mini40: { label: 'Small · 4 per row', cols: 4, rows: 10, width: 48.5, height: 25.4, marginX: 8, marginTop: 21.5, gapX: 0, gapY: 0, font: 4.2 },
    cutout10: { label: 'Large · 2 per row', cols: 2, rows: 5, width: 95, height: 50, marginX: 7.5, marginTop: 12.5, gapX: 5, gapY: 5.5, font: 7.6 }
  };

  const refs = {
    namesInput: $('#namesInput'),
    studentCount: $('#studentCount'),
    nameFormat: $('#nameFormat'),
    cleanBtn: $('#cleanBtn'),
    sortBtn: $('#sortBtn'),
    clearBtn: $('#clearBtn'),
    sheetLayout: $('#sheetLayout'),
    startPosition: $('#startPosition'),
    fontSize: $('#fontSize'),
    extraBlankLabels: $('#extraBlankLabels'),
    themePicker: $('#themePicker'),
    pageSummary: $('#pageSummary'),
    emptyState: $('#emptyState'),
    printPages: $('#printPages'),
    printOutput: $('#printOutput'),
    printBtn: $('#printBtn'),
    themeModeBtn: $('#themeModeBtn'),
    toast: $('#toast')
  };

  const state = { theme: 'woodland', names: [], blankCount: 0, toastTimer: 0, renderTimer: 0 };

  function normalizeLine(line) {
    return line.trim().replace(/\s+/g, ' ');
  }

  function titleCase(value) {
    return value.replace(/(^|[\s'’-])([a-zà-öø-ÿ])/gi, (match, before, letter) => before + letter.toLocaleUpperCase());
  }

  function rawRosterEntries(raw) {
    const lines = raw.split(/[\n\r\t;]+/).map(normalizeLine).filter(Boolean);
    const seen = new Set();
    const entries = [];

    lines.forEach((line) => {
      let first = '';
      let surname = '';
      if (line.includes(',')) {
        const parts = line.split(',').map(normalizeLine).filter(Boolean);
        surname = parts[0] || '';
        first = parts.slice(1).join(' ').trim() || surname;
      } else {
        const words = line.split(' ').filter(Boolean);
        first = words[0] || '';
        surname = words.length > 1 ? words.slice(1).join(' ') : '';
      }
      first = titleCase(first);
      surname = titleCase(surname);
      const key = `${first}|${surname}`.toLocaleLowerCase();
      if (!first || seen.has(key)) return;
      seen.add(key);
      entries.push({ first, surname });
    });
    return entries;
  }

  function distinctFirstNames(entries) {
    const groups = new Map();
    entries.forEach((entry) => {
      const key = entry.first.toLocaleLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });

    return entries.map((entry) => {
      const matching = groups.get(entry.first.toLocaleLowerCase()) || [];
      if (matching.length === 1) return entry.first;
      if (!entry.surname) return `${entry.first} ${matching.indexOf(entry) + 1}`;

      let prefixLength = 1;
      while (prefixLength < entry.surname.length) {
        const prefix = entry.surname.slice(0, prefixLength).toLocaleLowerCase();
        const clashes = matching.filter((other) => other.surname.slice(0, prefixLength).toLocaleLowerCase() === prefix).length;
        if (clashes === 1) break;
        prefixLength += 1;
      }
      return `${entry.first} ${entry.surname.slice(0, prefixLength)}`;
    });
  }

  function formatEntries(entries, format = refs.nameFormat.value) {
    if (format === 'full') return entries.map(({ first, surname }) => [first, surname].filter(Boolean).join(' '));
    if (format === 'initial') return entries.map(({ first, surname }) => surname ? `${first} ${surname[0]}.` : first);
    return distinctFirstNames(entries);
  }

  function toast(message) {
    clearTimeout(state.toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add('show');
    state.toastTimer = setTimeout(() => refs.toast.classList.remove('show'), 2600);
  }

  function renderThemePicker() {
    refs.themePicker.replaceChildren();
    themes.forEach((theme, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-card';
      button.dataset.theme = theme.id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(theme.id === state.theme));
      button.tabIndex = theme.id === state.theme ? 0 : -1;
      button.innerHTML = `
        <div class="theme-thumb" style="--thumb-bg:${theme.thumb}">
          <img src="${theme.art[0]}" alt="">
        </div>
        <span class="theme-name">${theme.name}</span>
      `;
      button.addEventListener('click', () => selectTheme(theme.id));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
        const next = (index + direction + themes.length) % themes.length;
        selectTheme(themes[next].id, true);
      });
      refs.themePicker.append(button);
    });
  }

  function selectTheme(themeId, focus = false) {
    state.theme = themeId;
    $$('.theme-card', refs.themePicker).forEach((button) => {
      const selected = button.dataset.theme === themeId;
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    render();
  }

  function fontSizeFor(layout) {
    const multipliers = { auto: 1, small: .82, medium: 1, large: 1.2 };
    return layout.font * (multipliers[refs.fontSize.value] || 1);
  }

  function applySheetVariables(sheet, layout, print) {
    const vars = sheet.style;
    const mainArtWidth = layout.cols >= 4 ? 28 : layout.cols === 3 ? 31 : 34;
    const frameX = 90 / 600 * 100;
    const frameY = 72 / 600 * (layout.width / layout.height) * 100;
    const mainArtRight = 1.5;
    const nameZoneStart = frameX;
    const nameZoneEnd = 100 - mainArtRight - mainArtWidth;
    vars.setProperty('--cols', layout.cols);
    vars.setProperty('--rows', layout.rows);
    vars.setProperty('--main-art-width', `${mainArtWidth}%`);
    vars.setProperty('--name-zone-width', `${nameZoneEnd - nameZoneStart}%`);
    vars.setProperty('--name-zone-left', `${(nameZoneStart + nameZoneEnd) / 2}%`);
    vars.setProperty('--frame-border-x', `${frameX}%`);
    vars.setProperty('--frame-border-y', `${frameY}%`);
    if (print) {
      vars.setProperty('--label-w', `${layout.width}mm`);
      vars.setProperty('--label-h', `${layout.height}mm`);
      vars.setProperty('--page-pad-x', `${layout.marginX}mm`);
      vars.setProperty('--page-pad-top', `${layout.marginTop}mm`);
      vars.setProperty('--gap-x', `${layout.gapX}mm`);
      vars.setProperty('--gap-y', `${layout.gapY}mm`);
      vars.setProperty('--print-name-size', `${fontSizeFor(layout)}mm`);
    } else {
      vars.setProperty('--screen-pad-x', `${layout.marginX / 210 * 100}%`);
      vars.setProperty('--screen-pad-top', `${layout.marginTop / 210 * 100}%`);
      vars.setProperty('--screen-gap-x', `${layout.gapX / 210 * 100}%`);
      vars.setProperty('--screen-gap-y', `${layout.gapY / 210 * 100}%`);
      vars.setProperty('--screen-name-size', `${fontSizeFor(layout) / 210 * 100}cqi`);
    }
  }

  function makeLabel(name, theme, variationIndex = 0, decoratedBlank = false) {
    const label = document.createElement('article');
    label.className = 'label-slot';
    label.dataset.labelTheme = theme.id;
    if (!name && !decoratedBlank) {
      label.classList.add('blank');
      label.setAttribute('aria-hidden', 'true');
      return label;
    }

    label.setAttribute('aria-label', name ? `Label for ${name}` : 'Blank decorated label');

    const frame = document.createElement('div');
    frame.className = 'label-frame';
    frame.style.setProperty('--frame-image', `url("${theme.frames[variationIndex % theme.frames.length]}")`);
    frame.setAttribute('aria-hidden', 'true');

    const mainImage = document.createElement('img');
    mainImage.className = 'label-main-art';
    mainImage.src = theme.art[variationIndex % theme.art.length];
    mainImage.alt = '';
    mainImage.setAttribute('aria-hidden', 'true');

    label.append(frame, mainImage);

    if (name) {
      const nameElement = document.createElement('span');
      nameElement.className = 'label-name';
      const words = name.trim().split(/\s+/).filter(Boolean);
      const compactLength = name.replace(/\s/g, '').length;
      const longestWord = Math.max(1, ...words.map((word) => word.length));
      const scale = words.length <= 1
        ? Math.min(1, 7.2 / longestWord)
        : Math.min(1, 8.5 / longestWord, 18 / compactLength);
      const safeScale = Math.max(.38, scale);
      nameElement.style.setProperty('--name-scale', safeScale.toFixed(3));
      nameElement.classList.add(words.length <= 1 ? 'single-name' : 'multi-name');

      const nameText = document.createElement('span');
      nameText.className = 'label-name-text';
      nameText.textContent = name.replace(/-/g, '\u2011');
      nameElement.append(nameText);
      label.append(nameElement);
    }
    return label;
  }

  function makeSheet(pageIndex, layout, startOffset, theme, print) {
    const capacity = layout.cols * layout.rows;
    const sheet = document.createElement('section');
    sheet.className = print ? 'print-sheet' : 'screen-sheet';
    sheet.setAttribute('aria-label', `Label sheet ${pageIndex + 1}`);
    applySheetVariables(sheet, layout, print);

    for (let position = 0; position < capacity; position += 1) {
      const globalPosition = pageIndex * capacity + position;
      const nameIndex = globalPosition - startOffset;
      const totalLabels = state.names.length + state.blankCount;
      const hasName = nameIndex >= 0 && nameIndex < state.names.length;
      const isExtraBlank = nameIndex >= state.names.length && nameIndex < totalLabels;
      sheet.append(makeLabel(hasName ? state.names[nameIndex] : '', theme, Math.max(0, nameIndex), isExtraBlank));
    }
    return sheet;
  }

  function render() {
    const entries = rawRosterEntries(refs.namesInput.value);
    state.names = formatEntries(entries);
    const requestedBlanks = Number.parseInt(refs.extraBlankLabels.value, 10) || 0;
    state.blankCount = Math.min(50, Math.max(0, requestedBlanks));
    if (String(state.blankCount) !== refs.extraBlankLabels.value) refs.extraBlankLabels.value = state.blankCount;
    refs.studentCount.textContent = state.names.length;

    const layout = layouts[refs.sheetLayout.value] || layouts.standard24;
    const capacity = layout.cols * layout.rows;
    refs.startPosition.max = capacity;
    const requestedStart = Number.parseInt(refs.startPosition.value, 10) || 1;
    const startPosition = Math.min(capacity, Math.max(1, requestedStart));
    if (String(startPosition) !== refs.startPosition.value) refs.startPosition.value = startPosition;
    const startOffset = startPosition - 1;
    const totalLabels = state.names.length + state.blankCount;
    const pageCount = totalLabels ? Math.ceil((startOffset + totalLabels) / capacity) : 0;
    const theme = themes.find((item) => item.id === state.theme) || themes[0];

    refs.emptyState.hidden = totalLabels > 0;
    refs.printPages.replaceChildren();
    refs.printOutput.replaceChildren();
    refs.printOutput.setAttribute('aria-hidden', 'true');

    if (!totalLabels) {
      refs.pageSummary.textContent = 'Add names or blank labels to begin';
      return;
    }

    const labelSummary = state.blankCount
      ? `${state.names.length} named + ${state.blankCount} blank`
      : `${state.names.length} label${state.names.length === 1 ? '' : 's'}`;
    refs.pageSummary.textContent = `${layout.label} · ${labelSummary} · ${pageCount} page${pageCount === 1 ? '' : 's'}`;
    for (let page = 0; page < pageCount; page += 1) {
      refs.printPages.append(makeSheet(page, layout, startOffset, theme, false));
      refs.printOutput.append(makeSheet(page, layout, startOffset, theme, true));
    }
  }

  function scheduleRender() {
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(render, 90);
  }

  function cleanNames() {
    const entries = rawRosterEntries(refs.namesInput.value);
    const cleaned = formatEntries(entries);
    refs.namesInput.value = cleaned.join('\n');
    render();
    toast(`Cleaned ${cleaned.length} student name${cleaned.length === 1 ? '' : 's'}.`);
  }

  function sortNames() {
    const names = formatEntries(rawRosterEntries(refs.namesInput.value)).sort((a, b) => a.localeCompare(b));
    refs.namesInput.value = names.join('\n');
    render();
    toast('Names sorted A–Z.');
  }

  function clearNames() {
    refs.namesInput.value = '';
    refs.namesInput.focus();
    render();
  }

  function applyColourMode(mode) {
    const dark = mode === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    refs.themeModeBtn.textContent = dark ? '☀️' : '🌙';
    refs.themeModeBtn.title = dark ? 'Turn on light mode' : 'Turn on dark mode';
    refs.themeModeBtn.setAttribute('aria-label', refs.themeModeBtn.title);
    localStorage.setItem('teacherToolsTheme', dark ? 'dark' : 'light');
  }

  refs.namesInput.addEventListener('input', scheduleRender);
  refs.nameFormat.addEventListener('change', render);
  refs.sheetLayout.addEventListener('change', render);
  refs.startPosition.addEventListener('input', scheduleRender);
  refs.fontSize.addEventListener('change', render);
  refs.extraBlankLabels.addEventListener('input', scheduleRender);
  refs.cleanBtn.addEventListener('click', cleanNames);
  refs.sortBtn.addEventListener('click', sortNames);
  refs.clearBtn.addEventListener('click', clearNames);
  refs.printBtn.addEventListener('click', async () => {
    render();
    if (!state.names.length && !state.blankCount) {
      toast('Add student names or choose some blank labels first.');
      return;
    }
    refs.printOutput.setAttribute('aria-hidden', 'false');
    if (document.fonts?.ready) await document.fonts.ready;
    window.print();
  });
  refs.themeModeBtn.addEventListener('click', () => {
    applyColourMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  window.addEventListener('afterprint', () => refs.printOutput.setAttribute('aria-hidden', 'true'));

  applyColourMode(localStorage.getItem('teacherToolsTheme') === 'dark' ? 'dark' : 'light');
  renderThemePicker();
  render();
})();

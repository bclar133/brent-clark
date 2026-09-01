(() => {
  'use strict';

  if (document.documentElement.dataset.seatingCleanup === '1') return;
  document.documentElement.dataset.seatingCleanup = '1';

  const $ = (selector, root = document) => root.querySelector(selector);
  const planPanel = $('#planPanel');
  const classPanel = $('.class-panel');
  const toolbars = planPanel?.querySelector('.toolbars');
  const arrangeGroup = toolbars?.querySelector('.arrange-group');
  const gridGroup = toolbars?.querySelector('.grid-size-group');
  const colourGroup = toolbars?.querySelector('.colour-group');
  const roomTools = planPanel?.querySelector('.room-tools');
  const savedRoomBox = planPanel?.querySelector('.saved-room-box');
  const savedClassBox = classPanel?.querySelector('.saved-class-box');
  const selectionBar = $('#selectionBar');
  const fixtureSelectionBar = $('#fixtureSelectionBar');
  const teacherSizeControls = $('#teacherSizeControls');
  const windowSizeControls = $('#windowSizeControls');
  const closeSelectionBtn = $('#closeSelectionBtn');
  const closeFixtureSelectionBtn = $('#closeFixtureSelectionBtn');
  const planInstructions = planPanel?.querySelector('.plan-instructions');
  const resetRoomBtn = $('#resetRoomBtn');
  const presentationBtn = $('#presentationBtn');
  const compactActions = classPanel?.querySelector('.compact-actions');

  if (!planPanel || !classPanel || !toolbars || !arrangeGroup || !gridGroup || !colourGroup) return;

  function makeDialog(title) {
    const dialog = document.createElement('dialog');
    dialog.className = 'ui-cleanup-dialog';
    dialog.innerHTML = `
      <div class="ui-cleanup-dialog-head">
        <h3>${title}</h3>
        <button class="ui-cleanup-dialog-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="ui-cleanup-dialog-body"></div>`;
    document.body.append(dialog);
    const closeBtn = dialog.querySelector('.ui-cleanup-dialog-close');
    closeBtn.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function openDialog(dialog) {
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  // --- One compact everyday toolbar ---
  const quickbar = document.createElement('div');
  quickbar.className = 'ui-cleanup-quickbar';
  quickbar.innerHTML = '<span class="quick-label">Arrange seating</span>';

  const arrangementSelect = $('#arrangementSelect');
  const groupSizeWrap = $('#groupSizeWrap');
  const arrangeBtn = $('#arrangeBtn');

  [arrangementSelect, groupSizeWrap, arrangeBtn].forEach(node => node && quickbar.append(node));

  const roomSetupBtn = document.createElement('button');
  roomSetupBtn.type = 'button';
  roomSetupBtn.className = 'quick-secondary';
  roomSetupBtn.textContent = '🏫 Room setup';

  const settingsBtn = document.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.className = 'quick-secondary';
  settingsBtn.textContent = '⚙ Settings';

  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.className = 'quick-secondary';
  helpBtn.textContent = '? Help';

  quickbar.append(roomSetupBtn, settingsBtn, helpBtn);
  if (presentationBtn) quickbar.append(presentationBtn);
  toolbars.before(quickbar);

  // --- Settings dialog ---
  const settingsDialog = makeDialog('Seating plan settings');
  const settingsBody = settingsDialog.querySelector('.ui-cleanup-dialog-body');
  settingsBody.append(gridGroup, colourGroup);
  settingsBtn.addEventListener('click', () => openDialog(settingsDialog));

  // --- Room setup dialog ---
  const roomDialog = makeDialog('Room setup');
  const roomBody = roomDialog.querySelector('.ui-cleanup-dialog-body');
  if (roomTools) roomBody.append(roomTools);
  if (savedRoomBox) roomBody.append(savedRoomBox);
  if (resetRoomBtn) {
    const footer = document.createElement('div');
    footer.className = 'dialog-footer-actions';
    footer.append(resetRoomBtn);
    roomBody.append(footer);
  }
  roomSetupBtn.addEventListener('click', () => openDialog(roomDialog));

  // --- Saved classes dialog ---
  if (savedClassBox && compactActions) {
    const classDialog = makeDialog('Saved classes');
    classDialog.querySelector('.ui-cleanup-dialog-body').append(savedClassBox);

    const classLibraryBtn = document.createElement('button');
    classLibraryBtn.type = 'button';
    classLibraryBtn.className = 'class-library-launch';
    classLibraryBtn.textContent = '💾 Saved classes';
    compactActions.insertAdjacentElement('afterend', classLibraryBtn);
    classLibraryBtn.addEventListener('click', () => openDialog(classDialog));
  }

  // --- Help dialog ---
  const helpDialog = makeDialog('How to use the seating plan');
  const helpBody = helpDialog.querySelector('.ui-cleanup-dialog-body');
  const helpList = document.createElement('div');
  helpList.className = 'ui-cleanup-help';
  if (planInstructions) {
    [...planInstructions.children].forEach(item => {
      const row = document.createElement('div');
      row.textContent = item.textContent;
      helpList.append(row);
    });
  }
  helpBody.append(helpList);
  helpBtn.addEventListener('click', () => openDialog(helpDialog));

  // --- Contextual student / fixture popovers ---
  selectionBar?.classList.add('ui-context-popover');
  fixtureSelectionBar?.classList.add('ui-context-popover');

  // The base page ships these controls in the DOM before anything is selected.
  // Force a clean initial state; the core app will unhide the right popover when
  // a real student/fixture is selected.
  if (selectionBar) selectionBar.hidden = true;
  if (fixtureSelectionBar) fixtureSelectionBar.hidden = true;
  if (teacherSizeControls) teacherSizeControls.hidden = true;
  if (windowSizeControls) windowSizeControls.hidden = true;

  let positionQueued = false;

  function placePopover(popover, target) {
    if (!popover || !target || popover.hidden) return;

    const margin = 10;
    const targetRect = target.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();

    let left = targetRect.right + margin;
    let top = targetRect.top;

    if (left + popRect.width > window.innerWidth - 8) {
      left = targetRect.left - popRect.width - margin;
    }
    if (left < 8) left = Math.max(8, (window.innerWidth - popRect.width) / 2);

    if (top + popRect.height > window.innerHeight - 8) {
      top = window.innerHeight - popRect.height - 8;
    }
    top = Math.max(8, top);

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function positionContextPopovers() {
    positionQueued = false;
    if (window.innerWidth <= 650) return;

    if (selectionBar && !selectionBar.hidden) {
      const target = document.querySelector('.student-card.selected');
      if (target) placePopover(selectionBar, target);
      else selectionBar.hidden = true;
    }

    if (fixtureSelectionBar && !fixtureSelectionBar.hidden) {
      const target = document.querySelector('.fixture-card.selected');
      if (target) placePopover(fixtureSelectionBar, target);
      else fixtureSelectionBar.hidden = true;
    }
  }

  function schedulePopoverPosition() {
    if (positionQueued) return;
    positionQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(positionContextPopovers));
  }

  function closeOpenPopover() {
    if (selectionBar && !selectionBar.hidden) {
      if (closeSelectionBtn) closeSelectionBtn.click();
      else selectionBar.hidden = true;
      return true;
    }
    if (fixtureSelectionBar && !fixtureSelectionBar.hidden) {
      if (closeFixtureSelectionBtn) closeFixtureSelectionBtn.click();
      else fixtureSelectionBar.hidden = true;
      return true;
    }
    return false;
  }

  const observer = new MutationObserver(schedulePopoverPosition);
  observer.observe(planPanel, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['hidden', 'class']
  });

  window.addEventListener('resize', schedulePopoverPosition);
  window.addEventListener('scroll', schedulePopoverPosition, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeOpenPopover();
  });

  // Clicking away from the contextual card dismisses it. Clicks on a student,
  // fixture or inside the popover itself are left to the core seating-plan logic.
  document.addEventListener('click', event => {
    const insidePopover = event.target.closest?.('.ui-context-popover');
    const selectingItem = event.target.closest?.('.student-card, .fixture-card');
    const setupDialog = event.target.closest?.('.ui-cleanup-dialog');
    if (!insidePopover && !selectingItem && !setupDialog) closeOpenPopover();
    schedulePopoverPosition();
  });

  schedulePopoverPosition();
})();
(() => {
  'use strict';

  if (window.__mobileLandscapeUpgradeV6) return;
  window.__mobileLandscapeUpgradeV6 = true;

  const style = document.createElement('style');
  style.id = 'mobileLandscapeUpgradeStyleV6';
  style.textContent = `
    .mobile-fullscreen-entry,
    .mobile-orientation-prompt { display:none; }

    @media (max-width:900px) and (pointer:coarse) {
      #countdownWorkspace .keyboard-tip { display:none!important; }

      .mobile-fullscreen-entry {
        display:grid;
        justify-items:center;
        gap:4px;
        margin:7px auto 2px;
        width:min(100%,360px);
      }
      .mobile-fullscreen-button {
        width:100%; min-height:42px; padding:0 16px; border:0; border-radius:13px;
        color:#fff; background:linear-gradient(135deg,var(--violet),#4f42c8);
        box-shadow:0 8px 22px rgba(89,74,207,.24);
        font-family:var(--display,'Fredoka',sans-serif); font-size:.88rem; font-weight:800;
      }
      .mobile-fullscreen-note {
        margin:0; color:var(--muted); font-size:.61rem; font-weight:800; text-align:center;
      }
      body.presentation-mode .mobile-fullscreen-entry { display:none!important; }

      .mobile-orientation-prompt {
        position:fixed; z-index:10050; left:50%; bottom:74px; transform:translateX(-50%);
        max-width:calc(100vw - 32px); padding:8px 12px;
        border:1px solid rgba(255,255,255,.28); border-radius:999px;
        background:rgba(9,21,35,.86); color:#fff; box-shadow:0 9px 28px rgba(0,0,0,.28);
        backdrop-filter:blur(9px); font-size:.69rem; font-weight:900; white-space:nowrap;
        pointer-events:none;
      }
      body.presentation-mode.mobile-orientation-needed .mobile-orientation-prompt { display:block; }

      /* Phone Stopwatch: keep the physical watch compact and reserve clear space for controls. */
      body:not(.presentation-mode) #stopwatchWorkspace .solo-panel {
        padding:8px!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .mode-toolbar {
        margin-bottom:4px!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .mode-toolbar p {
        margin-top:2px!important;
        font-size:.72rem!important;
        line-height:1.2!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace #stopwatchStage {
        min-height:0!important;
        padding:4px 6px 7px!important;
        gap:3px!important;
        grid-template-columns:1fr!important;
        grid-template-rows:205px auto auto auto!important;
        overflow:visible!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-scene {
        min-height:205px!important;
        height:205px!important;
        padding:0!important;
        overflow:visible!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-body {
        top:-26px!important;
        transform:scale(.40)!important;
        transform-origin:50% 50%!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-actions {
        width:100%!important;
        display:flex!important;
        flex-direction:row!important;
        flex-wrap:nowrap!important;
        gap:4px!important;
        justify-content:stretch!important;
        padding-top:0!important;
        margin:0!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-actions .control-button {
        flex:1 1 0!important;
        width:auto!important;
        min-width:0!important;
        min-height:39px!important;
        padding:0 5px!important;
        font-size:.76rem!important;
        white-space:nowrap!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .laps-list {
        width:100%!important;
        max-height:46px!important;
        margin:0!important;
        padding:1px 0 0!important;
        font-size:.66rem!important;
        line-height:1.15!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .laps-list li {
        padding:3px 5px!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-entry {
        width:100%!important;
        margin:3px auto 0!important;
        gap:2px!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-button {
        min-height:38px!important;
        font-size:.78rem!important;
      }
      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-note {
        font-size:.58rem!important;
      }

      /* Real controls stay available over the scene in mobile presentation mode. */
      body.presentation-mode #countdownWorkspace .timer-controls,
      body.presentation-mode #stopwatchWorkspace .stopwatch-actions,
      body.presentation-mode #intervalWorkspace .timer-controls,
      body.presentation-mode #focusWorkspace .timer-controls,
      body.presentation-mode #scheduleWorkspace .timer-controls {
        display:flex!important; position:fixed!important; z-index:99990!important;
        left:50%!important; right:auto!important; bottom:max(8px,env(safe-area-inset-bottom))!important;
        transform:translateX(-50%)!important; width:auto!important; max-width:calc(100vw - 20px)!important;
        margin:0!important; padding:6px!important; gap:6px!important; justify-content:center!important;
        flex-wrap:nowrap!important; border:1px solid rgba(255,255,255,.22)!important;
        border-radius:15px!important; background:rgba(10,22,36,.72)!important;
        box-shadow:0 8px 28px rgba(0,0,0,.28)!important; backdrop-filter:blur(10px)!important;
      }
      body.presentation-mode #countdownWorkspace .timer-controls .control-button,
      body.presentation-mode #stopwatchWorkspace .stopwatch-actions .control-button,
      body.presentation-mode #intervalWorkspace .timer-controls .control-button,
      body.presentation-mode #focusWorkspace .timer-controls .control-button,
      body.presentation-mode #scheduleWorkspace .timer-controls .control-button {
        flex:0 1 auto!important; min-width:0!important; min-height:42px!important;
        padding:0 11px!important; border-radius:10px!important; font-size:.78rem!important;
        white-space:nowrap!important;
      }
      body.presentation-mode #countdownWorkspace .timer-controls .primary,
      body.presentation-mode #stopwatchWorkspace .stopwatch-actions .primary,
      body.presentation-mode #intervalWorkspace .timer-controls .primary,
      body.presentation-mode #focusWorkspace .timer-controls .primary,
      body.presentation-mode #scheduleWorkspace .timer-controls .primary { min-width:82px!important; }

      body.presentation-mode #intervalWorkspace .builder-stage,
      body.presentation-mode #scheduleWorkspace .builder-stage,
      body.presentation-mode #focusWorkspace .focus-panel { padding-bottom:76px!important; }

      /* Stopwatch is the portrait exception. Leave room for controls and lap readout. */
      body.presentation-mode #stopwatchWorkspace .stopwatch-scene { padding-bottom:168px!important; }
      body.presentation-mode #stopwatchWorkspace .stopwatch-body {
        top:-28px!important;
        transform:scale(.54)!important;
        transform-origin:50% 50%!important;
      }

      /* The desktop presentation stylesheet hides laps completely. Restore them on phones. */
      body.presentation-mode #stopwatchWorkspace .laps-list {
        display:block!important;
        position:fixed!important;
        z-index:99989!important;
        left:50%!important;
        bottom:68px!important;
        transform:translateX(-50%)!important;
        width:min(340px,calc(100vw - 28px))!important;
        max-height:104px!important;
        overflow:auto!important;
        margin:0!important;
        padding:7px 10px!important;
        list-style-position:inside!important;
        border:1px solid rgba(255,255,255,.2)!important;
        border-radius:12px!important;
        background:rgba(10,22,36,.68)!important;
        color:#fff!important;
        box-shadow:0 7px 24px rgba(0,0,0,.24)!important;
        backdrop-filter:blur(9px)!important;
        font-size:.76rem!important;
        font-weight:800!important;
      }
      body.presentation-mode #stopwatchWorkspace .laps-list li {
        padding:4px 5px!important;
        border-bottom:1px solid rgba(255,255,255,.13)!important;
        color:#fff!important;
      }
      body.presentation-mode #stopwatchWorkspace .laps-list li:last-child { border-bottom:0!important; }
      body.presentation-mode #stopwatchWorkspace .laps-list .empty-state {
        color:rgba(255,255,255,.66)!important;
        text-align:center!important;
      }
    }

    @media (max-width:900px) and (pointer:coarse) and (orientation:landscape) {
      body.presentation-mode #countdownWorkspace .timer-controls,
      body.presentation-mode #intervalWorkspace .timer-controls,
      body.presentation-mode #focusWorkspace .timer-controls,
      body.presentation-mode #scheduleWorkspace .timer-controls {
        bottom:max(5px,env(safe-area-inset-bottom))!important; padding:4px!important;
      }
      body.presentation-mode #countdownWorkspace .timer-controls .control-button,
      body.presentation-mode #intervalWorkspace .timer-controls .control-button,
      body.presentation-mode #focusWorkspace .timer-controls .control-button,
      body.presentation-mode #scheduleWorkspace .timer-controls .control-button {
        min-height:38px!important; padding:0 10px!important; font-size:.74rem!important;
      }
    }
  `;
  document.head.appendChild(style);

  const phoneQuery = window.matchMedia('(max-width:900px) and (pointer:coarse)');
  const portraitQuery = window.matchMedia('(orientation:portrait)');
  const landscapeQuery = window.matchMedia('(orientation:landscape)');
  const isPhoneLike = () => phoneQuery.matches;

  function activeWorkspaceName() {
    return document.querySelector('.workspace-panel.active')?.dataset.panel || 'countdown';
  }
  function preferredOrientation() {
    return activeWorkspaceName() === 'stopwatch' ? 'portrait' : 'landscape';
  }

  function makeFullscreenEntry(workspace, anchor) {
    if (!workspace || !anchor || workspace.querySelector('.mobile-fullscreen-entry')) return;
    const stopwatchEntry = workspace.id === 'stopwatchWorkspace';
    const entry = document.createElement('div');
    entry.className = 'mobile-fullscreen-entry';
    entry.innerHTML = `
      <button class="mobile-fullscreen-button" type="button">⛶ Full screen</button>
      <p class="mobile-fullscreen-note">📱 Full screen looks best in ${stopwatchEntry ? 'portrait' : 'landscape'} on phones.</p>
    `;
    anchor.insertAdjacentElement('afterend', entry);
    entry.querySelector('.mobile-fullscreen-button')?.addEventListener('click', () => {
      document.getElementById('fullscreenBtn')?.click();
    });
  }

  const countdown = document.getElementById('countdownWorkspace');
  makeFullscreenEntry(countdown, countdown?.querySelector('.keyboard-tip'));
  const stopwatch = document.getElementById('stopwatchWorkspace');
  makeFullscreenEntry(stopwatch, stopwatch?.querySelector('.laps-list'));
  const clock = document.getElementById('clockWorkspace');
  makeFullscreenEntry(clock, clock?.querySelector('#clockStage'));
  const interval = document.getElementById('intervalWorkspace');
  makeFullscreenEntry(interval, interval?.querySelector('.builder-stage .timer-controls'));
  const focus = document.getElementById('focusWorkspace');
  makeFullscreenEntry(focus, focus?.querySelector('.timer-controls'));
  const schedule = document.getElementById('scheduleWorkspace');
  makeFullscreenEntry(schedule, schedule?.querySelector('.builder-stage .timer-controls'));

  if (!document.getElementById('mobileOrientationPrompt')) {
    const prompt = document.createElement('div');
    prompt.id = 'mobileOrientationPrompt';
    prompt.className = 'mobile-orientation-prompt';
    prompt.setAttribute('role', 'status');
    document.body.appendChild(prompt);
  }

  function wrongOrientation(orientation) {
    return orientation === 'portrait' ? landscapeQuery.matches : portraitQuery.matches;
  }
  function setFallbackPrompt(show, orientation = preferredOrientation()) {
    const prompt = document.getElementById('mobileOrientationPrompt');
    if (prompt) prompt.textContent = orientation === 'portrait'
      ? '↻ Rotate your phone to portrait for the Stopwatch'
      : '↻ Rotate your phone to landscape for the best full-screen view';
    document.body.classList.toggle('mobile-orientation-needed', Boolean(show && isPhoneLike() && wrongOrientation(orientation)));
  }

  async function lockPreferredOrientation() {
    if (!isPhoneLike() || !document.body.classList.contains('presentation-mode')) return;
    const orientation = preferredOrientation();
    let locked = false;
    try {
      if (screen.orientation?.lock) { await screen.orientation.lock(orientation); locked = true; }
      else if (screen.lockOrientation) locked = Boolean(screen.lockOrientation(orientation));
      else if (screen.mozLockOrientation) locked = Boolean(screen.mozLockOrientation(orientation));
      else if (screen.msLockOrientation) locked = Boolean(screen.msLockOrientation(orientation));
    } catch {}
    setFallbackPrompt(!locked, orientation);
  }

  function unlockOrientation() {
    document.body.classList.remove('mobile-orientation-needed');
    try { screen.orientation?.unlock?.(); } catch {}
    try { screen.unlockOrientation?.(); } catch {}
    try { screen.mozUnlockOrientation?.(); } catch {}
    try { screen.msUnlockOrientation?.(); } catch {}
  }

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement && document.body.classList.contains('presentation-mode')) setTimeout(lockPreferredOrientation, 60);
    else if (!document.body.classList.contains('presentation-mode')) unlockOrientation();
  });
  document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!isPhoneLike()) return;
    setTimeout(() => {
      if (document.body.classList.contains('presentation-mode')) lockPreferredOrientation();
      else unlockOrientation();
    }, 180);
  });
  document.getElementById('presentationExitBtn')?.addEventListener('click', () => setTimeout(unlockOrientation, 0));

  const orientationChanged = () => {
    if (!document.body.classList.contains('presentation-mode')) return;
    const orientation = preferredOrientation();
    if (!wrongOrientation(orientation)) setFallbackPrompt(false, orientation);
    else if (isPhoneLike()) setTimeout(lockPreferredOrientation, 80);
  };
  portraitQuery.addEventListener?.('change', orientationChanged);
  landscapeQuery.addEventListener?.('change', orientationChanged);
  window.addEventListener('orientationchange', orientationChanged);
})();
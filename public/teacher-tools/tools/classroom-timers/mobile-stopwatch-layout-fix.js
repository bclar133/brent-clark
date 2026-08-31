(() => {
  'use strict';

  if (window.__mobileStopwatchLayoutFixV3) return;
  window.__mobileStopwatchLayoutFixV3 = true;

  const style = document.createElement('style');
  style.id = 'mobileStopwatchLayoutFixV3';
  style.textContent = `
    @media (max-width:600px) {
      /* Normal phone view: the watch is positioned independently from the controls.
         Scaling a 370x450 element alone does not shrink its layout box, so make the
         scene a real compact box and absolutely position the physical watch inside it. */
      body:not(.presentation-mode) #stopwatchWorkspace .solo-panel {
        padding:8px!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .mode-toolbar {
        margin-bottom:4px!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace #stopwatchStage {
        display:flex!important;
        flex-direction:column!important;
        align-items:stretch!important;
        min-height:0!important;
        height:auto!important;
        padding:5px 6px 7px!important;
        gap:4px!important;
        overflow:hidden!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-scene {
        position:relative!important;
        display:block!important;
        flex:0 0 170px!important;
        width:100%!important;
        min-height:170px!important;
        height:170px!important;
        padding:0!important;
        margin:0!important;
        overflow:hidden!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-body {
        position:absolute!important;
        left:50%!important;
        right:auto!important;
        top:25px!important;
        margin:0!important;
        transform:translateX(-50%) scale(.31)!important;
        transform-origin:50% 0!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-actions {
        order:2!important;
        display:flex!important;
        flex-direction:row!important;
        flex-wrap:nowrap!important;
        width:100%!important;
        margin:0!important;
        padding:0!important;
        gap:5px!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .stopwatch-actions .control-button {
        flex:1 1 0!important;
        width:0!important;
        min-width:0!important;
        min-height:40px!important;
        padding:0 5px!important;
        font-size:.74rem!important;
        white-space:nowrap!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .laps-list {
        order:3!important;
        width:100%!important;
        max-height:44px!important;
        min-height:18px!important;
        margin:0!important;
        padding:2px 0 0!important;
        overflow:auto!important;
        font-size:.65rem!important;
        line-height:1.15!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .laps-list li {
        padding:2px 5px!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-entry {
        order:4!important;
        width:100%!important;
        margin:2px 0 0!important;
        gap:2px!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-button {
        min-height:38px!important;
        font-size:.78rem!important;
      }

      body:not(.presentation-mode) #stopwatchWorkspace .mobile-fullscreen-note {
        font-size:.57rem!important;
        line-height:1.15!important;
      }

      /* Portrait fullscreen Stopwatch. Chrome for Android shows its own temporary
         fullscreen safety banner at the bottom of the screen. Web pages cannot hide
         that browser UI, so keep the working controls safely above that area. */
      body.presentation-mode #stopwatchWorkspace .stopwatch-body {
        transform:scale(.47)!important;
        top:-34px!important;
      }

      body.presentation-mode #stopwatchWorkspace .stopwatch-scene {
        padding-bottom:190px!important;
      }

      body.presentation-mode #stopwatchWorkspace .stopwatch-actions {
        display:flex!important;
        position:fixed!important;
        z-index:100020!important;
        left:8px!important;
        right:8px!important;
        bottom:max(70px,calc(60px + env(safe-area-inset-bottom)))!important;
        transform:none!important;
        width:auto!important;
        max-width:none!important;
        margin:0!important;
        padding:7px!important;
        gap:7px!important;
        justify-content:stretch!important;
        flex-wrap:nowrap!important;
        border:1px solid rgba(255,255,255,.24)!important;
        border-radius:16px!important;
        background:rgba(10,22,36,.78)!important;
        box-shadow:0 9px 30px rgba(0,0,0,.3)!important;
        backdrop-filter:blur(11px)!important;
      }

      body.presentation-mode #stopwatchWorkspace .stopwatch-actions .control-button {
        flex:1 1 0!important;
        width:0!important;
        min-width:0!important;
        min-height:56px!important;
        padding:0 8px!important;
        border-radius:12px!important;
        font-size:.94rem!important;
        font-weight:900!important;
        white-space:nowrap!important;
      }

      /* Don't waste fullscreen space on the placeholder. Once a real lap exists,
         the list appears above the full-width controls. */
      body.presentation-mode #stopwatchWorkspace .laps-list:has(.empty-state) {
        display:none!important;
      }

      body.presentation-mode #stopwatchWorkspace .laps-list:not(:has(.empty-state)) {
        display:block!important;
        position:fixed!important;
        z-index:100019!important;
        left:8px!important;
        right:8px!important;
        bottom:max(142px,calc(132px + env(safe-area-inset-bottom)))!important;
        transform:none!important;
        width:auto!important;
        max-width:none!important;
        max-height:86px!important;
        overflow:auto!important;
        margin:0!important;
        padding:7px 10px!important;
        border:1px solid rgba(255,255,255,.2)!important;
        border-radius:12px!important;
        background:rgba(10,22,36,.72)!important;
        color:#fff!important;
        box-shadow:0 7px 24px rgba(0,0,0,.24)!important;
        backdrop-filter:blur(9px)!important;
        font-size:.78rem!important;
        font-weight:800!important;
      }

      body.presentation-mode #stopwatchWorkspace .laps-list li {
        color:#fff!important;
      }
    }

    /* Android Chrome's fullscreen safety banner also covers the bottom controls on
       Countdown, Interval, Focus and Schedule. Keep every live control bar above that
       browser-owned area and make the buttons span the available screen width. */
    @media (max-width:900px) and (pointer:coarse) {
      body.presentation-mode #countdownWorkspace .timer-controls,
      body.presentation-mode #intervalWorkspace .timer-controls,
      body.presentation-mode #focusWorkspace .timer-controls,
      body.presentation-mode #scheduleWorkspace .timer-controls {
        display:flex!important;
        position:fixed!important;
        z-index:100020!important;
        left:8px!important;
        right:8px!important;
        bottom:max(76px,calc(66px + env(safe-area-inset-bottom)))!important;
        transform:none!important;
        width:auto!important;
        max-width:none!important;
        margin:0!important;
        padding:7px!important;
        gap:7px!important;
        justify-content:stretch!important;
        align-items:stretch!important;
        flex-wrap:nowrap!important;
        border:1px solid rgba(255,255,255,.24)!important;
        border-radius:16px!important;
        background:rgba(10,22,36,.78)!important;
        box-shadow:0 9px 30px rgba(0,0,0,.3)!important;
        backdrop-filter:blur(11px)!important;
      }

      body.presentation-mode #countdownWorkspace .timer-controls .control-button,
      body.presentation-mode #intervalWorkspace .timer-controls .control-button,
      body.presentation-mode #focusWorkspace .timer-controls .control-button,
      body.presentation-mode #scheduleWorkspace .timer-controls .control-button {
        flex:1 1 0!important;
        width:0!important;
        min-width:0!important;
        min-height:56px!important;
        padding:0 7px!important;
        border-radius:12px!important;
        font-size:clamp(.76rem,2.7vw,.94rem)!important;
        font-weight:900!important;
        white-space:nowrap!important;
      }

      /* Reserve visual breathing room behind the raised controls. */
      body.presentation-mode #countdownWorkspace .timer-stage,
      body.presentation-mode #intervalWorkspace .builder-stage,
      body.presentation-mode #focusWorkspace .focus-panel,
      body.presentation-mode #scheduleWorkspace .builder-stage {
        padding-bottom:150px!important;
      }
    }
  `;

  document.head.appendChild(style);
})();

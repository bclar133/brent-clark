(() => {
  'use strict';

  if (window.__presentationFullscreenUpgradeV2) return;
  window.__presentationFullscreenUpgradeV2 = true;

  const style = document.createElement('style');
  style.id = 'presentationFullscreenUpgradeStyleV2';
  style.textContent = `
    /* The old Scenic view has an opaque gradient background-image. Remove it globally so
       the DVD scene's changing --dvd-bg colour is actually visible. */
    #scenicClock.dvd-scene{
      background-image:none!important;
      background-color:var(--dvd-bg,#f3c6d8)!important;
      transition:background-color 7s ease-in-out!important;
    }

    /* Presentation mode owns the whole viewport — no app-shell or panel gutters. */
    html:has(body.presentation-mode),
    html:fullscreen,
    body.presentation-mode{
      width:100%!important;
      height:100%!important;
      margin:0!important;
      padding:0!important;
      overflow:hidden!important;
      background:#111!important;
    }

    body.presentation-mode .app-shell{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100vh!important;
      max-width:none!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      background:transparent!important;
      overflow:hidden!important;
    }

    body.presentation-mode .topbar,
    body.presentation-mode .workspace-tabs{
      display:none!important;
    }

    body.presentation-mode .workspace-panel{
      display:none!important;
    }
    body.presentation-mode .workspace-panel.active{
      display:block!important;
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100vh!important;
      margin:0!important;
      padding:0!important;
      overflow:hidden!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
    }

    body.presentation-mode .workspace-panel.active > .panel,
    body.presentation-mode .workspace-panel.active .solo-panel,
    body.presentation-mode .workspace-panel.active .timer-panel,
    body.presentation-mode .workspace-panel.active .builder-stage{
      margin:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }

    /* Countdown scenes */
    body.presentation-mode #countdownWorkspace .timer-layout{
      display:block!important;
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      margin:0!important;
      padding:0!important;
    }
    body.presentation-mode #countdownWorkspace .controls-panel,
    body.presentation-mode #countdownWorkspace .stage-header,
    body.presentation-mode #countdownWorkspace .timer-controls,
    body.presentation-mode #countdownWorkspace .keyboard-tip{
      display:none!important;
    }
    body.presentation-mode #countdownWorkspace .timer-panel,
    body.presentation-mode #countdownWorkspace .stage-wrap,
    body.presentation-mode #countdownStage,
    body.presentation-mode #sceneLayer{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
      max-width:none!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:hidden!important;
    }

    /* Stopwatch */
    body.presentation-mode #stopwatchWorkspace .solo-panel{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      padding:0!important;
      background:transparent!important;
      overflow:hidden!important;
    }
    body.presentation-mode #stopwatchWorkspace .mode-toolbar,
    body.presentation-mode #stopwatchWorkspace .stopwatch-actions,
    body.presentation-mode #stopwatchWorkspace .laps-list{
      display:none!important;
    }
    body.presentation-mode #stopwatchStage,
    body.presentation-mode #stopwatchWorkspace .stopwatch-scene{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:hidden!important;
    }
    body.presentation-mode #stopwatchWorkspace .stopwatch-scene{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
    }

    /* Clock views, including DVD Bounce */
    body.presentation-mode #clockWorkspace .solo-panel{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      padding:0!important;
      background:transparent!important;
      overflow:hidden!important;
    }
    body.presentation-mode #clockWorkspace .mode-toolbar{
      display:none!important;
    }
    body.presentation-mode #clockStage{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:hidden!important;
    }
    body.presentation-mode #clockStage .clock-view:not([hidden]){
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
      margin:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    body.presentation-mode #scenicClock.dvd-scene{
      min-height:0!important;
      border-radius:0!important;
    }

    /* Interval and lesson schedule: hide setup and let the live stage fill the viewport. */
    body.presentation-mode #intervalWorkspace .builder-layout,
    body.presentation-mode #scheduleWorkspace .builder-layout{
      display:block!important;
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      margin:0!important;
      padding:0!important;
    }
    body.presentation-mode #intervalWorkspace .builder-controls,
    body.presentation-mode #scheduleWorkspace .builder-controls{
      display:none!important;
    }
    body.presentation-mode #intervalWorkspace .builder-stage,
    body.presentation-mode #scheduleWorkspace .builder-stage{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-height:0!important;
      padding:clamp(28px,5vw,84px)!important;
      border-radius:0!important;
      overflow:hidden!important;
    }

    /* Focus timer */
    body.presentation-mode #focusWorkspace .solo-panel{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      margin:0!important;
      padding:clamp(28px,5vw,84px)!important;
      border-radius:0!important;
      overflow:hidden!important;
    }
    body.presentation-mode #focusWorkspace .focus-presets{
      display:none!important;
    }

    /* Floating presentation controls stay available without reserving layout space. */
    body.presentation-mode .presentation-toolbar:not([hidden]){
      position:fixed!important;
      top:10px!important;
      right:10px!important;
      left:auto!important;
      z-index:99999!important;
      margin:0!important;
    }

    /* Browser fullscreen element itself must not introduce margins/background edges. */
    html:fullscreen body.presentation-mode,
    html:-webkit-full-screen body.presentation-mode{
      margin:0!important;
      padding:0!important;
      width:100vw!important;
      height:100vh!important;
      background:#111!important;
    }
  `;
  document.head.appendChild(style);
})();

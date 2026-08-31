(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'hourglassLayoutFixV8';
  style.textContent = `
    .hourglass-scene.hourglass-upgraded {
      display:block !important;
      position:absolute !important;
      inset:0 !important;
      width:100% !important;
      height:100% !important;
      min-height:100% !important;
      overflow:hidden !important;
      background:#17131f !important;
    }

    /* Show the original wizard image with no darkening, tinting or contrast filters. */
    .hourglass-scene.hourglass-upgraded .hourglass-bg-image,
    .hourglass-scene.hourglass-upgraded .hourglass-illustrated-bg {
      position:absolute !important;
      inset:0 !important;
      width:100% !important;
      height:100% !important;
      z-index:1 !important;
      background-image:var(--wizard-bg) !important;
      background-size:cover !important;
      background-repeat:no-repeat !important;
      background-position:68% center !important;
      filter:none !important;
      opacity:1 !important;
      transform:none !important;
      pointer-events:none !important;
    }

    /* Remove all darkening/atmospheric overlays from the wizard artwork. */
    .hourglass-scene.hourglass-upgraded .hourglass-bg-vignette,
    .hourglass-scene.hourglass-upgraded .hourglass-bg-haze,
    .hourglass-scene.hourglass-upgraded .hourglass-shadow-vignette,
    .hourglass-scene.hourglass-upgraded .hourglass-magic-haze {
      display:none !important;
      opacity:0 !important;
      background:none !important;
    }

    /* Fill most of the left-hand space, while leaving a clear gap before the hourglass. */
    #countdownStage.theme-hourglass .time-display-wrap {
      position:absolute !important;
      left:5% !important;
      top:50% !important;
      right:auto !important;
      bottom:auto !important;
      transform:translateY(-50%) !important;
      width:min(31%, 300px) !important;
      z-index:12 !important;
      justify-items:start !important;
      align-items:start !important;
      text-align:left !important;
      gap:.28rem !important;
    }

    #countdownStage.theme-hourglass #countdownDisplay,
    #countdownStage.theme-hourglass .time-display {
      font-size:clamp(3.2rem,5.3vw,5rem) !important;
      padding:6px 17px 7px !important;
      border-radius:15px !important;
      text-align:left !important;
      line-height:.98 !important;
    }

    #countdownStage.theme-hourglass #countdownMessage,
    #countdownStage.theme-hourglass .timer-message {
      margin-top:5px !important;
      padding:5px 11px !important;
      font-size:clamp(.82rem,1vw,.96rem) !important;
      text-align:left !important;
    }

    .hourglass-scene.hourglass-upgraded .hourglass {
      position:absolute !important;
      z-index:6 !important;
      left:51% !important;
      top:56% !important;
      margin:0 !important;
      transform:translate(-50%,-50%) !important;
      filter:drop-shadow(0 14px 22px rgba(0,0,0,.55)) !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-top,
    .hourglass-scene.hourglass-upgraded .hg-bottom {
      height:130px !important;
      border:0 !important;
      background:rgba(225,242,247,.08) !important;
      box-shadow:inset 0 0 0 2px rgba(228,239,247,.10) !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-top {
      top:35px !important;
      z-index:8 !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-bottom {
      bottom:35px !important;
      z-index:8 !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-sand-top,
    .hourglass-scene.hourglass-upgraded .hg-sand-bottom {
      box-shadow:none !important;
      border:0 !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-sand-bottom {
      z-index:2 !important;
    }

    /* Stream begins at the bottleneck and ends just inside the top of the lower sand pile. */
    .hourglass-scene.hourglass-upgraded .hg-stream {
      z-index:7 !important;
      left:115px !important;
      top:165px !important;
      width:3px !important;
      height:var(--streamHeight,132px) !important;
      opacity:0 !important;
      visibility:hidden !important;
      background:transparent !important;
      border-radius:999px !important;
      box-shadow:0 0 5px rgba(246,199,84,.24) !important;
      overflow:hidden !important;
      transform:translateX(-50%) !important;
      animation:none !important;
      pointer-events:none !important;
    }

    .hourglass-scene.hourglass-upgraded.hourglass-running .hg-stream {
      opacity:var(--stream,1) !important;
      visibility:visible !important;
    }

    .hourglass-scene.hourglass-upgraded .hg-stream::before {
      content:'' !important;
      position:absolute !important;
      inset:-12px 0 0 !important;
      width:100% !important;
      height:calc(100% + 12px) !important;
      border-radius:999px !important;
      background:repeating-linear-gradient(
        180deg,
        rgba(255,248,205,.99) 0 3px,
        rgba(245,204,96,.96) 3px 7px,
        rgba(211,143,37,.82) 7px 11px
      ) !important;
      background-size:100% 11px !important;
      animation:hourglassFallingSand .27s linear infinite !important;
    }

    @keyframes hourglassFallingSand {
      from { transform:translateY(0); }
      to { transform:translateY(11px); }
    }

    @media (max-width:760px) {
      .hourglass-scene.hourglass-upgraded .hourglass-bg-image,
      .hourglass-scene.hourglass-upgraded .hourglass-illustrated-bg {
        background-position:67% center !important;
      }

      #countdownStage.theme-hourglass .time-display-wrap {
        left:4% !important;
        top:18% !important;
        transform:none !important;
        width:min(48%, 205px) !important;
      }

      #countdownStage.theme-hourglass #countdownDisplay,
      #countdownStage.theme-hourglass .time-display {
        font-size:clamp(2.15rem,6.2vw,2.95rem) !important;
      }

      .hourglass-scene.hourglass-upgraded .hourglass {
        left:52% !important;
        top:58% !important;
        transform:translate(-50%,-50%) scale(.84) !important;
      }
    }
  `;
  document.head.appendChild(style);

  function syncHourglassState(scene) {
    if (!scene) return;
    const running = stageStatus?.textContent.trim() === 'Running';
    scene.classList.toggle('hourglass-running', Boolean(running));
  }

  function syncStreamToSand(scene) {
    if (!scene) return;
    const sand = scene.querySelector('.hg-sand-bottom');
    const stream = scene.querySelector('.hg-stream');
    if (!sand || !stream) return;

    const raw = sand.style.getPropertyValue('--bottomSand') || '0%';
    const percent = Math.max(0, Math.min(100, parseFloat(raw) || 0));
    const streamHeight = Math.max(0, 132 - (1.30 * percent));
    stream.style.setProperty('--streamHeight', `${streamHeight.toFixed(2)}px`);
  }

  function attachSandObserver(scene) {
    const sand = scene?.querySelector('.hg-sand-bottom');
    if (!sand || sand.__hourglassStreamObserver) return;

    const observer = new MutationObserver(() => syncStreamToSand(scene));
    observer.observe(sand, { attributes:true, attributeFilter:['style'] });
    sand.__hourglassStreamObserver = observer;
  }

  function syncHourglassScene() {
    const scene = sceneLayer.querySelector('.hourglass-scene');
    if (!scene) return;

    scene.querySelectorAll('.hourglass-wizard').forEach(el => el.remove());

    scene.style.position = 'absolute';
    scene.style.inset = '0';
    scene.style.width = '100%';
    scene.style.height = '100%';

    syncHourglassState(scene);
    attachSandObserver(scene);
    syncStreamToSand(scene);
  }

  const observer = new MutationObserver(syncHourglassScene);
  observer.observe(sceneLayer, { childList:true, subtree:true });

  const statusObserver = stageStatus ? new MutationObserver(() => {
    const scene = sceneLayer.querySelector('.hourglass-scene');
    syncHourglassState(scene);
    syncStreamToSand(scene);
  }) : null;
  statusObserver?.observe(stageStatus, { childList:true, characterData:true, subtree:true });

  syncHourglassScene();
})();

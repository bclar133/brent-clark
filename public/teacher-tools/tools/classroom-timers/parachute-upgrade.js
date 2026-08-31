(() => {
  'use strict';

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'parachuteCharacterUpgrade';
  style.textContent = `
    .parachute-scene {
      background:
        radial-gradient(circle at 86% 14%, rgba(255,244,173,.92) 0 35px, rgba(255,244,173,.28) 36px 58px, transparent 59px),
        linear-gradient(#49a9dc 0%, #b9e6f7 69%, #88c96f 69% 100%) !important;
    }

    .parachutist.parachutist-v2 {
      width: 210px !important;
      height: 190px !important;
      margin-top: -38px;
      transform-origin: 50% 50%;
      filter: drop-shadow(0 7px 7px rgba(31,73,95,.2));
    }

    .parachute-v2-assembly {
      position: absolute;
      inset: 0;
    }

    .fun-canopy {
      position: absolute;
      z-index: 4;
      left: 4px;
      top: 0;
      width: 202px;
      height: 64px;
      border-radius: 105px 105px 14px 14px;
      background:
        repeating-linear-gradient(90deg,
          #f35f51 0 28px,
          #ffd064 28px 56px,
          #55bdd5 56px 84px);
      clip-path: polygon(50% 0, 77% 7%, 94% 26%, 100% 100%, 0 100%, 6% 26%, 23% 7%);
      box-shadow: inset 0 -9px 0 rgba(62,87,103,.12), 0 5px 7px rgba(42,92,110,.15);
    }
    .fun-canopy::after {
      content: '';
      position: absolute;
      left: 7px;
      right: 7px;
      bottom: -3px;
      height: 9px;
      border-radius: 50%;
      border-bottom: 4px solid rgba(49,71,83,.22);
    }

    .fun-rigging {
      position: absolute;
      z-index: 5;
      inset: 0;
      width: 210px;
      height: 190px;
      overflow: visible;
      pointer-events: none;
    }
    .fun-rigging path {
      fill: none;
      stroke: #46545d;
      stroke-width: 3.3;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
    }
    .fun-rigging path.inner {
      stroke: #62727d;
      stroke-width: 2.4;
    }

    .fun-character {
      position: absolute;
      z-index: 7;
      left: 50%;
      top: 82px;
      width: 104px;
      height: 106px;
      transform: translateX(-50%);
    }

    .fun-head {
      position: absolute;
      z-index: 8;
      left: 22px;
      top: 0;
      width: 60px;
      height: 58px;
      border: 2px solid #5a321f;
      border-radius: 48% 48% 46% 46%;
      background: linear-gradient(145deg,#ffd0aa,#f3aa78);
      box-shadow: inset -5px -4px 0 rgba(151,74,45,.08);
    }
    .fun-ear {
      position: absolute;
      z-index: 7;
      top: 24px;
      width: 13px;
      height: 18px;
      border: 2px solid #5a321f;
      border-radius: 50%;
      background: #efab7d;
    }
    .fun-ear.left { left: 15px; transform: rotate(-9deg); }
    .fun-ear.right { right: 15px; transform: rotate(9deg); }

    .fun-hair {
      position: absolute;
      z-index: 10;
      left: 20px;
      top: -7px;
      width: 65px;
      height: 27px;
      border-radius: 55% 55% 32% 24%;
      background: #7d4729;
      transform: rotate(-4deg);
      box-shadow:
        7px -5px 0 -1px #7d4729,
        18px -2px 0 -2px #7d4729,
        29px -7px 0 -3px #7d4729,
        -5px 5px 0 -3px #7d4729;
      clip-path: polygon(0 15%, 17% 0, 28% 22%, 42% 0, 51% 24%, 67% 3%, 75% 30%, 94% 18%, 100% 76%, 80% 64%, 68% 78%, 54% 58%, 36% 75%, 18% 60%, 0 73%);
    }

    .fun-eye {
      position: absolute;
      z-index: 11;
      top: 20px;
      width: 17px;
      height: 20px;
      border: 2px solid #4b352b;
      border-radius: 50%;
      background: white;
      overflow: hidden;
    }
    .fun-eye.left { left: 31px; transform: rotate(4deg); }
    .fun-eye.right { right: 31px; transform: rotate(-4deg); }
    .fun-eye::after {
      content: '';
      position: absolute;
      width: 7px;
      height: 9px;
      left: 5px;
      top: 7px;
      border-radius: 50%;
      background: #1f252a;
      box-shadow: 2px -2px 0 -2px white;
      animation: parachuteLook 3.1s ease-in-out infinite alternate;
    }
    @keyframes parachuteLook {
      0%,35% { transform: translateX(-2px); }
      65%,100% { transform: translateX(2px); }
    }

    .fun-brow {
      position: absolute;
      z-index: 12;
      top: 15px;
      width: 15px;
      height: 5px;
      border-top: 3px solid #61371f;
      border-radius: 50%;
    }
    .fun-brow.left { left: 30px; transform: rotate(-8deg); }
    .fun-brow.right { right: 30px; transform: rotate(8deg); }

    .fun-cheek {
      position: absolute;
      z-index: 10;
      top: 38px;
      width: 10px;
      height: 6px;
      border-radius: 50%;
      background: rgba(226,88,79,.32);
    }
    .fun-cheek.left { left: 27px; }
    .fun-cheek.right { right: 27px; }

    .fun-nose {
      position: absolute;
      z-index: 12;
      left: 49px;
      top: 34px;
      width: 8px;
      height: 6px;
      border-bottom: 2px solid #9a5d3b;
      border-radius: 50%;
    }

    .fun-mouth {
      position: absolute;
      z-index: 12;
      left: 40px;
      top: 43px;
      width: 25px;
      height: 14px;
      overflow: hidden;
      border: 2px solid #543021;
      border-radius: 6px 6px 15px 15px;
      background: #49201d;
    }
    .fun-mouth::before {
      content: '';
      position: absolute;
      left: 3px;
      right: 3px;
      top: 0;
      height: 5px;
      border-radius: 0 0 6px 6px;
      background: white;
    }
    .fun-mouth::after {
      content: '';
      position: absolute;
      left: 8px;
      bottom: -2px;
      width: 12px;
      height: 7px;
      border-radius: 50%;
      background: #ef645f;
    }

    .fun-body {
      position: absolute;
      z-index: 6;
      left: 31px;
      top: 53px;
      width: 42px;
      height: 45px;
      border-radius: 12px 12px 9px 9px;
      background: linear-gradient(90deg,#173f7d,#2f63ad 48%,#163c77);
      border: 2px solid #263445;
    }
    .fun-body::before,
    .fun-body::after {
      content: '';
      position: absolute;
      top: 1px;
      width: 7px;
      height: 43px;
      border-radius: 4px;
      background: #25313b;
    }
    .fun-body::before { left: 7px; transform: rotate(-12deg); }
    .fun-body::after { right: 7px; transform: rotate(12deg); }

    .fun-belt {
      position: absolute;
      z-index: 9;
      left: 31px;
      top: 82px;
      width: 42px;
      height: 8px;
      border-radius: 5px;
      background: #26313a;
    }
    .fun-belt::after {
      content: '';
      position: absolute;
      left: 16px;
      top: -2px;
      width: 10px;
      height: 10px;
      border: 2px solid #c08a53;
      border-radius: 3px;
      background: #69462d;
    }

    .fun-arm {
      position: absolute;
      z-index: 6;
      top: 59px;
      width: 34px;
      height: 12px;
      border: 2px solid #263445;
      border-radius: 9px;
      background: #255398;
      transform-origin: 50% 50%;
    }
    .fun-arm.left { left: 7px; transform: rotate(-38deg); }
    .fun-arm.right { right: 7px; transform: rotate(38deg); }

    .fun-hand {
      position: absolute;
      z-index: 10;
      top: 57px;
      width: 17px;
      height: 18px;
      border: 2px solid #6a3d28;
      border-radius: 48% 48% 44% 44%;
      background: #f3b184;
      box-shadow: inset -3px -2px 0 rgba(144,72,45,.1);
    }
    .fun-hand.left { left: 3px; transform: rotate(-18deg); }
    .fun-hand.right { right: 3px; transform: rotate(18deg); }

    .fun-leg {
      position: absolute;
      z-index: 5;
      top: 91px;
      width: 20px;
      height: 22px;
      border: 2px solid #24313d;
      border-radius: 4px 4px 10px 10px;
      background: #28548f;
      transform-origin: top center;
    }
    .fun-leg.left { left: 30px; transform: rotate(15deg); }
    .fun-leg.right { right: 30px; transform: rotate(-15deg); }

    .fun-boot {
      position: absolute;
      z-index: 7;
      top: 103px;
      width: 23px;
      height: 12px;
      border-radius: 9px 9px 6px 6px;
      background: #252a2e;
      border: 2px solid #111719;
    }
    .fun-boot.left { left: 20px; transform: rotate(18deg); }
    .fun-boot.right { right: 20px; transform: rotate(-18deg); }

    .parachutist-v2 .fun-character {
      animation: parachuteCharacterBob 1.15s ease-in-out infinite alternate;
    }
    @keyframes parachuteCharacterBob {
      from { transform: translateX(-50%) rotate(-1.2deg); }
      to { transform: translateX(-50%) rotate(1.2deg); }
    }

    .timer-stage.finished .parachutist-v2 .fun-character {
      animation: parachuteLand .35s ease-out both;
    }
    @keyframes parachuteLand {
      0% { transform: translateX(-50%) translateY(0) scaleY(1); }
      65% { transform: translateX(-50%) translateY(4px) scaleY(.92); }
      100% { transform: translateX(-50%) translateY(0) scaleY(1); }
    }

    @media (max-width: 760px) {
      .parachutist.parachutist-v2 {
        width: 185px !important;
        height: 170px !important;
        margin-top: -30px;
      }
      .parachute-v2-assembly {
        transform: scale(.88);
        transform-origin: 50% 50%;
      }
    }
  `;
  document.head.appendChild(style);

  function upgradeParachute() {
    const parachutist = sceneLayer.querySelector('.parachute-scene .parachutist');
    if (!parachutist || parachutist.dataset.characterV2 === 'true') return;

    parachutist.dataset.characterV2 = 'true';
    parachutist.classList.add('parachutist-v2');
    parachutist.innerHTML = `
      <div class="parachute-v2-assembly" aria-hidden="true">
        <div class="fun-canopy"></div>
        <svg class="fun-rigging" viewBox="0 0 210 190" preserveAspectRatio="none">
          <path d="M 18 54 C 24 78, 33 101, 46 140" />
          <path d="M 192 54 C 186 78, 177 101, 164 140" />
          <path class="inner" d="M 63 59 C 70 82, 73 108, 72 145" />
          <path class="inner" d="M 147 59 C 140 82, 137 108, 138 145" />
        </svg>
        <div class="fun-character">
          <div class="fun-ear left"></div>
          <div class="fun-ear right"></div>
          <div class="fun-head"></div>
          <div class="fun-hair"></div>
          <div class="fun-eye left"></div>
          <div class="fun-eye right"></div>
          <div class="fun-brow left"></div>
          <div class="fun-brow right"></div>
          <div class="fun-cheek left"></div>
          <div class="fun-cheek right"></div>
          <div class="fun-nose"></div>
          <div class="fun-mouth"></div>
          <div class="fun-body"></div>
          <div class="fun-belt"></div>
          <div class="fun-arm left"></div>
          <div class="fun-arm right"></div>
          <div class="fun-hand left"></div>
          <div class="fun-hand right"></div>
          <div class="fun-leg left"></div>
          <div class="fun-leg right"></div>
          <div class="fun-boot left"></div>
          <div class="fun-boot right"></div>
        </div>
      </div>
    `;
  }

  const observer = new MutationObserver(upgradeParachute);
  observer.observe(sceneLayer, { childList: true, subtree: true });
  upgradeParachute();
})();

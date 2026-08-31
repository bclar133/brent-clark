(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV3')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV3';
  style.textContent = `
    /* Keep the whole background waterhole cluster on the far-right side of the plains,
       safely outside the foreground egg silhouette. */
    .xt-dino.dino-egg-upgraded .dino-up-tree.t2 {
      right:11% !important;
      bottom:24.5% !important;
      transform:scale(.62) !important;
      opacity:.82 !important;
      z-index:1 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-water {
      right:3.5% !important;
      bottom:12.5% !important;
      width:145px !important;
      height:43px !important;
      z-index:1 !important;
      opacity:.92 !important;
    }

    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      right:8.5% !important;
      bottom:15.7% !important;
      width:56px !important;
      height:40px !important;
      z-index:1 !important;
      opacity:.68 !important;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.08)) !important;
    }

    /* Chunkier toy-like T-rex proportions: big head, broad jaw, thick legs and tiny arms. */
    .xt-dino.dino-egg-upgraded .dino-up-baby {
      width:190px !important;
      height:198px !important;
      filter:drop-shadow(0 5px 4px rgba(0,0,0,.17)) !important;
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-tree.t2 {
        right:8% !important;
        transform:scale(.48) !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-water {
        right:1% !important;
        bottom:13% !important;
        width:112px !important;
        height:34px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        right:6% !important;
        bottom:16% !important;
        width:44px !important;
        height:32px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-baby {
        width:174px !important;
        height:184px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const toyTrexMarkup = `
    <svg viewBox="0 0 210 205" aria-hidden="true" focusable="false">
      <!-- long heavy tail -->
      <path d="M73 145 Q48 137 14 143 Q31 151 62 158 Z" fill="#78c749"/>
      <path d="M45 146 Q25 142 7 132" fill="none" stroke="#57963b" stroke-width="7" stroke-linecap="round"/>

      <!-- chunky body -->
      <ellipse cx="108" cy="143" rx="46" ry="38" fill="#82ce4d"/>
      <ellipse cx="119" cy="141" rx="25" ry="24" fill="#96db62" opacity=".52"/>

      <!-- dark green body striping -->
      <path d="M72 117 Q82 109 91 117 M91 111 Q102 103 111 113 M112 108 Q124 102 134 114 M133 116 Q144 111 151 121"
            fill="none" stroke="#22663a" stroke-width="6" stroke-linecap="round"/>
      <path d="M61 132 l11 -5 M76 137 l10 -5 M142 132 l10 -6" fill="none" stroke="#2c7740" stroke-width="4" stroke-linecap="round"/>

      <!-- thick legs -->
      <path d="M85 162 Q82 178 82 191 M125 162 Q132 177 134 191" fill="none" stroke="#69ad3f" stroke-width="15" stroke-linecap="round"/>

      <!-- broad feet / toes -->
      <path d="M82 190 Q71 190 62 196 Q72 198 88 197" fill="#76bd46"/>
      <path d="M134 190 Q146 190 158 196 Q147 199 129 197" fill="#76bd46"/>
      <path d="M67 194 l-5 4 M76 194 l-1 5 M84 194 l4 4 M142 194 l-4 4 M150 194 l2 5 M157 194 l5 3"
            fill="none" stroke="#4f8435" stroke-width="3.5" stroke-linecap="round"/>

      <!-- tiny T-rex arms -->
      <path class="normal-arm" d="M77 130 Q67 135 64 145 M132 129 Q142 134 145 143"
            fill="none" stroke="#7ec94b" stroke-width="8" stroke-linecap="round"/>
      <path class="happy-arm" d="M77 130 Q65 119 64 107 M132 129 Q145 118 146 106"
            fill="none" stroke="#7ec94b" stroke-width="8" stroke-linecap="round"/>
      <path class="normal-arm" d="M64 145 l-5 3 M64 145 l2 5 M145 143 l5 3 M145 143 l-2 5"
            fill="none" stroke="#4e8436" stroke-width="2.8" stroke-linecap="round"/>
      <path class="happy-arm" d="M64 107 l-5 -4 M64 107 l2 -6 M146 106 l5 -4 M146 106 l-2 -6"
            fill="none" stroke="#4e8436" stroke-width="2.8" stroke-linecap="round"/>

      <!-- oversized toy-like T-rex head -->
      <g class="dino-up-baby-head">
        <!-- skull -->
        <path d="M47 72 Q50 45 73 34 Q98 22 128 33 Q151 40 160 57
                 Q177 62 193 77 Q184 90 165 94 Q151 108 123 109
                 Q89 111 65 102 Q48 95 44 83 Q42 76 47 72 Z"
              fill="#87d44e"/>

        <!-- muzzle -->
        <path d="M130 59 Q166 57 193 77 Q184 87 161 89 Q144 89 128 83 Z" fill="#96df62"/>

        <!-- lower jaw, tan like the attachment -->
        <path d="M126 84 Q157 93 189 79 Q184 101 165 112 Q145 123 119 115 Q126 101 126 84 Z"
              fill="#ead8ad" stroke="#bfa77a" stroke-width="2"/>

        <!-- open mouth interior -->
        <path class="happy-mouth" d="M130 84 Q160 93 184 82 Q178 103 159 108 Q143 111 126 101 Z"
              fill="#542d2b"/>

        <!-- teeth -->
        <path d="M136 86 l5 8 l5-7 l5 8 l6-7 l5 7 l6-7 l5 6 l5-6"
              fill="none" stroke="#fff9e8" stroke-width="5" stroke-linecap="square" stroke-linejoin="miter"/>

        <!-- brow / eye mask -->
        <path d="M72 48 Q89 35 112 44 Q101 58 80 60 Z" fill="#1f6339"/>
        <path d="M61 39 l9 -9 M92 34 l8 -10 M119 37 l9 -7" fill="none" stroke="#246d3b" stroke-width="5" stroke-linecap="round"/>

        <!-- orange eye -->
        <ellipse cx="98" cy="54" rx="9" ry="10" fill="#f0a52a"/>
        <circle cx="100" cy="54" r="4.5" fill="#16130f"/>
        <circle cx="98" cy="51" r="1.4" fill="#fff"/>

        <!-- nostrils and face markings -->
        <circle cx="169" cy="71" r="2.2" fill="#426830"/>
        <circle cx="180" cy="76" r="1.9" fill="#426830"/>
        <path d="M57 62 l12 4 M62 73 l10 3 M119 46 l12 -3 M143 54 l12 2" fill="none" stroke="#27713d" stroke-width="4" stroke-linecap="round"/>
        <circle cx="79" cy="78" r="2.6" fill="#26703c"/>
        <circle cx="116" cy="70" r="2.2" fill="#26703c"/>

        <!-- neutral closed mouth while peeking -->
        <path class="flat-mouth" d="M128 85 Q158 94 186 81" fill="none" stroke="#5b422e" stroke-width="4" stroke-linecap="round"/>

        <!-- happy cheeks only at full hatch -->
        <circle class="happy-cheek" cx="77" cy="87" r="6" fill="#ef9983" opacity=".62"/>
        <circle class="happy-cheek" cx="117" cy="91" r="6" fill="#ef9983" opacity=".62"/>
      </g>
    </svg>
  `;

  function patchScene(scene){
    if(!scene || scene.dataset.dinoRefinedV3 === '1') return;
    if(scene.dataset.dinoRefinedV2 !== '1') return;

    const baby = scene.querySelector('.dino-up-baby');
    if(baby) baby.innerHTML = toyTrexMarkup;

    scene.dataset.dinoRefinedV3 = '1';
  }

  function scan(){
    sceneLayer.querySelectorAll('.xt-dino[data-xt-theme="dino"]').forEach(patchScene);
  }

  scan();
  const observer = new MutationObserver(scan);
  observer.observe(sceneLayer,{childList:true,subtree:true});
})();

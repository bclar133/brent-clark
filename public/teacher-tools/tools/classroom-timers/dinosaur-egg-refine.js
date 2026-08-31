(() => {
  'use strict';

  if (document.getElementById('dinosaurEggRefineStyleV1')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  const style = document.createElement('style');
  style.id = 'dinosaurEggRefineStyleV1';
  style.textContent = `
    /* Push the waterhole dinosaur deeper into the scene and make it read as a small sauropod. */
    .xt-dino.dino-egg-upgraded .dino-up-drinker {
      right:18% !important;
      bottom:17.5% !important;
      width:70px !important;
      height:50px !important;
      z-index:1 !important;
      opacity:.72 !important;
      transform-origin:78% 88% !important;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.10)) !important;
    }

    /* Slightly stronger, finer cracks so the edge cracks remain readable. */
    .xt-dino.dino-egg-upgraded .dino-up-cracks path {
      stroke:#756a50 !important;
      stroke-width:2.8 !important;
    }

    /* Give the hatchling a slightly larger silhouette so the T-rex features read clearly. */
    .xt-dino.dino-egg-upgraded .dino-up-baby {
      width:188px !important;
      height:198px !important;
      filter:drop-shadow(0 5px 4px rgba(0,0,0,.18)) !important;
    }

    @media(max-width:760px){
      .xt-dino.dino-egg-upgraded .dino-up-drinker {
        right:13% !important;
        bottom:18.5% !important;
        width:54px !important;
        height:40px !important;
      }
      .xt-dino.dino-egg-upgraded .dino-up-baby {
        width:178px !important;
        height:190px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const sauropodMarkup = `
    <svg viewBox="0 0 140 95" aria-hidden="true" focusable="false">
      <!-- tail -->
      <path d="M35 48 Q19 43 6 33 Q20 38 42 39" fill="#6d9d4d"/>

      <!-- body -->
      <ellipse cx="57" cy="49" rx="30" ry="17" fill="#79ad55"/>
      <ellipse cx="51" cy="45" rx="16" ry="8" fill="#8aba62" opacity=".55"/>

      <!-- sturdy legs -->
      <path d="M43 60 L40 82 M56 62 L56 83 M69 60 L72 82 M80 57 L83 79"
            fill="none" stroke="#557b3c" stroke-width="6" stroke-linecap="round"/>
      <path d="M36 82 L44 82 M52 83 L60 83 M68 82 L76 82 M79 79 L87 79"
            fill="none" stroke="#486b34" stroke-width="3" stroke-linecap="round"/>

      <!-- unmistakable long sauropod neck dipping to the water -->
      <path d="M78 45 Q99 40 111 53 Q120 62 121 70"
            fill="none" stroke="#79ad55" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="122" cy="72" rx="12" ry="8" fill="#7eb35a" transform="rotate(8 122 72)"/>
      <circle cx="126" cy="69" r="1.9" fill="#142014"/>
      <circle cx="126.5" cy="68.5" r=".6" fill="#eef8e7"/>
      <path d="M128 76 Q123 78 118 76" fill="none" stroke="#3e6330" stroke-width="1.8" stroke-linecap="round"/>

      <!-- a few dinosaur spots -->
      <circle cx="48" cy="43" r="3" fill="#628d46" opacity=".65"/>
      <circle cx="62" cy="52" r="2.6" fill="#628d46" opacity=".65"/>
      <circle cx="72" cy="43" r="2.3" fill="#628d46" opacity=".65"/>
    </svg>
  `;

  const trexMarkup = `
    <svg viewBox="0 0 190 200" aria-hidden="true" focusable="false">
      <!-- heavy tail -->
      <path d="M67 139 Q45 135 18 146 Q39 149 65 154 Z" fill="#6fb95b"/>
      <path d="M31 145 Q20 143 10 137" fill="none" stroke="#5d9d4c" stroke-width="6" stroke-linecap="round"/>

      <!-- powerful little T-rex body -->
      <ellipse cx="99" cy="139" rx="40" ry="34" fill="#76c360"/>
      <ellipse cx="106" cy="142" rx="22" ry="20" fill="#8bd170" opacity=".58"/>

      <!-- big legs and three-toed feet -->
      <path d="M82 158 Q79 173 77 185 M118 158 Q122 172 126 184"
            fill="none" stroke="#568f48" stroke-width="12" stroke-linecap="round"/>
      <path d="M76 184 L62 190 M77 184 L78 193 M78 184 L90 190"
            fill="none" stroke="#456f3c" stroke-width="5" stroke-linecap="round"/>
      <path d="M126 184 L114 191 M126 184 L128 193 M127 184 L140 189"
            fill="none" stroke="#456f3c" stroke-width="5" stroke-linecap="round"/>

      <!-- tiny T-rex arms: down while peeking, raised happily after hatching -->
      <path class="normal-arm" d="M75 127 Q64 132 62 143 M121 127 Q131 131 133 140"
            fill="none" stroke="#76c360" stroke-width="7" stroke-linecap="round"/>
      <path class="normal-arm" d="M62 143 l-5 4 M62 143 l2 6 M133 140 l5 4 M133 140 l-2 6"
            fill="none" stroke="#4d843f" stroke-width="2.8" stroke-linecap="round"/>
      <path class="happy-arm" d="M75 127 Q62 115 61 102 M121 127 Q135 114 136 101"
            fill="none" stroke="#76c360" stroke-width="7" stroke-linecap="round"/>
      <path class="happy-arm" d="M61 102 l-6 -5 M61 102 l3 -7 M136 101 l6 -5 M136 101 l-3 -7"
            fill="none" stroke="#4d843f" stroke-width="2.8" stroke-linecap="round"/>

      <!-- large recognisable T-rex head and snout -->
      <g class="dino-up-baby-head">
        <path d="M52 72 Q55 46 79 38 Q104 30 122 43 Q132 51 133 61
                 Q149 63 164 77 Q153 91 132 93 Q119 108 91 106
                 Q63 105 52 88 Q48 81 52 72 Z"
              fill="#83d16a"/>
        <path d="M127 63 Q148 64 164 77 Q150 84 128 82 Z" fill="#91dc75"/>
        <path d="M127 82 Q148 84 159 78 Q151 94 128 94 Z" fill="#68ad54"/>

        <!-- brow ridges -->
        <path d="M68 55 Q77 47 88 52 M96 50 Q107 44 117 51"
              fill="none" stroke="#5da34d" stroke-width="6" stroke-linecap="round"/>

        <!-- expressive eyes -->
        <circle cx="79" cy="63" r="5.5" fill="#152016"/>
        <circle cx="108" cy="62" r="5.5" fill="#152016"/>
        <circle cx="77.5" cy="61.5" r="1.5" fill="#fff"/>
        <circle cx="106.5" cy="60.5" r="1.5" fill="#fff"/>

        <!-- nose -->
        <circle cx="148" cy="73" r="2.1" fill="#355f31"/>
        <circle cx="156" cy="76" r="1.8" fill="#355f31"/>

        <!-- neutral little mouth while peeking -->
        <path class="flat-mouth" d="M123 84 Q139 88 153 82"
              fill="none" stroke="#24451f" stroke-width="4" stroke-linecap="round"/>

        <!-- happy open grin when fully hatched -->
        <path class="happy-mouth" d="M120 82 Q138 98 157 82 Q151 104 135 104 Q124 101 120 82 Z"
              fill="#6e2f2f" stroke="#24451f" stroke-width="4" stroke-linejoin="round"/>
        <path class="happy-mouth" d="M127 87 l4 7 l5-6 l5 7 l5-7 l5 5"
              fill="#fff7dd" stroke="#fff7dd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

        <circle class="happy-cheek" cx="71" cy="82" r="6" fill="#f09c86" opacity=".62"/>
        <circle class="happy-cheek" cx="113" cy="83" r="6" fill="#f09c86" opacity=".62"/>

        <!-- small T-rex crown bumps -->
        <path d="M70 42 l7 -9 l5 10 M91 36 l7 -10 l6 11 M111 40 l7 -8 l5 11"
              fill="#6fba5a" stroke="#5da34d" stroke-width="2" stroke-linejoin="round"/>
      </g>
    </svg>
  `;

  /* Seven cracks because the existing animation has seven crack/sound thresholds. */
  const crackPaths = [
    /* upper-left, reaching toward the shell edge */
    'M 88 96 L 72 113 L 82 128 L 61 143 L 70 158 M 76 120 L 54 118 L 43 130',
    /* upper-right, close to the rim */
    'M 183 103 L 202 118 L 194 132 L 219 146 L 211 163 M 201 120 L 226 115 L 238 126',
    /* left-middle, visibly near the edge */
    'M 66 178 L 49 191 L 61 204 L 43 221 L 57 234 M 53 195 L 34 188',
    /* right-middle, visibly near the edge */
    'M 205 176 L 229 190 L 216 205 L 238 219 L 224 237 M 225 191 L 246 181',
    /* lower-left edge */
    'M 101 237 L 82 251 L 90 268 L 68 281 L 75 300 M 83 256 L 58 258 L 45 271',
    /* lower-right edge */
    'M 174 239 L 195 252 L 186 270 L 211 281 L 201 301 M 198 257 L 222 257 L 236 269',
    /* long irregular crack from high centre toward the bottom */
    'M 139 64 L 131 84 L 145 101 L 134 123 L 149 142 L 137 163 L 151 184 L 139 207 L 151 227 L 142 251 L 153 273 L 143 300 L 150 326 M 136 124 L 116 135 L 102 128 M 143 206 L 164 217 L 177 210'
  ];

  function patchScene(scene){
    if(!scene || scene.dataset.dinoRefined === '1') return;
    if(scene.dataset.dinoEggUpgrade !== '1') return;

    const drinker = scene.querySelector('.dino-up-drinker');
    if(drinker) drinker.innerHTML = sauropodMarkup;

    const baby = scene.querySelector('.dino-up-baby');
    if(baby) baby.innerHTML = trexMarkup;

    const cracks = scene.querySelector('.dino-up-cracks');
    if(cracks){
      cracks.innerHTML = crackPaths.map((d,i)=>`<path data-dino-crack="${i}" d="${d}"></path>`).join('');
    }

    scene.dataset.dinoRefined = '1';
  }

  function scan(){
    sceneLayer.querySelectorAll('.xt-dino[data-xt-theme="dino"]').forEach(patchScene);
  }

  scan();
  const observer = new MutationObserver(scan);
  observer.observe(sceneLayer,{childList:true,subtree:true});
})();

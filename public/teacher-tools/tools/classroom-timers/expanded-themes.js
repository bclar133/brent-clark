(() => {
  'use strict';

  if (document.getElementById('expandedThemesStyleV1')) return;

  const THEMES = {
    bomb: { label:'Bomb Fuse', description:'The fuse burns toward the bomb and reaches it at zero.', icon:'💣', category:'action fun' },
    volcano: { label:'Volcano', description:'Magma rises through the volcano before erupting at zero.', icon:'🌋', category:'action fun' },
    snowman: { label:'Snowman', description:'The snowman slowly melts into a puddle as time runs out.', icon:'☃️', category:'calm fun' },
    moon: { label:'Moon Phases', description:'The Moon waxes from new moon to a glowing full moon at zero.', icon:'🌙', category:'minimal calm' },
    dino: { label:'Dinosaur Egg', description:'Cracks spread across the egg until a baby dinosaur hatches.', icon:'🥚', category:'fun' },
    dominoes: { label:'Dominoes', description:'The domino chain falls one piece at a time toward zero.', icon:'🁢', category:'action fun' },
    pacman: { label:'Pac-Man', description:'Pac-Man races through the maze eating every pellet before zero.', icon:'🟡', category:'action fun' },
    autumn: { label:'Autumn Tree', description:'The leaves change colour and drift to the ground as time passes.', icon:'🍂', category:'calm' }
  };

  const style = document.createElement('style');
  style.id = 'expandedThemesStyleV1';
  style.textContent = `
    .theme-card[data-theme="space"]:not([data-custom-theme]){display:none!important}

    #countdownStage.theme-bomb .time-display-wrap,
    #countdownStage.theme-volcano .time-display-wrap,
    #countdownStage.theme-snowman .time-display-wrap,
    #countdownStage.theme-moon .time-display-wrap,
    #countdownStage.theme-dino .time-display-wrap,
    #countdownStage.theme-dominoes .time-display-wrap,
    #countdownStage.theme-pacman .time-display-wrap,
    #countdownStage.theme-autumn .time-display-wrap{
      left:4%!important;right:auto!important;top:4%!important;transform:none!important;
      justify-items:start!important;text-align:left!important;z-index:40!important;
    }
    #countdownStage.theme-bomb .timer-message,
    #countdownStage.theme-volcano .timer-message,
    #countdownStage.theme-snowman .timer-message,
    #countdownStage.theme-moon .timer-message,
    #countdownStage.theme-dino .timer-message,
    #countdownStage.theme-dominoes .timer-message,
    #countdownStage.theme-pacman .timer-message,
    #countdownStage.theme-autumn .timer-message{justify-self:start!important}

    .xt-scene{position:absolute;inset:0;overflow:hidden;font-family:var(--body);user-select:none}

    /* Bomb fuse */
    .xt-bomb{background:radial-gradient(circle at 78% 58%,#563929 0 9%,transparent 28%),linear-gradient(155deg,#d7aa6f,#76533d 56%,#332b2a)}
    .xt-bomb::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(8deg,rgba(255,255,255,.025) 0 2px,transparent 2px 11px);opacity:.6}
    .xt-bomb-body{position:absolute;left:76%;top:48%;width:154px;height:154px;border-radius:50%;background:radial-gradient(circle at 34% 25%,#4b5157,#15191d 58%,#080a0c);box-shadow:0 24px 30px rgba(0,0,0,.42),inset -18px -18px 25px rgba(0,0,0,.45);transform:translate(-50%,-50%)}
    .xt-bomb-body::before{content:'';position:absolute;left:58px;top:-29px;width:39px;height:40px;border-radius:10px 10px 3px 3px;background:linear-gradient(90deg,#584631,#a08258,#4b3928);transform:rotate(7deg)}
    .xt-bomb-body::after{content:'TNT';position:absolute;left:50%;top:53%;transform:translate(-50%,-50%) rotate(-8deg);color:#d8dde1;font-family:var(--heading);font-size:1.25rem;letter-spacing:.08em;opacity:.45}
    .xt-fuse-svg{position:absolute;inset:0;width:100%;height:100%;z-index:2;overflow:visible}
    .xt-fuse-char{fill:none;stroke:#2b2119;stroke-width:13;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 5px 3px rgba(0,0,0,.28))}
    .xt-fuse-live{fill:none;stroke:#b68b53;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
    .xt-fuse-spark{position:absolute;z-index:5;width:26px;height:26px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 12%,#ffe56a 18% 34%,#ff7b2d 40% 58%,transparent 64%);filter:drop-shadow(0 0 11px #ff9d31);animation:xtSpark .18s infinite alternate}
    .xt-fuse-spark::before,.xt-fuse-spark::after{content:'';position:absolute;left:12px;top:-8px;width:2px;height:14px;background:#ffd960;transform:rotate(35deg);transform-origin:bottom}.xt-fuse-spark::after{transform:rotate(-48deg)}
    @keyframes xtSpark{to{transform:translate(-50%,-50%) scale(1.22) rotate(12deg)}}
    .xt-boom{position:absolute;left:76%;top:48%;z-index:8;opacity:0;transform:translate(-50%,-50%) scale(.1) rotate(-8deg);font-family:var(--heading);font-size:clamp(3rem,9vw,8rem);color:#fff26a;text-shadow:5px 5px 0 #ef5239,-4px -4px 0 #ef5239,0 0 35px #ff8b25}
    .xt-bomb.xt-finished .xt-boom{animation:xtBoom .85s cubic-bezier(.2,.8,.2,1) forwards}
    .xt-bomb.xt-finished .xt-bomb-body{animation:xtBombVanish .65s ease-out forwards}
    @keyframes xtBoom{0%{opacity:0;transform:translate(-50%,-50%) scale(.1) rotate(-8deg)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.18) rotate(5deg)}100%{opacity:.94;transform:translate(-50%,-50%) scale(.92) rotate(-2deg)}}
    @keyframes xtBombVanish{65%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.55)}}

    /* Volcano */
    .xt-volcano{background:linear-gradient(#6db3ca 0 57%,#426e4a 57% 76%,#283a2a 76%)}
    .xt-volcano-sun{position:absolute;right:9%;top:9%;width:80px;height:80px;border-radius:50%;background:#f4d476;box-shadow:0 0 38px rgba(244,212,118,.5)}
    .xt-volcano-mountain{position:absolute;left:50%;bottom:7%;width:min(72%,620px);height:68%;transform:translateX(-50%);clip-path:polygon(49% 5%,60% 22%,70% 43%,100% 100%,0 100%,30% 46%,41% 20%);background:linear-gradient(100deg,#51463f,#78604e 47%,#423932 76%);filter:drop-shadow(0 15px 15px rgba(0,0,0,.28));overflow:hidden}
    .xt-volcano-mountain::before{content:'';position:absolute;left:37%;right:36%;top:4%;height:16%;background:#2d2724;clip-path:ellipse(48% 30% at 50% 25%)}
    .xt-volcano-magma{position:absolute;left:42%;right:41%;bottom:0;height:var(--magma,12%);background:linear-gradient(#fff16c,#ff8d2d 18%,#e83d23 58%,#8d1716);box-shadow:0 -10px 28px rgba(255,87,31,.52);transition:height .12s linear}
    .xt-volcano-lava-line{position:absolute;left:47.4%;top:12%;width:5.5%;height:68%;background:linear-gradient(#fff06a,#f05a22 55%,#b61f1d);clip-path:polygon(42% 0,77% 11%,58% 24%,88% 38%,56% 50%,78% 64%,38% 80%,62% 100%,12% 100%,31% 81%,7% 65%,37% 48%,17% 30%,39% 13%);opacity:var(--lava-flow,.2);filter:drop-shadow(0 0 9px #f06a24)}
    .xt-volcano-smoke{position:absolute;left:50%;top:19%;width:150px;height:125px;transform:translateX(-50%);opacity:var(--smoke,.15)}
    .xt-volcano-smoke i{position:absolute;border-radius:50%;background:rgba(65,62,62,.66);filter:blur(1px);animation:xtSmokeBob 2.4s ease-in-out infinite alternate}.xt-volcano-smoke i:nth-child(1){width:62px;height:48px;left:45px;bottom:0}.xt-volcano-smoke i:nth-child(2){width:74px;height:58px;left:11px;bottom:34px;animation-delay:-.7s}.xt-volcano-smoke i:nth-child(3){width:58px;height:48px;right:4px;bottom:51px;animation-delay:-1.2s}
    @keyframes xtSmokeBob{to{transform:translateY(-10px) scale(1.08)}}
    .xt-eruption{position:absolute;left:50%;top:27%;width:1px;height:1px;z-index:8}
    .xt-eruption i{position:absolute;width:12px;height:12px;border-radius:50%;background:#ff8a27;box-shadow:0 0 12px #ff6724;opacity:0}
    .xt-volcano.xt-finished .xt-eruption i{animation:xtErupt 1.45s cubic-bezier(.16,.7,.3,1) forwards;animation-delay:var(--delay)}
    @keyframes xtErupt{0%{opacity:1;transform:translate(0,0) scale(.5)}45%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(1.1)}100%{opacity:0;transform:translate(calc(var(--dx) * 1.25),calc(var(--dy) + 170px)) scale(.7)}}

    /* Snowman */
    .xt-snowman{background:linear-gradient(#8fd0ee 0 70%,#eaf5fb 70%)}
    .xt-snow-hills{position:absolute;left:-6%;right:-6%;bottom:-7%;height:32%;border-radius:50% 50% 0 0;background:#f7fcff;box-shadow:0 -30px 0 -12px rgba(222,240,250,.75)}
    .xt-snowman-figure{position:absolute;left:68%;bottom:10%;width:230px;height:390px;transform:translateX(-50%) translateY(var(--melt-y,0px)) scaleY(var(--melt-scale,1));transform-origin:50% 100%;opacity:var(--snow-opacity,1);transition:filter .2s linear}
    .xt-snow-ball{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 34% 25%,#fff,#eef7fb 58%,#c6dbe5);box-shadow:inset -13px -12px 18px rgba(95,132,150,.14),0 8px 12px rgba(50,80,95,.14)}
    .xt-snow-bottom{bottom:0;width:205px;height:178px}.xt-snow-middle{bottom:131px;width:158px;height:145px}.xt-snow-head{bottom:244px;width:116px;height:112px}
    .xt-snow-eye{position:absolute;top:33px;width:9px;height:9px;border-radius:50%;background:#283238}.xt-snow-eye.e1{left:33px}.xt-snow-eye.e2{right:33px}
    .xt-carrot{position:absolute;left:55px;top:54px;width:54px;height:15px;background:#ef7d31;clip-path:polygon(0 15%,100% 50%,0 85%);transform-origin:left center;transform:rotate(var(--carrot-rot,0deg)) translateY(var(--carrot-drop,0px))}
    .xt-snow-hat{position:absolute;left:54px;top:6px;width:119px;height:70px;transform:translateX(-50%) rotate(var(--hat-rot,0deg)) translate(var(--hat-x,0px),var(--hat-y,0px));transform-origin:50% 100%}.xt-snow-hat::before{content:'';position:absolute;left:18px;top:0;width:75px;height:55px;background:#25313a;border-radius:8px 8px 2px 2px}.xt-snow-hat::after{content:'';position:absolute;left:0;bottom:5px;width:119px;height:17px;border-radius:50%;background:#1d282f}
    .xt-snow-arm{position:absolute;top:189px;width:92px;height:7px;border-radius:99px;background:#6e4d33;transform-origin:right center}.xt-snow-arm.a1{left:-14px;transform:rotate(24deg)}.xt-snow-arm.a2{right:-15px;transform-origin:left center;transform:rotate(-25deg)}
    .xt-snow-puddle{position:absolute;left:68%;bottom:7%;width:var(--puddle-w,70px);height:var(--puddle-h,18px);transform:translateX(-50%);border-radius:50%;background:rgba(157,214,237,.72);box-shadow:inset 0 3px 8px rgba(255,255,255,.65)}

    /* Moon phases */
    .xt-moon{background:radial-gradient(circle at 74% 40%,#25385f,#0b1225 48%,#050914)}
    .xt-moon-star{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:#fff;opacity:var(--o);box-shadow:0 0 5px rgba(210,230,255,.55)}
    .xt-moon-glyph{position:absolute;right:12%;top:48%;transform:translateY(-50%);font-size:clamp(9rem,24vw,18rem);line-height:1;filter:drop-shadow(0 0 var(--moon-glow,8px) rgba(220,234,255,.7));transition:filter .25s ease}
    .xt-moon-label{position:absolute;right:12%;top:78%;min-width:220px;text-align:center;color:#dbe8ff;font-family:var(--display);font-size:clamp(1.1rem,2.5vw,1.8rem);letter-spacing:.04em}
    .xt-moon-orbit{position:absolute;right:8%;top:18%;width:42%;height:62%;border:1px solid rgba(190,215,255,.18);border-radius:50%}
    .xt-moon.xt-finished .xt-moon-glyph{animation:xtFullMoon 1.25s ease-out both}@keyframes xtFullMoon{50%{filter:drop-shadow(0 0 40px rgba(230,242,255,.95));transform:translateY(-50%) scale(1.08)}100%{filter:drop-shadow(0 0 26px rgba(230,242,255,.82));transform:translateY(-50%) scale(1)}}

    /* Dinosaur egg */
    .xt-dino{background:linear-gradient(#89c8b0 0 66%,#52724a 66%)}
    .xt-dino::before{content:'';position:absolute;left:-4%;right:-4%;bottom:-7%;height:34%;border-radius:50% 50% 0 0;background:#6f8b4a;box-shadow:0 -24px 0 -12px #5f7d42}
    .xt-dino-egg-wrap{position:absolute;left:68%;bottom:9%;width:270px;height:345px;transform:translateX(-50%)}
    .xt-dino-egg{position:absolute;left:50%;bottom:0;width:220px;height:300px;transform:translateX(-50%);border-radius:50% 50% 46% 46% / 62% 62% 38% 38%;background:radial-gradient(circle at 34% 24%,#fff8d7,#e8d9aa 56%,#b8a66f);box-shadow:0 20px 28px rgba(31,51,30,.28),inset -20px -18px 25px rgba(110,92,48,.12)}
    .xt-dino-speck{position:absolute;border-radius:50%;background:rgba(109,127,78,.38)}
    .xt-dino-crack{position:absolute;left:50%;top:43%;width:7px;height:95px;background:#665c43;clip-path:polygon(35% 0,100% 0,56% 22%,93% 36%,42% 52%,80% 68%,20% 100%,0 96%,38% 67%,6% 54%,54% 35%,18% 22%);opacity:0;transform-origin:top}
    .xt-dino-crack.c2{transform:translateX(-32px) rotate(22deg) scale(.72)}.xt-dino-crack.c3{transform:translateX(34px) rotate(-28deg) scale(.65)}
    .xt-dino-egg-wrap.xt-wiggle .xt-dino-egg{animation:xtEggWiggle .42s ease-in-out infinite alternate}@keyframes xtEggWiggle{from{transform:translateX(-50%) rotate(-2deg)}to{transform:translateX(-50%) rotate(2.5deg)}}
    .xt-baby-dino{position:absolute;left:50%;bottom:70px;z-index:5;transform:translateX(-50%) translateY(90px) scale(.2);opacity:0;font-size:128px;filter:drop-shadow(0 8px 5px rgba(0,0,0,.22))}
    .xt-shell-half{position:absolute;bottom:0;width:116px;height:112px;background:linear-gradient(#efe2b5,#b9a776);opacity:0}.xt-shell-half.left{left:20px;clip-path:polygon(0 35%,25% 18%,45% 36%,67% 10%,100% 38%,92% 100%,0 100%)}.xt-shell-half.right{right:20px;clip-path:polygon(0 38%,29% 12%,48% 34%,74% 15%,100% 35%,100% 100%,7% 100%)}
    .xt-dino.xt-finished .xt-dino-egg{animation:xtEggBreak .5s ease-out forwards}.xt-dino.xt-finished .xt-baby-dino{animation:xtDinoPop .9s .25s cubic-bezier(.2,.8,.2,1.2) forwards}.xt-dino.xt-finished .xt-shell-half{animation:xtShellShow .45s .18s forwards}
    @keyframes xtEggBreak{to{opacity:0;transform:translateX(-50%) scale(1.12)}}@keyframes xtDinoPop{to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}@keyframes xtShellShow{to{opacity:1}}

    /* Dominoes */
    .xt-dominoes{background:linear-gradient(#c6e3ed 0 61%,#c99a68 61%)}
    .xt-domino-floor{position:absolute;left:0;right:0;bottom:0;height:39%;background:repeating-linear-gradient(90deg,rgba(92,55,31,.08) 0 2px,transparent 2px 78px)}
    .xt-domino{position:absolute;width:24px;height:82px;border-radius:5px;background:#f5efe2;border:3px solid #292929;box-shadow:4px 7px 8px rgba(67,43,27,.24);transform-origin:50% 100%;transition:transform .18s cubic-bezier(.3,.8,.4,1),filter .18s;z-index:3}
    .xt-domino::before{content:'';position:absolute;left:3px;right:3px;top:50%;height:2px;background:#292929}.xt-domino::after{content:'•  •';position:absolute;left:2px;right:2px;top:7px;color:#292929;font-size:18px;letter-spacing:1px;line-height:27px;text-align:center;white-space:pre-wrap}
    .xt-domino.fallen{transform:rotate(74deg) translateX(5px);filter:brightness(.94)}
    .xt-domino-label{position:absolute;left:50%;top:32%;transform:translateX(-50%);font-family:var(--heading);font-size:clamp(1.4rem,4vw,3.2rem);color:#755136;opacity:0;letter-spacing:.07em}
    .xt-dominoes.xt-finished .xt-domino-label{animation:xtClack .7s ease-out forwards}@keyframes xtClack{0%{opacity:0;transform:translateX(-50%) scale(.6)}45%{opacity:1;transform:translateX(-50%) scale(1.15)}100%{opacity:.9;transform:translateX(-50%) scale(1)}}

    /* Pac-Man */
    .xt-pacman{background:#070a17}
    .xt-pac-board{position:absolute;left:4%;right:4%;top:22%;bottom:5%;border:6px solid #244dff;border-radius:18px;box-shadow:0 0 14px rgba(57,84,255,.5),inset 0 0 18px rgba(57,84,255,.15);overflow:hidden;background:#050713}
    .xt-pac-wall{position:absolute;background:#1739ca;border:2px solid #3e65ff;border-radius:5px;box-shadow:0 0 6px rgba(55,91,255,.38)}
    .xt-pellet{position:absolute;width:7px;height:7px;border-radius:50%;background:#ffe4a8;transform:translate(-50%,-50%);box-shadow:0 0 4px rgba(255,227,165,.4);transition:opacity .12s}
    .xt-power-pellet{width:15px;height:15px;background:#fff1cf}
    .xt-pacman-char{position:absolute;z-index:5;width:44px;height:44px;border-radius:50%;transform:translate(-50%,-50%) rotate(var(--pac-angle,0deg));background:#ffd62a;clip-path:polygon(100% 0,100% 34%,56% 50%,100% 66%,100% 100%,0 100%,0 0);filter:drop-shadow(0 0 6px rgba(255,214,42,.4));animation:xtPacMouth .22s steps(2,end) infinite alternate}
    @keyframes xtPacMouth{to{clip-path:polygon(100% 0,100% 43%,64% 50%,100% 57%,100% 100%,0 100%,0 0)}}
    .xt-pac-ghost{position:absolute;font-size:35px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5));opacity:.78}
    .xt-pac-clear{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%) scale(.4);opacity:0;z-index:8;color:#ffe744;font-family:var(--heading);font-size:clamp(2rem,7vw,5rem);text-shadow:0 0 12px #ffdf31}
    .xt-pacman.xt-finished .xt-pac-clear{animation:xtPacClear .8s ease-out forwards}@keyframes xtPacClear{to{opacity:1;transform:translate(-50%,-50%) scale(1)}}

    /* Autumn tree */
    .xt-autumn{background:linear-gradient(#a7d5e5 0 66%,#c89c68 66%)}
    .xt-autumn-ground{position:absolute;left:-5%;right:-5%;bottom:-8%;height:36%;border-radius:50% 50% 0 0;background:#b88957;box-shadow:0 -20px 0 -9px rgba(168,118,71,.35)}
    .xt-tree-trunk{position:absolute;left:68%;bottom:12%;width:74px;height:300px;transform:translateX(-50%);background:linear-gradient(90deg,#684127,#9a6740 52%,#5c3925);clip-path:polygon(32% 0,70% 0,64% 60%,84% 100%,53% 90%,20% 100%,36% 60%);filter:drop-shadow(5px 9px 6px rgba(0,0,0,.18))}
    .xt-tree-branch{position:absolute;left:68%;bottom:44%;width:220px;height:15px;background:#684127;border-radius:99px;transform-origin:0 50%}.xt-tree-branch.b1{transform:rotate(-29deg)}.xt-tree-branch.b2{transform:rotate(205deg);width:185px}.xt-tree-branch.b3{bottom:53%;transform:rotate(-55deg);width:145px}
    .xt-leaf{position:absolute;z-index:4;width:var(--leaf-size);height:calc(var(--leaf-size) * .72);border-radius:80% 20% 75% 25%;transform:translate(-50%,-50%) rotate(var(--leaf-rot));box-shadow:0 2px 2px rgba(76,45,24,.12)}
    .xt-leaf-pile{position:absolute;left:68%;bottom:8%;width:260px;height:42px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 50% 40%,rgba(199,92,37,.9),rgba(154,72,34,.85) 45%,rgba(113,64,35,.55) 70%,transparent 72%);opacity:var(--pile,.1)}

    @media(max-width:760px){
      #countdownStage.theme-bomb .time-display-wrap,#countdownStage.theme-volcano .time-display-wrap,#countdownStage.theme-snowman .time-display-wrap,#countdownStage.theme-moon .time-display-wrap,#countdownStage.theme-dino .time-display-wrap,#countdownStage.theme-dominoes .time-display-wrap,#countdownStage.theme-pacman .time-display-wrap,#countdownStage.theme-autumn .time-display-wrap{left:3%!important;top:3%!important}
      .xt-bomb-body{left:79%;width:112px;height:112px}.xt-moon-glyph{right:5%;font-size:8.5rem}.xt-moon-label{right:4%;min-width:160px}.xt-dino-egg-wrap{left:72%;transform:translateX(-50%) scale(.76);transform-origin:bottom center}.xt-snowman-figure{left:72%;transform:translateX(-50%) translateY(var(--melt-y,0px)) scale(.76,var(--melt-scale,1));transform-origin:bottom center}.xt-snow-puddle{left:72%}.xt-tree-trunk,.xt-tree-branch,.xt-leaf-pile{left:72%}.xt-pac-board{top:27%}
    }
  `;
  document.head.appendChild(style);

  let sceneLayer = null;
  let stage = null;
  let stageStatus = null;
  let display = null;
  let message = null;
  let minutesInput = null;
  let secondsInput = null;
  let themeGrid = null;
  let stageKicker = null;
  let themeDescription = null;
  let hiddenSpaceCard = null;

  let activeTheme = null;
  let sceneState = {};
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let lastFinished = false;
  let raf = 0;
  let rebuilding = false;

  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const lerp = (a,b,t) => a+(b-a)*t;
  const random = (a,b) => a+Math.random()*(b-a);

  function storageGet(key,fallback=null){
    try{const value=localStorage.getItem(`ttTimers.${key}`);return value===null?fallback:JSON.parse(value);}catch{return fallback;}
  }
  function storageSet(key,value){try{localStorage.setItem(`ttTimers.${key}`,JSON.stringify(value));}catch{}}
  function storageRemove(key){try{localStorage.removeItem(`ttTimers.${key}`);}catch{}}

  function parseRemainingSeconds(){
    const parts=(display?.textContent||'').trim().split(':').map(Number);
    if(parts.some(n=>!Number.isFinite(n))) return null;
    if(parts.length===2) return parts[0]*60+parts[1];
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));}

  function progressNow(now){
    const current=parseRemainingSeconds();
    if(current===null) return 0;
    const status=stageStatus?.textContent.trim()||'';
    const running=status==='Running';
    if(displayedRemaining===null||current!==displayedRemaining||status!==lastStatus){displayedRemaining=current;displayChangedAt=now;lastStatus=status;}
    let estimated=current;
    if(running&&current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function pointAlong(points,t){
    if(!points?.length) return {x:50,y:50,angle:0};
    const segs=[];let total=0;
    for(let i=1;i<points.length;i++){const dx=points[i].x-points[i-1].x,dy=points[i].y-points[i-1].y,d=Math.hypot(dx,dy);segs.push({a:points[i-1],b:points[i],d,start:total});total+=d;}
    const target=clamp(t,0,1)*total;
    let seg=segs[segs.length-1];
    for(const s of segs){if(target<=s.start+s.d){seg=s;break;}}
    const u=seg.d?clamp((target-seg.start)/seg.d,0,1):0;
    return {x:lerp(seg.a.x,seg.b.x,u),y:lerp(seg.a.y,seg.b.y,u),angle:Math.atan2(seg.b.y-seg.a.y,seg.b.x-seg.a.x)*180/Math.PI};
  }

  function addCards(){
    if(!themeGrid) return;
    hiddenSpaceCard=themeGrid.querySelector('.theme-card[data-theme="space"]:not([data-custom-theme])');
    if(!hiddenSpaceCard) return;
    Object.entries(THEMES).forEach(([name,meta])=>{
      if(themeGrid.querySelector(`[data-custom-theme="${name}"]`)) return;
      const button=document.createElement('button');
      button.className='theme-card';
      button.type='button';
      button.dataset.theme=`custom-${name}`;
      button.dataset.customTheme=name;
      button.dataset.category=meta.category;
      button.setAttribute('role','option');
      button.setAttribute('aria-selected','false');
      button.innerHTML=`<span>${meta.icon}</span><strong>${meta.label}</strong>`;
      button.addEventListener('click',()=>chooseCustom(name));
      themeGrid.appendChild(button);
    });
    applyCurrentFilter();
  }

  function applyCurrentFilter(){
    const activeFilter=themeGrid?.closest('.setting-block')?.querySelector('.theme-filters button.active')?.dataset.themeFilter||'all';
    themeGrid?.querySelectorAll('[data-custom-theme]').forEach(card=>{
      const cats=(card.dataset.category||'').split(/\s+/);
      card.hidden=activeFilter!=='all'&&!cats.includes(activeFilter);
    });
  }

  function setCustomUi(name){
    const meta=THEMES[name];if(!meta) return;
    document.querySelectorAll('.theme-card').forEach(card=>{const on=card.dataset.customTheme===name;card.classList.toggle('active',on);card.setAttribute('aria-selected',String(on));});
    stageKicker.textContent=meta.label;
    themeDescription.textContent=meta.description;
    const finished=stage.classList.contains('finished');
    stage.className=`timer-stage theme-${name} expanded-theme`;
    if(finished) stage.classList.add('finished');
  }

  function chooseCustom(name){
    if(!THEMES[name]||!hiddenSpaceCard) return;
    hiddenSpaceCard.click();
    activeTheme=name;
    storageSet('customCountdownTheme',name);
    displayedRemaining=parseRemainingSeconds();
    displayChangedAt=performance.now();
    lastStatus=stageStatus?.textContent.trim()||'';
    lastFinished=false;
    setCustomUi(name);
    buildScene(name);
  }

  function deactivateCustom(){
    if(!activeTheme) return;
    activeTheme=null;
    sceneState={};
    lastFinished=false;
    storageRemove('customCountdownTheme');
  }

  function buildScene(name){
    if(!activeTheme||activeTheme!==name||!sceneLayer||rebuilding) return;
    rebuilding=true;
    sceneState={name};

    if(name==='bomb'){
      sceneLayer.innerHTML=`<div class="xt-scene xt-bomb" data-xt-theme="bomb"><svg class="xt-fuse-svg" viewBox="0 0 1000 600" preserveAspectRatio="none"><path class="xt-fuse-char" d="M 150 390 C 280 300 385 455 510 350 C 600 274 670 330 742 323"/><path class="xt-fuse-live" d="M 150 390 C 280 300 385 455 510 350 C 600 274 670 330 742 323"/></svg><div class="xt-fuse-spark"></div><div class="xt-bomb-body"></div><div class="xt-boom">BOOM!</div></div>`;
      requestAnimationFrame(()=>{const path=sceneLayer.querySelector('.xt-fuse-live');if(path){sceneState.fuseLength=path.getTotalLength();path.style.strokeDasharray=`${sceneState.fuseLength}`;path.style.strokeDashoffset='0';}});
    }

    if(name==='volcano'){
      const particles=Array.from({length:18},(_,i)=>`<i style="--dx:${random(-180,180).toFixed(0)}px;--dy:${random(-210,-70).toFixed(0)}px;--delay:${(i*.025).toFixed(2)}s"></i>`).join('');
      sceneLayer.innerHTML=`<div class="xt-scene xt-volcano" data-xt-theme="volcano"><div class="xt-volcano-sun"></div><div class="xt-volcano-smoke"><i></i><i></i><i></i></div><div class="xt-volcano-mountain"><div class="xt-volcano-magma"></div></div><div class="xt-volcano-lava-line"></div><div class="xt-eruption">${particles}</div></div>`;
    }

    if(name==='snowman'){
      sceneLayer.innerHTML=`<div class="xt-scene xt-snowman" data-xt-theme="snowman"><div class="xt-snow-hills"></div><div class="xt-snow-puddle"></div><div class="xt-snowman-figure"><div class="xt-snow-arm a1"></div><div class="xt-snow-arm a2"></div><div class="xt-snow-ball xt-snow-bottom"></div><div class="xt-snow-ball xt-snow-middle"></div><div class="xt-snow-ball xt-snow-head"><i class="xt-snow-eye e1"></i><i class="xt-snow-eye e2"></i><i class="xt-carrot"></i></div><div class="xt-snow-hat"></div></div></div>`;
    }

    if(name==='moon'){
      const stars=Array.from({length:92},()=>`<i class="xt-moon-star" style="left:${random(2,98).toFixed(2)}%;top:${random(3,95).toFixed(2)}%;--s:${random(1.2,3.2).toFixed(1)}px;--o:${random(.35,.95).toFixed(2)}"></i>`).join('');
      sceneLayer.innerHTML=`<div class="xt-scene xt-moon" data-xt-theme="moon">${stars}<div class="xt-moon-orbit"></div><div class="xt-moon-glyph">🌑</div><div class="xt-moon-label">New Moon</div></div>`;
    }

    if(name==='dino'){
      const specks=Array.from({length:12},()=>`<i class="xt-dino-speck" style="left:${random(25,72).toFixed(1)}%;top:${random(18,78).toFixed(1)}%;width:${random(12,25).toFixed(0)}px;height:${random(9,20).toFixed(0)}px;transform:rotate(${random(-35,35).toFixed(0)}deg)"></i>`).join('');
      sceneLayer.innerHTML=`<div class="xt-scene xt-dino" data-xt-theme="dino"><div class="xt-dino-egg-wrap"><div class="xt-baby-dino">🦖</div><div class="xt-shell-half left"></div><div class="xt-shell-half right"></div><div class="xt-dino-egg">${specks}<i class="xt-dino-crack c1"></i><i class="xt-dino-crack c2"></i><i class="xt-dino-crack c3"></i></div></div></div>`;
    }

    if(name==='dominoes'){
      const count=29;
      const pieces=Array.from({length:count},(_,i)=>{const x=7+i*(86/(count-1));const y=66+Math.sin(i*.58)*4;return `<i class="xt-domino" data-domino="${i}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;transform:translate(-50%,-100%) rotate(${(-4+Math.sin(i*.8)*4).toFixed(1)}deg)"></i>`;}).join('');
      sceneState.dominoCount=count;
      sceneLayer.innerHTML=`<div class="xt-scene xt-dominoes" data-xt-theme="dominoes"><div class="xt-domino-floor"></div>${pieces}<div class="xt-domino-label">CLACK!</div></div>`;
    }

    if(name==='pacman'){
      const route=[{x:8,y:18},{x:90,y:18},{x:90,y:38},{x:20,y:38},{x:20,y:61},{x:82,y:61},{x:82,y:82},{x:8,y:82}];
      sceneState.route=route;
      const pelletCount=48;
      const pellets=Array.from({length:pelletCount},(_,i)=>{const t=i/(pelletCount-1),p=pointAlong(route,t);return `<i class="xt-pellet ${i%16===0?'xt-power-pellet':''}" data-pellet="${i}" style="left:${p.x}%;top:${p.y}%"></i>`;}).join('');
      const walls=`<i class="xt-pac-wall" style="left:14%;top:28%;width:27%;height:4%"></i><i class="xt-pac-wall" style="left:50%;top:28%;width:31%;height:4%"></i><i class="xt-pac-wall" style="left:30%;top:49%;width:35%;height:4%"></i><i class="xt-pac-wall" style="left:8%;top:70%;width:24%;height:4%"></i><i class="xt-pac-wall" style="left:57%;top:70%;width:30%;height:4%"></i><i class="xt-pac-wall" style="left:45%;top:34%;width:4%;height:14%"></i><i class="xt-pac-wall" style="left:68%;top:54%;width:4%;height:15%"></i>`;
      sceneLayer.innerHTML=`<div class="xt-scene xt-pacman" data-xt-theme="pacman"><div class="xt-pac-board">${walls}${pellets}<div class="xt-pac-ghost" style="left:47%;top:43%">👻</div><div class="xt-pac-ghost" style="left:55%;top:67%;filter:hue-rotate(125deg) drop-shadow(0 2px 2px rgba(0,0,0,.5))">👻</div><div class="xt-pacman-char"></div><div class="xt-pac-clear">LEVEL CLEAR!</div></div></div>`;
    }

    if(name==='autumn'){
      const leaves=[];
      const leafHtml=Array.from({length:62},(_,i)=>{const left=random(50,86),top=random(22,58),size=random(12,25),rot=random(-70,70),threshold=random(.08,.92),targetX=clamp(left+random(-24,18),35,91);const hue=random(25,60);leaves.push({left,top,size,rot,threshold,targetX,hue});return `<i class="xt-leaf" data-leaf="${i}" style="left:${left}%;top:${top}%;--leaf-size:${size}px;--leaf-rot:${rot}deg;background:hsl(${hue} 72% 48%)"></i>`;}).join('');
      sceneState.leaves=leaves;
      sceneLayer.innerHTML=`<div class="xt-scene xt-autumn" data-xt-theme="autumn"><div class="xt-autumn-ground"></div><div class="xt-tree-trunk"></div><div class="xt-tree-branch b1"></div><div class="xt-tree-branch b2"></div><div class="xt-tree-branch b3"></div>${leafHtml}<div class="xt-leaf-pile"></div></div>`;
    }

    rebuilding=false;
    lastFinished=false;
  }

  function renderTheme(name,progress,finished){
    const scene=sceneLayer?.querySelector(`.xt-scene[data-xt-theme="${name}"]`);
    if(!scene) return;

    if(name==='bomb'){
      const path=scene.querySelector('.xt-fuse-live'),spark=scene.querySelector('.xt-fuse-spark');
      if(path){const len=sceneState.fuseLength||path.getTotalLength();sceneState.fuseLength=len;path.style.strokeDasharray=`${len}`;path.style.strokeDashoffset=`${len*progress}`;const p=path.getPointAtLength(len*progress);if(spark){spark.style.left=`${p.x/10}%`;spark.style.top=`${p.y/6}%`;spark.style.opacity=finished?'0':'1';}}
    }

    if(name==='volcano'){
      scene.style.setProperty('--magma',`${12+progress*70}%`);scene.style.setProperty('--lava-flow',String(.18+progress*.82));scene.style.setProperty('--smoke',String(.12+progress*.76));
    }

    if(name==='snowman'){
      const figure=scene.querySelector('.xt-snowman-figure'),puddle=scene.querySelector('.xt-snow-puddle'),carrot=scene.querySelector('.xt-carrot'),hat=scene.querySelector('.xt-snow-hat');
      if(figure){figure.style.setProperty('--melt-scale',String(1-progress*.67));figure.style.setProperty('--melt-y',`${progress*112}px`);figure.style.setProperty('--snow-opacity',String(clamp(1-(progress-.88)/.12,.08,1)));}
      if(puddle){puddle.style.setProperty('--puddle-w',`${70+progress*250}px`);puddle.style.setProperty('--puddle-h',`${18+progress*42}px`);}
      if(carrot){const t=clamp((progress-.72)/.28,0,1);carrot.style.setProperty('--carrot-rot',`${t*82}deg`);carrot.style.setProperty('--carrot-drop',`${t*82}px`);}
      if(hat){const t=clamp((progress-.62)/.38,0,1);hat.style.setProperty('--hat-rot',`${t*34}deg`);hat.style.setProperty('--hat-x',`${t*56}px`);hat.style.setProperty('--hat-y',`${t*144}px`);}
    }

    if(name==='moon'){
      const phases=[['🌑','New Moon'],['🌒','Waxing Crescent'],['🌓','First Quarter'],['🌔','Waxing Gibbous'],['🌕','Full Moon']];
      const index=Math.min(phases.length-1,Math.floor(progress*phases.length));
      const glyph=scene.querySelector('.xt-moon-glyph'),label=scene.querySelector('.xt-moon-label');
      if(glyph){glyph.textContent=phases[index][0];glyph.style.setProperty('--moon-glow',`${8+progress*20}px`);}if(label)label.textContent=phases[index][1];
    }

    if(name==='dino'){
      const wrap=scene.querySelector('.xt-dino-egg-wrap'),cracks=[...scene.querySelectorAll('.xt-dino-crack')];
      cracks.forEach((crack,i)=>{const threshold=.32+i*.18;crack.style.opacity=String(clamp((progress-threshold)/.08,0,1));});
      wrap?.classList.toggle('xt-wiggle',progress>.72&&!finished);
    }

    if(name==='dominoes'){
      const pieces=[...scene.querySelectorAll('.xt-domino')],n=pieces.length;
      pieces.forEach((piece,i)=>{const fallen=progress>=i/Math.max(1,n-1);piece.classList.toggle('fallen',fallen);if(!fallen){piece.style.transform=`translate(-50%,-100%) rotate(${(-4+Math.sin(i*.8)*4).toFixed(1)}deg)`;}else{piece.style.transform='translate(-50%,-100%) rotate(74deg) translateX(5px)';}});
    }

    if(name==='pacman'){
      const pac=scene.querySelector('.xt-pacman-char'),p=pointAlong(sceneState.route,progress);if(pac){pac.style.left=`${p.x}%`;pac.style.top=`${p.y}%`;pac.style.setProperty('--pac-angle',`${p.angle}deg`);}
      const pellets=[...scene.querySelectorAll('.xt-pellet')],n=pellets.length;pellets.forEach((pellet,i)=>pellet.style.opacity=progress>=(i+1)/n?'0':'1');
    }

    if(name==='autumn'){
      const leaves=[...scene.querySelectorAll('.xt-leaf')];
      leaves.forEach((leaf,i)=>{const meta=sceneState.leaves?.[i];if(!meta)return;const local=clamp((progress-meta.threshold)/Math.max(.08,1-meta.threshold),0,1);const hue=lerp(meta.hue,12,clamp(progress*1.2,0,1));leaf.style.background=`hsl(${hue} 76% ${44+Math.sin(i)*4}%)`;leaf.style.left=`${lerp(meta.left,meta.targetX,local).toFixed(2)}%`;leaf.style.top=`${lerp(meta.top,82+Math.sin(i*.9)*3,local).toFixed(2)}%`;leaf.style.transform=`translate(-50%,-50%) rotate(${meta.rot+local*(220+30*Math.sin(i))}deg)`;});
      scene.querySelector('.xt-leaf-pile')?.style.setProperty('--pile',String(.08+progress*.92));
    }

    if(finished&&!lastFinished){scene.classList.add('xt-finished');lastFinished=true;}
    if(!finished&&lastFinished){scene.classList.remove('xt-finished');lastFinished=false;}
  }

  function loop(now){
    if(activeTheme){
      const progress=progressNow(now);
      const remaining=parseRemainingSeconds();
      const finished=stage.classList.contains('finished')||remaining===0;
      renderTheme(activeTheme,progress,finished);
    }else{
      displayedRemaining=null;lastFinished=false;
    }
    raf=requestAnimationFrame(loop);
  }

  function initialise(){
    sceneLayer=document.getElementById('sceneLayer');stage=document.getElementById('countdownStage');stageStatus=document.getElementById('stageStatus');display=document.getElementById('countdownDisplay');message=document.getElementById('countdownMessage');minutesInput=document.getElementById('countdownMinutes');secondsInput=document.getElementById('countdownSeconds');themeGrid=document.getElementById('themeGrid');stageKicker=document.getElementById('stageKicker');themeDescription=document.getElementById('themeDescription');
    if(!sceneLayer||!stage||!display||!themeGrid||!stageKicker||!themeDescription){setTimeout(initialise,80);return;}

    addCards();

    themeGrid.addEventListener('click',event=>{
      const card=event.target.closest('.theme-card');if(!card)return;
      if(!card.dataset.customTheme){setTimeout(()=>deactivateCustom(),0);}
    });

    const sceneObserver=new MutationObserver(()=>{
      if(!activeTheme||rebuilding)return;
      const custom=sceneLayer.querySelector(`.xt-scene[data-xt-theme="${activeTheme}"]`);
      if(!custom) queueMicrotask(()=>buildScene(activeTheme));
    });
    sceneObserver.observe(sceneLayer,{childList:true,subtree:false});

    document.querySelectorAll('.theme-filters button').forEach(btn=>btn.addEventListener('click',()=>setTimeout(applyCurrentFilter,0)));

    const savedCore=storageGet('countdownTheme','sunrise');
    if(savedCore==='space'){
      const savedCustom=storageGet('customCountdownTheme','bomb');
      const restored=THEMES[savedCustom]?savedCustom:'bomb';
      activeTheme=restored;
      storageSet('customCountdownTheme',restored);
      setCustomUi(restored);
      buildScene(restored);
    }

    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(loop);
  }

  initialise();
})();

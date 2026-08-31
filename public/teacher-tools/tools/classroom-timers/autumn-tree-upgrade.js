(() => {
  'use strict';

  if (window.__autumnTreeUpgradeV1) return;
  window.__autumnTreeUpgradeV1 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'autumnTreeUpgradeStyleV1';
  style.textContent = `
    #countdownStage.theme-autumn .time-display-wrap{
      position:absolute!important;left:2.2%!important;right:auto!important;top:1.4%!important;bottom:auto!important;
      transform:none!important;width:auto!important;max-width:none!important;z-index:40!important;
      justify-items:start!important;text-align:left!important
    }
    #countdownStage.theme-autumn .timer-message{
      position:absolute!important;left:calc(100% + 12px)!important;top:2px!important;bottom:auto!important;
      margin:0!important;padding:4px 10px!important;white-space:nowrap!important;line-height:1.1!important
    }

    .xt-autumn.autumn-v2 .xt-leaf,
    .xt-autumn.autumn-v2 .xt-leaf-pile{display:none!important}

    .xt-autumn.autumn-v2{
      background:linear-gradient(#a8d7e8 0 66%,#c89c68 66%)!important;
    }

    .xt-autumn.autumn-v2 .xt-tree-branch.b4{
      left:68%;bottom:57%;width:168px;height:14px;
      transform-origin:0 50%;transform:rotate(218deg);
      background:linear-gradient(90deg,#684127,#7c4e2e 64%,#56331f);
      border-radius:99px;z-index:2
    }

    .autumn-v2-leaf{
      position:absolute;z-index:4;width:var(--leaf-size);height:calc(var(--leaf-size) * .72);
      border-radius:80% 20% 75% 25%;transform:translate(-50%,-50%) rotate(var(--leaf-rot));
      transform-origin:50% 50%;box-shadow:0 2px 2px rgba(76,45,24,.13);
      will-change:left,top,transform,background
    }

    .autumn-v2-ground-leaves{
      position:absolute;left:38%;right:3%;bottom:7%;height:13%;z-index:3;pointer-events:none;
      background:
        radial-gradient(ellipse at 18% 78%,rgba(112,66,35,.25) 0 4%,transparent 5%),
        radial-gradient(ellipse at 42% 82%,rgba(147,80,37,.28) 0 5%,transparent 6%),
        radial-gradient(ellipse at 67% 72%,rgba(125,69,34,.25) 0 4%,transparent 5%),
        radial-gradient(ellipse at 84% 88%,rgba(156,87,39,.25) 0 5%,transparent 6%);
      opacity:var(--ground-leaves,.08);transition:opacity .15s linear
    }

    .autumn-v2-bird{
      position:absolute;z-index:8;width:36px;height:27px;transform:translate(-50%,-50%);
      transform-origin:50% 60%;pointer-events:none;will-change:left,top,transform,opacity
    }
    .autumn-v2-bird .bird-body{
      position:absolute;left:6px;top:9px;width:23px;height:14px;border-radius:60% 55% 48% 54%;
      background:var(--bird-body);box-shadow:inset -4px -3px 5px rgba(60,70,80,.13),0 2px 2px rgba(0,0,0,.1)
    }
    .autumn-v2-bird .bird-head{
      position:absolute;right:2px;top:4px;width:14px;height:14px;border-radius:50%;background:var(--bird-head)
    }
    .autumn-v2-bird .bird-eye{
      position:absolute;right:6px;top:8px;width:2.5px;height:2.5px;border-radius:50%;background:#1f2730;z-index:4
    }
    .autumn-v2-bird .bird-beak{
      position:absolute;right:-5px;top:9px;width:8px;height:6px;background:#e69a36;
      clip-path:polygon(0 0,100% 50%,0 100%);z-index:3
    }
    .autumn-v2-bird .bird-wing{
      position:absolute;left:9px;top:11px;width:14px;height:9px;border-radius:80% 20% 75% 25%;
      background:var(--bird-wing);transform-origin:90% 50%;transform:rotate(var(--wing-angle,-10deg));z-index:3
    }
    .autumn-v2-bird .bird-tail{
      position:absolute;left:0;top:13px;width:11px;height:9px;background:var(--bird-wing);
      clip-path:polygon(100% 20%,0 0,35% 50%,0 100%,100% 75%)
    }
    .autumn-v2-bird .bird-foot{
      position:absolute;left:15px;top:21px;width:8px;height:5px;border-left:1.5px solid #765839;border-bottom:1.5px solid #765839;
      transform:skewX(-18deg)
    }
    .autumn-v2-bird.bird-one{--bird-body:#f5d879;--bird-head:#ffe69d;--bird-wing:#d9b84d}
    .autumn-v2-bird.bird-two{--bird-body:#8fcbed;--bird-head:#b9e2f7;--bird-wing:#579bc5}

    .autumn-v2-vulture{
      position:absolute;z-index:9;width:64px;height:46px;opacity:0;transform:translate(-50%,-50%);
      transform-origin:50% 70%;pointer-events:none;will-change:left,top,transform,opacity
    }
    .autumn-v2-vulture .v-body{
      position:absolute;left:12px;top:16px;width:37px;height:24px;border-radius:58% 52% 46% 45%;
      background:linear-gradient(145deg,#39383b,#17171a 72%);box-shadow:0 4px 4px rgba(0,0,0,.25)
    }
    .autumn-v2-vulture .v-back{
      position:absolute;left:4px;top:13px;width:35px;height:18px;border-radius:80% 20% 75% 25%;
      background:#242428;transform-origin:90% 65%;transform:rotate(var(--v-wing-angle,-18deg));z-index:2
    }
    .autumn-v2-vulture .v-neck{
      position:absolute;right:11px;top:11px;width:15px;height:22px;border-radius:45% 55% 55% 40%;background:#ddd2b8;transform:rotate(-14deg);z-index:3
    }
    .autumn-v2-vulture .v-head{
      position:absolute;right:4px;top:7px;width:16px;height:14px;border-radius:55% 48% 50% 42%;background:#9f5954;z-index:4
    }
    .autumn-v2-vulture .v-eye{
      position:absolute;right:8px;top:11px;width:3px;height:3px;border-radius:50%;background:#f5e96e;box-shadow:0 0 0 1px #151515;z-index:6
    }
    .autumn-v2-vulture .v-brow{
      position:absolute;right:7px;top:9px;width:8px;height:2px;background:#222;transform:rotate(-14deg);z-index:7
    }
    .autumn-v2-vulture .v-beak{
      position:absolute;right:-6px;top:14px;width:13px;height:9px;background:#d6ad4e;
      clip-path:polygon(0 0,100% 28%,62% 55%,77% 100%,25% 70%);z-index:5
    }
    .autumn-v2-vulture .v-tail{
      position:absolute;left:5px;top:27px;width:15px;height:14px;background:#1b1b1f;
      clip-path:polygon(100% 0,0 20%,38% 52%,5% 100%,100% 68%)
    }
    .autumn-v2-vulture .v-feet{
      position:absolute;left:29px;top:37px;width:17px;height:8px;border-left:2px solid #7b6842;border-right:2px solid #7b6842;z-index:1
    }

    @media(max-width:760px){
      #countdownStage.theme-autumn .time-display-wrap{left:2%!important;top:1%!important}
      #countdownStage.theme-autumn .timer-message{left:0!important;top:calc(100% + 5px)!important}
      .xt-autumn.autumn-v2 .xt-tree-branch.b4{left:72%;width:132px}
      .autumn-v2-bird{transform:translate(-50%,-50%) scale(.82)}
      .autumn-v2-vulture{transform:translate(-50%,-50%) scale(.82)}
    }
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const easeOut = t => 1-Math.pow(1-clamp(t,0,1),3);
  const quad = (a,b,c,t) => {
    const mt=1-t;
    return mt*mt*a+2*mt*t*b+t*t*c;
  };
  const mix = (a,b,t) => a.map((v,i)=>Math.round(lerp(v,b[i],t)));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let active = null;
  let raf = 0;

  function parseRemaining(){
    const parts=(display.textContent||'').trim().split(':').map(Number);
    if(parts.some(v=>!Number.isFinite(v))) return null;
    if(parts.length===2) return parts[0]*60+parts[1];
    if(parts.length===3) return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }

  function totalSeconds(){
    return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0));
  }

  function progressNow(now){
    const current=parseRemaining();
    if(current===null) return 0;
    const total=totalSeconds();
    const status=(stageStatus?.textContent||'').trim();
    const running=status==='Running';
    if(displayedRemaining===null||displayedRemaining!==current||status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }
    let estimated=current;
    if(running&&current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/total,0,1);
  }

  function shuffle(values){
    for(let i=values.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [values[i],values[j]]=[values[j],values[i]];
    }
    return values;
  }

  function leafColour(progress,variation){
    const t=clamp(progress/.54,0,1);
    let c;
    if(t<.43){
      c=mix([58,139,65],[104,159,66],t/.43);
    }else if(t<.75){
      c=mix([104,159,66],[190,145,48],(t-.43)/.32);
    }else{
      c=mix([190,145,48],[111,65,35],(t-.75)/.25);
    }
    return rgb(c.map(v=>clamp(v+variation,0,255)));
  }

  function cuteBirdMarkup(className){
    return `<div class="autumn-v2-bird ${className}"><i class="bird-tail"></i><i class="bird-body"></i><i class="bird-wing"></i><i class="bird-head"></i><i class="bird-eye"></i><i class="bird-beak"></i><i class="bird-foot"></i></div>`;
  }

  function vultureMarkup(){
    return `<div class="autumn-v2-vulture"><i class="v-tail"></i><i class="v-body"></i><i class="v-back"></i><i class="v-neck"></i><i class="v-head"></i><i class="v-eye"></i><i class="v-brow"></i><i class="v-beak"></i><i class="v-feet"></i></div>`;
  }

  function makeLeaves(scene){
    const clusters=[
      {x:56,y:30,rx:8,ry:9,count:10},
      {x:59,y:21,rx:8,ry:8,count:9},
      {x:65,y:27,rx:10,ry:10,count:12},
      {x:73,y:24,rx:10,ry:9,count:11},
      {x:80,y:33,rx:9,ry:10,count:10},
      {x:76,y:45,rx:10,ry:8,count:9},
      {x:64,y:43,rx:10,ry:9,count:9}
    ];
    const metas=[];
    clusters.forEach(cluster=>{
      for(let i=0;i<cluster.count;i++){
        const angle=Math.random()*Math.PI*2;
        const radius=Math.sqrt(Math.random());
        const left=cluster.x+Math.cos(angle)*cluster.rx*radius;
        const top=cluster.y+Math.sin(angle)*cluster.ry*radius;
        metas.push({
          left,top,
          size:12+Math.random()*13,
          rot:-75+Math.random()*150,
          spin:(Math.random()>.5?1:-1)*(180+Math.random()*220),
          finalX:clamp(left-9+Math.random()*18,38,94),
          finalY:86+Math.random()*7,
          sway:(Math.random()-.5)*12,
          phase:Math.random()*Math.PI*2,
          colourVariation:Math.round(-8+Math.random()*16),
          order:0
        });
      }
    });

    const order=shuffle(metas.map((_,i)=>i));
    order.forEach((leafIndex,rank)=>metas[leafIndex].order=rank);

    metas.forEach((meta,i)=>{
      const leaf=document.createElement('i');
      leaf.className='autumn-v2-leaf';
      leaf.dataset.autumnLeaf=String(i);
      leaf.style.left=`${meta.left}%`;
      leaf.style.top=`${meta.top}%`;
      leaf.style.setProperty('--leaf-size',`${meta.size.toFixed(1)}px`);
      leaf.style.setProperty('--leaf-rot',`${meta.rot.toFixed(1)}deg`);
      scene.appendChild(leaf);
    });
    return metas;
  }

  function upgradeScene(){
    const scene=sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    if(!scene){active=null;return;}
    if(scene.dataset.autumnV2==='true'){
      if(!active||active.scene!==scene){
        active={
          scene,
          leaves:[...scene.querySelectorAll('.autumn-v2-leaf')],
          metas:scene.__autumnLeafMeta||[],
          birdOne:scene.querySelector('.bird-one'),
          birdTwo:scene.querySelector('.bird-two'),
          vulture:scene.querySelector('.autumn-v2-vulture'),
          groundLeaves:scene.querySelector('.autumn-v2-ground-leaves')
        };
      }
      return;
    }

    scene.dataset.autumnV2='true';
    scene.classList.add('autumn-v2');
    scene.querySelectorAll('.xt-leaf,.xt-leaf-pile').forEach(el=>el.remove());

    if(!scene.querySelector('.xt-tree-branch.b4')){
      const branch=document.createElement('div');
      branch.className='xt-tree-branch b4';
      scene.appendChild(branch);
    }

    const groundLeaves=document.createElement('div');
    groundLeaves.className='autumn-v2-ground-leaves';
    scene.appendChild(groundLeaves);

    const metas=makeLeaves(scene);
    scene.__autumnLeafMeta=metas;

    scene.insertAdjacentHTML('beforeend',cuteBirdMarkup('bird-one'));
    scene.insertAdjacentHTML('beforeend',cuteBirdMarkup('bird-two'));
    scene.insertAdjacentHTML('beforeend',vultureMarkup());

    active={
      scene,
      leaves:[...scene.querySelectorAll('.autumn-v2-leaf')],
      metas,
      birdOne:scene.querySelector('.bird-one'),
      birdTwo:scene.querySelector('.bird-two'),
      vulture:scene.querySelector('.autumn-v2-vulture'),
      groundLeaves
    };
  }

  function renderBird(bird,progress,now,start,control,end,direction){
    if(!bird) return;
    const fly=clamp((progress-.55)/.15,0,1);
    if(fly<=0){
      bird.style.left=`${start.x}%`;
      bird.style.top=`${start.y}%`;
      bird.style.opacity='1';
      bird.style.transform=`translate(-50%,-50%) rotate(${direction<0?-3:3}deg)`;
      bird.style.setProperty('--wing-angle','-10deg');
      return;
    }
    const x=quad(start.x,control.x,end.x,fly);
    const y=quad(start.y,control.y,end.y,fly);
    const wing=Math.sin(now/48)*34;
    bird.style.left=`${x}%`;
    bird.style.top=`${y}%`;
    bird.style.opacity=String(clamp(1-(fly-.82)/.18,0,1));
    bird.style.transform=`translate(-50%,-50%) rotate(${direction<0?-16:14}deg) scale(${1+.08*Math.sin(fly*Math.PI)})`;
    bird.style.setProperty('--wing-angle',`${wing.toFixed(1)}deg`);
  }

  function renderVulture(vulture,progress,now){
    if(!vulture) return;
    const t=clamp((progress-.91)/.085,0,1);
    if(t<=0){
      vulture.style.opacity='0';
      vulture.style.left='108%';
      vulture.style.top='14%';
      return;
    }
    const x=quad(108,91,76,t);
    const y=quad(14,20,35,t);
    const flying=t<.92;
    const wing=flying ? -18+Math.sin(now/58)*28 : -8;
    vulture.style.opacity='1';
    vulture.style.left=`${x}%`;
    vulture.style.top=`${y}%`;
    vulture.style.setProperty('--v-wing-angle',`${wing.toFixed(1)}deg`);
    vulture.style.transform=`translate(-50%,-50%) rotate(${lerp(-13,0,t).toFixed(1)}deg) scale(${lerp(.82,1,t).toFixed(2)})`;
  }

  function render(now){
    upgradeScene();
    if(!active?.scene?.isConnected) return;

    const progress=progressNow(now);
    const count=active.leaves.length;
    let fallen=0;

    active.leaves.forEach((leaf,i)=>{
      const meta=active.metas[i];
      if(!meta) return;
      leaf.style.background=leafColour(progress,meta.colourVariation);

      const fallStart=.57+(meta.order/Math.max(1,count-1))*.30;
      const local=clamp((progress-fallStart)/.105,0,1);
      const e=easeOut(local);
      const sway=Math.sin(meta.phase+local*Math.PI*2)*meta.sway*local;
      const left=lerp(meta.left,meta.finalX,e)+sway;
      const top=lerp(meta.top,meta.finalY,e);
      const rotation=meta.rot+meta.spin*e;
      leaf.style.left=`${left.toFixed(2)}%`;
      leaf.style.top=`${top.toFixed(2)}%`;
      leaf.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg)`;
      leaf.style.zIndex=local>=1?'3':'4';
      if(local>=1) fallen++;
    });

    if(active.groundLeaves){
      active.groundLeaves.style.setProperty('--ground-leaves',String(.08+.74*(fallen/Math.max(1,count))));
    }

    renderBird(active.birdOne,progress,now,{x:57,y:35},{x:39,y:20},{x:-7,y:8},-1);
    renderBird(active.birdTwo,progress,now,{x:76,y:35},{x:88,y:18},{x:107,y:8},1);
    renderVulture(active.vulture,progress,now);
  }

  const observer=new MutationObserver(upgradeScene);
  observer.observe(sceneLayer,{childList:true,subtree:true});

  function tick(now){
    render(now);
    raf=requestAnimationFrame(tick);
  }

  cancelAnimationFrame(raf);
  upgradeScene();
  raf=requestAnimationFrame(tick);
})();
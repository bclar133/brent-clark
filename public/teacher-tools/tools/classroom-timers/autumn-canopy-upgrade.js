(() => {
  'use strict';

  if (window.__autumnCanopyUpgradeV2) return;
  window.__autumnCanopyUpgradeV2 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'autumnCanopyUpgradeStyleV2';
  style.textContent = `
    .xt-autumn.autumn-v2 .autumn-v2-leaf{display:none!important}
    .autumn-canopy-leaf{
      position:absolute;z-index:7;width:var(--leaf-size);height:calc(var(--leaf-size) * .74);
      border-radius:80% 20% 75% 25%;transform:translate(-50%,-50%) rotate(var(--leaf-rot));
      transform-origin:50% 50%;box-shadow:0 2px 2px rgba(58,43,24,.13);
      will-change:left,top,transform,background;pointer-events:none
    }
    .xt-autumn.autumn-v2 .autumn-v2-bird{
      z-index:24!important;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.16));
    }
    .xt-autumn.autumn-v2 .autumn-v2-vulture{z-index:25!important}
  `;
  document.head.appendChild(style);

  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const easeOut = t => 1-Math.pow(1-clamp(t,0,1),3);
  const mix = (a,b,t) => a.map((v,i)=>Math.round(lerp(v,b[i],t)));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  let active = null;
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
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
    const t=clamp(progress/.55,0,1);
    let colour;
    if(t<.42){
      colour=mix([48,137,58],[78,154,60],t/.42);
    }else if(t<.72){
      colour=mix([78,154,60],[181,139,43],(t-.42)/.30);
    }else{
      colour=mix([181,139,43],[104,59,31],(t-.72)/.28);
    }
    return rgb(colour.map(v=>clamp(v+variation,0,255)));
  }

  function buildDenseCanopy(scene){
    scene.querySelectorAll('.autumn-canopy-leaf').forEach(el=>el.remove());

    // Compact overlapping clusters trace each branch so very little wood is visible.
    // Extra clusters at every branch tip stop the ends looking bare.
    const clusters=[
      // upper-left branch, from trunk to tip
      {x:57,y:31,rx:6.0,ry:5.2,count:18},
      {x:51,y:27,rx:6.0,ry:5.2,count:18},
      {x:45,y:23,rx:6.2,ry:5.4,count:20},
      {x:38,y:19,rx:6.4,ry:5.5,count:24},
      {x:33,y:17,rx:6.0,ry:5.2,count:22},

      // high central / top growth
      {x:57,y:20,rx:6.8,ry:5.8,count:20},
      {x:63,y:17,rx:6.7,ry:5.7,count:20},
      {x:69,y:18,rx:6.5,ry:5.6,count:20},

      // upper-right branch to its tip
      {x:61,y:31,rx:6.0,ry:5.2,count:18},
      {x:66,y:26,rx:6.0,ry:5.2,count:18},
      {x:71,y:21,rx:6.2,ry:5.3,count:20},
      {x:76,y:17,rx:6.3,ry:5.4,count:23},

      // lower-left branch, from trunk to tip
      {x:55,y:43,rx:6.2,ry:5.2,count:18},
      {x:49,y:42,rx:6.2,ry:5.2,count:18},
      {x:43,y:40,rx:6.3,ry:5.3,count:20},
      {x:36,y:38,rx:6.4,ry:5.4,count:22},
      {x:29,y:36,rx:6.5,ry:5.5,count:25},

      // lower-right branch, from trunk to tip
      {x:61,y:43,rx:6.2,ry:5.2,count:18},
      {x:68,y:41,rx:6.2,ry:5.2,count:19},
      {x:75,y:38,rx:6.3,ry:5.3,count:20},
      {x:82,y:35,rx:6.4,ry:5.4,count:22},
      {x:89,y:32,rx:6.6,ry:5.5,count:25},

      // central fill to remove canopy holes around forks
      {x:53,y:34,rx:7.0,ry:6.0,count:22},
      {x:61,y:35,rx:7.0,ry:6.0,count:22},
      {x:68,y:33,rx:6.8,ry:5.8,count:20},
      {x:46,y:33,rx:6.8,ry:5.8,count:20}
    ];

    const metas=[];
    clusters.forEach(cluster=>{
      for(let i=0;i<cluster.count;i++){
        const angle=Math.random()*Math.PI*2;
        // Pull leaves toward the cluster centre; this creates a compact, overlapping canopy.
        const radius=Math.pow(Math.random(),.72);
        const left=cluster.x+Math.cos(angle)*cluster.rx*radius;
        const top=cluster.y+Math.sin(angle)*cluster.ry*radius;
        metas.push({
          left,
          top,
          size:15+Math.random()*11,
          rot:-80+Math.random()*160,
          spin:(Math.random()>.5?1:-1)*(170+Math.random()*250),
          finalX:clamp(left-7+Math.random()*14,20,97),
          finalY:85+Math.random()*8,
          sway:(Math.random()-.5)*7,
          phase:Math.random()*Math.PI*2,
          variation:Math.round(-7+Math.random()*14),
          order:0
        });
      }
    });

    const order=shuffle(metas.map((_,i)=>i));
    order.forEach((index,rank)=>metas[index].order=rank);

    const fragment=document.createDocumentFragment();
    const leaves=[];
    metas.forEach((meta,i)=>{
      const leaf=document.createElement('i');
      leaf.className='autumn-canopy-leaf';
      leaf.dataset.canopyLeaf=String(i);
      leaf.style.left=`${meta.left}%`;
      leaf.style.top=`${meta.top}%`;
      leaf.style.setProperty('--leaf-size',`${meta.size.toFixed(1)}px`);
      leaf.style.setProperty('--leaf-rot',`${meta.rot.toFixed(1)}deg`);
      fragment.appendChild(leaf);
      leaves.push(leaf);
    });
    scene.appendChild(fragment);
    return {leaves,metas};
  }

  function install(){
    const scene=sceneLayer.querySelector('.xt-autumn.autumn-v2[data-xt-theme="autumn"]');
    if(!scene){active=null;return;}
    if(scene.dataset.denseCanopyV2==='true'){
      if(!active||active.scene!==scene){
        active={
          scene,
          leaves:[...scene.querySelectorAll('.autumn-canopy-leaf')],
          metas:scene.__denseCanopyMetaV2||[],
          birdOne:scene.querySelector('.bird-one'),
          birdTwo:scene.querySelector('.bird-two')
        };
      }
      return;
    }

    scene.dataset.denseCanopyV2='true';
    delete scene.dataset.denseCanopyV1;
    scene.querySelectorAll('.autumn-v2-leaf,.autumn-canopy-leaf').forEach(el=>el.remove());
    const canopy=buildDenseCanopy(scene);
    scene.__denseCanopyMetaV2=canopy.metas;

    active={
      scene,
      leaves:canopy.leaves,
      metas:canopy.metas,
      birdOne:scene.querySelector('.bird-one'),
      birdTwo:scene.querySelector('.bird-two')
    };
  }

  function renderBird(bird,progress,now,rest,control,end,scale,direction){
    if(!bird) return;
    const fly=clamp((progress-.55)/.15,0,1);
    if(fly<=0){
      bird.style.left=`${rest.x}%`;
      bird.style.top=`${rest.y}%`;
      bird.style.opacity='1';
      bird.style.transform=`translate(-50%,-86%) rotate(${rest.angle}deg) scale(${scale})`;
      bird.style.setProperty('--wing-angle','-10deg');
      return;
    }

    const mt=1-fly;
    const x=mt*mt*rest.x+2*mt*fly*control.x+fly*fly*end.x;
    const y=mt*mt*rest.y+2*mt*fly*control.y+fly*fly*end.y;
    const wing=Math.sin(now/48)*34;
    bird.style.left=`${x}%`;
    bird.style.top=`${y}%`;
    bird.style.opacity=String(clamp(1-(fly-.82)/.18,0,1));
    bird.style.transform=`translate(-50%,-50%) rotate(${direction<0?-16:14}deg) scale(${(scale*(1+.08*Math.sin(fly*Math.PI))).toFixed(3)})`;
    bird.style.setProperty('--wing-angle',`${wing.toFixed(1)}deg`);
  }

  function render(now){
    install();
    if(!active?.scene?.isConnected) return;

    const progress=progressNow(now);
    const count=active.leaves.length;

    active.leaves.forEach((leaf,i)=>{
      const meta=active.metas[i];
      if(!meta) return;
      leaf.style.background=leafColour(progress,meta.variation);

      const fallStart=.58+(meta.order/Math.max(1,count-1))*.30;
      const local=clamp((progress-fallStart)/.095,0,1);
      const e=easeOut(local);
      const sway=Math.sin(meta.phase+local*Math.PI*2)*meta.sway*local;
      const left=lerp(meta.left,meta.finalX,e)+sway;
      const top=lerp(meta.top,meta.finalY,e);
      const rotation=meta.rot+meta.spin*e;
      leaf.style.left=`${left.toFixed(2)}%`;
      leaf.style.top=`${top.toFixed(2)}%`;
      leaf.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg)`;
      leaf.style.zIndex=local>=1?'3':'7';
    });

    // Birds remain clearly in front of the dense canopy and sit on branch lines.
    renderBird(active.birdOne,progress,now,{x:50.5,y:30.4,angle:-27},{x:31,y:16},{x:-7,y:7},.90,-1);
    renderBird(active.birdTwo,progress,now,{x:77.5,y:32.8,angle:8},{x:90,y:17},{x:107,y:8},1.08,1);
  }

  const observer=new MutationObserver(()=>install());
  observer.observe(sceneLayer,{childList:true,subtree:true});

  function tick(now){
    render(now);
    raf=requestAnimationFrame(tick);
  }

  install();
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(tick);
})();
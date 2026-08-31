(() => {
  'use strict';

  if (window.__autumnBalanceFixV2) return;
  window.__autumnBalanceFixV2 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  const display = document.getElementById('countdownDisplay');
  const stageStatus = document.getElementById('stageStatus');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !display) return;

  const style = document.createElement('style');
  style.id = 'autumnBalanceFixStyleV2';
  style.textContent = `
    .xt-autumn .xt-tree-branch{z-index:2!important}
    .xt-autumn .xt-tree-trunk{z-index:5!important}
    .autumn-balance-leaf{
      position:absolute;z-index:8;width:var(--leaf-size);height:calc(var(--leaf-size) * .74);
      border-radius:80% 20% 75% 25%;transform:translate(-50%,-50%) rotate(var(--leaf-rot));
      transform-origin:50% 50%;box-shadow:0 2px 2px rgba(58,43,24,.13);
      pointer-events:none;will-change:left,top,transform,background
    }
    .xt-autumn .autumn-v2-bird{z-index:24!important}
    .xt-autumn .autumn-v2-vulture{z-index:26!important}
  `;
  document.head.appendChild(style);

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(lerp(v,b[i],t)));
  const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
  const quad=(a,b,c,t)=>{const mt=1-t;return mt*mt*a+2*mt*t*b+t*t*c;};

  let active=null;
  let displayedRemaining=null;
  let displayChangedAt=performance.now();
  let lastStatus='';

  function hash01(n){
    const x=Math.sin((n+1)*12.9898+78.233)*43758.5453;
    return x-Math.floor(x);
  }

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
    const status=(stageStatus?.textContent||'').trim();
    if(displayedRemaining===null||displayedRemaining!==current||status!==lastStatus){
      displayedRemaining=current;
      displayChangedAt=now;
      lastStatus=status;
    }
    let estimated=current;
    if(status==='Running'&&current>0) estimated=Math.max(0,current-(now-displayChangedAt)/1000);
    return clamp(1-estimated/totalSeconds(),0,1);
  }

  function finalColour(index){
    const h=hash01(index+930);
    if(h<.26) return mix([86,50,29],[122,61,34],h/.26);
    if(h<.55) return mix([122,61,34],[169,82,39],(h-.26)/.29);
    if(h<.80) return mix([169,82,39],[177,58,39],(h-.55)/.25);
    return mix([177,58,39],[143,41,40],(h-.80)/.20);
  }

  function leafColour(progress,index){
    const t=clamp(progress/.55,0,1);
    const target=finalColour(index);
    let c;
    if(t<.40) c=mix([48,137,58],[77,153,60],t/.40);
    else if(t<.70) c=mix([77,153,60],[184,139,43],(t-.40)/.30);
    else c=mix([184,139,43],target,(t-.70)/.30);
    const shade=(hash01(index+401)-.5)*12;
    return rgb(c.map(v=>clamp(Math.round(v+shade),0,255)));
  }

  function branchSegment(branch,sceneRect){
    const markerA=document.createElement('i');
    const markerB=document.createElement('i');
    const common='position:absolute;width:1px;height:1px;top:50%;pointer-events:none;opacity:0;';
    markerA.style.cssText=common+'left:0;';
    markerB.style.cssText=common+'right:0;';
    branch.append(markerA,markerB);
    const a=markerA.getBoundingClientRect();
    const b=markerB.getBoundingClientRect();
    markerA.remove(); markerB.remove();
    if(!sceneRect.width||!sceneRect.height) return null;
    return {
      x1:(a.left-sceneRect.left)/sceneRect.width*100,
      y1:(a.top-sceneRect.top)/sceneRect.height*100,
      x2:(b.left-sceneRect.left)/sceneRect.width*100,
      y2:(b.top-sceneRect.top)/sceneRect.height*100
    };
  }

  function addAlongSegment(metas,segment,seed,sceneRect){
    const dx=segment.x2-segment.x1,dy=segment.y2-segment.y1;
    const px=dx*sceneRect.width/100,py=dy*sceneRect.height/100;
    const pixelLength=Math.hypot(px,py);
    if(pixelLength<28) return;
    const mag=Math.hypot(dx,dy)||1;
    const nx=-dy/mag,ny=dx/mag;
    const count=Math.max(34,Math.round(pixelLength/4.4));
    const width=3.1;

    for(let i=0;i<count;i++){
      const u=clamp((i+.18+hash01(seed+i)*.64)/count,0,1);
      const across=(hash01(seed+i+100)-.5)*2*width;
      const along=(hash01(seed+i+200)-.5)*1.0;
      const left=segment.x1+dx*u+nx*across+(dx/mag)*along;
      const top=segment.y1+dy*u+ny*across+(dy/mag)*along;
      metas.push({
        left,top,
        size:15+hash01(seed+i+300)*10,
        rot:-78+hash01(seed+i+400)*156,
        spin:(hash01(seed+i+500)>.5?1:-1)*(180+hash01(seed+i+600)*210),
        finalX:clamp(left-6+hash01(seed+i+700)*12,4,97),
        finalY:86+hash01(seed+i+800)*7,
        sway:(hash01(seed+i+900)-.5)*6,
        phase:hash01(seed+i+1000)*Math.PI*2,
        order:0
      });
    }

    // Extra foliage at the branch tip so bare wood never protrudes past the canopy.
    const tipIsSecond=segment.x2>segment.x1 || Math.abs(segment.x2-segment.x1)<2;
    const tx=tipIsSecond?segment.x2:segment.x1;
    const ty=tipIsSecond?segment.y2:segment.y1;
    for(let i=0;i<14;i++){
      const angle=hash01(seed+2000+i)*Math.PI*2;
      const radius=Math.sqrt(hash01(seed+2100+i))*3.8;
      const left=tx+Math.cos(angle)*radius;
      const top=ty+Math.sin(angle)*radius;
      metas.push({
        left,top,
        size:15+hash01(seed+2200+i)*10,
        rot:-80+hash01(seed+2300+i)*160,
        spin:(hash01(seed+2400+i)>.5?1:-1)*(180+hash01(seed+2500+i)*210),
        finalX:clamp(left-6+hash01(seed+2600+i)*12,4,97),
        finalY:86+hash01(seed+2700+i)*7,
        sway:(hash01(seed+2800+i)-.5)*6,
        phase:hash01(seed+2900+i)*Math.PI*2,
        order:0
      });
    }
  }

  function nearestPerch(segments,sceneRect){
    const target={x:76.5,y:43.5};
    let best=null;
    let bestD=Infinity;
    segments.forEach(segment=>{
      const vx=segment.x2-segment.x1,vy=segment.y2-segment.y1;
      const len2=vx*vx+vy*vy||1;
      const u=clamp(((target.x-segment.x1)*vx+(target.y-segment.y1)*vy)/len2,.12,.88);
      const x=segment.x1+vx*u,y=segment.y1+vy*u;
      const d=Math.hypot(x-target.x,y-target.y);
      if(d<bestD){
        let angle=Math.atan2(vy*sceneRect.height,vx*sceneRect.width)*180/Math.PI;
        if(angle>90) angle-=180;
        if(angle<-90) angle+=180;
        bestD=d;
        best={x,y:y-2.65,angle};
      }
    });
    return best||{x:76.5,y:43.2,angle:-15};
  }

  function build(scene){
    scene.querySelectorAll('.autumn-balance-leaf').forEach(el=>el.remove());
    const sceneRect=scene.getBoundingClientRect();
    const branches=[...scene.querySelectorAll('.xt-tree-branch')];
    const segments=branches.map(branch=>branchSegment(branch,sceneRect)).filter(Boolean);
    const metas=[];
    segments.forEach((segment,index)=>addAlongSegment(metas,segment,100+index*5000,sceneRect));

    const ranked=metas.map((_,i)=>({i,key:hash01(i+1500)})).sort((a,b)=>a.key-b.key);
    ranked.forEach((item,rank)=>metas[item.i].order=rank);

    const fragment=document.createDocumentFragment();
    const leaves=[];
    metas.forEach((meta,i)=>{
      const leaf=document.createElement('i');
      leaf.className='autumn-balance-leaf';
      leaf.style.left=`${meta.left}%`;
      leaf.style.top=`${meta.top}%`;
      leaf.style.setProperty('--leaf-size',`${meta.size.toFixed(1)}px`);
      leaf.style.setProperty('--leaf-rot',`${meta.rot.toFixed(1)}deg`);
      fragment.appendChild(leaf);
      leaves.push(leaf);
    });
    scene.appendChild(fragment);
    return {scene,leaves,metas,segments,perch:nearestPerch(segments,sceneRect)};
  }

  function ensureScene(){
    const scene=sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    if(!scene){active=null;return null;}
    if(!active||active.scene!==scene||!scene.querySelector('.autumn-balance-leaf')) active=build(scene);
    return active;
  }

  function renderLeaves(instance,progress){
    const count=instance.leaves.length;
    instance.leaves.forEach((leaf,i)=>{
      const meta=instance.metas[i];
      leaf.style.background=leafColour(progress,i+2200);
      const fallStart=.585+(meta.order/Math.max(1,count-1))*.295;
      const local=clamp((progress-fallStart)/.095,0,1);
      const e=easeOut(local);
      const sway=Math.sin(meta.phase+local*Math.PI*2)*meta.sway*local;
      const left=lerp(meta.left,meta.finalX,e)+sway;
      const top=lerp(meta.top,meta.finalY,e);
      leaf.style.left=`${left.toFixed(2)}%`;
      leaf.style.top=`${top.toFixed(2)}%`;
      leaf.style.transform=`translate(-50%,-50%) rotate(${(meta.rot+meta.spin*e).toFixed(1)}deg)`;
      leaf.style.zIndex=local>=1?'3':'8';
    });
  }

  function renderVulture(instance,progress,now){
    const vulture=instance.scene.querySelector('.autumn-v2-vulture');
    if(!vulture) return;
    const t=clamp((progress-.91)/.085,0,1);
    if(t<=0) return;

    const perch=instance.perch;
    const x=quad(108,93,perch.x,t);
    const y=quad(18,28,perch.y,t);
    const flying=t<.90;
    const wing=flying ? -18+Math.sin(now/58)*28 : -7;
    const scale=lerp(.82,1,t);
    const rotation=flying ? lerp(8,perch.angle,t) : perch.angle;

    vulture.style.opacity='1';
    vulture.style.left=`${x}%`;
    vulture.style.top=`${y}%`;
    vulture.style.setProperty('--v-wing-angle',`${wing.toFixed(1)}deg`);
    vulture.style.transform=`translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg) scaleX(-1) scale(${scale.toFixed(3)})`;
  }

  function tick(now){
    const instance=ensureScene();
    if(instance){
      const progress=progressNow(now);
      renderLeaves(instance,progress);
      renderVulture(instance,progress,now);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize',()=>{
    if(active?.scene?.isConnected){
      active.scene.querySelectorAll('.autumn-balance-leaf').forEach(el=>el.remove());
      active=null;
    }
  });

  requestAnimationFrame(tick);
})();

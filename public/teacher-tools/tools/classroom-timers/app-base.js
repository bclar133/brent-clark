(() => {
  'use strict';

  const style = document.createElement('style');
  style.id = 'classroomTimersPresentationAndRacerV3';
  style.textContent = `
    .presentation-toolbar[hidden] { display:none !important; }
    body.presentation-mode .presentation-toolbar:not([hidden]) { display:flex; }

    .race-scene {
      background:
        radial-gradient(circle at 13% 23%, rgba(33,105,45,.22) 0 20px, transparent 21px),
        radial-gradient(circle at 80% 72%, rgba(29,96,40,.20) 0 24px, transparent 25px),
        linear-gradient(#84ca70,#70b95f);
    }
    .race-cloud { display:none !important; }
    .race-road svg { overflow:visible; shape-rendering:geometricPrecision; }
    .race-road .race-shoulder { fill:none; stroke:#d8c69a; stroke-width:142; stroke-linecap:round; stroke-linejoin:round; }
    .race-road .race-edge { fill:none; stroke:#f5f6ef; stroke-width:130; stroke-linecap:round; stroke-linejoin:round; }
    .race-road .race-path { fill:none; stroke:#3d4145 !important; stroke-width:118 !important; stroke-linecap:round !important; stroke-linejoin:round !important; }
    .race-road .race-centre { fill:none; stroke:#f6dd7b !important; stroke-width:5 !important; stroke-dasharray:24 22 !important; stroke-linecap:round; opacity:.92; }

    .race-car {
      width:76px !important;
      height:40px !important;
      transform:translate(-50%,-50%) !important;
      transform-origin:50% 50%;
      filter:drop-shadow(0 7px 6px rgba(0,0,0,.34));
    }
    /* While moving, app-core.js rotates the car to the live track tangent.
       At zero, lock it to the exact final tangent so it does not snap to 0deg. */
    .timer-stage.finished .race-car { rotate:var(--finish-heading,0deg) !important; }

    .race-car .car-body {
      inset:2px 1px !important;
      border-radius:15px 23px 23px 15px !important;
      background:linear-gradient(180deg,#ff6a5f 0%,#e53032 50%,#b91924 100%) !important;
      box-shadow:inset 0 0 0 2px rgba(88,0,8,.25),inset 0 7px 8px rgba(255,255,255,.2);
    }
    .race-car .car-body::before {
      content:""; position:absolute; right:4px; top:7px; width:5px; height:8px; border-radius:3px;
      background:#fff4b6; box-shadow:0 18px 0 #fff4b6;
    }
    .race-car .car-body::after {
      content:""; position:absolute; left:4px; top:8px; width:5px; height:7px; border-radius:2px;
      background:#8f1018; box-shadow:0 17px 0 #8f1018;
    }
    .race-car .car-cabin {
      left:27px !important; top:6px !important; width:30px !important; height:28px !important;
      border:0 !important; border-radius:8px 12px 12px 8px !important;
      background:linear-gradient(90deg,#183848 0 45%,#5aa8c2 48% 72%,#183848 75%) !important;
      clip-path:polygon(13% 0,82% 0,100% 24%,100% 76%,82% 100%,13% 100%,0 73%,0 27%);
      box-shadow:inset 0 0 0 2px rgba(255,255,255,.16);
    }
    .race-car .car-wheel {
      width:10px !important; height:5px !important; border:0 !important; border-radius:2px !important;
      background:#17191b !important; bottom:auto !important;
    }
    .race-car .car-wheel.w1 { left:18px !important; top:-2px !important; box-shadow:0 39px 0 #17191b; }
    .race-car .car-wheel.w2 { right:16px !important; top:-2px !important; box-shadow:0 39px 0 #17191b; }

    .finish-flag {
      width:18px !important; height:112px !important;
      background:conic-gradient(#fff 25%,#111 0 50%,#fff 0 75%,#111 0) 0 0 / 18px 18px !important;
      transform:translate(-50%,-50%) !important;
      border:2px solid rgba(255,255,255,.7);
      box-shadow:0 4px 10px rgba(0,0,0,.28);
    }
    .finish-flag::before { display:none !important; }

    /* Ramp Ball: Rube Goldberg machine */
    .ramp-scene {
      background:
        radial-gradient(circle at 15% 18%,rgba(255,255,255,.08) 0 3px,transparent 4px),
        radial-gradient(circle at 81% 37%,rgba(255,255,255,.06) 0 3px,transparent 4px),
        linear-gradient(145deg,#243650,#101925) !important;
    }
    .ramp-svg { filter:drop-shadow(0 8px 7px rgba(0,0,0,.35)) !important; }
    .ramp-svg line.rube-ramp { display:block !important; stroke:#e3ad4c !important; stroke-width:14 !important; stroke-linecap:round !important; }
    .ramp-svg line.rube-drop { stroke:transparent !important; }
    .ramp-svg circle.rube-bumper { fill:#ef6658; stroke:#ffd77a; stroke-width:5; filter:drop-shadow(0 4px 3px rgba(0,0,0,.3)); }
    .ramp-svg circle.rube-bolt { fill:#f4d47c; stroke:#6c4822; stroke-width:4; }
    .rube-arrow { position:absolute; z-index:2; color:rgba(255,255,255,.42); font-size:25px; font-weight:900; transform:translate(-50%,-50%); }
    .rube-bucket {
      position:absolute; z-index:4; width:86px; height:64px; transform:translateX(-50%);
      border:6px solid #d5dde5; border-top:10px solid #f5f8fa; border-radius:8px 8px 22px 22px;
      background:linear-gradient(90deg,#6f7c88,#c7d0d8 45%,#75828d);
      box-shadow:0 10px 16px rgba(0,0,0,.35),inset 0 7px 8px rgba(255,255,255,.16);
      clip-path:polygon(5% 0,95% 0,82% 100%,18% 100%);
    }
    .rube-bucket::before {
      content:""; position:absolute; left:9px; right:9px; top:-11px; height:16px; border-radius:50%;
      background:#19222d; box-shadow:inset 0 3px 4px rgba(0,0,0,.6);
    }
    .rube-bucket::after {
      content:"BUCKET"; position:absolute; left:50%; top:23px; transform:translateX(-50%);
      color:#34404a; font-size:10px; font-weight:1000; letter-spacing:.08em;
    }
    .ramp-ball { z-index:8 !important; width:40px !important; height:40px !important; transition:filter .15s ease; }
    .timer-stage.finished .ramp-ball { animation:rubeBucketDrop .55s cubic-bezier(.35,.05,.7,.25) forwards; }
    @keyframes rubeBucketDrop {
      0% { transform:translate(-50%,-50%) translateY(0) scale(1); opacity:1; }
      70% { transform:translate(-50%,-50%) translateY(34px) scale(.92); opacity:1; }
      100% { transform:translate(-50%,-50%) translateY(49px) scale(.68); opacity:.15; }
    }
  `;
  document.head.appendChild(style);

  const sceneLayer = document.getElementById('sceneLayer');
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

  function buildSmoothRoadPath() {
    const count=8,startX=90,endX=910;
    const mid=300+(Math.random()*70-35);
    const amp1=75+Math.random()*45,amp2=18+Math.random()*25;
    const phase1=Math.random()*Math.PI*2,phase2=Math.random()*Math.PI*2;
    const cycles=1.15+Math.random()*.45;
    const points=[];

    for(let i=0;i<count;i++) {
      const t=i/(count-1),x=startX+(endX-startX)*t;
      let y=mid+Math.sin(phase1+t*Math.PI*cycles)*amp1+Math.sin(phase2+t*Math.PI*cycles*1.85)*amp2;
      points.push({x,y:clamp(y,125,475)});
    }
    points[1].y=points[0].y+(points[2].y-points[0].y)*.35;
    points[count-2].y=points[count-1].y+(points[count-3].y-points[count-1].y)*.35;

    let d=`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    const tension=.72;
    for(let i=0;i<points.length-1;i++) {
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      const cp1x=p1.x+(p2.x-p0.x)*tension/6,cp1y=p1.y+(p2.y-p0.y)*tension/6;
      const cp2x=p2.x-(p3.x-p1.x)*tension/6,cp2y=p2.y-(p3.y-p1.y)*tension/6;
      d+=` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function tangentAt(path,distance) {
    const len=path.getTotalLength();
    const d1=clamp(distance-10,0,len),d2=clamp(distance+10,0,len);
    const p1=path.getPointAtLength(d1),p2=path.getPointAtLength(d2);
    const rect=sceneLayer.getBoundingClientRect();
    const dx=(p2.x-p1.x)*(rect.width/1000),dy=(p2.y-p1.y)*(rect.height/600);
    const mag=Math.hypot(dx,dy)||1;
    return {angle:Math.atan2(dy,dx)*180/Math.PI,tx:dx/mag,ty:dy/mag};
  }

  function orientAt(path,distance,element,offset=0) {
    if(!path||!element||!sceneLayer) return;
    const tangent=tangentAt(path,distance);
    element.style.rotate=`${tangent.angle+offset}deg`;
  }

  function upgradeRoad() {
    if(!sceneLayer) return;
    const svg=sceneLayer.querySelector('.race-road svg');
    const roadPath=svg?.querySelector('.race-path');
    if(!svg||!roadPath||svg.dataset.racerV3==='true') return;

    svg.dataset.racerV3='true';
    const d=buildSmoothRoadPath();
    roadPath.setAttribute('d',d);

    const oldCentre=[...svg.querySelectorAll('path')].find(p=>p!==roadPath);
    if(oldCentre) { oldCentre.setAttribute('d',d); oldCentre.classList.add('race-centre'); }

    const shoulder=roadPath.cloneNode(false);
    shoulder.setAttribute('class','race-shoulder'); shoulder.setAttribute('d',d);
    const edge=roadPath.cloneNode(false);
    edge.setAttribute('class','race-edge'); edge.setAttribute('d',d);
    svg.insertBefore(shoulder,roadPath);
    svg.insertBefore(edge,roadPath);

    requestAnimationFrame(() => {
      const len=roadPath.getTotalLength();
      const start=roadPath.getPointAtLength(0),end=roadPath.getPointAtLength(len);
      const car=sceneLayer.querySelector('.race-car'),finish=sceneLayer.querySelector('.finish-flag');
      const rect=sceneLayer.getBoundingClientRect();
      if(!rect.width||!rect.height) return;

      if(car) {
        car.style.left=`${start.x/10}%`;
        car.style.top=`${start.y/6}%`;
        orientAt(roadPath,0,car,0);
      }

      const finalTangent=tangentAt(roadPath,len);
      if(car) car.style.setProperty('--finish-heading',`${finalTangent.angle}deg`);

      if(finish) {
        // The car is 76px long and points along the road tangent. Put the finish line
        // one half-car-length beyond the path endpoint so its front bumper touches it at zero.
        const frontOffsetPx=38;
        const endX=end.x*rect.width/1000,endY=end.y*rect.height/600;
        const lineX=endX+finalTangent.tx*frontOffsetPx;
        const lineY=endY+finalTangent.ty*frontOffsetPx;
        finish.style.left=`${lineX/rect.width*100}%`;
        finish.style.top=`${lineY/rect.height*100}%`;
        orientAt(roadPath,len,finish,0);
      }
    });
  }

  function upgradeRampMachine() {
    if(!sceneLayer) return;
    const scene=sceneLayer.querySelector('.ramp-scene');
    const svg=scene?.querySelector('.ramp-svg');
    if(!scene||!svg||svg.dataset.rubeV2==='true') return;

    const lines=[...svg.querySelectorAll('line')];
    if(!lines.length) return;
    svg.dataset.rubeV2='true';

    lines.forEach((line,i) => {
      line.classList.add(i%2===0?'rube-ramp':'rube-drop');
      if(i%2!==0) return;
      const x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1'));
      const x2=Number(line.getAttribute('x2')),y2=Number(line.getAttribute('y2'));
      for(const [x,y] of [[x1,y1],[x2,y2]]) {
        const bolt=document.createElementNS('http://www.w3.org/2000/svg','circle');
        bolt.setAttribute('cx',x); bolt.setAttribute('cy',y); bolt.setAttribute('r','8'); bolt.setAttribute('class','rube-bolt');
        svg.appendChild(bolt);
      }
      if(i<lines.length-1) {
        const bumper=document.createElementNS('http://www.w3.org/2000/svg','circle');
        bumper.setAttribute('cx',x2); bumper.setAttribute('cy',y2+17); bumper.setAttribute('r','12'); bumper.setAttribute('class','rube-bumper');
        svg.appendChild(bumper);
      }
    });

    lines.filter((_,i)=>i%2===0).forEach(line => {
      const x1=Number(line.getAttribute('x1')),x2=Number(line.getAttribute('x2'));
      const y1=Number(line.getAttribute('y1')),y2=Number(line.getAttribute('y2'));
      const arrow=document.createElement('div');
      arrow.className='rube-arrow'; arrow.textContent=x2>x1?'↘':'↙';
      arrow.style.left=`${((x1+x2)/2)/10}%`; arrow.style.top=`${((y1+y2)/2)/6}%`;
      scene.appendChild(arrow);
    });

    const finalLine=lines[lines.length-1];
    const bucket=document.createElement('div');
    bucket.className='rube-bucket';
    bucket.style.left=`${Number(finalLine.getAttribute('x2'))/10}%`;
    bucket.style.top=`${Math.min(91,Number(finalLine.getAttribute('y2'))/6+3.2)}%`;
    scene.appendChild(bucket);
  }

  if(sceneLayer) {
    const upgradeScenes=()=>{ upgradeRoad(); upgradeRampMachine(); };
    new MutationObserver(upgradeScenes).observe(sceneLayer,{childList:true,subtree:true});
    upgradeScenes();
  }

  const current=document.currentScript;
  const core=document.createElement('script');
  core.src=new URL('app-core.js?v=2',current.src).href;
  core.async=false;
  document.body.appendChild(core);
})();

(() => {
  'use strict';

  if (document.getElementById('coasterUpgradeStyleV8')) return;

  const sceneLayer = document.getElementById('sceneLayer');
  const stage = document.getElementById('countdownStage');
  const stageStatus = document.getElementById('stageStatus');
  const display = document.getElementById('countdownDisplay');
  const minutesInput = document.getElementById('countdownMinutes');
  const secondsInput = document.getElementById('countdownSeconds');
  if (!sceneLayer || !stage || !display) return;

  const style = document.createElement('style');
  style.id = 'coasterUpgradeStyleV8';
  style.textContent = `
    .coaster-scene.coaster-upgraded{
      position:absolute;inset:0;overflow:hidden;
      background:linear-gradient(#79caee 0 72.5%,#76b95d 72.5% 100%)!important;
    }
    .coaster-scene.coaster-upgraded:after{
      content:'';position:absolute;left:-6%;right:-6%;top:67.8%;height:7%;z-index:0;
      border-radius:50% 50% 0 0;background:#579b49;opacity:.23;pointer-events:none;
    }
    .coaster-horizon{
      position:absolute;left:-5%;right:-5%;top:58%;height:15%;z-index:1;pointer-events:none;opacity:.42;
      background:
        radial-gradient(ellipse at 7% 100%,#679c66 0 13%,transparent 13.5%),
        radial-gradient(ellipse at 22% 100%,#5f9660 0 17%,transparent 17.5%),
        radial-gradient(ellipse at 41% 100%,#6aa06a 0 14%,transparent 14.5%),
        radial-gradient(ellipse at 61% 100%,#5b925c 0 18%,transparent 18.5%),
        radial-gradient(ellipse at 80% 100%,#679d67 0 15%,transparent 15.5%),
        radial-gradient(ellipse at 96% 100%,#5c925e 0 17%,transparent 17.5%);
      filter:saturate(.76) brightness(.97);
    }
    .coaster-birds{display:none!important}
    .coaster-upgrade-track,.coaster-hitch-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .coaster-upgrade-track{z-index:2}.coaster-hitch-layer{z-index:5;overflow:visible}
    .coaster-supports .support-post{
      stroke:#6a5843;stroke-width:7;stroke-linecap:butt;opacity:.72;
      filter:drop-shadow(0 2px 1px rgba(0,0,0,.12));
    }
    .coaster-supports .support-foot{stroke:#5b4b3a;stroke-width:13;stroke-linecap:round;opacity:.58}
    .coaster-rail-shadow{fill:none;stroke:rgba(38,30,24,.24);stroke-width:22;stroke-linecap:round;stroke-linejoin:round}
    .coaster-rail{fill:none;stroke:#594936;stroke-width:15;stroke-linecap:round;stroke-linejoin:round}
    .coaster-sleepers{fill:none;stroke:#e0bd79;stroke-width:4;stroke-dasharray:5 12;stroke-linecap:butt}
    .coaster-hitch{stroke:#282b31;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 2px 1px rgba(0,0,0,.25))}
    .coaster-car-upgraded{position:absolute;z-index:7;width:48px;height:27px;transform-origin:50% 50%;filter:drop-shadow(0 4px 4px rgba(0,0,0,.23));pointer-events:none}
    .coaster-car-upgraded .car-shell{position:absolute;left:2px;right:2px;top:3px;height:19px;border-radius:7px 10px 8px 8px;background:linear-gradient(180deg,#ff6658 0 52%,#e6423b 53% 100%);border:2px solid rgba(133,34,31,.55);box-shadow:inset 0 2px 0 rgba(255,255,255,.18)}
    .coaster-car-upgraded .car-shell:before{content:'';position:absolute;left:8px;right:8px;top:-5px;height:8px;border-radius:5px 5px 2px 2px;background:#c82f31;border:2px solid rgba(111,26,29,.5)}
    .coaster-car-upgraded .seat{position:absolute;top:3px;width:8px;height:11px;border-radius:6px 6px 3px 3px;background:#242a31}
    .coaster-car-upgraded .seat.s1{left:10px}.coaster-car-upgraded .seat.s2{left:27px}
    .coaster-car-upgraded .wheel{position:absolute;bottom:-1px;width:10px;height:10px;border-radius:50%;background:radial-gradient(circle,#8f9ba6 0 29%,#22272d 31% 100%);border:1px solid #12161a}
    .coaster-car-upgraded .wheel.w1{left:8px}.coaster-car-upgraded .wheel.w2{right:8px}
    .coaster-car-upgraded.rear .car-shell{background:linear-gradient(180deg,#ff7868 0 52%,#e94a42 53% 100%)}
    .coaster-scene .coaster-circus-tent{left:7.2%!important;bottom:28.2%!important;transform:scale(.48)!important;transform-origin:left bottom!important;opacity:.34!important;filter:brightness(.70) saturate(.56) contrast(.92) drop-shadow(0 1px 1px rgba(0,0,0,.08))!important}
    .coaster-scene .coaster-ferris{right:7%!important;bottom:27.2%!important;transform:scale(.62)!important;transform-origin:right bottom!important;opacity:.43!important;filter:brightness(.78) saturate(.62) drop-shadow(0 2px 2px rgba(0,0,0,.08))!important}
    .coaster-scene .coaster-carousel{right:27%!important;bottom:27%!important;transform:scale(.58)!important;transform-origin:right bottom!important;opacity:.40!important;filter:brightness(.78) saturate(.62) drop-shadow(0 2px 2px rgba(0,0,0,.08))!important}
    .coaster-scene .coaster-swing-ride{left:27%!important;bottom:26.8%!important;transform:scale(.58)!important;transform-origin:left bottom!important;opacity:.38!important;filter:brightness(.78) saturate(.62)!important}
    #countdownStage.theme-coaster .time-display-wrap{position:absolute!important;left:3.5%!important;right:auto!important;top:4%!important;bottom:auto!important;transform:none!important;width:min(30%,310px)!important;z-index:20!important;justify-items:start!important;text-align:left!important}
    #countdownStage.theme-coaster #countdownDisplay,#countdownStage.theme-coaster .time-display{width:auto!important;max-width:100%!important;font-size:clamp(3rem,5vw,5.2rem)!important;line-height:.98!important;padding:7px 16px 9px!important;text-align:left!important;white-space:nowrap!important}
    #countdownStage.theme-coaster #countdownMessage,#countdownStage.theme-coaster .timer-message{margin-top:6px!important;padding:5px 10px!important;font-size:clamp(.78rem,.95vw,.94rem)!important;text-align:left!important}
    @media(max-width:760px){
      .coaster-car-upgraded{width:42px;height:24px}.coaster-car-upgraded .car-shell{height:17px}.coaster-car-upgraded .seat{height:10px;width:7px}.coaster-car-upgraded .wheel{width:9px;height:9px}
      #countdownStage.theme-coaster .time-display-wrap{left:3%!important;top:3%!important;width:min(44%,220px)!important}
      #countdownStage.theme-coaster #countdownDisplay,#countdownStage.theme-coaster .time-display{font-size:clamp(2.2rem,7vw,3.3rem)!important;padding:6px 11px 7px!important}
      .coaster-horizon{top:60%;height:13%;opacity:.36}
      .coaster-scene .coaster-circus-tent{left:4%!important;bottom:28%!important;transform:scale(.48)!important}
      .coaster-scene .coaster-ferris{right:4%!important;bottom:27.2%!important;transform:scale(.58)!important}
      .coaster-scene .coaster-carousel{right:24%!important;bottom:27%!important;transform:scale(.54)!important}
      .coaster-scene .coaster-swing-ride{left:28%!important;bottom:26.8%!important;transform:scale(.52)!important}
      .coaster-supports .support-post{stroke-width:6}
    }
  `;
  document.head.appendChild(style);

  const TRACK_D = 'M 35 500 C 92 500 123 458 172 447 C 225 435 253 315 302 292 C 355 267 389 423 446 437 C 488 447 516 401 550 390 C 620 390 670 340 670 275 C 670 195 620 140 550 140 C 480 140 430 195 430 275 C 430 340 480 390 550 390 C 618 390 658 315 714 286 C 774 255 814 402 875 417 C 927 430 960 367 995 355';
  const SUPPORT_XS = [118,205,296,405,714,805,890,960];
  const GROUND_Y = 520;
  const SUPPORT_TOP_OFFSET = 10;

  let trackedScene = null;
  let path = null;
  let frontCar = null;
  let rearCar = null;
  let hitch = null;
  let displayedRemaining = null;
  let displayChangedAt = performance.now();
  let lastStatus = '';
  let raf = 0;

  function parseRemainingSeconds(){const parts=display.textContent.trim().split(':').map(Number);if(parts.some(n=>!Number.isFinite(n)))return null;if(parts.length===2)return parts[0]*60+parts[1];if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];return null}
  function totalSeconds(){return Math.max(1,(Number(minutesInput?.value)||0)*60+(Number(secondsInput?.value)||0))}
  function continuousProgress(now,running){const current=parseRemainingSeconds();if(current===null)return 0;if(displayedRemaining===null||current!==displayedRemaining){displayedRemaining=current;displayChangedAt=now}let estimated=current;if(running&&current>0)estimated=Math.max(0,current-(now-displayChangedAt)/1000);return Math.max(0,Math.min(1,1-estimated/totalSeconds()))}
  function carMarkup(extraClass){return `<div class="coaster-car-upgraded ${extraClass}"><div class="car-shell"><i class="seat s1"></i><i class="seat s2"></i></div><i class="wheel w1"></i><i class="wheel w2"></i></div>`}
  function buildSupportsMarkup(){return `<g class="coaster-supports">${SUPPORT_XS.map(x=>`<line class="support-post" data-x="${x}" x1="${x}" y1="${GROUND_Y}" x2="${x}" y2="${GROUND_Y}"/><line class="support-foot" data-x="${x}" x1="${x-10}" y1="${GROUND_Y}" x2="${x+10}" y2="${GROUND_Y}"/>`).join('')}</g>`}
  function findTrackYAtX(targetX){if(!path)return GROUND_Y-40;const length=path.getTotalLength();let bestDx=Infinity;let bestY=null;for(let pos=0;pos<=length;pos+=1.5){const point=path.getPointAtLength(pos);const dx=Math.abs(point.x-targetX);if(dx+.02<bestDx){bestDx=dx;bestY=point.y}else if(Math.abs(dx-bestDx)<=.35&&(bestY===null||point.y>bestY)){bestY=point.y}}return bestY??GROUND_Y-40}
  function updateSupportGeometry(){if(!trackedScene||!path)return;trackedScene.querySelectorAll('.coaster-supports .support-post').forEach(line=>{const x=Number(line.dataset.x);const trackY=findTrackYAtX(x);const topY=Math.min(GROUND_Y-12,trackY+SUPPORT_TOP_OFFSET);line.setAttribute('x1',x.toFixed(1));line.setAttribute('x2',x.toFixed(1));line.setAttribute('y1',topY.toFixed(1));line.setAttribute('y2',GROUND_Y.toFixed(1))});trackedScene.querySelectorAll('.coaster-supports .support-foot').forEach(foot=>{const x=Number(foot.dataset.x);foot.setAttribute('x1',(x-10).toFixed(1));foot.setAttribute('x2',(x+10).toFixed(1));foot.setAttribute('y1',GROUND_Y.toFixed(1));foot.setAttribute('y2',GROUND_Y.toFixed(1))})}
  function upgradeScene(scene,now){if(!scene||scene.classList.contains('coaster-upgraded'))return;scene.classList.add('coaster-upgraded');scene.innerHTML=`<div class="coaster-horizon" aria-hidden="true"></div><svg class="coaster-upgrade-track" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">${buildSupportsMarkup()}<path class="coaster-rail-shadow" d="${TRACK_D}"/><path class="coaster-rail" d="${TRACK_D}"/><path class="coaster-sleepers" d="${TRACK_D}"/></svg><svg class="coaster-hitch-layer" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><line class="coaster-hitch" x1="0" y1="0" x2="0" y2="0"/></svg>${carMarkup('rear')}${carMarkup('front')}`;const svg=scene.querySelector('.coaster-upgrade-track');path=svg?.querySelector('.coaster-rail');const cars=[...scene.querySelectorAll('.coaster-car-upgraded')];rearCar=cars.find(c=>c.classList.contains('rear'))||null;frontCar=cars.find(c=>c.classList.contains('front'))||null;hitch=scene.querySelector('.coaster-hitch');trackedScene=scene;displayedRemaining=parseRemainingSeconds();displayChangedAt=now;lastStatus=stageStatus?.textContent.trim()||'';updateSupportGeometry()}
  function placeCar(car,distance,length){if(!car||!path)return null;const scene=trackedScene;const rect=scene.getBoundingClientRect();if(!rect.width||!rect.height)return null;const d=Math.max(0,Math.min(length,distance));const p=path.getPointAtLength(d);const p2=path.getPointAtLength(Math.min(length,d+4));const p0=path.getPointAtLength(Math.max(0,d-4));const sx=rect.width/1000;const sy=rect.height/600;const dx=(p2.x-p0.x)*sx;const dy=(p2.y-p0.y)*sy;const mag=Math.hypot(dx,dy)||1;const angle=Math.atan2(dy,dx)*180/Math.PI;const nx=dy/mag;const ny=-dx/mag;const lift=rect.width<700?8:10;const cxPx=p.x*sx+nx*lift;const cyPx=p.y*sy+ny*lift;const cx=cxPx/sx;const cy=cyPx/sy;car.style.left=`${(cx/10).toFixed(3)}%`;car.style.top=`${(cy/6).toFixed(3)}%`;car.style.transform=`translate(-50%,-50%) rotate(${angle.toFixed(2)}deg)`;return{x:cx,y:cy,angle}}
  function renderTrain(progress){if(!path||!frontCar||!rearCar||!hitch)return;const length=path.getTotalLength();if(!length)return;const spacing=54;const frontDistance=spacing+progress*Math.max(0,length-spacing);const rearDistance=Math.max(0,frontDistance-spacing);const front=placeCar(frontCar,frontDistance,length);const rear=placeCar(rearCar,rearDistance,length);if(!front||!rear)return;hitch.setAttribute('x1',rear.x.toFixed(2));hitch.setAttribute('y1',rear.y.toFixed(2));hitch.setAttribute('x2',front.x.toFixed(2));hitch.setAttribute('y2',front.y.toFixed(2))}
  function loop(now){const scene=sceneLayer.querySelector('.coaster-scene');if(!scene){trackedScene=null;path=frontCar=rearCar=hitch=null;displayedRemaining=null;lastStatus='';raf=requestAnimationFrame(loop);return}if(scene!==trackedScene||!scene.classList.contains('coaster-upgraded'))upgradeScene(scene,now);if(!path){raf=requestAnimationFrame(loop);return}const status=stageStatus?.textContent.trim()||'';const running=status==='Running';if(status!==lastStatus){lastStatus=status;displayedRemaining=parseRemainingSeconds();displayChangedAt=now}renderTrain(continuousProgress(now,running));raf=requestAnimationFrame(loop)}
  const sceneObserver=new MutationObserver(()=>{const scene=sceneLayer.querySelector('.coaster-scene');if(scene&&!scene.classList.contains('coaster-upgraded'))upgradeScene(scene,performance.now())});sceneObserver.observe(sceneLayer,{childList:true,subtree:true});window.addEventListener('resize',()=>{updateSupportGeometry();renderTrain(continuousProgress(performance.now(),stageStatus?.textContent.trim()==='Running'))});cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
})();
(() => {
  'use strict';

  if (window.__sceneGeometryFixV2) return;
  window.__sceneGeometryFixV2 = true;

  const sceneLayer = document.getElementById('sceneLayer');
  if (!sceneLayer) return;

  function fixPlant() {
    const scene = sceneLayer.querySelector('.plant-scene');
    const stem = scene?.querySelector('.plant-stem');
    const pot = scene?.querySelector('.plant-pot');
    if (!scene || !stem || !pot) return;

    let bridge = scene.querySelector('.plant-stem-bridge-v2');
    if (!bridge) {
      bridge = document.createElement('div');
      bridge.className = 'plant-stem-bridge-v2';
      bridge.setAttribute('aria-hidden', 'true');
      scene.insertBefore(bridge, pot);
    }

    const sceneRect = scene.getBoundingClientRect();
    const stemRect = stem.getBoundingClientRect();
    const potRect = pot.getBoundingClientRect();
    if (!sceneRect.width || !sceneRect.height || !stemRect.width || !potRect.height) return;

    const x = stemRect.left - sceneRect.left + stemRect.width / 2;
    const startY = stemRect.bottom - sceneRect.top - 3;
    const overlap = Math.max(18, Math.min(34, potRect.height * 0.3));
    const endY = potRect.top - sceneRect.top + overlap;
    const height = Math.max(8, endY - startY);

    Object.assign(bridge.style, {
      position: 'absolute',
      left: `${x.toFixed(1)}px`,
      top: `${startY.toFixed(1)}px`,
      width: `${Math.max(9, stemRect.width).toFixed(1)}px`,
      height: `${height.toFixed(1)}px`,
      transform: 'translateX(-50%)',
      transformOrigin: 'top center',
      borderRadius: '0 0 8px 8px',
      background: '#2f8d4d',
      zIndex: '4',
      pointerEvents: 'none'
    });
  }

  function branchBase(branch, sceneRect) {
    const marker = document.createElement('i');
    marker.style.cssText = 'position:absolute;left:0;top:50%;width:1px;height:1px;opacity:0;pointer-events:none;';
    branch.appendChild(marker);
    const r = marker.getBoundingClientRect();
    marker.remove();
    return {
      x: r.left - sceneRect.left,
      y: r.top - sceneRect.top
    };
  }

  function addBranchConnector(scene, trunk, branch, key) {
    const sceneRect = scene.getBoundingClientRect();
    const trunkRect = trunk.getBoundingClientRect();
    if (!sceneRect.width || !sceneRect.height || !trunkRect.width) return;

    const base = branchBase(branch, sceneRect);
    const trunkLeft = trunkRect.left - sceneRect.left;
    const trunkRight = trunkRect.right - sceneRect.left;
    const trunkTop = trunkRect.top - sceneRect.top;
    const trunkBottom = trunkRect.bottom - sceneRect.top;
    const trunkX = Math.max(trunkLeft + 6, Math.min(trunkRight - 6, base.x));
    const trunkY = Math.max(trunkTop + 8, Math.min(trunkBottom - 8, base.y));
    const dx = trunkX - base.x;
    const dy = trunkY - base.y;
    const length = Math.hypot(dx, dy);

    let connector = scene.querySelector(`.autumn-branch-connector-v2[data-branch="${key}"]`);
    if (length < 3) {
      connector?.remove();
      return;
    }

    if (!connector) {
      connector = document.createElement('i');
      connector.className = 'autumn-branch-connector-v2';
      connector.dataset.branch = key;
      connector.setAttribute('aria-hidden', 'true');
      scene.insertBefore(connector, trunk);
    }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    Object.assign(connector.style, {
      position: 'absolute',
      left: `${base.x.toFixed(1)}px`,
      top: `${base.y.toFixed(1)}px`,
      width: `${(length + 10).toFixed(1)}px`,
      height: `${Math.max(13, branch.getBoundingClientRect().height * 0.72).toFixed(1)}px`,
      transform: `translateY(-50%) rotate(${angle.toFixed(2)}deg)`,
      transformOrigin: '0 50%',
      borderRadius: '999px',
      background: 'linear-gradient(90deg,#684127,#7c4e2e)',
      zIndex: '2',
      pointerEvents: 'none'
    });
  }

  function fixAutumn() {
    const scene = sceneLayer.querySelector('.xt-autumn[data-xt-theme="autumn"]');
    const trunk = scene?.querySelector('.xt-tree-trunk');
    if (!scene || !trunk) return;

    const b4 = scene.querySelector('.xt-tree-branch.b4');
    if (b4) {
      const sceneRect = scene.getBoundingClientRect();
      const trunkRect = trunk.getBoundingClientRect();
      if (sceneRect.width && sceneRect.height && trunkRect.width) {
        const trunkCenterX = trunkRect.left - sceneRect.left + trunkRect.width / 2;
        const joinY = trunkRect.top - sceneRect.top + Math.max(8, Math.min(16, trunkRect.height * 0.05));
        b4.style.left = `${trunkCenterX.toFixed(1)}px`;
        b4.style.top = `${(joinY - b4.offsetHeight / 2).toFixed(1)}px`;
        b4.style.bottom = 'auto';
      }
    }

    [...scene.querySelectorAll('.xt-tree-branch')].forEach((branch, index) => {
      addBranchConnector(scene, trunk, branch, branch.className.match(/\bb\d+\b/)?.[0] || String(index));
    });
  }

  let queued = false;
  function sync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fixPlant();
      fixAutumn();
    });
  }

  const observer = new MutationObserver(sync);
  observer.observe(sceneLayer, { childList: true, subtree: true });
  window.addEventListener('resize', sync);

  sync();
  setTimeout(sync, 100);
  setTimeout(sync, 400);
})();

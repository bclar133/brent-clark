(() => {
  'use strict';

  if (window.__sceneConnectionFixV1) return;
  window.__sceneConnectionFixV1 = true;

  const style = document.createElement('style');
  style.id = 'sceneConnectionFixStyleV1';
  style.textContent = `
    /* Growing Plant: extend the stem behind the pot rim so there can never be a visible gap. */
    .plant-scene .plant-stem::after {
      content:'';
      position:absolute;
      left:0;
      right:0;
      bottom:-34px;
      height:38px;
      border-radius:0 0 8px 8px;
      background:#2f8d4d;
      pointer-events:none;
    }

    /* Autumn Tree: extend the added upper-left branch back into the trunk.
       Branches sit behind the trunk, so the overlap creates a natural joined fork. */
    .xt-autumn .xt-tree-branch.b4::before {
      content:'';
      position:absolute;
      left:-36px;
      top:0;
      width:42px;
      height:100%;
      border-radius:99px;
      background:#684127;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
})();

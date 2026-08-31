(() => {
  'use strict';

  function install() {
    const host = document.querySelector('.theme-card[data-theme="space"]:not([data-custom-theme])');
    if (!host) {
      setTimeout(install, 80);
      return;
    }
    if (host.dataset.expandedHostFixed === 'true') return;
    host.dataset.expandedHostFixed = 'true';

    // The hidden Space Journey card is used only to drive the existing timer
    // engine. Stop its synthetic click from bubbling to the custom-theme
    // cleanup listener, while still allowing its own original click handler
    // to run on the target.
    host.addEventListener('click', event => event.stopPropagation(), true);
  }

  install();
})();

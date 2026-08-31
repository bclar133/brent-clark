(() => {
  'use strict';

  if (document.getElementById('removeVolcanoStyleV1')) return;

  const style = document.createElement('style');
  style.id = 'removeVolcanoStyleV1';
  style.textContent = `.theme-card[data-custom-theme="volcano"]{display:none!important}`;
  document.head.appendChild(style);

  let fallbackQueued = false;

  function cleanVolcano() {
    document.querySelectorAll('.theme-card[data-custom-theme="volcano"]').forEach(card => card.remove());

    try {
      if (JSON.parse(localStorage.getItem('ttTimers.customCountdownTheme') || 'null') === 'volcano') {
        localStorage.setItem('ttTimers.customCountdownTheme', JSON.stringify('bomb'));
      }
    } catch {}

    const stage = document.getElementById('countdownStage');
    if (!stage?.classList.contains('theme-volcano') || fallbackQueued) return;

    const bombCard = document.querySelector('.theme-card[data-custom-theme="bomb"]');
    if (!bombCard) return;

    fallbackQueued = true;
    queueMicrotask(() => {
      bombCard.click();
      fallbackQueued = false;
    });
  }

  const observer = new MutationObserver(cleanVolcano);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  cleanVolcano();
})();

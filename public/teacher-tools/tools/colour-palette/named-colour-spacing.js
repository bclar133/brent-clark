(() => {
  'use strict';

  function spacedColourName(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  const selector = [
    '.named-colour-name',
    '#namedColourSelectedName',
    '#gameV2Target',
    '.game-v2-colour-summary div > span:first-child'
  ].join(', ');

  function formatNode(node) {
    if (!(node instanceof Element) || !node.matches(selector)) return;
    const current = node.textContent.trim();
    const spaced = spacedColourName(current);
    if (spaced && spaced !== current) node.textContent = spaced;
  }

  function updateNames(root = document) {
    if (root instanceof Element) formatNode(root);
    root.querySelectorAll?.(selector).forEach(formatNode);
  }

  updateNames();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target instanceof Element) {
        formatNode(mutation.target);
        updateNames(mutation.target);
      }
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          formatNode(node);
          updateNames(node);
        } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
          formatNode(node.parentElement);
        }
      });
    });
  });

  observer.observe(document.body, { childList:true, subtree:true, characterData:true });
})();

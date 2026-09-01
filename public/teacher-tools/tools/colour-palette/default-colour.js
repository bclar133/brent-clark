(() => {
  'use strict';

  const hexInput = document.getElementById('hexInput');
  if (!hexInput) return;

  const hue = Math.random() * 360;
  const saturation = 35 + Math.random() * 65;
  const value = 100;

  const c = value / 100 * saturation / 100;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value / 100 - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  const toHex = (channel) => Math.round((channel + m) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  const randomHex = `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  hexInput.value = randomHex;
  hexInput.dispatchEvent(new Event('input', { bubbles:true }));
})();

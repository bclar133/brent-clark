(() => {
  'use strict';

  const inputs = [
    document.getElementById('redInput'),
    document.getElementById('greenInput'),
    document.getElementById('blueInput')
  ].filter(Boolean);

  inputs.forEach((input) => {
    if (input.closest('.rgb-stepper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'rgb-stepper';

    const buttons = document.createElement('div');
    buttons.className = 'rgb-stepper-buttons';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'rgb-stepper-button';
    up.dataset.direction = 'up';
    up.setAttribute('aria-label', `Increase ${input.id === 'redInput' ? 'red' : input.id === 'greenInput' ? 'green' : 'blue'} value`);
    up.title = 'Increase by 1';

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'rgb-stepper-button';
    down.dataset.direction = 'down';
    down.setAttribute('aria-label', `Decrease ${input.id === 'redInput' ? 'red' : input.id === 'greenInput' ? 'green' : 'blue'} value`);
    down.title = 'Decrease by 1';

    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(input, buttons);
    buttons.append(up, down);

    function change(direction, amount = 1) {
      const current = Number(input.value) || 0;
      const min = Number(input.min || 0);
      const max = Number(input.max || 255);
      const next = Math.min(max, Math.max(min, current + direction * amount));
      input.value = String(next);
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.focus({ preventScroll:true });
    }

    up.addEventListener('click', (event) => change(1, event.shiftKey ? 10 : 1));
    down.addEventListener('click', (event) => change(-1, event.shiftKey ? 10 : 1));
  });
})();

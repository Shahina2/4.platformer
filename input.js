// Отслеживает клавиши и экранные кнопки. Отдаёт состояние в игру.
export const input = {
  left: false,
  right: false,
  jump: false,
};

const keyMap = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'jump',
  KeyW: 'jump',
};

window.addEventListener('keydown', (e) => {
  const action = keyMap[e.code];
  if (!action) return;
  e.preventDefault();
  input[action] = true;
});

window.addEventListener('keyup', (e) => {
  const action = keyMap[e.code];
  if (!action) return;
  e.preventDefault();
  input[action] = false;
});

// Экранные кнопки (телефон). Поддержка удержания: pointerdown/up.
export function bindTouchControls() {
  document.querySelectorAll('.touch-controls button').forEach((btn) => {
    const action = btn.dataset.key;
    const press = (e) => { e.preventDefault(); input[action] = true; };
    const release = (e) => { e.preventDefault(); input[action] = false; };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  });
}

export function resetInput() {
  input.left = input.right = input.jump = false;
}
// Keyboard and mouse input: movement keys, sneak, jammer, pause, restart, mute, and the
// click that throws a coin at a point on the floor. Coordinates come back in canvas space.
import { KEYS } from './config.js';

function matches(list, code) {
  return list.includes(code);
}

/** Track the keys held down, and the latest click, for one game session. */
export function makeInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false, sneak: false,
    click: null,
    pressed: new Set(),
  };

  function onKeyDown(event) {
    if (matches(KEYS.up, event.code)) input.up = true;
    if (matches(KEYS.down, event.code)) input.down = true;
    if (matches(KEYS.left, event.code)) input.left = true;
    if (matches(KEYS.right, event.code)) input.right = true;
    if (matches(KEYS.sneak, event.code)) input.sneak = true;
    input.pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    if (matches(KEYS.up, event.code)) input.up = false;
    if (matches(KEYS.down, event.code)) input.down = false;
    if (matches(KEYS.left, event.code)) input.left = false;
    if (matches(KEYS.right, event.code)) input.right = false;
    if (matches(KEYS.sneak, event.code)) input.sneak = false;
  }

  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onClick);
  return input;
}

/** The movement vector from the keys held down right now. */
export function moveVector(input) {
  return {
    x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    y: (input.down ? 1 : 0) - (input.up ? 1 : 0),
  };
}

/** True once for a key pressed since the last frame, then forgotten. */
export function wasPressed(input, codes) {
  return codes.some((code) => {
    if (!input.pressed.has(code)) return false;
    input.pressed.delete(code);
    return true;
  });
}

/** Take the latest click (if any) and clear it. */
export function takeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}

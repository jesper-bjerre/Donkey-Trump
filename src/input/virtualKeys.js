// On-screen controls feed the game by dispatching the same keyboard events a
// physical keyboard would, so every scene, menu and overlay works unchanged.

export const VIRTUAL_KEYS = Object.freeze({
  left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  jump: { key: ' ', code: 'Space', keyCode: 32 },
  confirm: { key: 'Enter', code: 'Enter', keyCode: 13 },
  pause: { key: 'p', code: 'KeyP', keyCode: 80 },
  mute: { key: 'm', code: 'KeyM', keyCode: 77 },
});

export function createVirtualKeyboardEvent(type, action, win = globalThis.window) {
  const def = VIRTUAL_KEYS[action];
  if (!def) throw new Error(`Unknown virtual key ${action}.`);
  const event = new win.KeyboardEvent(type, { key: def.key, code: def.code, bubbles: true, cancelable: true });
  // Phaser reads the legacy keyCode/which, which the constructor cannot set.
  Object.defineProperty(event, 'keyCode', { value: def.keyCode });
  Object.defineProperty(event, 'which', { value: def.keyCode });
  return event;
}

// Tracks held virtual keys so each press/release is sent exactly once.
export class VirtualKeyboard {
  constructor({ target = globalThis.window } = {}) {
    this.target = target;
    this.held = new Set();
  }

  press(action) {
    if (this.held.has(action)) return false;
    this.held.add(action);
    this.target.dispatchEvent(createVirtualKeyboardEvent('keydown', action, this.target));
    return true;
  }

  release(action) {
    if (!this.held.has(action)) return false;
    this.held.delete(action);
    this.target.dispatchEvent(createVirtualKeyboardEvent('keyup', action, this.target));
    return true;
  }

  tap(action) {
    this.press(action);
    this.release(action);
  }

  // Makes the held set match `actions`, pressing and releasing only the difference.
  setHeld(actions, group) {
    const wanted = new Set(actions);
    for (const action of [...this.held]) if (group.includes(action) && !wanted.has(action)) this.release(action);
    for (const action of wanted) this.press(action);
  }

  releaseAll() {
    for (const action of [...this.held]) this.release(action);
  }
}

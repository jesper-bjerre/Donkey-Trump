// Translates keyboard state into a plain per-frame input snapshot so gameplay
// systems never touch Phaser key objects directly.

export const KEY_BINDINGS = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
  jump: ['SPACE'],
  confirm: ['ENTER'],
  pause: ['P'],
  escape: ['ESC'],
  mute: ['M'],
};

export const EMPTY_INPUT = Object.freeze({
  left: false,
  right: false,
  up: false,
  down: false,
  upPressed: false,
  downPressed: false,
  jumpPressed: false,
  jumpHeld: false,
  confirmPressed: false,
  pausePressed: false,
  escapePressed: false,
  mutePressed: false,
});

export class InputMapper {
  // keyboard: Phaser.Input.Keyboard.KeyboardPlugin
  constructor(keyboard) {
    this.keys = {};
    // Presses are recorded from key 'down' events rather than polled, so a tap whose
    // keydown and keyup land in the same frame is not lost.
    this.pressed = new Set();
    for (const [action, codes] of Object.entries(KEY_BINDINGS)) {
      this.keys[action] = codes.map((code) => {
        const key = keyboard.addKey(code, true);
        key.on('down', () => this.pressed.add(action));
        return key;
      });
    }
  }

  isDown(action) {
    return this.keys[action].some((key) => key.isDown);
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  read() {
    const snapshot = {
      left: this.isDown('left'),
      right: this.isDown('right'),
      up: this.isDown('up'),
      down: this.isDown('down'),
      upPressed: this.wasPressed('up'),
      downPressed: this.wasPressed('down'),
      jumpPressed: this.wasPressed('jump'),
      jumpHeld: this.isDown('jump'),
      confirmPressed: this.wasPressed('confirm'),
      pausePressed: this.wasPressed('pause'),
      escapePressed: this.wasPressed('escape'),
      mutePressed: this.wasPressed('mute'),
    };
    this.pressed.clear();
    return snapshot;
  }
}

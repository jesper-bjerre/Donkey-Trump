import { vi } from 'vitest';

// Chainable stand-in for Phaser text and image objects.
export function createFakeGameObject(initialText = '') {
  const object = {
    text: initialText,
    visible: true,
    setText: vi.fn((value) => {
      object.text = value;
      return object;
    }),
  };
  for (const method of ['setOrigin', 'setDepth', 'setStyle', 'setVisible', 'setScale', 'setInteractive', 'on', 'setStrokeStyle', 'setAlpha', 'destroy', 'add', 'removeAll']) {
    object[method] = vi.fn((value) => {
      if (method === 'setVisible') object.visible = value;
      return object;
    });
  }
  return object;
}

export function createFakeScene() {
  const created = [];
  const scene = {
    created,
    scale: { width: 800, height: 600 },
    add: {
      text: vi.fn((_x, _y, text) => {
        const object = createFakeGameObject(text);
        created.push(object);
        return object;
      }),
      image: vi.fn(() => createFakeGameObject()),
      rectangle: vi.fn(() => createFakeGameObject()),
      container: vi.fn(() => createFakeGameObject()),
    },
    textures: { exists: vi.fn(() => true) },
    input: { keyboard: { once: vi.fn(), on: vi.fn() } },
    scene: { start: vi.fn() },
    tweens: { add: vi.fn(() => ({ stop: vi.fn() })) },
  };
  return scene;
}

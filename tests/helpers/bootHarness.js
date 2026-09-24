import { vi } from 'vitest';
import { BootScene } from '../../src/scenes/BootScene.js';
import { createFakeScene } from './fakeScene.js';

export const SUPPORTED = { canvas: true, webgl: true, keyboard: true };

// Runs BootScene.preload/create against fake loader and scene plugins.
export function runBoot({ manifest, environment = SUPPORTED, failLoads = false, failKey = 'any' }) {
  const scene = new BootScene({ manifest, environment });
  const fake = createFakeScene();
  const handlers = {};
  scene.add = fake.add;
  scene.scale = fake.scale;
  scene.input = fake.input;
  scene.scene = fake.scene;
  scene.load = {
    svg: vi.fn(),
    spritesheet: vi.fn(),
    image: vi.fn(),
    audio: vi.fn(),
    json: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
  };
  scene.preload();
  if (failLoads) handlers.loaderror?.({ key: failKey });
  scene.create();
  return { scene, fake };
}

import { PlayScene } from '../../src/scenes/PlayScene.js';
import { PlayerController } from '../../src/controllers/PlayerController.js';
import { LadderSystem } from '../../src/systems/LadderSystem.js';
import { WORLD_GRAVITY_Y, MAX_FALL_SPEED } from '../../src/config/physics.js';
import { createFakeSprite } from './fakeSprite.js';

export const FRAME_MS = 1000 / 60;

// A PlayScene with real mechanics systems and a fake Arcade sprite.
export function createMechanicsScene({ slopes, ladders, spawn }) {
  const scene = new PlayScene();
  scene.player = createFakeSprite({ centerX: spawn.x, bottom: spawn.y, width: 16, height: 30 });
  scene.playerController = new PlayerController(scene.player);
  scene.ladderSystem = new LadderSystem({ player: scene.player, controller: scene.playerController, ladders });
  scene.level = { girders: slopes, ladders };
  scene.now = 0;
  return scene;
}

// One frame: Arcade integrates first, then Scene.update runs the mechanics step.
export function frame(scene, input) {
  const body = scene.player.body;
  const dt = FRAME_MS / 1000;
  if (body.allowGravity) body.velocity.y = Math.min(MAX_FALL_SPEED, body.velocity.y + WORLD_GRAVITY_Y * dt);
  body.x += body.velocity.x * dt;
  body.y += body.velocity.y * dt;
  scene.now += FRAME_MS;
  scene.stepMechanics(input, scene.now);
}

export const feet = (scene) => scene.player.body.y + scene.player.body.height;
export const centerX = (scene) => scene.player.body.x + scene.player.body.width / 2;

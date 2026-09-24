import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { WORLD_GRAVITY_Y } from './config/physics.js';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export { WORLD_GRAVITY_Y };

export function createGameConfig() {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0b14',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: WORLD_GRAVITY_Y },
        debug: false,
      },
    },
    scene: [BootScene, TitleScene, IntroScene, PlayScene],
  };
}

export function bootstrapGame(doc = document) {
  const host = doc.getElementById('game');
  if (!host) {
    throw new Error('Donkey Trump could not start: missing #game container element.');
  }
  return new Phaser.Game(createGameConfig());
}

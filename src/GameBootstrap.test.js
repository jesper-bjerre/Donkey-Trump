import { describe, expect, it } from 'vitest';
import * as Phaser from 'phaser';
import { bootstrapGame, createGameConfig } from './GameBootstrap.js';

describe('createGameConfig', () => {
  it('uses Arcade Physics with debug drawing disabled', () => {
    const config = createGameConfig();
    expect(config.physics.default).toBe('arcade');
    expect(config.physics.arcade.debug).toBe(false);
  });

  it('mounts into the #game element with automatic renderer selection', () => {
    const config = createGameConfig();
    expect(config.type).toBe(Phaser.AUTO);
    expect(config.parent).toBe('game');
    expect(typeof config.width).toBe('number');
    expect(typeof config.height).toBe('number');
  });

  it('registers BootScene, TitleScene and PlayScene in boot order', () => {
    const keys = createGameConfig().scene.map((SceneClass) => new SceneClass().sys.settings.key);
    expect(keys).toEqual(['BootScene', 'TitleScene', 'PlayScene']);
  });
});

describe('bootstrapGame', () => {
  it('throws a descriptive error when the #game container is missing', () => {
    const doc = { getElementById: () => null };
    expect(() => bootstrapGame(doc)).toThrow(/game/);
  });
});

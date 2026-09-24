import { describe, expect, it, vi } from 'vitest';
import {
  getCoreAnimationDefinitions,
  registerCoreAnimations,
  resolveAnimationSpriteKey,
  selectPlayerAnimation,
} from '../../src/rendering/AnimationRegistry.js';
import assetManifest from '../../src/assets/assetManifest.json';
import fixture from '../fixtures/animationManifest.fixture.json';

const REQUIRED_KEYS = ['player.idle', 'player.walk', 'player.jump', 'player.climb', 'player.hit', 'boss.idle', 'boss.throw', 'barrel.roll', 'rescue.idle', 'rescue.complete'];

// Fake Phaser animation manager.
function fakeScene(existing = []) {
  const registered = new Map(existing.map((key) => [key, {}]));
  return {
    registered,
    anims: {
      exists: vi.fn((key) => registered.has(key)),
      create: vi.fn((config) => registered.set(config.key, config)),
      generateFrameNumbers: vi.fn((sheetKey, { frames }) => frames.map((frame) => ({ key: sheetKey, frame }))),
    },
  };
}

describe('registerCoreAnimations', () => {
  it('creates every core animation key', () => {
    const scene = fakeScene();
    expect(registerCoreAnimations(scene)).toEqual(REQUIRED_KEYS);
    expect([...scene.registered.keys()]).toEqual(REQUIRED_KEYS);
  });

  it('skips keys that already exist, so retries and scene re-entry are safe', () => {
    const scene = fakeScene(['player.walk', 'barrel.roll']);
    registerCoreAnimations(scene);
    const createdKeys = scene.anims.create.mock.calls.map(([config]) => config.key);
    expect(createdKeys).not.toContain('player.walk');
    expect(createdKeys).not.toContain('barrel.roll');
    registerCoreAnimations(scene);
    expect(scene.anims.create).toHaveBeenCalledTimes(REQUIRED_KEYS.length - 2);
  });

  it('builds frames from the sheet key for each group', () => {
    const scene = fakeScene();
    registerCoreAnimations(scene);
    expect(scene.anims.generateFrameNumbers).toHaveBeenCalledWith('barrel.original.sheet', { frames: [0, 1, 2, 3] });
  });

  it('fails clearly when a required sheet is missing from the manifest', () => {
    expect(() => registerCoreAnimations(fakeScene(), { manifest: fixture.missingBoss })).toThrow(/boss/);
  });
});

describe('definitions', () => {
  it('loops barrel.roll and plays player.hit and rescue.complete once', () => {
    const byKey = Object.fromEntries(getCoreAnimationDefinitions().map((definition) => [definition.key, definition]));
    expect(byKey['barrel.roll'].repeat).toBe(-1);
    expect(byKey['barrel.roll'].frameRate).toBeGreaterThan(0);
    expect(byKey['player.hit'].repeat).toBeGreaterThanOrEqual(0);
    expect(byKey['rescue.complete'].repeat).toBeGreaterThanOrEqual(0);
  });

  it('only uses frames that exist in each sheet', () => {
    const frameCounts = Object.fromEntries(assetManifest.sprites.filter((s) => s.type === 'spritesheet').map((s) => [s.key, s.frameCount]));
    for (const definition of getCoreAnimationDefinitions()) {
      const count = frameCounts[resolveAnimationSpriteKey(definition.group)];
      for (const frame of definition.frames) expect(frame).toBeLessThan(count);
    }
  });
});

describe('resolveAnimationSpriteKey', () => {
  it('maps each group to a sheet present in the manifest', () => {
    for (const group of ['player', 'boss', 'barrel', 'rescue']) {
      const key = resolveAnimationSpriteKey(group);
      expect(assetManifest.sprites.some((sprite) => sprite.key === key)).toBe(true);
      expect(resolveAnimationSpriteKey(group, fixture.complete)).toBe(key);
    }
  });

  it('rejects unknown groups and missing sheets', () => {
    expect(() => resolveAnimationSpriteKey('dragon')).toThrow(/Unknown/);
    expect(() => resolveAnimationSpriteKey('boss', fixture.missingBoss)).toThrow(/no sprite sheet/);
  });
});

describe('selectPlayerAnimation', () => {
  it('picks the animation from player state', () => {
    expect(selectPlayerAnimation({ state: 'hit', grounded: true, climbing: false, velocityX: 0 })).toBe('player.hit');
    expect(selectPlayerAnimation({ state: 'climbing', grounded: false, climbing: true, velocityX: 0 })).toBe('player.climb');
    expect(selectPlayerAnimation({ state: 'jumping', grounded: false, climbing: false, velocityX: 120 })).toBe('player.jump');
    expect(selectPlayerAnimation({ state: 'normal', grounded: true, climbing: false, velocityX: -120 })).toBe('player.walk');
    expect(selectPlayerAnimation({ state: 'normal', grounded: true, climbing: false, velocityX: 0 })).toBe('player.idle');
  });
});

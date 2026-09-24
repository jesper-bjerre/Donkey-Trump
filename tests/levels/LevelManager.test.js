import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVELS, LevelManager, loadLevelDefinition, validateLevelDefinition } from '../../src/levels/LevelManager.js';
import fixtures from '../../src/levels/level.fixtures.json';
import level1 from '../../src/levels/level1.json';
import level2 from '../../src/levels/level2.json';
import level3 from '../../src/levels/level3.json';

const clone = (value) => structuredClone(value);

describe('validateLevelDefinition', () => {
  it('accepts every fixture level with all required sections', () => {
    expect(fixtures.levels).toHaveLength(3);
    for (const level of fixtures.levels) {
      for (const field of ['dimensions', 'playerSpawn', 'girders', 'ladders', 'boss', 'barrels', 'rescue', 'difficulty']) {
        expect(level).toHaveProperty(field);
      }
      expect(() => validateLevelDefinition(level)).not.toThrow();
    }
  });

  it('accepts the three production level files', () => {
    for (const level of [level1, level2, level3]) expect(() => validateLevelDefinition(level)).not.toThrow();
  });

  it('rejects a missing ladders[0].x with the path in the message', () => {
    const broken = clone(level1);
    delete broken.ladders[0].x;
    expect(() => validateLevelDefinition(broken)).toThrow(/ladders\[0\]\.x/);
  });

  it('rejects out-of-bounds numbers and unknown fields', () => {
    const slow = clone(level1);
    slow.barrels.spawnIntervalMs = 10;
    expect(() => validateLevelDefinition(slow)).toThrow(/barrels\.spawnIntervalMs/);
    const extra = clone(level1);
    extra.cheat = true;
    expect(() => validateLevelDefinition(extra)).toThrow(/cheat/);
  });

  it('applies cross-field rules', () => {
    const inverted = clone(level1);
    inverted.barrels.speedMin = 300;
    expect(() => validateLevelDefinition(inverted)).toThrow(/speedMin/);
    const vertical = clone(level1);
    vertical.girders[0].x2 = vertical.girders[0].x1;
    expect(() => validateLevelDefinition(vertical)).toThrow(/girders\[0\]/);
  });

  it('keeps stack traces and environment values out of error text', () => {
    const broken = clone(level1);
    broken.rescue.width = 'wide';
    try {
      validateLevelDefinition(broken);
      throw new Error('expected validation failure');
    } catch (error) {
      expect(error.message).toMatch(/rescue\.width/);
      expect(error.message).not.toMatch(/process\.env|\n\s+at /);
    }
  });
});

describe('LevelManager', () => {
  it('loads the default levels in order and marks the last as final', () => {
    const manager = new LevelManager();
    expect(manager.count).toBe(DEFAULT_LEVELS.length);
    expect(manager.getLevel(0).id).toBe('level-1');
    expect(manager.isFinalLevel(2)).toBe(true);
    expect(manager.isFinalLevel(1)).toBe(false);
  });

  it('returns immutable level copies', () => {
    const loaded = loadLevelDefinition(level1);
    expect(Object.isFrozen(loaded.girders[0])).toBe(true);
    expect(loaded).not.toBe(level1);
  });

  it('throws for an unknown level index', () => {
    expect(() => new LevelManager().getLevel(9)).toThrow(/Level 10/);
  });
});

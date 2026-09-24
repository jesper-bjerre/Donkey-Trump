import { describe, expect, it, vi } from 'vitest';
import { BossController, createBossController } from '../../src/controllers/BossController.js';
import fixtures from '../../src/levels/level.fixtures.json';

const level = fixtures.levels[0];

describe('BossController placement', () => {
  it('places the boss in the rightmost 25 percent of the level', () => {
    for (const fixture of fixtures.levels) {
      const boss = createBossController(fixture);
      expect(boss.x).toBeGreaterThanOrEqual(fixture.dimensions.width * 0.75);
      expect(boss.x).toBeLessThanOrEqual(fixture.dimensions.width);
    }
  });

  it('clamps a misconfigured left-side boss back to the right side', () => {
    const boss = createBossController({ ...level, boss: { ...level.boss, x: 100 } });
    expect(boss.x).toBe(level.dimensions.width * 0.75);
  });

  it('works without optional animation config', () => {
    expect(level.boss.animation).toBeUndefined();
    const boss = new BossController(level);
    expect(boss.throwKey).toBeNull();
    expect(() => boss.playThrow()).not.toThrow();
  });

  it('creates a feet-anchored sprite when given a scene', () => {
    const sprite = { setOrigin: vi.fn(() => sprite), setDepth: vi.fn(() => sprite), destroy: vi.fn() };
    const scene = { add: { sprite: vi.fn(() => sprite) } };
    new BossController(level, { scene });
    expect(scene.add.sprite).toHaveBeenCalledWith(level.boss.x, level.boss.y, 'boss.trumpInspired');
    expect(sprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
  });
});

describe('getBarrelSpawnPoint', () => {
  it('derives the anchor from boss config and spawnAnchorOffset', () => {
    const boss = createBossController(level);
    expect(boss.getBarrelSpawnPoint()).toEqual({
      x: level.boss.x + level.boss.spawnAnchorOffset.x,
      y: level.boss.y + level.boss.spawnAnchorOffset.y,
    });
  });

  it('spawns on the playfield side of the boss', () => {
    const boss = createBossController(level);
    expect(boss.getBarrelSpawnPoint().x).toBeLessThanOrEqual(boss.x);
  });
});

import { describe, expect, it } from 'vitest';
import { LevelManager } from '../../src/levels/LevelManager.js';
import { computeJumpApexPx, DEFAULT_PLAYER_MOVEMENT } from '../../src/controllers/PlayerController.js';
import { WORLD_GRAVITY_Y } from '../../src/config/physics.js';
import { getYAtX, isWithinSegment } from '../../src/systems/SlopeResolver.js';
import level1 from '../../src/levels/level1.json';
import level2 from '../../src/levels/level2.json';
import level3 from '../../src/levels/level3.json';

const levels = [level1, level2, level3];

describe('production levels', () => {
  it('load through LevelManager', () => {
    const manager = new LevelManager(levels);
    expect(manager.count).toBe(3);
    expect(manager.getLevel(2).rescue.isFinalLevel).toBe(true);
    expect(manager.getLevel(0).rescue.isFinalLevel).toBe(false);
  });

  it('never lengthen the barrel spawn interval as levels progress', () => {
    const intervals = levels.map((level) => level.barrels.spawnIntervalMs);
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeLessThanOrEqual(intervals[i - 1]);
  });

  it('never lower the maximum barrel speed as levels progress', () => {
    const speeds = levels.map((level) => level.barrels.speedMax);
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1]);
  });

  it('keep every floor gap taller than a full jump', () => {
    const apex = computeJumpApexPx(DEFAULT_PLAYER_MOVEMENT, WORLD_GRAVITY_Y);
    for (const level of levels) {
      expect(level.tuning.minFloorGapPx).toBeGreaterThan(apex);
      expect(level.tuning.minFloorGapPx).toBeGreaterThan(level.tuning.maxDirectJumpPx);
    }
  });

  it('connect each ladder to a girder at both ends', () => {
    for (const level of levels) {
      for (const ladder of level.ladders) {
        const surfaces = level.girders.filter((g) => isWithinSegment(ladder.snapX, g)).map((g) => getYAtX(ladder.snapX, g));
        expect(surfaces.some((y) => Math.abs(y - ladder.y) < 0.5), `${level.id} ${ladder.id} top`).toBe(true);
        expect(surfaces.some((y) => Math.abs(y - (ladder.y + ladder.height)) < 0.5), `${level.id} ${ladder.id} bottom`).toBe(true);
      }
    }
  });

  it('place the player spawn on the bottom girder', () => {
    for (const level of levels) {
      expect(getYAtX(level.playerSpawn.x, level.girders[0])).toBeCloseTo(level.playerSpawn.y, 0);
    }
  });
});

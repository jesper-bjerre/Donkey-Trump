import { describe, expect, it } from 'vitest';
import { DIFFICULTY_RAMP, createEndlessLevel } from '../../src/levels/endless.js';
import { validateLevelDefinition, DEFAULT_LEVELS, loadLevelDefinition } from '../../src/levels/LevelManager.js';
import { computeJumpApexPx, DEFAULT_PLAYER_MOVEMENT } from '../../src/controllers/PlayerController.js';
import { WORLD_GRAVITY_Y } from '../../src/config/physics.js';

const layouts = DEFAULT_LEVELS.map(loadLevelDefinition);
const levels = Array.from({ length: 60 }, (_, index) => createEndlessLevel(layouts, index));

describe('endless levels', () => {
  it('plays the authored layouts unchanged in the first loop', () => {
    for (let i = 0; i < layouts.length; i++) {
      expect(levels[i].barrels.speedMax).toBe(layouts[i].barrels.speedMax);
      expect(levels[i].barrels.spawnIntervalMs).toBe(layouts[i].barrels.spawnIntervalMs);
    }
  });

  it('cycles the layouts while every single level is faster than the one before', () => {
    for (let i = 1; i < levels.length; i++) {
      const [prev, next] = [levels[i - 1].barrels, levels[i].barrels];
      expect(levels[i].girders).toEqual(layouts[i % layouts.length].girders);
      expect(next.speedMax, `level ${i + 1}`).toBeGreaterThan(prev.speedMax);
      expect(next.speedMin, `level ${i + 1}`).toBeGreaterThan(prev.speedMin);
      expect(next.spawnIntervalMs).toBeLessThanOrEqual(prev.spawnIntervalMs);
      expect(next.route.directThrowChance).toBeGreaterThanOrEqual(prev.route.directThrowChance);
    }
  });

  it('never exceeds the fairness caps, however far the player gets', () => {
    for (const level of [...levels, createEndlessLevel(layouts, 10000)]) {
      expect(level.barrels.speedMax).toBeLessThanOrEqual(DIFFICULTY_RAMP.speedMaxLimit);
      expect(level.barrels.speedMin).toBeLessThanOrEqual(level.barrels.speedMax);
      expect(level.barrels.spawnIntervalMs).toBeGreaterThanOrEqual(DIFFICULTY_RAMP.spawnIntervalLimitMs);
      expect(level.barrels.route.directThrowChance).toBeLessThanOrEqual(DIFFICULTY_RAMP.directThrowChanceLimit);
      expect(level.barrels.maxActive).toBeLessThanOrEqual(DIFFICULTY_RAMP.maxActiveCap);
    }
  });

  it('keeps even the fastest barrel clearable within one full jump', () => {
    const airtimeS = (2 * DEFAULT_PLAYER_MOVEMENT.jumpVelocity) / WORLD_GRAVITY_Y;
    const apex = computeJumpApexPx(DEFAULT_PLAYER_MOVEMENT, WORLD_GRAVITY_Y);
    // A barrel covers less than 2.5x its own path per jump and the jump clears its height.
    expect(DIFFICULTY_RAMP.speedMaxLimit * airtimeS).toBeLessThan(260);
    expect(apex).toBeGreaterThan(18 * 2);
  });

  it('produces valid level data that never ends the game', () => {
    for (const level of levels.slice(0, 12)) {
      expect(() => validateLevelDefinition({ ...level, order: Math.min(level.order, 99), difficulty: { ...level.difficulty, tier: Math.min(level.difficulty.tier, 10) } })).not.toThrow();
      expect(level.rescue.isFinalLevel).toBe(false);
    }
  });
});

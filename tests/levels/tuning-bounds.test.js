import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_MOVEMENT, computeJumpApexPx } from '../../src/controllers/PlayerController.js';
import { WORLD_GRAVITY_Y } from '../../src/config/physics.js';
import { getYAtX, isWithinSegment } from '../../src/systems/SlopeResolver.js';
import level1 from '../../src/levels/level1.json';
import level2 from '../../src/levels/level2.json';
import level3 from '../../src/levels/level3.json';

const LEVELS = [level1, level2, level3];

// Documented tuning bounds. Adjust here deliberately, with playtest evidence.
const BOUNDS = {
  spawnIntervalMs: { min: 1500, max: 4000 },
  speedMax: { min: 90, max: 200 },
  // Absolute ceiling for the fastest level so barrels stay jumpable.
  maxAdjacentSpeedJump: 40,
  // Floors must clear a full jump with this much margin.
  jumpMarginPx: 12,
};

const floorRange = (girder) => [Math.min(girder.x1, girder.x2), Math.max(girder.x1, girder.x2)];

// Smallest vertical distance between consecutive floors across their shared x range.
function minimumFloorGap(level) {
  let min = Infinity;
  for (let i = 0; i < level.girders.length - 1; i++) {
    const [lowA, highA] = floorRange(level.girders[i]);
    const [lowB, highB] = floorRange(level.girders[i + 1]);
    for (let x = Math.max(lowA, lowB); x <= Math.min(highA, highB); x += 1) {
      min = Math.min(min, getYAtX(x, level.girders[i]) - getYAtX(x, level.girders[i + 1]));
    }
  }
  return min;
}

describe('difficulty progression', () => {
  it('spawn intervals never lengthen and stay within bounds', () => {
    const intervals = LEVELS.map((level) => level.barrels.spawnIntervalMs);
    intervals.forEach((value, i) => {
      expect(value).toBeGreaterThanOrEqual(BOUNDS.spawnIntervalMs.min);
      expect(value).toBeLessThanOrEqual(BOUNDS.spawnIntervalMs.max);
      if (i > 0) expect(value).toBeLessThanOrEqual(intervals[i - 1]);
    });
  });

  it('barrel speedMax never drops and stays within bounds', () => {
    const speeds = LEVELS.map((level) => level.barrels.speedMax);
    speeds.forEach((value, i) => {
      expect(value).toBeGreaterThanOrEqual(BOUNDS.speedMax.min);
      expect(value).toBeLessThanOrEqual(BOUNDS.speedMax.max);
      if (i > 0) {
        expect(value).toBeGreaterThanOrEqual(speeds[i - 1]);
        expect(value - speeds[i - 1]).toBeLessThanOrEqual(BOUNDS.maxAdjacentSpeedJump);
      }
    });
  });

  it('difficulty tiers increase with level order', () => {
    LEVELS.forEach((level, i) => expect(level.difficulty.tier).toBe(i + 1));
  });
});

describe('ladder-only vertical progression', () => {
  const apex = computeJumpApexPx(DEFAULT_PLAYER_MOVEMENT, WORLD_GRAVITY_Y);

  it('keeps the movement model jump under the configured maximum', () => {
    expect(apex).toBeLessThanOrEqual(DEFAULT_PLAYER_MOVEMENT.maxJumpHeightPx);
  });

  for (const level of LEVELS) {
    it(`${level.id}: requires ladders because every floor gap beats a full jump`, () => {
      expect(level.tuning.jumpClearanceRequired).toBe(true);
      const gap = minimumFloorGap(level);
      expect(gap).toBeGreaterThan(level.tuning.maxDirectJumpPx);
      expect(gap).toBeGreaterThan(apex + BOUNDS.jumpMarginPx);
      expect(Math.floor(gap)).toBe(level.tuning.minFloorGapPx);
    });

    it(`${level.id}: ladders stay in bounds and span exactly one floor band`, () => {
      const { width, height } = level.dimensions;
      for (const ladder of level.ladders) {
        expect(ladder.x).toBeGreaterThanOrEqual(0);
        expect(ladder.x + ladder.width).toBeLessThanOrEqual(width);
        expect(ladder.y).toBeGreaterThanOrEqual(0);
        expect(ladder.y + ladder.height).toBeLessThanOrEqual(height);
        const topFloor = level.girders.findIndex((g) => isWithinSegment(ladder.snapX, g) && Math.abs(getYAtX(ladder.snapX, g) - ladder.y) < 0.5);
        const bottomFloor = level.girders.findIndex(
          (g) => isWithinSegment(ladder.snapX, g) && Math.abs(getYAtX(ladder.snapX, g) - (ladder.y + ladder.height)) < 0.5,
        );
        expect(bottomFloor, ladder.id).toBeGreaterThanOrEqual(0);
        expect(topFloor, ladder.id).toBe(bottomFloor + 1);
      }
    });

    it(`${level.id}: every floor band has at least one ladder up`, () => {
      const bands = new Set(
        level.ladders.map((ladder) =>
          level.girders.findIndex((g) => isWithinSegment(ladder.snapX, g) && Math.abs(getYAtX(ladder.snapX, g) - (ladder.y + ladder.height)) < 0.5),
        ),
      );
      for (let floor = 0; floor < level.girders.length - 1; floor++) expect(bands.has(floor), `floor ${floor}`).toBe(true);
    });
  }
});

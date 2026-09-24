import { describe, expect, it } from 'vitest';
import {
  INTRO_TIMING,
  buildIntroPath,
  buildIntroTimeline,
  flatY,
  girderTiltsAt,
  introPhaseAt,
  ladderAtTilt,
  ladderFloors,
  pathDurationMs,
  samplePath,
  tiltGirder,
} from '../../src/scenes/introTimeline.js';
import { LevelManager } from '../../src/levels/LevelManager.js';

const manager = new LevelManager();
const layouts = [0, 1, 2].map((index) => manager.getLevel(index));
const level = layouts[0];

describe('girder tilt', () => {
  it('starts flat at the midpoint and ends at the real slope', () => {
    const girder = level.girders[1];
    expect(tiltGirder(girder, 0)).toMatchObject({ y1: flatY(girder), y2: flatY(girder) });
    expect(tiltGirder(girder, 1)).toMatchObject({ y1: girder.y1, y2: girder.y2 });
  });

  it('keeps every ladder attached to its floors while the girders tilt', () => {
    const links = ladderFloors(level);
    expect(links.every((link) => link.bottom >= 0 && link.top === link.bottom + 1)).toBe(true);
    const done = links.map((link) => ladderAtTilt(link, level.girders));
    done.forEach((ladder, i) => {
      expect(ladder.y).toBeCloseTo(level.ladders[i].y, 0);
      expect(ladder.height).toBeCloseTo(level.ladders[i].height, 0);
    });
  });

  it('tilts girders one after another from the top floor down', () => {
    const timeline = buildIntroTimeline(level);
    const count = level.girders.length;
    const early = girderTiltsAt(timeline, count, timeline.signEnd + INTRO_TIMING.tiltPerGirderMs * 0.5);
    expect(early[count - 1]).toBeGreaterThan(0);
    expect(early[0]).toBe(0);
    expect(girderTiltsAt(timeline, count, 0).every((tilt) => tilt === 0)).toBe(true);
    expect(girderTiltsAt(timeline, count, timeline.tiltEnd).every((tilt) => tilt === 1)).toBe(true);
  });
});

describe('boss route', () => {
  for (const layout of layouts) {
    it(`${layout.id}: carries Motzfeldt up every floor by ladder, then returns to the boss spot`, () => {
      const path = buildIntroPath(layout);
      const climbs = path.filter((seg) => seg.action === 'climb' && seg.carrying);
      expect(climbs).toHaveLength(layout.girders.length - 1);
      for (const climb of climbs) {
        expect(layout.ladders.some((ladder) => ladder.snapX === climb.from.x)).toBe(true);
        expect(climb.to.y).toBeLessThan(climb.from.y);
      }
      const drop = path.find((seg) => seg.action === 'drop');
      expect(drop.to.x).toBe(layout.rescue.x + layout.rescue.width / 2);
      const end = samplePath(path, pathDurationMs(path) + 1);
      expect(end).toMatchObject({ x: layout.boss.x, done: true, carrying: false });
      expect(end.y).toBeCloseTo(flatY(layout.girders[layout.girders.length - 2]));
    });
  }

  it('starts off-screen right carrying Motzfeldt', () => {
    const start = samplePath(buildIntroPath(level), 0);
    expect(start.x).toBeGreaterThan(level.dimensions.width);
    expect(start.carrying).toBe(true);
    expect(start.y).toBeCloseTo(flatY(level.girders[0]));
  });
});

describe('timeline', () => {
  it('runs path, sign, tilt, card, done in order and stays short', () => {
    const timeline = buildIntroTimeline(level);
    expect(introPhaseAt(timeline, 0)).toBe('path');
    expect(introPhaseAt(timeline, timeline.pathEnd + 1)).toBe('sign');
    expect(introPhaseAt(timeline, timeline.signEnd + 1)).toBe('tilt');
    expect(introPhaseAt(timeline, timeline.tiltEnd + 1)).toBe('card');
    expect(introPhaseAt(timeline, timeline.end)).toBe('done');
    expect(timeline.end).toBeGreaterThan(8000);
    expect(timeline.end).toBeLessThan(20000);
  });
});

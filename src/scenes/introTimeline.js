// Pure choreography for the opening cutscene, built from the level's own geometry:
// the girders start flat, Donkey Trump carries Motzfeldt up the ladders to the top,
// leaves her there, returns to his spot and signs an executive order that tilts
// every girder into its slope. No Phaser here, so the whole sequence is testable.
import { getYAtX, isWithinSegment } from '../systems/SlopeResolver.js';

export const INTRO_TIMING = Object.freeze({
  walkSpeed: 500, // px/s
  climbSpeed: 220, // px/s
  enterFromX: 860, // off-screen right
  dropPauseMs: 500,
  signMs: 1400,
  tiltPerGirderMs: 320,
  cardMs: 2400,
});

// A flat girder sits at the height of its midpoint.
export function flatY(girder) {
  return (girder.y1 + girder.y2) / 2;
}

// Girders interpolated from flat (tilt 0) to their real slope (tilt 1).
export function tiltGirder(girder, tilt) {
  const mid = flatY(girder);
  return { ...girder, y1: mid + (girder.y1 - mid) * tilt, y2: mid + (girder.y2 - mid) * tilt };
}

// Which floors (girder indexes) each ladder connects, from the final geometry.
export function ladderFloors(level) {
  const floorAt = (x, y) => level.girders.findIndex((g) => isWithinSegment(x, g) && Math.abs(getYAtX(x, g) - y) < 0.5);
  return level.ladders.map((ladder) => ({
    ladder,
    bottom: floorAt(ladder.snapX, ladder.y + ladder.height),
    top: floorAt(ladder.snapX, ladder.y),
  }));
}

// Ladder endpoints follow the girders while they tilt.
export function ladderAtTilt({ ladder, bottom, top }, girders) {
  const topY = getYAtX(ladder.snapX, girders[top]);
  const bottomY = getYAtX(ladder.snapX, girders[bottom]);
  return { ...ladder, y: topY, height: bottomY - topY };
}

function segment(from, to, speed, action, extra = {}) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return { from, to, action, durationMs: (distance / speed) * 1000, ...extra };
}

// The boss's route: floor by floor up the first ladder of each floor, drop
// Motzfeldt at the rescue spot, climb back down and walk to the boss position.
export function buildIntroPath(level, timing = INTRO_TIMING) {
  const floors = level.girders.map(flatY);
  const links = ladderFloors(level);
  const top = level.girders.length - 1;
  const bossFloor = top - 1;
  const segments = [];
  let at = { x: timing.enterFromX, y: floors[0] };
  const walkTo = (x, extra) => {
    const to = { x, y: at.y };
    if (to.x !== at.x) segments.push(segment(at, to, timing.walkSpeed, 'walk', extra));
    at = to;
  };
  const climbTo = (y, extra) => {
    const to = { x: at.x, y };
    segments.push(segment(at, to, timing.climbSpeed, 'climb', extra));
    at = to;
  };

  let lastLink = null;
  for (let floor = 0; floor < top; floor++) {
    const link = links.find((candidate) => candidate.bottom === floor && candidate.top === floor + 1);
    if (!link) throw new Error(`Intro needs a ladder from floor ${floor} to ${floor + 1}.`);
    walkTo(link.ladder.snapX, { carrying: true });
    climbTo(floors[floor + 1], { carrying: true });
    lastLink = link;
  }
  const rescueX = level.rescue.x + level.rescue.width / 2;
  walkTo(rescueX, { carrying: true });
  segments.push({ from: at, to: at, action: 'drop', durationMs: timing.dropPauseMs, carrying: false });
  walkTo(lastLink.ladder.snapX, { carrying: false });
  climbTo(floors[bossFloor], { carrying: false });
  walkTo(level.boss.x, { carrying: false });
  return segments;
}

// Position and pose of the boss after `elapsedMs` along the path.
export function samplePath(segments, elapsedMs) {
  let remaining = Math.max(0, elapsedMs);
  for (const seg of segments) {
    if (remaining <= seg.durationMs) {
      const t = seg.durationMs === 0 ? 1 : remaining / seg.durationMs;
      return {
        x: seg.from.x + (seg.to.x - seg.from.x) * t,
        y: seg.from.y + (seg.to.y - seg.from.y) * t,
        action: seg.action,
        carrying: seg.carrying ?? false,
        facingLeft: seg.to.x < seg.from.x,
        done: false,
      };
    }
    remaining -= seg.durationMs;
  }
  const last = segments.at(-1);
  return { x: last.to.x, y: last.to.y, action: 'idle', carrying: false, facingLeft: true, done: true };
}

export function pathDurationMs(segments) {
  return segments.reduce((sum, seg) => sum + seg.durationMs, 0);
}

// Full timeline: walk/climb, sign the order, tilt the girders top-down, show the card.
export function buildIntroTimeline(level, timing = INTRO_TIMING) {
  const path = buildIntroPath(level, timing);
  const pathEnd = pathDurationMs(path);
  const signEnd = pathEnd + timing.signMs;
  const tiltEnd = signEnd + level.girders.length * timing.tiltPerGirderMs;
  return { path, pathEnd, signEnd, tiltEnd, end: tiltEnd + timing.cardMs, timing };
}

// Tilt progress per girder (0 flat .. 1 sloped). Girders tilt one after another,
// from the top floor down, like a wave spreading from the signed order.
export function girderTiltsAt(timeline, girderCount, elapsedMs) {
  return Array.from({ length: girderCount }, (_, index) => {
    const order = girderCount - 1 - index;
    const start = timeline.signEnd + order * timeline.timing.tiltPerGirderMs;
    return Math.min(1, Math.max(0, (elapsedMs - start) / timeline.timing.tiltPerGirderMs));
  });
}

export function introPhaseAt(timeline, elapsedMs) {
  if (elapsedMs < timeline.pathEnd) return 'path';
  if (elapsedMs < timeline.signEnd) return 'sign';
  if (elapsedMs < timeline.tiltEnd) return 'tilt';
  if (elapsedMs < timeline.end) return 'card';
  return 'done';
}

import { describe, expect, it } from 'vitest';
import {
  findSupportingSegment,
  getDownhillDirection,
  getYAtX,
  isWithinSegment,
  normalizeSlopeSegment,
  resolveBodyToSlope,
} from '../../src/systems/SlopeResolver.js';
import { ascending, descending, flat, flatBody, malformed, outOfRangeX, reversed, stackedFloors, vertical } from '../fixtures/slopeSegments.fixture.js';

describe('getYAtX', () => {
  it('interpolates linearly along a descending segment', () => {
    expect(getYAtX(50, { x1: 0, y1: 120, x2: 100, y2: 140 })).toBe(130);
    expect(getYAtX(25, descending)).toBe(125);
  });

  it('handles ascending, flat and reversed segments', () => {
    expect(getYAtX(50, ascending)).toBe(130);
    expect(getYAtX(300, flat)).toBe(300);
    expect(getYAtX(0, reversed)).toBe(120);
  });

  it('treats flat-body girders as horizontal at their top edge', () => {
    expect(getYAtX(80, flatBody)).toBe(50);
  });

  it('throws instead of extrapolating outside the segment', () => {
    expect(() => getYAtX(outOfRangeX, ascending)).toThrow(/outside/);
  });
});

describe('isWithinSegment', () => {
  it('includes both boundary x values', () => {
    expect(isWithinSegment(0, ascending)).toBe(true);
    expect(isWithinSegment(100, ascending)).toBe(true);
    expect(isWithinSegment(0, reversed)).toBe(true);
  });

  it('excludes x values outside the range', () => {
    expect(isWithinSegment(-0.01, ascending)).toBe(false);
    expect(isWithinSegment(100.01, ascending)).toBe(false);
    expect(isWithinSegment(outOfRangeX, descending)).toBe(false);
  });
});

describe('normalizeSlopeSegment', () => {
  it('orders endpoints left to right', () => {
    expect(normalizeSlopeSegment(reversed)).toMatchObject({ x1: 0, y1: 120, x2: 100, y2: 140 });
  });

  it('rejects vertical segments with a descriptive error', () => {
    expect(() => normalizeSlopeSegment(vertical)).toThrow(/vertical/);
  });

  it('rejects malformed segments instead of producing NaN', () => {
    for (const segment of malformed) {
      expect(() => normalizeSlopeSegment(segment)).toThrow(/Slope segment/);
    }
  });
});

describe('getDownhillDirection', () => {
  it('points toward the lower end', () => {
    expect(getDownhillDirection(descending)).toBe(1);
    expect(getDownhillDirection(ascending)).toBe(-1);
    expect(getDownhillDirection(flat)).toBe(0);
  });
});

describe('findSupportingSegment', () => {
  it('returns null when no fixture segment matches the x and y tolerance', () => {
    expect(findSupportingSegment(50, 10, [ascending, descending, flat])).toBeNull();
    expect(findSupportingSegment(outOfRangeX, 130, [ascending, descending])).toBeNull();
  });

  it('picks the floor under the feet, not the one above', () => {
    const support = findSupportingSegment(400, 575, stackedFloors);
    expect(support.segment).toBe(stackedFloors[0]);
    expect(support.surfaceY).toBe(574);
  });

  it('catches feet that sank slightly below the surface within one frame', () => {
    expect(findSupportingSegment(50, 138, [descending]).surfaceY).toBe(130);
  });
});

describe('resolveBodyToSlope', () => {
  it('snaps a falling body onto the girder and reports grounded', () => {
    const result = resolveBodyToSlope({ x: 50, bottom: 133, velocityY: 40 }, [descending]);
    expect(result).toMatchObject({ bottom: 130, grounded: true, segment: descending });
  });

  it('never snaps a rising body, so jumps are not cut short', () => {
    const result = resolveBodyToSlope({ x: 50, bottom: 131, velocityY: -150 }, [descending]);
    expect(result).toMatchObject({ bottom: 131, grounded: false, segment: null });
  });

  it('leaves a body past the girder end falling', () => {
    const result = resolveBodyToSlope({ x: 120, bottom: 140, velocityY: 10 }, [descending]);
    expect(result.grounded).toBe(false);
  });
});

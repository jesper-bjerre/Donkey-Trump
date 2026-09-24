// Line-segment slope math. Arcade Physics has no sloped collision, so girders are
// plain segments and bodies are snapped onto them each frame. Pure: no Phaser.

export const DEFAULT_SLOPE_TOLERANCE = {
  // How far above the surface (px) feet may be and still count as touching it.
  abovePx: 2,
  // How far below the surface (px) feet may sink in one frame and still be caught.
  belowPx: 12,
};

export function normalizeSlopeSegment(segment) {
  if (!segment || typeof segment !== 'object') {
    throw new Error('Slope segment must be an object with x1, y1, x2, y2.');
  }
  for (const field of ['x1', 'y1', 'x2', 'y2']) {
    if (typeof segment[field] !== 'number' || !Number.isFinite(segment[field])) {
      throw new Error(`Slope segment field ${field} must be a finite number.`);
    }
  }
  if (segment.x1 === segment.x2) {
    throw new Error('Slope segment cannot be vertical (x1 equals x2).');
  }
  // Always store left-to-right so interpolation and range checks stay simple.
  const flip = segment.x1 > segment.x2;
  const normalized = {
    ...segment,
    x1: flip ? segment.x2 : segment.x1,
    y1: flip ? segment.y2 : segment.y1,
    x2: flip ? segment.x1 : segment.x2,
    y2: flip ? segment.y1 : segment.y2,
  };
  if (segment.collisionMode === 'flat-body') {
    const top = Math.min(normalized.y1, normalized.y2);
    normalized.y1 = top;
    normalized.y2 = top;
  }
  return normalized;
}

export function isWithinSegment(x, segment) {
  const { x1, x2 } = normalizeSlopeSegment(segment);
  return x >= x1 && x <= x2;
}

export function getYAtX(x, segment) {
  const { x1, y1, x2, y2 } = normalizeSlopeSegment(segment);
  if (x < x1 || x > x2) {
    throw new Error(`x ${x} is outside the slope segment range ${x1}..${x2}.`);
  }
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
}

// Downhill horizontal direction along a segment: -1 left, 1 right, 0 flat.
export function getDownhillDirection(segment) {
  const { y1, y2 } = normalizeSlopeSegment(segment);
  return Math.sign(y2 - y1);
}

// Returns the segment whose surface is closest to footY within the tolerance band,
// or null when nothing supports the point.
export function findSupportingSegment(x, footY, segments, tolerance = DEFAULT_SLOPE_TOLERANCE) {
  let best = null;
  let bestDistance = Infinity;
  for (const raw of segments) {
    const segment = normalizeSlopeSegment(raw);
    if (x < segment.x1 || x > segment.x2) continue;
    const surfaceY = getYAtX(x, segment);
    const sink = footY - surfaceY;
    if (sink < -tolerance.abovePx || sink > tolerance.belowPx) continue;
    const distance = Math.abs(sink);
    if (distance < bestDistance) {
      best = { segment: raw, surfaceY };
      bestDistance = distance;
    }
  }
  return best;
}

// body: { x (center), bottom (feet y), velocityY }. Returns the corrected feet y,
// whether the body is grounded, and the supporting segment. Rising bodies are
// never snapped, so jumps are not cut short by the girder they started on.
export function resolveBodyToSlope(body, segments, tolerance = DEFAULT_SLOPE_TOLERANCE) {
  if (body.velocityY < 0) {
    return { bottom: body.bottom, grounded: false, segment: null };
  }
  const support = findSupportingSegment(body.x, body.bottom, segments, tolerance);
  if (!support) {
    return { bottom: body.bottom, grounded: false, segment: null };
  }
  return { bottom: support.surfaceY, grounded: true, segment: support.segment };
}

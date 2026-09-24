// Girder segments for SlopeResolver tests. y grows downward, as on screen.
export const ascending = { x1: 0, y1: 140, x2: 100, y2: 120 };
export const descending = { x1: 0, y1: 120, x2: 100, y2: 140 };
export const flat = { x1: 200, y1: 300, x2: 400, y2: 300 };
export const reversed = { x1: 100, y1: 140, x2: 0, y2: 120 };
export const flatBody = { x1: 0, y1: 50, x2: 100, y2: 60, collisionMode: 'flat-body' };
export const vertical = { x1: 50, y1: 0, x2: 50, y2: 100 };
export const outOfRangeX = 250;
export const malformed = [
  { x1: 0, y1: 0, x2: 10 },
  { x1: '0', y1: 0, x2: 10, y2: 0 },
  { x1: 0, y1: Number.NaN, x2: 10, y2: 0 },
  null,
];
export const stackedFloors = [
  { x1: 0, y1: 580, x2: 800, y2: 568 },
  { x1: 0, y1: 480, x2: 740, y2: 500 },
];

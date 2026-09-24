// Draws girders and ladders procedurally from level data so sloped art always
// matches the SlopeResolver segments exactly.

const GIRDER_THICKNESS = 10;
const GIRDER_COLOR = 0xd1344b;
const GIRDER_TRUSS = 0x7a1022;
const LADDER_COLOR = 0x3fc1d9;
const RUNG_SPACING = 10;

export function drawGirder(graphics, girder) {
  const { x1, y1, x2, y2 } = girder;
  const t = GIRDER_THICKNESS;
  graphics.fillStyle(GIRDER_COLOR, 1);
  graphics.fillPoints(
    [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      { x: x2, y: y2 + t },
      { x: x1, y: y1 + t },
    ],
    true,
  );
  // Zig-zag truss so the slope reads as a steel girder.
  graphics.lineStyle(2, GIRDER_TRUSS, 1);
  const length = Math.abs(x2 - x1);
  const steps = Math.max(1, Math.round(length / 16));
  graphics.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const x = x1 + (x2 - x1) * f;
    const top = y1 + (y2 - y1) * f;
    graphics.lineTo(x, i % 2 === 0 ? top + 1 : top + t - 1);
  }
  graphics.strokePath();
}

export function drawLadder(graphics, ladder) {
  graphics.fillStyle(LADDER_COLOR, 1);
  graphics.fillRect(ladder.x + 2, ladder.y, 3, ladder.height);
  graphics.fillRect(ladder.x + ladder.width - 5, ladder.y, 3, ladder.height);
  for (let y = ladder.y + RUNG_SPACING / 2; y < ladder.y + ladder.height; y += RUNG_SPACING) {
    graphics.fillRect(ladder.x + 2, y, ladder.width - 4, 2);
  }
}

export function drawLevel(graphics, level) {
  graphics.clear();
  level.ladders.forEach((ladder) => drawLadder(graphics, ladder));
  level.girders.forEach((girder) => drawGirder(graphics, girder));
  return graphics;
}

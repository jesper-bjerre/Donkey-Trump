// Ladder spans from an upper floor at y 100 down to a lower floor at y 200.
export const ladder = { id: 'main', x: 90, y: 100, width: 20, height: 100, snapX: 100, climbSpeedOverride: null };
export const fastLadder = { id: 'fast', x: 290, y: 100, width: 20, height: 100, snapX: 300, climbSpeedOverride: 150 };
export const ladders = [ladder, fastLadder];

// Player sprite placements (center x, feet y).
export const overlappingAtBottom = { centerX: 104, bottom: 200, blockedDown: true };
export const overlappingAtTop = { centerX: 98, bottom: 100, blockedDown: true };
export const nonOverlapping = { centerX: 160, bottom: 200, blockedDown: true };
export const nearTopExit = { centerX: 100, bottom: 101 };
export const nearBottomExit = { centerX: 100, bottom: 199.5 };
export const onFastLadder = { centerX: 300, bottom: 200, blockedDown: true };

const none = { left: false, right: false, up: false, down: false, jumpPressed: false, jumpHeld: false };
export const input = {
  none,
  up: { ...none, up: true },
  down: { ...none, down: true },
  jump: { ...none, jumpPressed: true, jumpHeld: true },
};

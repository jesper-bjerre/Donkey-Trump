export const grounded = { centerX: 100, bottom: 200, blockedDown: true };
export const airborne = { centerX: 100, bottom: 150, blockedDown: false, velocity: { x: 0, y: 50 } };
export const climbing = { centerX: 100, bottom: 180, blockedDown: false };

const none = { left: false, right: false, up: false, down: false, jumpPressed: false, jumpHeld: false };
export const noInput = { ...none };
export const leftInput = { ...none, left: true };
export const rightInput = { ...none, right: true };
export const jumpPressed = { ...none, jumpPressed: true, jumpHeld: true };
export const jumpHeld = { ...none, jumpHeld: true };
export const jumpReleased = { ...none };

// Decides whether to show on-screen touch controls. Phones and tablets whose
// only pointer is a finger get them; anything with a mouse or trackpad does not.
// ?touch=1 / ?touch=0 overrides detection (handy for testing on desktop).

export function hasTouchSupport(win = globalThis.window) {
  return Boolean(win && ('ontouchstart' in win || (win.navigator?.maxTouchPoints ?? 0) > 0));
}

function matches(win, query) {
  try {
    return Boolean(win?.matchMedia?.(query).matches);
  } catch {
    return false;
  }
}

export function shouldUseTouchControls(win = globalThis.window) {
  const override = new URLSearchParams(win?.location?.search ?? '').get('touch');
  if (override === '1') return true;
  if (override === '0') return false;
  return hasTouchSupport(win) && matches(win, '(pointer: coarse)') && !matches(win, '(any-pointer: fine)');
}

// Compares the real viewport first: iOS Safari can report a stale orientation
// media query right after rotating, while innerWidth/innerHeight are current.
export function isPortrait(win = globalThis.window) {
  const width = win?.innerWidth;
  const height = win?.innerHeight;
  if (width > 0 && height > 0) return height > width;
  return matches(win, '(orientation: portrait)');
}

// Set once at startup by main.js; UI copy switches from key names to button names.
let touchMode = false;

export function setTouchMode(enabled) {
  touchMode = Boolean(enabled);
}

export function isTouchMode() {
  return touchMode;
}

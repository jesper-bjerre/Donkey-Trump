// Player preferences held in memory only (no storage, no identifiers).
// Reduced motion defaults to the OS preference and can be overridden per session.

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const DEFAULT_REDUCED_MOTION = false;

let reducedMotionOverride = null;

export function getReducedMotionPreference({ win = globalThis.window, override = reducedMotionOverride } = {}) {
  if (typeof override === 'boolean') return override;
  try {
    if (typeof win?.matchMedia !== 'function') return DEFAULT_REDUCED_MOTION;
    return Boolean(win.matchMedia(REDUCED_MOTION_QUERY).matches);
  } catch {
    return DEFAULT_REDUCED_MOTION;
  }
}

// Pass true/false to force a setting, or null to follow the OS again.
export function setReducedMotionOverride(value) {
  if (value !== null && typeof value !== 'boolean') throw new Error('Reduced motion override must be true, false or null.');
  reducedMotionOverride = value;
}

export function getReducedMotionOverride() {
  return reducedMotionOverride;
}

export function getPlayerSettings(options) {
  return { reducedMotion: getReducedMotionPreference(options) };
}

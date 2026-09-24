import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_REDUCED_MOTION,
  getPlayerSettings,
  getReducedMotionOverride,
  getReducedMotionPreference,
  setReducedMotionOverride,
} from '../../src/config/playerSettings.js';
import * as fx from '../fixtures/playerSettings.fixture.js';

afterEach(() => setReducedMotionOverride(null));

describe('getReducedMotionPreference', () => {
  it('follows prefers-reduced-motion: reduce', () => {
    expect(getReducedMotionPreference({ win: fx.reduceWindow })).toBe(true);
  });

  it('is false with no preference', () => {
    expect(getReducedMotionPreference({ win: fx.noPreferenceWindow })).toBe(false);
  });

  it('falls back to the default without window or matchMedia', () => {
    expect(getReducedMotionPreference({ win: undefined })).toBe(DEFAULT_REDUCED_MOTION);
    expect(getReducedMotionPreference({ win: fx.windowWithoutMatchMedia })).toBe(DEFAULT_REDUCED_MOTION);
    expect(getReducedMotionPreference({ win: fx.throwingWindow })).toBe(DEFAULT_REDUCED_MOTION);
  });

  it('lets an explicit override win over the OS preference', () => {
    expect(getReducedMotionPreference({ win: fx.noPreferenceWindow, override: true })).toBe(true);
    setReducedMotionOverride(false);
    expect(getReducedMotionOverride()).toBe(false);
    expect(getReducedMotionPreference({ win: fx.reduceWindow })).toBe(false);
    setReducedMotionOverride(null);
    expect(getReducedMotionPreference({ win: fx.reduceWindow })).toBe(true);
    expect(getPlayerSettings({ win: fx.reduceWindow })).toEqual({ reducedMotion: true });
  });

  it('rejects non-boolean overrides', () => {
    expect(() => setReducedMotionOverride('yes')).toThrow();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { hasTouchSupport, isPortrait, isTouchMode, setTouchMode, shouldUseTouchControls } from '../../src/input/deviceDetection.js';

afterEach(() => setTouchMode(false));

const device = ({ touch = true, coarse = true, finePointer = false, search = '', portrait = false } = {}) => ({
  location: { search },
  navigator: { maxTouchPoints: touch ? 5 : 0 },
  matchMedia: (query) => ({
    matches:
      (query === '(pointer: coarse)' && coarse) ||
      (query === '(any-pointer: fine)' && finePointer) ||
      (query === '(orientation: portrait)' && portrait),
  }),
});

describe('shouldUseTouchControls', () => {
  it('shows controls on touch-only phones and tablets', () => {
    expect(shouldUseTouchControls(device())).toBe(true);
  });

  it('hides them on desktops and on tablets with a mouse or trackpad', () => {
    expect(shouldUseTouchControls(device({ touch: false, coarse: false, finePointer: true }))).toBe(false);
    expect(shouldUseTouchControls(device({ finePointer: true }))).toBe(false);
    expect(shouldUseTouchControls(device({ touch: false }))).toBe(false);
  });

  it('honors the ?touch override', () => {
    expect(shouldUseTouchControls(device({ touch: false, coarse: false, search: '?touch=1' }))).toBe(true);
    expect(shouldUseTouchControls(device({ search: '?touch=0' }))).toBe(false);
  });

  it('survives a missing window or matchMedia', () => {
    expect(shouldUseTouchControls(undefined)).toBe(false);
    expect(hasTouchSupport({ navigator: {} })).toBe(false);
    expect(isPortrait({})).toBe(false);
  });
});

describe('touch mode flag', () => {
  it('is off by default and can be switched on', () => {
    expect(isTouchMode()).toBe(false);
    setTouchMode(true);
    expect(isTouchMode()).toBe(true);
    expect(isPortrait(device({ portrait: true }))).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enterFullscreen, getFullscreenSupport, isStandalone } from '../../src/ui/fullscreen.js';
import { mountTouchControls } from '../../src/ui/TouchControls.js';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const fakeWin = ({ ua = '', standalone = false, displayMode = null } = {}) => ({
  navigator: { userAgent: ua, standalone },
  matchMedia: (query) => ({ matches: displayMode !== null && query === `(display-mode: ${displayMode})` }),
});

describe('getFullscreenSupport', () => {
  it('sends iPhone Safari to the Home Screen route', () => {
    expect(getFullscreenSupport({ fullscreenEnabled: false }, fakeWin({ ua: IPHONE_UA }))).toMatchObject({ api: false, homeScreenOnly: true });
  });

  it('treats the Home Screen web app as already fullscreen', () => {
    const support = getFullscreenSupport({ fullscreenEnabled: false }, fakeWin({ ua: IPHONE_UA, standalone: true }));
    expect(support).toMatchObject({ standalone: true, alreadyFullscreen: true, homeScreenOnly: false });
    expect(isStandalone(fakeWin({ displayMode: 'fullscreen' }))).toBe(true);
  });

  it('uses the Fullscreen API on Android and prefixed on iPad', () => {
    expect(getFullscreenSupport({ fullscreenEnabled: true }, fakeWin({ ua: 'Android' })).api).toBe(true);
    expect(getFullscreenSupport({ webkitFullscreenEnabled: true }, fakeWin({ ua: 'iPad' })).api).toBe(true);
  });
});

describe('enterFullscreen', () => {
  it('requests fullscreen and then locks landscape', async () => {
    const lock = vi.fn(() => Promise.resolve());
    const doc = { documentElement: { requestFullscreen: vi.fn(() => Promise.resolve()) }, defaultView: { screen: { orientation: { lock } } } };
    await expect(enterFullscreen(doc)).resolves.toBe(true);
    expect(lock).toHaveBeenCalledWith('landscape');
  });

  it('falls back to the webkit prefix and survives a refused orientation lock', async () => {
    const webkitRequestFullscreen = vi.fn(() => Promise.resolve());
    const doc = { documentElement: { webkitRequestFullscreen }, defaultView: { screen: { orientation: { lock: () => Promise.reject(new Error('no')) } } } };
    await expect(enterFullscreen(doc)).resolves.toBe(true);
    expect(webkitRequestFullscreen).toHaveBeenCalled();
  });

  it('reports false when the browser refuses', async () => {
    const doc = { documentElement: { requestFullscreen: () => Promise.reject(new Error('denied')) } };
    await expect(enterFullscreen(doc)).resolves.toBe(false);
  });
});

describe('touch deck fullscreen behaviour', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main><div id="game"></div><p id="game-help"></p><div id="sr-status"></div></main>';
    Object.defineProperty(window, 'innerWidth', { value: 844, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 390, configurable: true });
  });
  afterEach(() => {
    delete document.fullscreenEnabled;
    vi.restoreAllMocks();
  });
  const keyboard = () => ({ held: new Set(), press: vi.fn(), release: vi.fn(), tap: vi.fn(), setHeld: vi.fn(), releaseAll: vi.fn() });

  it('goes fullscreen on the first tap where the API exists, only once', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const request = vi.fn(() => Promise.resolve());
    document.documentElement.requestFullscreen = request;
    const { handheld } = mountTouchControls({ keyboard: keyboard() });
    handheld.querySelector('[data-action="jump"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    handheld.querySelector('[data-action="jump"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(request).toHaveBeenCalledTimes(1);
    delete document.documentElement.requestFullscreen;
  });

  it('on iPhone shows the Add to Home Screen guide on landscape and from FULL SCREEN', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA);
    const controls = mountTouchControls({ keyboard: keyboard() });
    controls.attachGame({ pause: vi.fn(), resume: vi.fn() });
    const tip = controls.installTip;
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toMatch(/Add to Home Screen/);
    tip.querySelector('[data-action="close-install"]').click();
    expect(tip.hidden).toBe(true);
    controls.handheld.querySelector('[data-action="fullscreen"]').click();
    expect(tip.hidden).toBe(false);
  });
});

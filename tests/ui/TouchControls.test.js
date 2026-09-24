import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DPAD_ACTIONS, directionsFromPoint, mountTouchControls } from '../../src/ui/TouchControls.js';
import { getControlCopy } from '../../src/config/controlCopy.js';

let portrait = false;
let orientationListener = null;

// Sets the viewport like a phone being turned; isPortrait reads these first.
function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

beforeEach(() => {
  document.body.innerHTML = '<main class="shell"><div id="game"></div><p id="game-help">Keyboard help</p><div id="sr-status"></div></main>';
  document.documentElement.className = '';
  portrait = false;
  setViewport(844, 390);
  vi.stubGlobal('matchMedia', (query) => ({
    get matches() {
      return query === '(orientation: portrait)' && portrait;
    },
    addEventListener: (_type, listener) => {
      orientationListener = listener;
    },
  }));
});
afterEach(() => vi.unstubAllGlobals());

const fakeKeyboard = () => ({ held: new Set(), press: vi.fn(), release: vi.fn(), tap: vi.fn(), setHeld: vi.fn(), releaseAll: vi.fn() });
const pointer = (target, type, init = {}) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, ...init }));

describe('directionsFromPoint', () => {
  it('ignores the dead zone at the center', () => {
    expect(directionsFromPoint(5, -5, 80)).toEqual([]);
  });

  it('maps each arm and diagonals to held directions', () => {
    expect(directionsFromPoint(-70, 0, 80)).toEqual(['left']);
    expect(directionsFromPoint(70, 0, 80)).toEqual(['right']);
    expect(directionsFromPoint(0, -70, 80)).toEqual(['up']);
    expect(directionsFromPoint(0, 70, 80)).toEqual(['down']);
    expect(directionsFromPoint(60, -60, 80)).toEqual(['right', 'up']);
  });
});

describe('mountTouchControls', () => {
  it('wraps the game in the handheld layout with labelled controls', () => {
    const { handheld } = mountTouchControls({ keyboard: fakeKeyboard() });
    expect(document.documentElement.classList.contains('touch-mode')).toBe(true);
    expect(handheld.querySelector('.handheld-screen #game')).not.toBeNull();
    const labels = [...handheld.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'));
    expect(labels).toEqual(expect.arrayContaining(['START', 'PAUSE', 'SOUND', 'JUMP']));
    expect(handheld.querySelector('[data-control="dpad"]').getAttribute('aria-label')).toBe('Direction pad');
    expect(document.getElementById('game-help').textContent).toMatch(/D-pad/);
  });

  it('holds JUMP while the finger is down and releases it on lift', () => {
    const keyboard = fakeKeyboard();
    const { handheld } = mountTouchControls({ keyboard });
    const jump = handheld.querySelector('[data-action="jump"]');
    pointer(jump, 'pointerdown');
    expect(keyboard.press).toHaveBeenCalledWith('jump');
    expect(jump.classList.contains('is-pressed')).toBe(true);
    pointer(jump, 'pointerup');
    expect(keyboard.release).toHaveBeenCalledWith('jump');
  });

  it('sends a tap for keyboard or switch activation of a focused button', () => {
    const keyboard = fakeKeyboard();
    const { handheld } = mountTouchControls({ keyboard });
    handheld.querySelector('[data-action="confirm"]').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(keyboard.tap).toHaveBeenCalledWith('confirm');
  });

  it('translates D-pad touches into held directions', () => {
    const keyboard = fakeKeyboard();
    const { handheld } = mountTouchControls({ keyboard });
    const pad = handheld.querySelector('[data-control="dpad"]');
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 160, height: 160 });
    pointer(pad, 'pointerdown', { clientX: 150, clientY: 80 });
    expect(keyboard.setHeld).toHaveBeenLastCalledWith(['right'], DPAD_ACTIONS);
    pointer(pad, 'pointermove', { clientX: 80, clientY: 5 });
    expect(keyboard.setHeld).toHaveBeenLastCalledWith(['up'], DPAD_ACTIONS);
    pointer(pad, 'pointerup');
    expect(keyboard.setHeld).toHaveBeenLastCalledWith([], DPAD_ACTIONS);
  });

  it('pauses the game in portrait and resumes it in landscape', () => {
    const keyboard = fakeKeyboard();
    const controls = mountTouchControls({ keyboard });
    const game = { pause: vi.fn(), resume: vi.fn(), scale: { refresh: vi.fn() } };
    controls.attachGame(game);
    const hint = document.querySelector('.rotate-hint');
    expect(hint.hidden).toBe(true);
    setViewport(390, 844);
    orientationListener();
    expect(hint.hidden).toBe(false);
    expect(game.pause).toHaveBeenCalled();
    expect(keyboard.releaseAll).toHaveBeenCalled();
    expect(controls.handheld.hasAttribute('inert')).toBe(true);
    setViewport(844, 390);
    orientationListener();
    expect(hint.hidden).toBe(true);
    expect(game.resume).toHaveBeenCalled();
    expect(game.scale.refresh).toHaveBeenCalled();
  });

  it('notices rotation from resize and orientationchange, not only the media query', () => {
    const controls = mountTouchControls({ keyboard: fakeKeyboard() });
    const game = { pause: vi.fn(), resume: vi.fn() };
    controls.attachGame(game);
    const hint = document.querySelector('.rotate-hint');
    setViewport(390, 844);
    window.dispatchEvent(new Event('resize'));
    expect(hint.hidden).toBe(false);
    setViewport(844, 390);
    window.dispatchEvent(new Event('orientationchange'));
    expect(hint.hidden).toBe(true);
    expect(game.resume).toHaveBeenCalled();
  });

  it('pauses a game attached while the page is already in portrait', () => {
    setViewport(390, 844);
    const controls = mountTouchControls({ keyboard: fakeKeyboard() });
    const game = { pause: vi.fn(), resume: vi.fn() };
    controls.attachGame(game);
    expect(game.pause).toHaveBeenCalledOnce();
  });

  it('keeps the orientation media query referenced so Safari cannot drop its listener', () => {
    const controls = mountTouchControls({ keyboard: fakeKeyboard() });
    expect(controls.portraitQuery).toBeDefined();
  });

  it('pauses only on the change into portrait, not on every resize', () => {
    const controls = mountTouchControls({ keyboard: fakeKeyboard() });
    const game = { pause: vi.fn(), resume: vi.fn() };
    controls.attachGame(game);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(game.pause).not.toHaveBeenCalled();
  });
});

describe('control copy', () => {
  it('names on-screen buttons in touch mode and keys otherwise', () => {
    expect(getControlCopy(true).gameOverRetry).toMatch(/START/);
    expect(getControlCopy(true).instructionLines.join(' ')).toMatch(/D-pad/);
    expect(getControlCopy(false).gameOverRetry).toMatch(/Enter/);
  });
});

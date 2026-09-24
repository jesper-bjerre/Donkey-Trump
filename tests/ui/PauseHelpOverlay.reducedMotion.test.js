import { describe, expect, it, vi } from 'vitest';
import { PauseHelpOverlay, getPauseOverlayPresentation } from '../../src/ui/PauseHelpOverlay.js';
import { getReducedMotionPreference } from '../../src/config/playerSettings.js';
import { createFakeScene } from '../helpers/fakeScene.js';
import * as fx from '../fixtures/playerSettings.fixture.js';

const callbacks = { onResume: vi.fn(), onRestart: vi.fn(), onReturnToTitle: vi.fn() };

describe('PauseHelpOverlay reduced motion', () => {
  it('drops the rolling preview animation class when reduced motion is preferred', () => {
    const reducedMotion = getReducedMotionPreference({ win: fx.reduceWindow });
    expect(getPauseOverlayPresentation({ reducedMotion })).toEqual({ reducedMotion: true, previewAnimationClass: null, hintPulse: false });
  });

  it('renders no preview and starts no tweens with reduced motion', () => {
    const scene = createFakeScene();
    const overlay = new PauseHelpOverlay(scene, callbacks, { reducedMotion: true });
    overlay.open();
    expect(overlay.preview).toBeUndefined();
    expect(scene.tweens.add).not.toHaveBeenCalled();
    expect(overlay.isOpen).toBe(true);
  });

  it('animates the preview and hint when motion is allowed', () => {
    const scene = createFakeScene();
    const overlay = new PauseHelpOverlay(scene, callbacks, { reducedMotion: false });
    overlay.open();
    expect(overlay.presentation.previewAnimationClass).toBe('rolling-preview');
    expect(overlay.preview).toBeDefined();
    expect(scene.tweens.add).toHaveBeenCalledTimes(2);
  });

  it('defaults to the player settings preference', () => {
    // jsdom has no matchMedia, so install the fixture's "reduce" stub.
    vi.stubGlobal('matchMedia', fx.reduceWindow.matchMedia);
    const overlay = new PauseHelpOverlay(createFakeScene(), callbacks);
    expect(overlay.presentation.reducedMotion).toBe(true);
    vi.unstubAllGlobals();
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { REQUIRED_BROWSER_CAPABILITIES, SUPPORTED_DESKTOP_BROWSERS, validateSupportMatrix } from '../../src/config/browserSupport.js';
import { getReducedMotionPreference } from '../../src/config/playerSettings.js';
import { FOCUS_MARKERS, TEXT_CONTRAST_PAIRS } from '../../src/config/uiTheme.js';
import { meetsWcagAA } from '../../src/qa/contrast.js';
import { getDevRoutes } from '../../src/routes/devRoutes.js';
import { createTitleMenuModel, formatMenuLabel } from '../../src/scenes/TitleScene.js';
import { checkBootCapabilities } from '../../src/scenes/BootScene.js';
import { PAUSE_ACTIONS, createPauseHelpState, getPauseOverlayPresentation } from '../../src/ui/PauseHelpOverlay.js';
import { formatHudState } from '../../src/systems/HudSystem.js';
import { EMPTY_INPUT } from '../../src/input/InputMapper.js';
import * as fx from '../fixtures/browserSupportMatrix.fixture.js';

const root = path.resolve(import.meta.dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('browser support matrix', () => {
  it('covers Chromium, Firefox and Safari desktop at current and previous major', () => {
    expect(validateSupportMatrix(SUPPORTED_DESKTOP_BROWSERS)).toEqual([]);
    expect(SUPPORTED_DESKTOP_BROWSERS.find((b) => b.family === 'chromium').names).toEqual(expect.arrayContaining(['Chrome', 'Edge']));
  });

  it('detects incomplete matrices', () => {
    expect(validateSupportMatrix(fx.complete)).toEqual([]);
    expect(validateSupportMatrix(fx.missingSafari)).toEqual(['missing safari']);
    expect(validateSupportMatrix(fx.currentOnlyFirefox)).toEqual(['firefox missing previous-major']);
    expect(validateSupportMatrix(fx.withMobile)).toEqual(['safari lists a mobile platform']);
  });

  it('requires rendering and keyboard support at boot', () => {
    expect(REQUIRED_BROWSER_CAPABILITIES).toEqual(expect.arrayContaining(['canvas-or-webgl', 'keyboard-events']));
    expect(checkBootCapabilities({ canvas: true, webgl: false, keyboard: false }).supported).toBe(false);
  });
});

describe('WCAG 2.1 AA for non-gameplay UI', () => {
  it('meets text contrast thresholds for every UI pairing', () => {
    for (const pair of TEXT_CONTRAST_PAIRS) {
      const result = meetsWcagAA(pair);
      expect(result.passes, `${pair.name}: ${result.ratio.toFixed(2)} < ${result.required}`).toBe(true);
    }
  });

  it('keeps every title and pause action keyboard operable', () => {
    const onStart = vi.fn();
    const title = createTitleMenuModel({ onStart });
    const reached = new Set();
    for (let i = 0; i < title.page.actions.length; i++) {
      reached.add(title.selectedAction);
      title.handleKey('ArrowDown');
    }
    expect([...reached].sort()).toEqual(['instructions', 'privacy', 'start']);
    title.handleKey('Enter');
    expect(onStart).toHaveBeenCalledOnce();

    const handlers = { onResume: vi.fn(), onRestart: vi.fn(), onReturnToTitle: vi.fn() };
    const seen = new Set();
    const pause = createPauseHelpState(handlers);
    pause.open();
    for (let i = 0; i < PAUSE_ACTIONS.length; i++) {
      seen.add(pause.selectedAction);
      pause.handleInput({ ...EMPTY_INPUT, downPressed: true });
    }
    expect(seen.size).toBe(PAUSE_ACTIONS.length);
  });

  it('shows focus with markers, not color alone', () => {
    const focused = formatMenuLabel('Start Game', true);
    expect(focused).toContain(FOCUS_MARKERS.before.trim());
    expect(focused).toContain(FOCUS_MARKERS.after.trim());
    expect(formatMenuLabel('Start Game', false)).toBe('Start Game');
  });

  it('conveys lives, score and outcomes as text rather than color', () => {
    const hud = formatHudState({ currentState: 'game-over', score: 10, lives: 0, levelIndex: 0, totalLevels: 3 });
    expect(hud).toMatchObject({ lives: 'Lives: 0', score: 'Score: 10', message: 'GAME OVER' });
  });

  it('ships English-only UI with a declared page language', () => {
    const configFiles = fs.readdirSync(path.join(root, 'src/config'));
    expect(configFiles.filter((file) => /^uiText\./.test(file))).toEqual(['uiText.en.json']);
    expect(read('index.html')).toMatch(/<html lang="en">/);
    expect(read('index.html')).toMatch(/id="sr-status"[^>]*aria-live="polite"/);
  });

  it('covers reduced motion via player settings and the pause overlay', () => {
    expect(getReducedMotionPreference({ override: true })).toBe(true);
    expect(getPauseOverlayPresentation({ reducedMotion: true }).previewAnimationClass).toBeNull();
    expect(read('src/ui/PauseHelpOverlay.js')).toContain("from '../config/playerSettings.js'");
  });
});

describe('no production admin surface', () => {
  it('omits the release QA page from production routes', () => {
    const production = getDevRoutes({ isDev: false });
    expect(production.some((route) => route.component === 'AccessibilityReleaseQASettingsPage')).toBe(false);
    expect(getDevRoutes({ isDev: true }).some((route) => route.component === 'AccessibilityReleaseQASettingsPage')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { HudSystem, formatHudState } from '../../src/systems/HudSystem.js';
import snapshots from '../fixtures/hudStateSnapshots.json';
import { createFakeScene } from '../helpers/fakeScene.js';

describe('formatHudState', () => {
  it('formats the starting score and lives', () => {
    expect(formatHudState(snapshots.start)).toMatchObject({ score: 'Score: 0', lives: 'Lives: 3', level: 'Level 1/3' });
  });

  it('reflects updated score and lives', () => {
    expect(formatHudState(snapshots.play).score).toBe('Score: 1200');
    expect(formatHudState(snapshots.lifeLoss).lives).toBe('Lives: 2');
  });

  it('shows Lives: 0 at game over and never a negative or undefined value', () => {
    expect(formatHudState(snapshots.gameOver).lives).toBe('Lives: 0');
    expect(formatHudState(snapshots.corrupt)).toMatchObject({ score: 'Score: 0', lives: 'Lives: 0' });
  });

  it('shows a state message for outcomes', () => {
    expect(formatHudState(snapshots.levelComplete).message).toMatch(/rescued/i);
    expect(formatHudState(snapshots.victory).message).toMatch(/victory/i);
    expect(formatHudState(snapshots.gameOver).message).toMatch(/game over/i);
  });
});

describe('HudSystem', () => {
  it('creates text objects and updates them from snapshots', () => {
    const scene = createFakeScene();
    const hud = HudSystem.createHud(scene);
    hud.updateFromState(snapshots.play);
    expect(hud.texts.score.text).toBe('Score: 1200');
    expect(hud.texts.lives.text).toBe('Lives: 3');
    hud.texts.score.setText.mockClear();
    hud.updateFromState(snapshots.lifeLoss);
    expect(hud.texts.score.setText).not.toHaveBeenCalled();
    expect(hud.texts.lives.text).toBe('Lives: 2');
  });
});

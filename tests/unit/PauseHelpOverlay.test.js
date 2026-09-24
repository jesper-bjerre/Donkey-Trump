import { describe, expect, it, vi } from 'vitest';
import { PAUSE_ACTIONS, createPauseHelpState, getPauseHelpContent } from '../../src/ui/PauseHelpOverlay.js';
import { EMPTY_INPUT } from '../../src/input/InputMapper.js';

const callbacks = () => ({ onResume: vi.fn(), onRestart: vi.fn(), onReturnToTitle: vi.fn() });
const press = (field) => ({ ...EMPTY_INPUT, [field]: true });

describe('getPauseHelpContent', () => {
  it('offers resume, restart and return to title', () => {
    expect(PAUSE_ACTIONS).toEqual(['resume', 'restart', 'returnToTitle']);
    expect(getPauseHelpContent().actions.map((action) => action.id)).toEqual(PAUSE_ACTIONS);
  });

  it('includes keyboard help for every control', () => {
    const copy = getPauseHelpContent().helpLines.join(' ').toLowerCase();
    for (const word of ['left', 'right', 'jump', 'up', 'down', 'pause', 'resume', 'retry']) expect(copy).toContain(word);
  });
});

describe('createPauseHelpState', () => {
  it('opens on resume and closes', () => {
    const state = createPauseHelpState(callbacks());
    state.open();
    expect(state.isOpen).toBe(true);
    expect(state.selectedAction).toBe('resume');
    state.close();
    expect(state.isOpen).toBe(false);
  });

  it('moves the selection with selectNextAction and selectPreviousAction, wrapping', () => {
    const state = createPauseHelpState(callbacks());
    state.open();
    state.selectNextAction();
    expect(state.selectedAction).toBe('restart');
    state.selectNextAction();
    state.selectNextAction();
    expect(state.selectedAction).toBe('resume');
    state.selectPreviousAction();
    expect(state.selectedAction).toBe('returnToTitle');
  });

  it('activateSelectedAction calls the matching callback and closes', () => {
    const cb = callbacks();
    const state = createPauseHelpState(cb);
    state.open();
    state.selectNextAction();
    expect(state.activateSelectedAction()).toBe('restart');
    expect(cb.onRestart).toHaveBeenCalledOnce();
    expect(state.isOpen).toBe(false);
    expect(state.activateSelectedAction()).toBeNull();
  });

  it('Escape or the pause key resumes regardless of the selection', () => {
    for (const key of ['escapePressed', 'pausePressed']) {
      const cb = callbacks();
      const state = createPauseHelpState(cb);
      state.open();
      state.handleInput(press('downPressed'));
      state.handleInput(press(key));
      expect(cb.onResume).toHaveBeenCalledOnce();
      expect(cb.onRestart).not.toHaveBeenCalled();
    }
  });

  it('navigates and confirms with keyboard input snapshots', () => {
    const cb = callbacks();
    const state = createPauseHelpState(cb);
    state.open();
    state.handleInput(press('upPressed'));
    state.handleInput(press('confirmPressed'));
    expect(cb.onReturnToTitle).toHaveBeenCalledOnce();
  });

  it('ignores input while closed', () => {
    const cb = callbacks();
    const state = createPauseHelpState(cb);
    expect(state.handleInput(press('escapePressed'))).toBeNull();
    expect(cb.onResume).not.toHaveBeenCalled();
  });
});

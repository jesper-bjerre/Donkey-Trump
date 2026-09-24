import { describe, expect, it, vi } from 'vitest';
import { createTitleMenuModel } from '../../src/scenes/TitleScene.js';

describe('title keyboard flow', () => {
  it('Enter activates the focused Start action', () => {
    const onStart = vi.fn();
    const model = createTitleMenuModel({ onStart });
    expect(model.focusKey).toBe('start');
    model.handleKey('Enter');
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('Escape closes InstructionsModal and focus returns to its trigger', () => {
    const model = createTitleMenuModel({ onStart: vi.fn() });
    model.handleKey('ArrowDown');
    model.handleKey('Enter');
    expect(model.modal).toBe('instructions');
    expect(model.focusKey).toBe('instructions-modal');
    model.handleKey('ArrowDown');
    model.handleKey('Escape');
    expect(model.modal).toBeNull();
    expect(model.focusKey).toBe('instructions');
    expect(model.selectedAction).toBe('instructions');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { InstructionsModal, TitleStartPage, createTitleMenuModel } from '../../src/scenes/TitleScene.js';

describe('title components', () => {
  it('offers only start and instructions, with an account-free message', () => {
    const page = TitleStartPage();
    expect(page.title).toMatch(/DONKEY TRUMP/);
    expect(page.actions.map((action) => action.id)).toEqual(['start', 'instructions']);
    expect(page.accountFree).toMatch(/no account/i);
  });

  it('InstructionsModal covers every control', () => {
    const copy = InstructionsModal().lines.join(' ').toLowerCase();
    for (const word of ['left', 'right', 'jump', 'up', 'down', 'pause', 'resume', 'retry']) expect(copy).toContain(word);
  });

  it('keeps the privacy promise as a line in How to Play', () => {
    const copy = InstructionsModal().lines.join(' ').toLowerCase();
    expect(copy).toContain('no accounts');
    expect(copy).toContain('no tracking');
  });
});

describe('createTitleMenuModel', () => {
  it('opens and closes the instructions modal', () => {
    const model = createTitleMenuModel({ onStart: vi.fn() });
    model.openInstructions();
    expect(model.modal).toBe('instructions');
    model.openInstructions();
    expect(model.modal).toBe('instructions');
    model.closeModal();
    expect(model.modal).toBeNull();
    model.openInstructions();
    model.handleKey('Escape');
    expect(model.modal).toBeNull();
  });

  it('routes start to PlayScene exactly once', () => {
    const onStart = vi.fn();
    const model = createTitleMenuModel({ onStart });
    model.handleKey('Enter');
    model.handleKey('Enter');
    model.handleKey(' ');
    model.activate('start');
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('does not start while a modal is open', () => {
    const onStart = vi.fn();
    const model = createTitleMenuModel({ onStart });
    model.openInstructions();
    expect(model.requestStart()).toBe(false);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('wraps focus with all four arrow keys, since the menu is one row', () => {
    const model = createTitleMenuModel({ onStart: vi.fn() });
    model.handleKey('ArrowUp');
    expect(model.selectedAction).toBe('instructions');
    model.handleKey('ArrowDown');
    expect(model.selectedAction).toBe('start');
    model.handleKey('ArrowRight');
    expect(model.selectedAction).toBe('instructions');
    model.handleKey('ArrowLeft');
    expect(model.selectedAction).toBe('start');
  });
});

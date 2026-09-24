import { describe, expect, it, vi } from 'vitest';
import { InstructionsModal, PrivacyModal, TitleStartPage, createTitleMenuModel } from '../../src/scenes/TitleScene.js';

describe('title components', () => {
  it('offers start, instructions and privacy actions with an account-free message', () => {
    const page = TitleStartPage();
    expect(page.title).toMatch(/DONKEY TRUMP/);
    expect(page.actions.map((action) => action.id)).toEqual(['start', 'instructions', 'privacy']);
    expect(page.accountFree).toMatch(/no account/i);
  });

  it('InstructionsModal covers every control', () => {
    const copy = InstructionsModal().lines.join(' ').toLowerCase();
    for (const word of ['left', 'right', 'jump', 'up', 'down', 'pause', 'resume', 'retry']) expect(copy).toContain(word);
  });

  it('PrivacyModal states the privacy posture', () => {
    const copy = PrivacyModal().lines.join(' ').toLowerCase();
    expect(copy).toContain('no accounts');
    expect(copy).toContain('no persistent profiles');
    expect(copy).toContain('no third-party analytics');
  });
});

describe('createTitleMenuModel', () => {
  it('opens and closes the instructions and privacy modals', () => {
    const model = createTitleMenuModel({ onStart: vi.fn() });
    model.openInstructions();
    expect(model.modal).toBe('instructions');
    model.openPrivacy();
    expect(model.modal).toBe('instructions');
    model.closeModal();
    expect(model.modal).toBeNull();
    model.openPrivacy();
    expect(model.modal).toBe('privacy');
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

  it('wraps focus with the arrow keys', () => {
    const model = createTitleMenuModel({ onStart: vi.fn() });
    model.handleKey('ArrowUp');
    expect(model.selectedAction).toBe('privacy');
    model.handleKey('ArrowDown');
    expect(model.selectedAction).toBe('start');
  });
});

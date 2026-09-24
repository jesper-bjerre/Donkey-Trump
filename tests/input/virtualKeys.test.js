import { afterEach, describe, expect, it } from 'vitest';
import { VIRTUAL_KEYS, VirtualKeyboard, createVirtualKeyboardEvent } from '../../src/input/virtualKeys.js';
import { KEY_BINDINGS } from '../../src/input/InputMapper.js';

const received = [];
const listen = (event) => received.push(`${event.type}:${event.keyCode}:${event.key}`);
window.addEventListener('keydown', listen);
window.addEventListener('keyup', listen);
afterEach(() => {
  received.length = 0;
});

describe('createVirtualKeyboardEvent', () => {
  it('carries the legacy keyCode Phaser reads, plus key and code', () => {
    const event = createVirtualKeyboardEvent('keydown', 'jump');
    expect(event).toMatchObject({ type: 'keydown', key: ' ', code: 'Space', keyCode: 32, which: 32 });
  });

  it('covers every action the touch deck sends, each bound in InputMapper', () => {
    const codeNames = { 37: 'LEFT', 39: 'RIGHT', 38: 'UP', 40: 'DOWN', 32: 'SPACE', 13: 'ENTER', 80: 'P', 77: 'M' };
    for (const [action, def] of Object.entries(VIRTUAL_KEYS)) {
      const binding = action === 'confirm' ? 'confirm' : action;
      expect(KEY_BINDINGS[binding], action).toContain(codeNames[def.keyCode]);
    }
  });

  it('rejects unknown actions', () => {
    expect(() => createVirtualKeyboardEvent('keydown', 'teleport')).toThrow(/Unknown/);
  });
});

describe('VirtualKeyboard', () => {
  it('sends one keydown per press and one keyup per release', () => {
    const keyboard = new VirtualKeyboard();
    keyboard.press('left');
    keyboard.press('left');
    keyboard.release('left');
    keyboard.release('left');
    expect(received).toEqual(['keydown:37:ArrowLeft', 'keyup:37:ArrowLeft']);
  });

  it('setHeld presses and releases only the difference within a group', () => {
    const keyboard = new VirtualKeyboard();
    const group = ['left', 'right', 'up', 'down'];
    keyboard.press('jump');
    keyboard.setHeld(['right', 'up'], group);
    keyboard.setHeld(['up'], group);
    keyboard.setHeld([], group);
    expect(received).toEqual(['keydown:32: ', 'keydown:39:ArrowRight', 'keydown:38:ArrowUp', 'keyup:39:ArrowRight', 'keyup:38:ArrowUp']);
    expect(keyboard.held.has('jump')).toBe(true);
  });

  it('releaseAll lets go of everything, and tap is a quick press+release', () => {
    const keyboard = new VirtualKeyboard();
    keyboard.press('down');
    keyboard.releaseAll();
    keyboard.tap('confirm');
    expect(received).toEqual(['keydown:40:ArrowDown', 'keyup:40:ArrowDown', 'keydown:13:Enter', 'keyup:13:Enter']);
  });
});

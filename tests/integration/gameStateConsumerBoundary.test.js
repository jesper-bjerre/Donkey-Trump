import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createGameStateMachine } from '../../src/state/GameStateMachine.js';
import { formatHudState } from '../../src/systems/HudSystem.js';

const read = (relative) => fs.readFileSync(path.resolve(import.meta.dirname, '../..', relative), 'utf8');

describe('GameStateMachine consumer boundary', () => {
  it('does not import Phaser, storage or network APIs', () => {
    const source = read('src/state/GameStateMachine.js') + read('src/state/ScoreLivesRules.js');
    expect(source).not.toMatch(/from ['"]phaser['"]/);
    expect(source).not.toMatch(/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);
  });

  it('feeds HudSystem formatting through subscriptions', () => {
    const machine = createGameStateMachine({ totalLevels: 3 });
    const frames = [];
    machine.subscribe((snapshot) => frames.push(formatHudState(snapshot)));
    machine.startGame();
    machine.addScore(100);
    machine.loseLife();
    expect(frames.at(-1)).toMatchObject({ score: 'Score: 100', lives: 'Lives: 2', level: 'Level 1/3' });
  });
});

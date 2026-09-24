import { describe, expect, it } from 'vitest';
import { createGameStateMachine } from '../../src/state/GameStateMachine.js';
import { HudSystem } from '../../src/systems/HudSystem.js';
import { createFakeScene } from '../helpers/fakeScene.js';

describe('HudSystem and GameStateMachine', () => {
  it('updates Phaser text doubles after addScore and loseLife', () => {
    const machine = createGameStateMachine({ totalLevels: 3 });
    const hud = new HudSystem(createFakeScene());
    machine.subscribe((snapshot) => hud.updateFromState(snapshot));
    machine.startGame();
    machine.addScore(100);
    expect(hud.texts.score.text).toBe('Score: 100');
    machine.loseLife();
    expect(hud.texts.lives.text).toBe('Lives: 2');
    expect(hud.texts.message.text).toMatch(/barrel/i);
  });
});

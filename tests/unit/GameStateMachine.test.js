import { describe, expect, it } from 'vitest';
import { GAME_STATES, TRANSITIONS, createGameStateMachine } from '../../src/state/GameStateMachine.js';
import scenarios from '../fixtures/gameStateScenarios.json';

const make = () => createGameStateMachine({ totalLevels: scenarios.totalLevels, initialLives: scenarios.initialLives });

function run(actions) {
  const machine = make();
  let snapshot;
  for (const action of actions) {
    snapshot = machine[action]();
    expect(snapshot.rejected, `${action} rejected: ${snapshot.reason}`).toBeUndefined();
  }
  return snapshot;
}

describe('GameStateMachine exports', () => {
  it('names every arcade state', () => {
    expect(Object.values(GAME_STATES)).toEqual(
      expect.arrayContaining(['start', 'play', 'pause', 'life-loss', 'level-complete', 'game-over', 'retry', 'victory']),
    );
  });

  it('exposes the transition methods', () => {
    const machine = make();
    for (const name of ['startGame', 'pauseGame', 'resumeGame', 'loseLife', 'completeLevel', 'retryLevel', 'restartGame', 'addScore', 'completeFinalLevel']) {
      expect(TRANSITIONS).toContain(name);
      expect(typeof machine[name]).toBe('function');
    }
  });
});

describe('transition sequences', () => {
  for (const [name, scenario] of Object.entries(scenarios.sequences)) {
    it(name, () => {
      const snapshot = run(scenario.actions);
      expect(snapshot.currentState).toBe(scenario.expectedState);
      if ('expectedLives' in scenario) expect(snapshot.lives).toBe(scenario.expectedLives);
      if ('expectedScore' in scenario) expect(snapshot.score).toBe(scenario.expectedScore);
      if ('expectedLevelIndex' in scenario) expect(snapshot.levelIndex).toBe(scenario.expectedLevelIndex);
    });
  }

  it('reaches game over when the last life is lost', () => {
    const machine = make();
    machine.startGame();
    for (let i = 0; i < scenarios.initialLives - 1; i++) {
      machine.loseLife();
      machine.retryLevel();
      machine.startLevel();
    }
    const snapshot = machine.loseLife();
    expect(snapshot.currentState).toBe(GAME_STATES.GAME_OVER);
    expect(snapshot.lives).toBe(0);
  });
});

describe('snapshots', () => {
  it('include the documented fields', () => {
    const snapshot = run(['startGame']);
    expect(snapshot).toMatchObject({ currentState: 'play', score: 0, lives: 3, levelIndex: 0, totalLevels: 3 });
    expect(snapshot.lastTransition).toEqual({ action: 'startGame', from: 'start', to: 'play' });
  });

  it('describe rejected transitions without changing state', () => {
    const machine = make();
    const rejected = machine.pauseGame();
    expect(rejected).toMatchObject({ rejected: true, attemptedAction: 'pauseGame', currentState: 'start' });
    expect(rejected.reason).toMatch(/not allowed/);
    expect(machine.getSnapshot().currentState).toBe('start');
  });

  it('refuses completeLevel on the final level and completeFinalLevel earlier', () => {
    const machine = make();
    machine.startGame();
    expect(machine.completeFinalLevel()).toMatchObject({ rejected: true, attemptedAction: 'completeFinalLevel' });
    machine.completeLevel();
    machine.startNextLevel();
    machine.completeLevel();
    machine.startNextLevel();
    expect(machine.completeLevel()).toMatchObject({ rejected: true, attemptedAction: 'completeLevel' });
  });

  it('adds score only during play and rejects invalid deltas', () => {
    const machine = make();
    machine.startGame();
    expect(machine.addScore(scenarios.scoringDeltas.barrelJump).score).toBe(100);
    expect(machine.addScore(-5)).toMatchObject({ rejected: true });
    machine.pauseGame();
    expect(machine.addScore(100)).toMatchObject({ rejected: true });
  });

  it('notifies subscribers on each committed transition', () => {
    const machine = make();
    const seen = [];
    const unsubscribe = machine.subscribe((snapshot) => seen.push(snapshot.currentState));
    machine.startGame();
    machine.pauseGame();
    machine.pauseGame();
    unsubscribe();
    machine.resumeGame();
    expect(seen).toEqual(['play', 'pause']);
  });
});

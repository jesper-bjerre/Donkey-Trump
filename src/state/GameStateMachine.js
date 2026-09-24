// Single in-memory authority for arcade flow. Score and lives math is delegated
// to ScoreLivesRules; this module only decides which transitions are allowed.
// Framework-free: no Phaser, no storage, no network.
import {
  OUTCOMES,
  SCORE_RULES,
  addPoints,
  applyHazardHit,
  applyLevelComplete,
  createInitialScoreLivesState,
} from './ScoreLivesRules.js';

export const GAME_STATES = Object.freeze({
  START: 'start',
  PLAY: 'play',
  PAUSE: 'pause',
  LIFE_LOSS: 'life-loss',
  LEVEL_COMPLETE: 'level-complete',
  GAME_OVER: 'game-over',
  RETRY: 'retry',
  VICTORY: 'victory',
});

const S = GAME_STATES;

export function createGameStateMachine({ totalLevels, initialLives = SCORE_RULES.startingLives } = {}) {
  if (!Number.isInteger(totalLevels) || totalLevels < 1) {
    throw new Error('GameStateMachine needs totalLevels >= 1.');
  }
  const listeners = new Set();
  let currentState = S.START;
  let lastTransition = null;
  let values = createInitialScoreLivesState({ lives: initialLives });

  const snapshot = () => ({
    currentState,
    score: values.score,
    lives: values.lives,
    levelIndex: values.levelIndex,
    totalLevels,
    lastTransition,
  });

  function commit(action, nextState, nextValues = values, extra = {}) {
    lastTransition = { action, from: currentState, to: nextState };
    currentState = nextState;
    values = nextValues;
    const snap = { ...snapshot(), ...extra };
    for (const listener of listeners) listener(snap);
    return snap;
  }

  function reject(action, reason) {
    return { ...snapshot(), rejected: true, attemptedAction: action, reason };
  }

  function guard(action, allowed) {
    return allowed.includes(currentState) ? null : reject(action, `${action} is not allowed from ${currentState}`);
  }

  return {
    getSnapshot: snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    startGame() {
      return guard('startGame', [S.START]) ?? commit('startGame', S.PLAY);
    },

    pauseGame() {
      return guard('pauseGame', [S.PLAY]) ?? commit('pauseGame', S.PAUSE);
    },

    resumeGame() {
      return guard('resumeGame', [S.PAUSE]) ?? commit('resumeGame', S.PLAY);
    },

    addScore(points) {
      const blocked = guard('addScore', [S.PLAY]);
      if (blocked) return blocked;
      if (!Number.isInteger(points) || points < 0) return reject('addScore', 'points must be a non-negative integer');
      return commit('addScore', S.PLAY, addPoints(values, points));
    },

    loseLife() {
      const blocked = guard('loseLife', [S.PLAY]);
      if (blocked) return blocked;
      const { state, outcome } = applyHazardHit(values);
      return commit('loseLife', outcome === OUTCOMES.GAME_OVER ? S.GAME_OVER : S.LIFE_LOSS, state, { outcome });
    },

    retryLevel() {
      return guard('retryLevel', [S.LIFE_LOSS]) ?? commit('retryLevel', S.RETRY);
    },

    // Begins the retried attempt of the same level.
    startLevel() {
      return guard('startLevel', [S.RETRY]) ?? commit('startLevel', S.PLAY);
    },

    completeLevel() {
      const blocked = guard('completeLevel', [S.PLAY]);
      if (blocked) return blocked;
      if (values.levelIndex >= totalLevels - 1) return reject('completeLevel', 'final level must use completeFinalLevel');
      const { state, outcome } = applyLevelComplete(values, { totalLevels });
      return commit('completeLevel', S.LEVEL_COMPLETE, state, { outcome });
    },

    startNextLevel() {
      const blocked = guard('startNextLevel', [S.LEVEL_COMPLETE]);
      if (blocked) return blocked;
      return commit('startNextLevel', S.PLAY, { ...values, levelIndex: values.levelIndex + 1 });
    },

    completeFinalLevel() {
      const blocked = guard('completeFinalLevel', [S.PLAY]);
      if (blocked) return blocked;
      if (values.levelIndex < totalLevels - 1) return reject('completeFinalLevel', 'current level is not the final level');
      const { state, outcome, bonus } = applyLevelComplete(values, { totalLevels });
      return commit('completeFinalLevel', S.VICTORY, state, { outcome, bonus });
    },

    restartGame() {
      const blocked = guard('restartGame', [S.GAME_OVER, S.VICTORY, S.PAUSE]);
      if (blocked) return blocked;
      return commit('restartGame', S.START, createInitialScoreLivesState({ lives: initialLives }));
    },
  };
}

// Named transitions for file inspection and consumers that iterate actions.
export const TRANSITIONS = Object.freeze([
  'startGame',
  'pauseGame',
  'resumeGame',
  'loseLife',
  'completeLevel',
  'retryLevel',
  'restartGame',
  'addScore',
  'completeFinalLevel',
  'startLevel',
  'startNextLevel',
]);

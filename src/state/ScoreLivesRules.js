// Pure score and lives rules. Every function returns a new state plus an outcome
// label; nothing here touches Phaser, storage or the network.

export const SCORE_RULES = Object.freeze({
  startingLives: 3,
  levelCompletePoints: 1000,
  barrelJumpPoints: 100,
  // Awarded per remaining life when the final level is rescued.
  victoryLifeBonus: 500,
});

export const OUTCOMES = Object.freeze({
  LIFE_LOST: 'lifeLost',
  GAME_OVER: 'gameOver',
  NEXT_LEVEL: 'nextLevel',
  VICTORY: 'victory',
});

export function createInitialScoreLivesState({ lives = SCORE_RULES.startingLives } = {}) {
  return { score: 0, lives, levelIndex: 0, status: 'play' };
}

export function addPoints(state, points) {
  if (!Number.isInteger(points) || points < 0) {
    throw new Error(`Score delta must be a non-negative integer, got ${points}.`);
  }
  return { ...state, score: state.score + points };
}

export function applyBarrelJump(state) {
  return addPoints(state, SCORE_RULES.barrelJumpPoints);
}

export function applyHazardHit(state) {
  const lives = Math.max(0, state.lives - 1);
  if (lives === 0) {
    return { state: { ...state, lives, status: 'game-over' }, outcome: OUTCOMES.GAME_OVER };
  }
  return { state: { ...state, lives, status: 'life-loss' }, outcome: OUTCOMES.LIFE_LOST };
}

export function canRetry(state) {
  return state.lives > 0;
}

export function applyLevelComplete(state, { totalLevels }) {
  const scored = addPoints(state, SCORE_RULES.levelCompletePoints);
  const isFinal = state.levelIndex >= totalLevels - 1;
  if (isFinal) {
    const bonus = state.lives * SCORE_RULES.victoryLifeBonus;
    return { state: { ...addPoints(scored, bonus), status: 'victory' }, outcome: OUTCOMES.VICTORY, bonus };
  }
  return { state: { ...scored, status: 'level-complete' }, outcome: OUTCOMES.NEXT_LEVEL, bonus: 0 };
}

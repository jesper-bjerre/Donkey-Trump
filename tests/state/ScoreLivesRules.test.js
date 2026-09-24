import { describe, expect, it } from 'vitest';
import {
  OUTCOMES,
  SCORE_RULES,
  addPoints,
  applyBarrelJump,
  applyHazardHit,
  applyLevelComplete,
  canRetry,
  createInitialScoreLivesState,
} from '../../src/state/ScoreLivesRules.js';

const states = {
  initial: { score: 0, lives: 3, levelIndex: 0, status: 'play' },
  hitWithLivesLeft: { score: 1500, lives: 2, levelIndex: 1, status: 'play' },
  hitOnFinalLife: { score: 1500, lives: 1, levelIndex: 1, status: 'play' },
  nonFinalComplete: { score: 200, lives: 3, levelIndex: 0, status: 'play' },
  finalComplete: { score: 2200, lives: 2, levelIndex: 2, status: 'play' },
};

describe('ScoreLivesRules', () => {
  it('creates the initial play state', () => {
    expect(createInitialScoreLivesState()).toEqual(states.initial);
    expect(createInitialScoreLivesState().lives).toBeGreaterThan(0);
  });

  it('decrements exactly one life and returns lifeLost when lives remain', () => {
    const { state, outcome } = applyHazardHit(states.hitWithLivesLeft);
    expect(state.lives).toBe(1);
    expect(outcome).toBe(OUTCOMES.LIFE_LOST);
    expect(canRetry(state)).toBe(true);
  });

  it('returns gameOver when the final life is lost', () => {
    const { state, outcome } = applyHazardHit(states.hitOnFinalLife);
    expect(outcome).toBe(OUTCOMES.GAME_OVER);
    expect(state.lives).toBe(0);
    expect(canRetry(state)).toBe(false);
  });

  it('awards level-complete points and returns nextLevel for non-final levels', () => {
    const { state, outcome } = applyLevelComplete(states.nonFinalComplete, { totalLevels: 3 });
    expect(state.score).toBe(200 + SCORE_RULES.levelCompletePoints);
    expect(outcome).toBe(OUTCOMES.NEXT_LEVEL);
  });

  it('returns victory with a remaining-lives bonus on the final level', () => {
    const { state, outcome, bonus } = applyLevelComplete(states.finalComplete, { totalLevels: 3 });
    expect(outcome).toBe(OUTCOMES.VICTORY);
    expect(bonus).toBe(2 * SCORE_RULES.victoryLifeBonus);
    expect(state.score).toBe(2200 + SCORE_RULES.levelCompletePoints + bonus);
  });

  it('awards barrel jumps and rejects invalid score deltas', () => {
    expect(applyBarrelJump(states.initial).score).toBe(SCORE_RULES.barrelJumpPoints);
    expect(() => addPoints(states.initial, -1)).toThrow();
    expect(() => addPoints(states.initial, 1.5)).toThrow();
  });

  it('never mutates its input', () => {
    const frozen = Object.freeze({ ...states.hitWithLivesLeft });
    expect(() => applyHazardHit(frozen)).not.toThrow();
    expect(frozen.lives).toBe(2);
  });
});

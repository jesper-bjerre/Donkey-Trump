// Deterministic transitions for analytics wiring tests.
export const hitWithLivesLeft = { currentState: 'life-loss', score: 1200, lives: 2, levelIndex: 1, totalLevels: 3 };
export const hitOnLastLife = { currentState: 'game-over', score: 1200, lives: 0, levelIndex: 1, totalLevels: 3 };
export const levelComplete = { currentState: 'level-complete', score: 1000, lives: 3, levelIndex: 0, totalLevels: 3 };
export const victory = { currentState: 'victory', score: 4500, lives: 3, levelIndex: 2, totalLevels: 3 };
export const firstKeyboardInput = { left: false, right: true, up: false, down: false, jumpPressed: false };

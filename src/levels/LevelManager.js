// Loads and validates declarative level data before any Phaser object is built,
// so malformed content fails with a readable path instead of mid-scene.
import schema from './level.schema.json';
import level1 from './level1.json';
import level2 from './level2.json';
import level3 from './level3.json';
import { validateAgainstSchema } from './schemaValidator.js';

export const DEFAULT_LEVELS = [level1, level2, level3];

export class LevelValidationError extends Error {
  constructor(problems) {
    const first = problems[0];
    super(`Invalid level data at ${first.path}: ${first.message}`);
    this.name = 'LevelValidationError';
    this.problems = problems;
  }
}

// Rules JSON Schema cannot express: cross-field relationships and bounds.
function semanticProblems(level) {
  const problems = [];
  const { width, height } = level.dimensions;
  if (level.barrels.speedMin > level.barrels.speedMax) {
    problems.push({ path: 'barrels.speedMin', message: 'must not exceed barrels.speedMax' });
  }
  level.girders.forEach((girder, index) => {
    if (girder.x1 === girder.x2) problems.push({ path: `girders[${index}]`, message: 'must not be vertical' });
  });
  level.ladders.forEach((ladder, index) => {
    if (ladder.x < 0 || ladder.x + ladder.width > width || ladder.y < 0 || ladder.y + ladder.height > height) {
      problems.push({ path: `ladders[${index}]`, message: 'must stay inside the level dimensions' });
    }
    if (ladder.snapX < ladder.x || ladder.snapX > ladder.x + ladder.width) {
      problems.push({ path: `ladders[${index}].snapX`, message: 'must lie within the ladder width' });
    }
  });
  if (level.boss.x < 0 || level.boss.x > width) problems.push({ path: 'boss.x', message: 'must be inside the level width' });
  return problems;
}

export function validateLevelDefinition(level) {
  const problems = validateAgainstSchema(level, schema);
  if (problems.length === 0) problems.push(...semanticProblems(level));
  if (problems.length > 0) throw new LevelValidationError(problems);
  return level;
}

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

// Returns a validated, immutable copy that gameplay systems can share safely.
export function loadLevelDefinition(level) {
  validateLevelDefinition(level);
  return deepFreeze(structuredClone(level));
}

export class LevelManager {
  constructor(levels = DEFAULT_LEVELS) {
    this.levels = levels.map(loadLevelDefinition).sort((a, b) => a.order - b.order);
    if (this.levels.length === 0) throw new Error('LevelManager needs at least one level.');
  }

  get count() {
    return this.levels.length;
  }

  getLevel(index) {
    const level = this.levels[index];
    if (!level) throw new Error(`Level ${index + 1} does not exist.`);
    return level;
  }

  isFinalLevel(index) {
    return index === this.levels.length - 1;
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/state/ScoreLivesRules.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, applyHazardHit: vi.fn(original.applyHazardHit) };
});

const { applyHazardHit } = await import('../../src/state/ScoreLivesRules.js');
const { PlayScene } = await import('../../src/scenes/PlayScene.js');
const { LevelManager } = await import('../../src/levels/LevelManager.js');
const { createGameStateMachine } = await import('../../src/state/GameStateMachine.js');
const { ObjectiveSystem } = await import('../../src/systems/ObjectiveSystem.js');
const { CollisionSystem } = await import('../../src/systems/CollisionSystem.js');
const { LadderSystem } = await import('../../src/systems/LadderSystem.js');

// Fixture states: barrel overlapping the player, and the player standing in the rescue zone.
const rescueBounds = (rescue) => ({ left: rescue.x + 10, right: rescue.x + 26, top: rescue.y + rescue.height - 30, bottom: rescue.y + rescue.height });

function createProgressionScene() {
  const scene = new PlayScene();
  scene.levelManager = new LevelManager();
  scene.stateMachine = createGameStateMachine({ totalLevels: scene.levelManager.count });
  scene.objectiveSystem = new ObjectiveSystem({ rescue: null, stateMachine: scene.stateMachine });
  scene.collisionSystem = new CollisionSystem({ stateMachine: scene.stateMachine });
  scene.ladderSystem = new LadderSystem({ player: null, controller: null, ladders: [] });
  scene.playerController = { setHit: vi.fn(), isGrounded: () => true, reset: vi.fn() };
  scene.player = { x: 0, y: 0, setTint: vi.fn() };
  scene.overlay = { show: vi.fn(), hide: vi.fn() };
  // Rendering and Phaser timing are replaced with synchronous seams.
  scene.buildLevel = vi.fn();
  scene.resetPlayer = vi.fn();
  scene.pauseWorld = vi.fn();
  scene.resumeWorld = vi.fn();
  scene.floatText = vi.fn();
  scene.schedule = (_ms, callback) => callback();
  vi.spyOn(scene.levelManager, 'getLevel');
  scene.stateMachine.startGame();
  scene.loadLevel(0);
  return scene;
}

function rescue(scene) {
  const result = scene.objectiveSystem.update(rescueBounds(scene.level.rescue));
  scene.onRescue(result);
  return result;
}

function hit(scene) {
  const result = scene.collisionSystem.handleBarrelPlayerOverlap(
    { left: 0, right: 16, top: 0, bottom: 30 },
    { active: true, damageEnabled: true, bounds: { left: 4, right: 22, top: 12, bottom: 30 } },
    Number.MAX_SAFE_INTEGER - scene.stateMachine.getSnapshot().lives,
  );
  scene.collisionSystem.reset();
  scene.onPlayerHit(result);
  return result;
}

beforeEach(() => {
  applyHazardHit.mockClear();
});

describe('PlayScene progression', () => {
  it('loads the next level through LevelManager after a non-final rescue', () => {
    const scene = createProgressionScene();
    scene.levelManager.getLevel.mockClear();
    rescue(scene);
    expect(scene.levelManager.getLevel).toHaveBeenCalledWith(1);
    expect(scene.level.id).toBe('level-2');
    expect(scene.stateMachine.getSnapshot()).toMatchObject({ currentState: 'play', levelIndex: 1, score: 1000 });
    expect(scene.resumeWorld).toHaveBeenCalled();
  });

  it('shows victory after rescuing Motzfeldt on level 3', () => {
    const scene = createProgressionScene();
    rescue(scene);
    rescue(scene);
    expect(scene.level.id).toBe('level-3');
    const result = rescue(scene);
    expect(result.currentState).toBe('victory');
    expect(scene.stateMachine.getSnapshot().currentState).toBe('victory');
    expect(scene.overlay.show).toHaveBeenLastCalledWith('VICTORY!', expect.arrayContaining([expect.stringMatching(/Final score/)]));
  });

  it('uses applyHazardHit for a barrel hit and retries the same level while lives remain', () => {
    const scene = createProgressionScene();
    scene.levelManager.getLevel.mockClear();
    const result = hit(scene);
    expect(applyHazardHit).toHaveBeenCalledOnce();
    expect(result.currentState).toBe('life-loss');
    expect(scene.levelManager.getLevel).toHaveBeenCalledWith(0);
    expect(scene.stateMachine.getSnapshot()).toMatchObject({ currentState: 'play', lives: 2, levelIndex: 0 });
  });

  it('enters game over when applyHazardHit returns gameOver', () => {
    const scene = createProgressionScene();
    hit(scene);
    hit(scene);
    const last = hit(scene);
    expect(applyHazardHit).toHaveBeenCalledTimes(3);
    expect(last.currentState).toBe('game-over');
    expect(scene.stateMachine.getSnapshot().currentState).toBe('game-over');
    expect(scene.overlay.show).toHaveBeenLastCalledWith('GAME OVER', expect.any(Array));
  });

  it('restarts from level 1 with a fresh score when playing again after game over', () => {
    const scene = createProgressionScene();
    rescue(scene);
    hit(scene);
    hit(scene);
    hit(scene);
    scene.playAgain();
    expect(scene.stateMachine.getSnapshot()).toMatchObject({ currentState: 'play', score: 0, lives: 3, levelIndex: 0 });
    expect(scene.level.id).toBe('level-1');
  });
});

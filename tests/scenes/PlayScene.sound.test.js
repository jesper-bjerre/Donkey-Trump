import { describe, expect, it, vi } from 'vitest';
import { PlayScene } from '../../src/scenes/PlayScene.js';
import { LevelManager } from '../../src/levels/LevelManager.js';
import { createGameStateMachine } from '../../src/state/GameStateMachine.js';

function createScene() {
  const scene = new PlayScene();
  scene.levelManager = new LevelManager();
  scene.stateMachine = createGameStateMachine({ totalLevels: 3 });
  scene.ladderSystem = { setLadders: vi.fn(), isClimbing: false };
  scene.objectiveSystem = { reset: vi.fn() };
  scene.collisionSystem = { reset: vi.fn() };
  scene.playerController = { state: 'normal', setHit: vi.fn(), isGrounded: () => true };
  scene.player = { x: 0, y: 0, setTint: vi.fn(), body: { velocity: { x: 0, y: 0 } } };
  scene.overlay = { show: vi.fn(), hide: vi.fn() };
  scene.hud = { updateFromState: vi.fn(), setSoundIndicator: vi.fn() };
  scene.buildLevel = vi.fn();
  scene.resetPlayer = vi.fn();
  scene.physics = { pause: vi.fn(), resume: vi.fn() };
  scene.schedule = (_ms, callback) => callback();
  scene.sounds = {
    muted: false,
    play: vi.fn(),
    playStep: vi.fn(),
    startMusic: vi.fn(),
    pauseMusic: vi.fn(),
    resumeMusic: vi.fn(),
    stopMusic: vi.fn(),
    toggleMute: vi.fn(() => true),
  };
  scene.stateMachine.startGame();
  return scene;
}

describe('PlayScene sound hooks', () => {
  it('starts music and the jingle on a new level but not on a retry', () => {
    const scene = createScene();
    scene.loadLevel(1);
    expect(scene.sounds.startMusic).toHaveBeenCalledWith(1);
    expect(scene.sounds.play).toHaveBeenCalledWith('levelStart');
    scene.sounds.play.mockClear();
    scene.sounds.startMusic.mockClear();
    scene.loadLevel(1, { retry: true });
    expect(scene.sounds.startMusic).not.toHaveBeenCalled();
    expect(scene.sounds.play).not.toHaveBeenCalledWith('levelStart');
  });

  it('pauses music on a hit and resumes it after the retry', () => {
    const scene = createScene();
    scene.loadLevel(0);
    scene.onPlayerHit(scene.stateMachine.loseLife());
    expect(scene.sounds.pauseMusic).toHaveBeenCalled();
    expect(scene.sounds.resumeMusic).toHaveBeenCalled();
  });

  it('stops music for the game-over and victory jingles', () => {
    const scene = createScene();
    scene.loadLevel(0);
    scene.onPlayerHit({ currentState: 'game-over', score: 0, lives: 0, levelIndex: 0 });
    expect(scene.sounds.stopMusic).toHaveBeenCalled();
    expect(scene.sounds.play).toHaveBeenCalledWith('gameOver');
    scene.onRescue({ currentState: 'victory', score: 5000, lives: 1, levelIndex: 2 });
    expect(scene.sounds.play).toHaveBeenCalledWith('victory');
  });

  it('plays a jump sound only on the frame a jump starts, and steps while walking', () => {
    const scene = createScene();
    scene.playerController.state = 'jumping';
    scene.playMovementSounds(false, 100);
    scene.playMovementSounds(true, 116);
    expect(scene.sounds.play.mock.calls.filter(([name]) => name === 'jump')).toHaveLength(1);
    scene.playerController.state = 'normal';
    scene.player.body.velocity.x = 120;
    scene.playMovementSounds(false, 200);
    expect(scene.sounds.playStep).toHaveBeenCalledWith(200);
  });

  it('toggles mute and shows a text indicator', () => {
    const scene = createScene();
    scene.toggleMute();
    expect(scene.sounds.toggleMute).toHaveBeenCalled();
    expect(scene.hud.setSoundIndicator).toHaveBeenCalledWith('Sound off (M)');
  });
});

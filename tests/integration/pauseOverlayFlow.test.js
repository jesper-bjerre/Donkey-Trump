import { describe, expect, it, vi } from 'vitest';
import { PlayScene } from '../../src/scenes/PlayScene.js';
import { createGameStateMachine } from '../../src/state/GameStateMachine.js';
import { HudSystem } from '../../src/systems/HudSystem.js';
import { PauseHelpOverlay } from '../../src/ui/PauseHelpOverlay.js';
import { EMPTY_INPUT } from '../../src/input/InputMapper.js';
import fixture from '../fixtures/pauseOverlayState.json';
import { createFakeScene } from '../helpers/fakeScene.js';

function createPausableScene() {
  const scene = new PlayScene();
  const fake = createFakeScene();
  scene.stateMachine = createGameStateMachine({ totalLevels: 3 });
  scene.hud = new HudSystem(fake);
  scene.stateMachine.subscribe((snapshot) => scene.hud.updateFromState(snapshot));
  for (const action of fixture.setupActions) scene.stateMachine[action]();
  scene.stateMachine.addScore(fixture.setupScore);
  scene.pauseOverlay = new PauseHelpOverlay(
    fake,
    { onResume: () => scene.resumeGame(), onRestart: vi.fn(), onReturnToTitle: vi.fn() },
    { reducedMotion: true },
  );
  scene.player = { anims: { pause: vi.fn(), resume: vi.fn() } };
  scene.pauseWorld = vi.fn();
  scene.resumeWorld = vi.fn();
  scene.inputTracked = true;
  scene.stepPlay = vi.fn();
  let nextInput = EMPTY_INPUT;
  scene.inputMapper = { read: () => nextInput };
  const frame = (input) => {
    nextInput = { ...EMPTY_INPUT, ...input };
    scene.update(0, 16);
  };
  return { scene, frame };
}

describe('pause overlay flow', () => {
  it('pauses from play, shows the overlay, keeps HUD values, and resumes', () => {
    const { scene, frame } = createPausableScene();
    expect(scene.stateMachine.getSnapshot()).toMatchObject(fixture.play);
    const pauseGame = vi.spyOn(scene.stateMachine, 'pauseGame');
    const resumeGame = vi.spyOn(scene.stateMachine, 'resumeGame');
    const hudBefore = { score: scene.hud.texts.score.text, lives: scene.hud.texts.lives.text };

    frame({ pausePressed: true });
    expect(pauseGame).toHaveBeenCalledOnce();
    expect(scene.pauseOverlay.isOpen).toBe(true);
    expect(scene.pauseOverlay.container.visible).toBe(true);
    expect(scene.pauseWorld).toHaveBeenCalled();
    expect(scene.stateMachine.getSnapshot()).toMatchObject(fixture.pause);
    expect(scene.hud.texts.score.text).toBe(hudBefore.score);
    expect(scene.hud.texts.lives.text).toBe(hudBefore.lives);

    frame({ escapePressed: true });
    expect(resumeGame).toHaveBeenCalledOnce();
    expect(scene.pauseOverlay.isOpen).toBe(false);
    expect(scene.stateMachine.getSnapshot().currentState).toBe('play');
    expect(scene.hud.texts.score.text).toBe(hudBefore.score);
  });

  it('does not open from game over or victory', () => {
    const { scene, frame } = createPausableScene();
    scene.stateMachine.loseLife();
    scene.stateMachine.retryLevel();
    scene.stateMachine.startLevel();
    scene.stateMachine.loseLife();
    expect(scene.stateMachine.getSnapshot().currentState).toBe('game-over');
    scene.playAgain = vi.fn();
    scene.returnToTitle = vi.fn();
    frame({ pausePressed: true });
    expect(scene.pauseOverlay.isOpen).toBe(false);
    expect(scene.pauseGame()).toMatchObject({ rejected: true });
    expect(scene.pauseOverlay.isOpen).toBe(false);
  });
});

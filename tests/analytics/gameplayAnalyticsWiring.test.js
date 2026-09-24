import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/analytics/AnalyticsAdapter.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, trackAnalyticsEvent: vi.fn(original.trackAnalyticsEvent) };
});

const { ANALYTICS_EVENTS, trackAnalyticsEvent } = await import('../../src/analytics/AnalyticsAdapter.js');
const { PlayScene } = await import('../../src/scenes/PlayScene.js');
const { LevelManager } = await import('../../src/levels/LevelManager.js');
const { createGameStateMachine } = await import('../../src/state/GameStateMachine.js');
const fx = await import('../fixtures/gameplayAnalytics.fixture.js');

function createScene() {
  const scene = new PlayScene();
  scene.levelManager = new LevelManager();
  scene.stateMachine = createGameStateMachine({ totalLevels: 3 });
  scene.ladderSystem = { setLadders: vi.fn() };
  scene.objectiveSystem = { reset: vi.fn() };
  scene.collisionSystem = { reset: vi.fn() };
  scene.playerController = { setHit: vi.fn() };
  scene.player = { x: 0, y: 0, setTint: vi.fn() };
  scene.overlay = { show: vi.fn(), hide: vi.fn() };
  scene.buildLevel = vi.fn();
  scene.resetPlayer = vi.fn();
  scene.pauseWorld = vi.fn();
  scene.resumeWorld = vi.fn();
  scene.schedule = vi.fn();
  return scene;
}

const eventsNamed = (name) => trackAnalyticsEvent.mock.calls.filter(([event]) => event === name);

beforeEach(() => {
  trackAnalyticsEvent.mockClear();
});

describe('gameplay analytics wiring', () => {
  it('emits session_start and level_start for level 1 when a session begins', () => {
    createScene().startSession();
    expect(trackAnalyticsEvent).toHaveBeenCalledWith('session_start', expect.objectContaining({ inputType: 'keyboard' }));
    expect(trackAnalyticsEvent).toHaveBeenCalledWith('level_start', expect.objectContaining({ level: 1 }));
  });

  it('emits input_used once, on the first keyboard input', () => {
    const scene = createScene();
    scene.startSession();
    scene.trackFirstInput(fx.firstKeyboardInput);
    scene.trackFirstInput(fx.firstKeyboardInput);
    expect(eventsNamed('input_used')).toHaveLength(1);
  });

  it('emits player_death on a hit without changing the transition result', () => {
    const scene = createScene();
    scene.startSession();
    const before = structuredClone(fx.hitWithLivesLeft);
    scene.onPlayerHit(fx.hitWithLivesLeft);
    expect(trackAnalyticsEvent).toHaveBeenCalledWith('player_death', expect.objectContaining({ level: expect.any(Number), lives: expect.any(Number) }));
    expect(fx.hitWithLivesLeft).toEqual(before);
    scene.onPlayerHit(fx.hitOnLastLife);
    expect(eventsNamed('player_death').at(-1)[1]).toMatchObject({ level: 2, lives: 0, cause: 'barrel' });
  });

  it('emits level_complete and victory_complete on rescues', () => {
    const scene = createScene();
    scene.startSession();
    scene.onRescue(fx.levelComplete);
    scene.onRescue(fx.victory);
    expect(eventsNamed('level_complete')[0][1]).toMatchObject({ level: 1, lives: 3, scoreBand: '1000-1999' });
    expect(eventsNamed('victory_complete')[0][1]).toMatchObject({ level: 3, scoreBand: '4000-4999' });
  });

  it('uses only allow-listed events, all accepted by the disabled adapter', () => {
    const scene = createScene();
    scene.startSession();
    scene.trackFirstInput(fx.firstKeyboardInput);
    scene.onPlayerHit(fx.hitWithLivesLeft);
    scene.onRescue(fx.victory);
    const allowed = Object.values(ANALYTICS_EVENTS);
    for (const [index, [name]] of trackAnalyticsEvent.mock.calls.entries()) {
      expect(allowed).toContain(name);
      expect(trackAnalyticsEvent.mock.results[index].value).toMatchObject({ accepted: true, sent: false, dropped: [] });
    }
  });

  it('keeps gameplay modules off network and storage APIs', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const scene = createScene();
    scene.startSession();
    scene.onRescue(fx.levelComplete);
    expect(fetchSpy).not.toHaveBeenCalled();
    const sources = ['src/scenes/PlayScene.js', 'src/state/GameStateMachine.js', 'src/systems/CollisionSystem.js', 'src/systems/ObjectiveSystem.js'];
    for (const file of sources) {
      const source = fs.readFileSync(path.resolve(import.meta.dirname, '../..', file), 'utf8');
      expect(source, file).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|localStorage|document\.cookie/);
    }
  });
});

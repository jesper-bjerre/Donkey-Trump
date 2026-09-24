import { describe, expect, it, vi } from 'vitest';
import { FeedbackSystem, resolveFeedbackEffect } from '../../src/systems/FeedbackSystem.js';
import hit from '../../src/assets/effects/hit.json';
import retry from '../../src/assets/effects/retry.json';
import rescue from '../../src/assets/effects/rescue.json';
import { createFakeGameObject, createFakeScene } from '../helpers/fakeScene.js';

function sceneWithCaches({ locked = false, soundThrows = false } = {}) {
  const scene = createFakeScene();
  const effects = { 'feedback.hit.effect': hit, 'feedback.retry.effect': retry, 'feedback.rescue.effect': rescue };
  scene.cache = { audio: { exists: () => true }, json: { get: (key) => effects[key] } };
  scene.sound = {
    locked,
    play: vi.fn(() => {
      if (soundThrows) throw new Error('decode failed');
      return true;
    }),
  };
  scene.cameras = { main: { shake: vi.fn() } };
  scene.time = { delayedCall: vi.fn() };
  return scene;
}

describe('resolveFeedbackEffect', () => {
  it('applies the reduced-motion variant only when requested', () => {
    expect(resolveFeedbackEffect(hit, { reducedMotion: false }).screenShake).toBeTruthy();
    expect(resolveFeedbackEffect(hit, { reducedMotion: true })).toMatchObject({ screenShake: null, scaleTo: 1 });
    expect(resolveFeedbackEffect(null, { reducedMotion: true })).toBeNull();
  });
});

describe('FeedbackSystem', () => {
  it('plays the hit sound and burst with a screen shake', () => {
    const scene = sceneWithCaches();
    const player = createFakeGameObject();
    new FeedbackSystem(scene).play('hit', { player });
    expect(scene.sound.play).toHaveBeenCalledWith('feedback.hit.audio', expect.any(Object));
    expect(scene.add.image).toHaveBeenCalled();
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });

  it('skips shaking and blinking with reduced motion', () => {
    const scene = sceneWithCaches();
    const player = createFakeGameObject();
    const feedback = new FeedbackSystem(scene, { reducedMotion: true });
    feedback.play('hit', { player });
    feedback.play('retry', { player });
    expect(scene.cameras.main.shake).not.toHaveBeenCalled();
    expect(player.setAlpha).toHaveBeenCalledWith(0.6);
  });

  it('shows floating rescue text', () => {
    const scene = sceneWithCaches();
    new FeedbackSystem(scene).play('rescue', { rescue: { x: 300, y: 70 } });
    expect(scene.add.text).toHaveBeenCalledWith(300, 70 + rescue.offsetY, 'Thank you!', expect.any(Object));
  });

  it('never throws when audio is locked or fails', () => {
    const locked = sceneWithCaches({ locked: true });
    expect(new FeedbackSystem(locked).playSound('hit')).toBe(false);
    expect(locked.sound.play).not.toHaveBeenCalled();
    const broken = sceneWithCaches({ soundThrows: true });
    expect(() => new FeedbackSystem(broken).play('hit', { player: createFakeGameObject() })).not.toThrow();
  });
});

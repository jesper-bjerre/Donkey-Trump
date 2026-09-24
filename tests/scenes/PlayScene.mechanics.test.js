import { describe, expect, it, vi } from 'vitest';
import { createMechanicsScene, feet, frame, centerX } from '../helpers/playSceneHarness.js';
import * as fx from '../fixtures/mechanicsVerticalSlice.fixture.js';

const none = { left: false, right: false, up: false, down: false, jumpPressed: false, jumpHeld: false };
const settle = (scene, frames = 10) => {
  for (let i = 0; i < frames; i++) frame(scene, none);
};
const makeScene = (spawn = fx.playerSpawn) => {
  const scene = createMechanicsScene({ slopes: fx.slopes, ladders: fx.ladders, spawn });
  settle(scene);
  return scene;
};

describe('PlayScene mechanics composition', () => {
  it('runs LadderSystem, then PlayerController, then SlopeResolver on a non-climbing frame', () => {
    const scene = makeScene();
    const ladder = vi.spyOn(scene.ladderSystem, 'update');
    const player = vi.spyOn(scene.playerController, 'update');
    const slope = vi.spyOn(scene, 'applySlope');
    frame(scene, none);
    const order = [ladder, player, slope].map((spy) => spy.mock.invocationCallOrder[0]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('keeps the player on the sloped floor', () => {
    const scene = makeScene();
    expect(scene.playerController.isGrounded()).toBe(true);
    for (let i = 0; i < 60; i++) frame(scene, { ...none, right: true });
    const x = centerX(scene);
    expect(feet(scene)).toBeCloseTo(580 - (x / 800) * 12, 0);
  });

  it('skips slope correction on climb frames and restores gravity after leaving the ladder', () => {
    const scene = makeScene({ x: 600, y: 572.5 });
    const slope = vi.spyOn(scene, 'applySlope');
    frame(scene, { ...none, up: true });
    expect(scene.ladderSystem.isClimbing).toBe(true);
    slope.mockClear();
    frame(scene, { ...none, up: true });
    expect(slope).not.toHaveBeenCalled();
    frame(scene, { ...none, jumpPressed: true, jumpHeld: true });
    expect(scene.ladderSystem.isClimbing).toBe(false);
    expect(scene.player.body.setAllowGravity).toHaveBeenLastCalledWith(true);
  });

  it('climbs the ladder onto the upper floor', () => {
    const scene = makeScene({ x: 600, y: 572.5 });
    for (let i = 0; i < 90 && feet(scene) > fx.ladders[0].y + 0.01; i++) frame(scene, { ...none, up: true });
    settle(scene);
    expect(feet(scene)).toBeCloseTo(fx.ladders[0].y, 1);
    expect(scene.playerController.isGrounded()).toBe(true);
  });

  it('cannot reach the next floor with a full jump', () => {
    const scene = makeScene();
    const start = feet(scene);
    let highest = start;
    frame(scene, { ...none, jumpPressed: true, jumpHeld: true });
    for (let i = 0; i < 90; i++) {
      frame(scene, { ...none, jumpHeld: true });
      highest = Math.min(highest, feet(scene));
    }
    expect(start - highest).toBeGreaterThan(20);
    expect(start - highest).toBeLessThan(fx.floorGapPx);
    expect(feet(scene)).toBeCloseTo(start, 0);
  });

  it('does not climb when pressing up away from a ladder', () => {
    const scene = makeScene();
    for (let i = 0; i < 20; i++) frame(scene, { ...none, up: true });
    expect(scene.ladderSystem.isClimbing).toBe(false);
    expect(feet(scene)).toBeCloseTo(fx.playerSpawn.y, 0);
  });
});

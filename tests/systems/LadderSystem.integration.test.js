import { describe, expect, it, vi } from 'vitest';
import { LadderSystem } from '../../src/systems/LadderSystem.js';
import { PlayerController, PLAYER_STATES } from '../../src/controllers/PlayerController.js';
import { createFakeSprite } from '../helpers/fakeSprite.js';
import * as fx from '../fixtures/ladderZones.fixture.js';

describe('LadderSystem and PlayerController', () => {
  it('calls setClimbing(true) on entry and setClimbing(false) on exit', () => {
    const player = createFakeSprite(fx.overlappingAtBottom);
    const controller = new PlayerController(player);
    const setClimbing = vi.spyOn(controller, 'setClimbing');
    const ladders = new LadderSystem({ player, controller, ladders: fx.ladders });

    ladders.update(fx.input.up);
    expect(setClimbing).toHaveBeenLastCalledWith(true);
    expect(controller.state).toBe(PLAYER_STATES.CLIMBING);

    ladders.update(fx.input.jump);
    expect(setClimbing).toHaveBeenLastCalledWith(false);
    expect(controller.state).toBe(PLAYER_STATES.NORMAL);
  });

  it('suspends normal movement while climbing and restores it afterwards', () => {
    const player = createFakeSprite(fx.overlappingAtBottom);
    const controller = new PlayerController(player);
    const ladders = new LadderSystem({ player, controller, ladders: fx.ladders });

    ladders.update(fx.input.up);
    controller.update({ ...fx.input.up, right: true });
    expect(player.body.velocity.x).toBe(0);

    ladders.update(fx.input.jump);
    controller.update({ ...fx.input.none, right: true });
    expect(player.body.velocity.x).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_LADDER_SETTINGS, LadderSystem, findOverlappingLadder } from '../../src/systems/LadderSystem.js';
import { getBodyBounds } from '../../src/systems/bodyPlacement.js';
import { PlayerController } from '../../src/controllers/PlayerController.js';
import { centerXOf, createFakeSprite, feetOf } from '../helpers/fakeSprite.js';
import * as fx from '../fixtures/ladderZones.fixture.js';

function setup(placement) {
  const player = createFakeSprite(placement);
  const controller = new PlayerController(player);
  const ladders = new LadderSystem({ player, controller, ladders: fx.ladders });
  return { player, controller, ladders };
}

describe('DEFAULT_LADDER_SETTINGS', () => {
  it('defines the tuning fields', () => {
    expect(Object.keys(DEFAULT_LADDER_SETTINGS)).toEqual(expect.arrayContaining(['climbSpeed', 'snapToLadder', 'exitPaddingPx', 'horizontalLock']));
  });
});

describe('findOverlappingLadder', () => {
  it('returns a fixture ladder only when the player bounds intersect it', () => {
    const inside = getBodyBounds(createFakeSprite(fx.overlappingAtBottom).body);
    const outside = getBodyBounds(createFakeSprite(fx.nonOverlapping).body);
    expect(findOverlappingLadder(inside, fx.ladders)).toBe(fx.ladder);
    expect(findOverlappingLadder(outside, fx.ladders)).toBeNull();
  });

  it('needs padding to see a ladder from the floor at its top', () => {
    const atTop = getBodyBounds(createFakeSprite({ ...fx.overlappingAtTop, bottom: 98 }).body);
    expect(findOverlappingLadder(atTop, fx.ladders, 0)).toBeNull();
    expect(findOverlappingLadder(atTop, fx.ladders, DEFAULT_LADDER_SETTINGS.exitPaddingPx)).toBe(fx.ladder);
  });
});

describe('climb entry', () => {
  it('enters climbing only when up or down is pressed while overlapping', () => {
    const { ladders } = setup(fx.overlappingAtBottom);
    ladders.update(fx.input.none);
    expect(ladders.isClimbing).toBe(false);
    ladders.update(fx.input.up);
    expect(ladders.isClimbing).toBe(true);
  });

  it('does not climb when not overlapping a ladder', () => {
    const { ladders, player } = setup(fx.nonOverlapping);
    ladders.update(fx.input.up);
    ladders.update(fx.input.down);
    expect(ladders.isClimbing).toBe(false);
    expect(player.body.setAllowGravity).not.toHaveBeenCalled();
  });

  it('ignores up at the top and down at the bottom', () => {
    expect((() => { const s = setup(fx.overlappingAtTop); s.ladders.update(fx.input.up); return s.ladders.isClimbing; })()).toBe(false);
    expect((() => { const s = setup(fx.overlappingAtBottom); s.ladders.update(fx.input.down); return s.ladders.isClimbing; })()).toBe(false);
  });

  it('lets the player climb down from the floor at the ladder top', () => {
    const { ladders } = setup(fx.overlappingAtTop);
    ladders.update(fx.input.down);
    expect(ladders.isClimbing).toBe(true);
  });

  it('snaps the player to snapX and stops horizontal motion', () => {
    const { ladders, player } = setup({ ...fx.overlappingAtBottom, velocity: { x: 120, y: 0 } });
    ladders.update(fx.input.up);
    expect(centerXOf(player)).toBe(fx.ladder.snapX);
    expect(player.body.velocity.x).toBe(0);
  });
});

describe('climbing', () => {
  it('disables gravity while climbing and moves at climb speed', () => {
    const { ladders, player } = setup(fx.overlappingAtBottom);
    ladders.update(fx.input.up);
    expect(player.body.setAllowGravity).toHaveBeenLastCalledWith(false);
    ladders.update(fx.input.up);
    expect(player.body.velocity.y).toBe(-DEFAULT_LADDER_SETTINGS.climbSpeed);
    ladders.update(fx.input.none);
    expect(player.body.velocity.y).toBe(0);
  });

  it('uses climbSpeedOverride when the ladder sets one', () => {
    const { ladders, player } = setup(fx.onFastLadder);
    ladders.update(fx.input.up);
    ladders.update(fx.input.up);
    expect(player.body.velocity.y).toBe(-fx.fastLadder.climbSpeedOverride);
  });

  it('restores gravity after a jump exit', () => {
    const { ladders, player } = setup(fx.overlappingAtBottom);
    ladders.update(fx.input.up);
    ladders.update(fx.input.jump);
    expect(ladders.isClimbing).toBe(false);
    expect(player.body.setAllowGravity).toHaveBeenLastCalledWith(true);
  });

  it('exits onto the upper floor at the top exit', () => {
    const { ladders, player } = setup(fx.overlappingAtBottom);
    ladders.update(fx.input.up);
    player.body.y = fx.nearTopExit.bottom - player.body.height - 1.5;
    ladders.update(fx.input.up);
    expect(ladders.isClimbing).toBe(false);
    expect(feetOf(player)).toBe(fx.ladder.y);
    expect(player.body.setAllowGravity).toHaveBeenLastCalledWith(true);
  });

  it('exits at the bottom when climbing down reaches the lower floor', () => {
    const { ladders, player } = setup(fx.overlappingAtTop);
    ladders.update(fx.input.down);
    player.body.y = fx.nearBottomExit.bottom - player.body.height;
    ladders.update(fx.input.down);
    expect(ladders.isClimbing).toBe(false);
    expect(feetOf(player)).toBe(fx.ladder.y + fx.ladder.height);
  });

  it('restores gravity when leaving the ladder zone', () => {
    const { ladders, player } = setup(fx.overlappingAtBottom);
    ladders.update(fx.input.up);
    player.body.x += 60;
    ladders.update(fx.input.up);
    expect(ladders.isClimbing).toBe(false);
    expect(player.body.setAllowGravity).toHaveBeenLastCalledWith(true);
  });
});

describe('grabbing a ladder mid-jump', () => {
  const midJump = { centerX: 104, bottom: 160, blockedDown: false, velocity: { x: 120, y: 80 } };

  it('grabs the ladder at the current height when up is held while airborne', () => {
    const { ladders, player, controller } = setup(midJump);
    controller.handleJump(0);
    expect(controller.isGrounded()).toBe(false);
    ladders.update(fx.input.up);
    expect(ladders.isClimbing).toBe(true);
    expect(feetOf(player)).toBe(160);
    expect(player.body.velocity.y).toBe(0);
    expect(player.body.setAllowGravity).toHaveBeenLastCalledWith(false);
  });

  it('continues climbing up from the grab point', () => {
    const { ladders, player } = setup(midJump);
    ladders.update(fx.input.up);
    ladders.update(fx.input.up);
    expect(player.body.velocity.y).toBe(-DEFAULT_LADDER_SETTINGS.climbSpeed);
  });

  it('does not grab when neither up nor down is held, so jumps past ladders stay free', () => {
    const { ladders } = setup(midJump);
    ladders.update(fx.input.none);
    expect(ladders.isClimbing).toBe(false);
  });

  it('can be switched off with grabMidAir: false', () => {
    const player = createFakeSprite(midJump);
    const controller = new PlayerController(player);
    const ladders = new LadderSystem({ player, controller, ladders: fx.ladders, settings: { grabMidAir: false } });
    ladders.update(fx.input.up);
    expect(ladders.isClimbing).toBe(false);
  });
});

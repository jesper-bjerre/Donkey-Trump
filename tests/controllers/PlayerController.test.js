import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_MOVEMENT, PlayerController, PLAYER_STATES, computeJumpApexPx } from '../../src/controllers/PlayerController.js';
import { WORLD_GRAVITY_Y } from '../../src/config/physics.js';
import { createFakeSprite } from '../helpers/fakeSprite.js';
import * as fx from '../fixtures/playerMovement.fixture.js';

const make = (fixture) => {
  const sprite = createFakeSprite(fixture);
  return { sprite, controller: new PlayerController(sprite) };
};

describe('DEFAULT_PLAYER_MOVEMENT', () => {
  it('exposes the tuning fields', () => {
    expect(Object.keys(DEFAULT_PLAYER_MOVEMENT)).toEqual(
      expect.arrayContaining(['moveSpeed', 'jumpVelocity', 'reducedJumpGravityMultiplier', 'maxJumpHeightPx', 'coyoteTimeMs']),
    );
  });

  it('keeps a full jump under the configured maximum height', () => {
    expect(computeJumpApexPx(DEFAULT_PLAYER_MOVEMENT, WORLD_GRAVITY_Y)).toBeLessThanOrEqual(DEFAULT_PLAYER_MOVEMENT.maxJumpHeightPx);
  });
});

describe('horizontal movement', () => {
  it('moves left, right, and stops with no input', () => {
    const { sprite, controller } = make(fx.grounded);
    controller.update(fx.leftInput);
    expect(sprite.body.velocity.x).toBeLessThan(0);
    expect(sprite.flipX).toBe(true);
    controller.update(fx.rightInput);
    expect(sprite.body.velocity.x).toBeGreaterThan(0);
    controller.update(fx.noInput);
    expect(sprite.body.velocity.x).toBe(0);
  });

  it('ignores movement input while climbing', () => {
    const { sprite, controller } = make(fx.climbing);
    controller.setClimbing(true);
    controller.update(fx.leftInput);
    expect(sprite.body.setVelocityX).not.toHaveBeenCalled();
  });
});

describe('handleJump', () => {
  it('applies jumpVelocity only when grounded', () => {
    const { sprite, controller } = make(fx.grounded);
    expect(controller.handleJump(0)).toBe(true);
    expect(sprite.body.velocity.y).toBe(-DEFAULT_PLAYER_MOVEMENT.jumpVelocity);
    expect(controller.state).toBe(PLAYER_STATES.JUMPING);
  });

  it('does not apply a second jump while body.blocked.down is false', () => {
    const { sprite, controller } = make(fx.grounded);
    controller.handleJump(0);
    sprite.body.blocked.down = false;
    sprite.body.setVelocityY.mockClear();
    controller.update(fx.jumpPressed, 16);
    controller.update(fx.jumpPressed, 32);
    expect(sprite.body.setVelocityY).not.toHaveBeenCalledWith(-DEFAULT_PLAYER_MOVEMENT.jumpVelocity);
  });

  it('refuses to jump when airborne without recent ground contact', () => {
    const { sprite, controller } = make(fx.airborne);
    expect(controller.handleJump(1000)).toBe(false);
    expect(sprite.body.velocity.y).toBe(50);
  });

  it('allows a jump within coyote time after leaving a slope', () => {
    const { controller } = make(fx.airborne);
    controller.setGrounded(true, 1000);
    controller.setGrounded(false, 1050);
    expect(controller.handleJump(1000 + DEFAULT_PLAYER_MOVEMENT.coyoteTimeMs)).toBe(true);
  });
});

describe('handleJumpRelease', () => {
  it('reduces upward velocity once when jump is released during ascent', () => {
    const { sprite, controller } = make(fx.grounded);
    controller.update(fx.jumpPressed, 0);
    controller.update(fx.jumpHeld, 16);
    expect(sprite.body.velocity.y).toBe(-DEFAULT_PLAYER_MOVEMENT.jumpVelocity);
    controller.update(fx.jumpReleased, 32);
    const cut = -DEFAULT_PLAYER_MOVEMENT.jumpVelocity * DEFAULT_PLAYER_MOVEMENT.reducedJumpGravityMultiplier;
    expect(sprite.body.velocity.y).toBeCloseTo(cut);
    controller.update(fx.jumpReleased, 48);
    expect(sprite.body.velocity.y).toBeCloseTo(cut);
  });

  it('does nothing while falling', () => {
    const { controller } = make(fx.airborne);
    expect(controller.handleJumpRelease()).toBe(false);
  });
});

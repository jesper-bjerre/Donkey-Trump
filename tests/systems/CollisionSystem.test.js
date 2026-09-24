import { describe, expect, it, vi } from 'vitest';
import { CollisionSystem, DEFAULT_COLLISION_SETTINGS } from '../../src/systems/CollisionSystem.js';
import * as fx from '../fixtures/collision.fixture.js';

const machine = () => ({ loseLife: vi.fn(() => ({ currentState: 'life-loss', lives: 2 })) });

describe('handleBarrelPlayerOverlap', () => {
  it('calls loseLife exactly once for an overlapping active barrel', () => {
    const stateMachine = machine();
    const collisions = new CollisionSystem({ stateMachine });
    expect(collisions.handleBarrelPlayerOverlap(fx.player, fx.overlappingBarrel, 0)).toMatchObject({ currentState: 'life-loss' });
    expect(stateMachine.loseLife).toHaveBeenCalledOnce();
  });

  it('ignores inactive or harmless barrels and distant ones', () => {
    const stateMachine = machine();
    const collisions = new CollisionSystem({ stateMachine });
    for (const barrel of [fx.inactiveBarrel, fx.harmlessBarrel, fx.distantBarrel, fx.grazingBarrel]) {
      expect(collisions.handleBarrelPlayerOverlap(fx.player, barrel, 0)).toBeNull();
    }
    expect(stateMachine.loseLife).not.toHaveBeenCalled();
  });

  it('does not take more than one life during the hit cooldown', () => {
    const stateMachine = machine();
    const collisions = new CollisionSystem({ stateMachine });
    collisions.update(fx.player, [fx.overlappingBarrel, fx.overlappingBarrel], 0);
    collisions.update(fx.player, [fx.overlappingBarrel], 16);
    collisions.update(fx.player, [fx.overlappingBarrel], DEFAULT_COLLISION_SETTINGS.hitCooldownMs - 1);
    expect(stateMachine.loseLife).toHaveBeenCalledOnce();
    collisions.update(fx.player, [fx.overlappingBarrel], DEFAULT_COLLISION_SETTINGS.hitCooldownMs);
    expect(stateMachine.loseLife).toHaveBeenCalledTimes(2);
  });

  it('delegates the consequence to the state machine instead of touching lives itself', () => {
    const stateMachine = machine();
    const collisions = new CollisionSystem({ stateMachine });
    const result = collisions.handleBarrelPlayerOverlap(fx.player, fx.overlappingBarrel, 0);
    expect(result).toBe(stateMachine.loseLife.mock.results[0].value);
    expect(collisions).not.toHaveProperty('lives');
  });

  it('reset clears the cooldown for a new attempt', () => {
    const stateMachine = machine();
    const collisions = new CollisionSystem({ stateMachine });
    collisions.update(fx.player, [fx.overlappingBarrel], 0);
    collisions.reset();
    collisions.update(fx.player, [fx.overlappingBarrel], 10);
    expect(stateMachine.loseLife).toHaveBeenCalledTimes(2);
  });
});

describe('detectBarrelJumps', () => {
  it('awards each barrel once when an airborne player passes over it', () => {
    const collisions = new CollisionSystem({ stateMachine: machine() });
    const barrel = fx.barrelUnderFeet();
    expect(collisions.detectBarrelJumps(fx.jumpingPlayer, [barrel], true)).toEqual([barrel]);
    expect(collisions.detectBarrelJumps(fx.jumpingPlayer, [barrel], true)).toEqual([]);
  });

  it('awards nothing while grounded', () => {
    const collisions = new CollisionSystem({ stateMachine: machine() });
    expect(collisions.detectBarrelJumps(fx.jumpingPlayer, [fx.barrelUnderFeet()], false)).toEqual([]);
  });
});

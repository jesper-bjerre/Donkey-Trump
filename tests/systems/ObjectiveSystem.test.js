import { describe, expect, it, vi } from 'vitest';
import { ObjectiveSystem, isPlayerInRescueZone } from '../../src/systems/ObjectiveSystem.js';
import fixtures from '../../src/levels/level.fixtures.json';

const [first, , last] = fixtures.levels;
const boundsAt = (rescue, dx = 0, dy = 0) => ({
  left: rescue.x + 10 + dx,
  right: rescue.x + 26 + dx,
  top: rescue.y + rescue.height - 30 + dy,
  bottom: rescue.y + rescue.height + dy,
});
const machineDouble = () => ({ completeLevel: vi.fn(() => ({ currentState: 'level-complete' })), completeFinalLevel: vi.fn(() => ({ currentState: 'victory' })) });

describe('isPlayerInRescueZone', () => {
  it('detects overlap with the rescue rectangle from level data', () => {
    expect(isPlayerInRescueZone(boundsAt(first.rescue), first.rescue)).toBe(true);
  });

  it('treats touching edges as outside and far bounds as non-overlapping', () => {
    const r = first.rescue;
    expect(isPlayerInRescueZone({ left: r.x + r.width, right: r.x + r.width + 16, top: r.y, bottom: r.y + 30 }, r)).toBe(false);
    expect(isPlayerInRescueZone(boundsAt(r, 0, 200), r)).toBe(false);
  });
});

describe('ObjectiveSystem', () => {
  it('completes a non-final level exactly once', () => {
    const machine = machineDouble();
    const objective = new ObjectiveSystem({ rescue: first.rescue, stateMachine: machine });
    objective.update(boundsAt(first.rescue));
    objective.update(boundsAt(first.rescue));
    expect(machine.completeLevel).toHaveBeenCalledOnce();
    expect(machine.completeFinalLevel).not.toHaveBeenCalled();
  });

  it('triggers final victory exactly once on the final level', () => {
    const machine = machineDouble();
    const objective = new ObjectiveSystem({ rescue: last.rescue, stateMachine: machine });
    expect(last.rescue.isFinalLevel).toBe(true);
    objective.update(boundsAt(last.rescue));
    objective.update(boundsAt(last.rescue));
    expect(machine.completeFinalLevel).toHaveBeenCalledOnce();
    expect(machine.completeLevel).not.toHaveBeenCalled();
  });

  it('does nothing without overlap and re-arms after reset', () => {
    const machine = machineDouble();
    const objective = new ObjectiveSystem({ rescue: first.rescue, stateMachine: machine });
    expect(objective.update(boundsAt(first.rescue, 0, 300))).toBeNull();
    objective.update(boundsAt(first.rescue));
    objective.reset();
    objective.update(boundsAt(first.rescue));
    expect(machine.completeLevel).toHaveBeenCalledTimes(2);
    expect(objective.objectiveLabel).toBe('motzfeldt');
  });
});

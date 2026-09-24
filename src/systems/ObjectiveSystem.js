// Detects Jumpman Løkke reaching Motzfeldt and fires exactly one progression
// transition per attempt: completeLevel, or completeFinalLevel on the last level.

export function getRescueZone(rescue) {
  return { left: rescue.x, right: rescue.x + rescue.width, top: rescue.y, bottom: rescue.y + rescue.height };
}

export function isPlayerInRescueZone(playerBounds, rescue) {
  const zone = getRescueZone(rescue);
  return (
    playerBounds.right > zone.left &&
    playerBounds.left < zone.right &&
    playerBounds.bottom > zone.top &&
    playerBounds.top < zone.bottom
  );
}

export class ObjectiveSystem {
  constructor({ rescue, stateMachine }) {
    this.rescue = rescue;
    this.stateMachine = stateMachine;
    this.completed = false;
  }

  get isFinalLevel() {
    return this.rescue.isFinalLevel === true;
  }

  get objectiveLabel() {
    return this.rescue.objectiveKey ?? this.rescue.spriteKey;
  }

  update(playerBounds) {
    if (this.completed || !isPlayerInRescueZone(playerBounds, this.rescue)) return null;
    this.completed = true;
    return this.isFinalLevel ? this.stateMachine.completeFinalLevel() : this.stateMachine.completeLevel();
  }

  reset(rescue = this.rescue) {
    this.rescue = rescue;
    this.completed = false;
  }
}

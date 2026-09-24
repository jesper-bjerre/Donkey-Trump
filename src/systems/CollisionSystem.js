// Detects barrel contact and routes it to the state machine. Owns only the
// hit-cooldown guard; lives, retry and game-over decisions stay in GameStateMachine.

export const DEFAULT_COLLISION_SETTINGS = {
  hitCooldownMs: 1500,
  // Shrinks both hitboxes so near-misses at sprite corners feel fair.
  hitboxInsetPx: 3,
  // A barrel counts as jumped when it passes under the feet within this height.
  jumpDetectHeightPx: 56,
};

export function boundsOverlap(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

export function insetBounds(bounds, inset) {
  return { left: bounds.left + inset, right: bounds.right - inset, top: bounds.top + inset, bottom: bounds.bottom - inset };
}

export class CollisionSystem {
  constructor({ stateMachine, settings = {} }) {
    this.stateMachine = stateMachine;
    this.settings = { ...DEFAULT_COLLISION_SETTINGS, ...settings };
    this.invulnerableUntil = -Infinity;
  }

  isHarmful(barrel) {
    return barrel.active !== false && barrel.damageEnabled !== false;
  }

  handleBarrelPlayerOverlap(playerBounds, barrel, nowMs) {
    if (!this.isHarmful(barrel) || nowMs < this.invulnerableUntil) return null;
    const inset = this.settings.hitboxInsetPx;
    if (!boundsOverlap(insetBounds(playerBounds, inset), insetBounds(barrel.bounds, inset))) return null;
    this.invulnerableUntil = nowMs + this.settings.hitCooldownMs;
    return this.stateMachine.loseLife();
  }

  // Returns the first hit transition this frame, or null.
  update(playerBounds, barrels, nowMs) {
    for (const barrel of barrels) {
      const result = this.handleBarrelPlayerOverlap(playerBounds, barrel, nowMs);
      if (result) return result;
    }
    return null;
  }

  // Marks and returns barrels the airborne player just cleared, for jump points.
  detectBarrelJumps(playerBounds, barrels, playerAirborne) {
    if (!playerAirborne) return [];
    const centerX = (playerBounds.left + playerBounds.right) / 2;
    const cleared = [];
    for (const barrel of barrels) {
      if (!this.isHarmful(barrel) || barrel.jumpAwarded) continue;
      const b = barrel.bounds;
      const underFeet = b.top >= playerBounds.bottom - 2 && b.top - playerBounds.bottom <= this.settings.jumpDetectHeightPx;
      if (underFeet && centerX >= b.left && centerX <= b.right) {
        barrel.jumpAwarded = true;
        cleared.push(barrel);
      }
    }
    return cleared;
  }

  reset() {
    this.invulnerableUntil = -Infinity;
  }
}

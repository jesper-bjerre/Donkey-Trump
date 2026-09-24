// Jumpman Løkke horizontal movement and the deliberately short jump. Ladder
// climbing is owned by LadderSystem, which toggles setClimbing.

export const DEFAULT_PLAYER_MOVEMENT = {
  moveSpeed: 120,
  jumpVelocity: 210,
  // Upward velocity is multiplied by this when jump is released early.
  reducedJumpGravityMultiplier: 0.45,
  // Design ceiling for a full jump; floor gaps must exceed it (see tuning tests).
  maxJumpHeightPx: 48,
  coyoteTimeMs: 80,
};

export const PLAYER_STATES = Object.freeze({
  NORMAL: 'normal',
  JUMPING: 'jumping',
  CLIMBING: 'climbing',
  HIT: 'hit',
  DEAD: 'dead',
});

// Apex of a full jump: v^2 / 2g.
export function computeJumpApexPx(settings, gravityY) {
  return (settings.jumpVelocity * settings.jumpVelocity) / (2 * gravityY);
}

export class PlayerController {
  constructor(sprite, settings = {}) {
    this.sprite = sprite;
    this.settings = { ...DEFAULT_PLAYER_MOVEMENT, ...settings };
    this.state = PLAYER_STATES.NORMAL;
    this.grounded = false;
    this.lastGroundedAt = -Infinity;
    this.jumpCut = false;
  }

  get body() {
    return this.sprite.body;
  }

  isClimbing() {
    return this.state === PLAYER_STATES.CLIMBING;
  }

  isGrounded() {
    return this.grounded || Boolean(this.body.blocked?.down);
  }

  // Called by the slope step once per frame with the resolved ground contact.
  setGrounded(grounded, nowMs = 0) {
    this.grounded = grounded;
    if (grounded) {
      this.lastGroundedAt = nowMs;
      if (this.state === PLAYER_STATES.JUMPING) this.state = PLAYER_STATES.NORMAL;
    }
  }

  canJump(nowMs) {
    if (this.state !== PLAYER_STATES.NORMAL) return false;
    return this.isGrounded() || nowMs - this.lastGroundedAt <= this.settings.coyoteTimeMs;
  }

  setClimbing(climbing) {
    if (climbing) {
      this.state = PLAYER_STATES.CLIMBING;
      this.grounded = false;
    } else if (this.state === PLAYER_STATES.CLIMBING) {
      this.state = PLAYER_STATES.NORMAL;
    }
  }

  setHit() {
    this.state = PLAYER_STATES.HIT;
    this.body.setVelocityX(0);
  }

  reset() {
    this.state = PLAYER_STATES.NORMAL;
    this.grounded = false;
    this.lastGroundedAt = -Infinity;
  }

  update(input, nowMs = 0) {
    if (this.state === PLAYER_STATES.CLIMBING || this.state === PLAYER_STATES.HIT || this.state === PLAYER_STATES.DEAD) {
      return;
    }
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.body.setVelocityX(direction * this.settings.moveSpeed);
    if (direction !== 0) this.sprite.setFlipX?.(direction < 0);

    if (input.jumpPressed) this.handleJump(nowMs);
    if (!input.jumpHeld) this.handleJumpRelease();
  }

  handleJump(nowMs = 0) {
    if (!this.canJump(nowMs)) return false;
    this.body.setVelocityY(-this.settings.jumpVelocity);
    this.state = PLAYER_STATES.JUMPING;
    this.grounded = false;
    this.jumpCut = false;
    // Consume coyote time so an airborne press cannot trigger a second jump.
    this.lastGroundedAt = -Infinity;
    return true;
  }

  handleJumpRelease() {
    const vy = this.body.velocity.y;
    // Cut the ascent once per jump; repeated frames with jump up must not compound.
    if (this.state === PLAYER_STATES.JUMPING && vy < 0 && !this.jumpCut) {
      this.jumpCut = true;
      this.body.setVelocityY(vy * this.settings.reducedJumpGravityMultiplier);
      return true;
    }
    return false;
  }
}

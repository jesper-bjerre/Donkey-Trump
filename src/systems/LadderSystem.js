// Ladders are overlap zones, not platforms. Climbing starts only while overlapping
// a ladder and pressing up/down, suspends gravity, and ends at either end, when
// jumping, or when the player leaves the zone.
import { getBodyBounds, getBodyCenterX, placeBodyBottom, placeBodyCenterX } from './bodyPlacement.js';

export const DEFAULT_LADDER_SETTINGS = {
  climbSpeed: 90,
  snapToLadder: true,
  // Vertical slack so a player standing exactly on a ladder's top or bottom still overlaps it.
  exitPaddingPx: 6,
  horizontalLock: true,
};

// Feet within this distance of a ladder end count as being at that end.
const END_EPSILON_PX = 1;

export function findOverlappingLadder(bounds, ladders, paddingPx = 0) {
  const centerX = (bounds.left + bounds.right) / 2;
  let best = null;
  for (const ladder of ladders) {
    const overlaps =
      bounds.right > ladder.x &&
      bounds.left < ladder.x + ladder.width &&
      bounds.bottom >= ladder.y - paddingPx &&
      bounds.top <= ladder.y + ladder.height + paddingPx;
    if (!overlaps) continue;
    if (!best || Math.abs(ladder.snapX - centerX) < Math.abs(best.snapX - centerX)) best = ladder;
  }
  return best;
}

export class LadderSystem {
  constructor({ player, controller, ladders, settings = {} }) {
    this.player = player;
    this.controller = controller;
    this.ladders = ladders;
    this.settings = { ...DEFAULT_LADDER_SETTINGS, ...settings };
    this.activeLadder = null;
  }

  get isClimbing() {
    return this.activeLadder !== null;
  }

  setLadders(ladders) {
    this.ladders = ladders;
    this.activeLadder = null;
  }

  climbSpeedFor(ladder) {
    return ladder.climbSpeedOverride ?? this.settings.climbSpeed;
  }

  findOverlappingLadder() {
    return findOverlappingLadder(getBodyBounds(this.player.body), this.ladders, this.settings.exitPaddingPx);
  }

  update(input) {
    const body = this.player.body;
    if (!this.activeLadder) {
      const ladder = this.findOverlappingLadder();
      if (ladder && this.shouldEnter(ladder, input)) this.enter(ladder);
      return { climbing: this.isClimbing, ladder: this.activeLadder };
    }

    const ladder = this.activeLadder;
    if (input.jumpPressed || this.findOverlappingLadder() !== ladder) {
      this.exit();
      return { climbing: false, ladder: null };
    }

    const feet = body.y + body.height;
    const speed = this.climbSpeedFor(ladder);
    if (this.settings.horizontalLock) body.setVelocityX(0);

    if (input.up && feet <= ladder.y + END_EPSILON_PX) {
      placeBodyBottom(this.player, ladder.y);
      this.exit();
      this.controller.setGrounded?.(true);
    } else if (input.down && feet >= ladder.y + ladder.height - END_EPSILON_PX) {
      placeBodyBottom(this.player, ladder.y + ladder.height);
      this.exit();
      this.controller.setGrounded?.(true);
    } else {
      body.setVelocityY(input.up ? -speed : input.down ? speed : 0);
    }
    return { climbing: this.isClimbing, ladder: this.activeLadder };
  }

  shouldEnter(ladder, input) {
    if (!input.up && !input.down) return false;
    if (this.controller.isGrounded && !this.controller.isGrounded()) return false;
    const feet = this.player.body.y + this.player.body.height;
    // Up is meaningless at the top, down is meaningless at the bottom.
    if (input.up) return feet > ladder.y + END_EPSILON_PX;
    return feet < ladder.y + ladder.height - END_EPSILON_PX;
  }

  enter(ladder) {
    const body = this.player.body;
    this.activeLadder = ladder;
    this.controller.setClimbing(true);
    body.setAllowGravity(false);
    body.setVelocityX(0);
    body.setVelocityY(0);
    if (this.settings.snapToLadder && getBodyCenterX(body) !== ladder.snapX) {
      placeBodyCenterX(this.player, ladder.snapX);
    }
  }

  exit() {
    const body = this.player.body;
    this.activeLadder = null;
    body.setAllowGravity(true);
    body.setVelocityY(0);
    this.controller.setClimbing(false);
  }
}

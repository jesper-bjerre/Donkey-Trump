// Barrels spawn at the boss anchor moving right-to-left, roll downhill along the
// girders via SlopeResolver, drop to the girder below at each end, and may take a
// ladder down when the level enables it. Some barrels are instead hurled directly
// at the player: they fly through the girders in an arc aimed at the player's x
// and land on the player's floor, then roll on like any other barrel. Sprites are pooled.
import { WORLD_GRAVITY_Y } from '../config/physics.js';
import { getDownhillDirection, resolveBodyToSlope } from './SlopeResolver.js';
import { getBodyBounds, getBodyCenterX, placeBodyBottom, placeBodyCenterX } from './bodyPlacement.js';

export const BARREL_DEFAULTS = {
  firstSpawnDelayMs: 1500,
  maxActive: 6,
  // Horizontal speed kept while falling off a girder end, so the barrel lands on the girder below.
  fallSpeedFactor: 0.25,
  ladderDropSpeed: 70,
  radiusPx: 9,
  // Direct throws only target a player at least this far below the throw point.
  directThrowMinDropPx: 60,
  directThrowMaxSpeedX: 320,
};

// Horizontal speed that makes a barrel released at rest reach `target` when it has
// fallen to the target's feet: t = sqrt(2 * drop / g), vx = dx / t.
export function computeDirectThrowVelocity(from, target, { gravityY = WORLD_GRAVITY_Y, maxSpeedX = BARREL_DEFAULTS.directThrowMaxSpeedX } = {}) {
  const drop = target.feet - from.y;
  if (drop <= 0) return null;
  const seconds = Math.sqrt((2 * drop) / gravityY);
  const vx = (target.x - from.x) / seconds;
  return Math.max(-maxSpeedX, Math.min(maxSpeedX, vx));
}

const LADDER_ALIGN_PX = 4;

export class BarrelSystem {
  constructor({ level, getSpawnPoint, createBarrelSprite, getTarget = () => null, onSpawn = () => {}, random = Math.random, settings = {} }) {
    this.level = level;
    this.getTarget = getTarget;
    this.config = { ...BARREL_DEFAULTS, ...level.barrels, ...settings };
    this.getSpawnPoint = getSpawnPoint;
    this.createBarrelSprite = createBarrelSprite;
    this.onSpawn = onSpawn;
    this.random = random;
    this.active = [];
    this.pool = [];
    this.elapsedMs = 0;
    this.nextSpawnAt = this.config.firstSpawnDelayMs;
  }

  get directThrowChance() {
    return this.config.route?.directThrowChance ?? 0;
  }

  // Decides whether this spawn is hurled at the player, returning the aim or null.
  planDirectThrow(point) {
    if (this.directThrowChance <= 0) return null;
    const target = this.getTarget();
    if (!target || target.feet - point.y < this.config.directThrowMinDropPx) return null;
    if (this.random() >= this.directThrowChance) return null;
    const vx = computeDirectThrowVelocity(point, target, { maxSpeedX: this.config.directThrowMaxSpeedX });
    return vx === null ? null : { vx, targetFeet: target.feet };
  }

  get ladderDropChance() {
    return this.config.route?.ladderDropChance ?? 0;
  }

  randomSpeed() {
    const { speedMin, speedMax } = this.config;
    return speedMin + this.random() * (speedMax - speedMin);
  }

  update(deltaMs) {
    this.elapsedMs += deltaMs;
    if (this.elapsedMs >= this.nextSpawnAt) {
      if (this.active.length < this.config.maxActive) this.spawnBarrel();
      this.nextSpawnAt = this.elapsedMs + this.config.spawnIntervalMs;
    }
    for (const barrel of [...this.active]) this.stepBarrel(barrel, deltaMs);
  }

  spawnBarrel(point = this.getSpawnPoint(), { throwPlan = this.planDirectThrow(point) } = {}) {
    const record = this.pool.pop() ?? this.createRecord();
    const sprite = record.sprite;
    if (sprite.body.reset) sprite.body.reset(point.x, point.y);
    else {
      sprite.x = point.x;
      sprite.y = point.y;
      sprite.body.x = point.x - sprite.body.width / 2;
      sprite.body.y = point.y - sprite.body.height / 2;
    }
    sprite.setActive?.(true).setVisible?.(true);
    sprite.body.enable = true;
    sprite.rotation = 0;
    Object.assign(record, {
      active: true,
      damageEnabled: true,
      jumpAwarded: false,
      speed: this.randomSpeed(),
      direction: -1,
      mode: throwPlan ? 'thrown' : 'falling',
      thrown: Boolean(throwPlan),
      targetFeet: throwPlan?.targetFeet ?? null,
      dropLadder: null,
      decidedLadders: new Set(),
    });
    sprite.body.setVelocityX(throwPlan ? throwPlan.vx : -record.speed);
    if (throwPlan) sprite.body.setVelocityY(0);
    this.active.push(record);
    this.onSpawn(record);
    return record;
  }

  createRecord() {
    const sprite = this.createBarrelSprite();
    return {
      sprite,
      get bounds() {
        return getBodyBounds(sprite.body);
      },
    };
  }

  stepBarrel(barrel, deltaMs) {
    const { sprite } = barrel;
    const body = sprite.body;

    if (barrel.mode === 'thrown') {
      // Flies through girders until it reaches the player's floor, then lands normally.
      if (body.y + body.height >= barrel.targetFeet - 4) {
        barrel.mode = 'falling';
        barrel.direction = Math.sign(body.velocity.x) || barrel.direction;
      }
    } else if (barrel.mode === 'dropping') {
      body.setVelocityX(0);
      body.setVelocityY(this.config.ladderDropSpeed);
      const ladder = barrel.dropLadder;
      if (body.y + body.height >= ladder.y + ladder.height - 1) {
        placeBodyBottom(sprite, ladder.y + ladder.height);
        barrel.mode = 'falling';
        barrel.direction = -barrel.direction;
      }
    } else {
      const contact = resolveBodyToSlope(
        { x: getBodyCenterX(body), bottom: body.y + body.height, velocityY: body.velocity.y },
        this.level.girders,
      );
      if (contact.grounded) {
        placeBodyBottom(sprite, contact.bottom);
        body.setVelocityY(0);
        barrel.direction = getDownhillDirection(contact.segment) || barrel.direction;
        barrel.mode = 'rolling';
        body.setVelocityX(barrel.direction * barrel.speed);
        this.maybeTakeLadder(barrel);
      } else if (barrel.mode === 'rolling') {
        barrel.mode = 'falling';
        body.setVelocityX(barrel.direction * barrel.speed * this.config.fallSpeedFactor);
      }
    }

    // Thrown barrels tumble fast in the air; rolling ones turn with their speed.
    const spin = barrel.mode === 'thrown' ? Math.sign(body.velocity.x || -1) * 12 : body.velocity.x / this.config.radiusPx;
    sprite.rotation += spin * (deltaMs / 1000);

    const { width, height } = this.level.dimensions;
    const bounds = getBodyBounds(body);
    if (bounds.right < 0 || bounds.left > width || bounds.top > height) this.recycle(barrel);
  }

  maybeTakeLadder(barrel) {
    if (this.ladderDropChance <= 0) return;
    const body = barrel.sprite.body;
    const feet = body.y + body.height;
    const centerX = getBodyCenterX(body);
    const ladder = this.level.ladders.find(
      (candidate) => Math.abs(candidate.snapX - centerX) <= LADDER_ALIGN_PX && Math.abs(candidate.y - feet) <= LADDER_ALIGN_PX,
    );
    if (!ladder || barrel.decidedLadders.has(ladder)) return;
    barrel.decidedLadders.add(ladder);
    if (this.random() < this.ladderDropChance) {
      barrel.mode = 'dropping';
      barrel.dropLadder = ladder;
      placeBodyCenterX(barrel.sprite, ladder.snapX);
    }
  }

  recycle(barrel) {
    const index = this.active.indexOf(barrel);
    if (index === -1) return;
    this.active.splice(index, 1);
    barrel.active = false;
    barrel.damageEnabled = false;
    barrel.sprite.body.setVelocityX(0);
    barrel.sprite.body.setVelocityY(0);
    barrel.sprite.body.enable = false;
    barrel.sprite.setActive?.(false).setVisible?.(false);
    this.pool.push(barrel);
  }

  getActiveBarrels() {
    return this.active;
  }

  freeze() {
    for (const barrel of this.active) {
      barrel.sprite.body.setVelocityX(0);
      barrel.sprite.body.setVelocityY(0);
      barrel.sprite.body.setAllowGravity?.(false);
    }
  }

  reset() {
    for (const barrel of [...this.active]) {
      barrel.sprite.body.setAllowGravity?.(true);
      this.recycle(barrel);
    }
    this.elapsedMs = 0;
    this.nextSpawnAt = this.config.firstSpawnDelayMs;
  }
}

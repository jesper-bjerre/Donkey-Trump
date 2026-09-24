// Places the Trump-inspired boss on the right side of its platform and owns the
// barrel spawn anchor, so barrel logic never recomputes boss placement.

// The boss must sit in the rightmost quarter of the level.
export const BOSS_MIN_X_RATIO = 0.75;

export function resolveBossPlacement(level) {
  const { width } = level.dimensions;
  const x = Math.min(Math.max(level.boss.x, width * BOSS_MIN_X_RATIO), width);
  return { x, y: level.boss.y };
}

export class BossController {
  constructor(level, { scene = null } = {}) {
    this.level = level;
    this.config = level.boss;
    this.position = resolveBossPlacement(level);
    this.spriteKey = this.config.spriteKey;
    this.throwKey = this.config.animation?.throwKey ?? null;
    this.sprite = null;
    if (scene) {
      // Prefer the animated sheet when it is loaded; fall back to the still image.
      const sheetKey = `${this.spriteKey}.sheet`;
      this.animated = Boolean(scene.textures?.exists(sheetKey) && scene.anims?.exists('boss.idle'));
      // Origin at the feet so boss.y is the platform surface.
      this.sprite = scene.add.sprite(this.position.x, this.position.y, this.animated ? sheetKey : this.spriteKey).setOrigin(0.5, 1).setDepth(5);
      if (this.animated) this.sprite.play('boss.idle');
      this.scene = scene;
    }
  }

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  getBarrelSpawnPoint() {
    const offset = this.config.spawnAnchorOffset;
    return { x: this.position.x + offset.x, y: this.position.y + offset.y };
  }

  // Cosmetic wind-up; safe to call without a scene.
  playThrow() {
    if (!this.sprite) return;
    if (this.animated) {
      this.sprite.play('boss.throw');
      this.sprite.chain?.('boss.idle');
    } else {
      this.scene?.tweens?.add({ targets: this.sprite, scaleY: 0.9, scaleX: 1.08, duration: 90, yoyo: true });
    }
  }

  destroy() {
    this.sprite?.destroy();
    this.sprite = null;
  }
}

export function createBossController(level, options) {
  return new BossController(level, options);
}

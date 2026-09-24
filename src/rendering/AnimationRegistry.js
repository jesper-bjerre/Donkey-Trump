// Single source of truth for sprite animations. Registration is idempotent so
// scenes can re-enter (retry, next level, back to title) without duplicates.
import assetManifest from '../assets/assetManifest.json';

export const ANIMATION_SHEETS = Object.freeze({
  player: 'player.jumpman.sheet',
  boss: 'boss.trumpInspired.sheet',
  barrel: 'barrel.original.sheet',
  rescue: 'rescue.motzfeldt.sheet',
});

const CORE_ANIMATIONS = Object.freeze([
  { key: 'player.idle', group: 'player', frames: [0], frameRate: 1, repeat: -1 },
  { key: 'player.walk', group: 'player', frames: [1, 2], frameRate: 8, repeat: -1 },
  { key: 'player.jump', group: 'player', frames: [3], frameRate: 1, repeat: 0 },
  { key: 'player.climb', group: 'player', frames: [4, 5], frameRate: 6, repeat: -1 },
  { key: 'player.hit', group: 'player', frames: [6], frameRate: 1, repeat: 0 },
  { key: 'boss.idle', group: 'boss', frames: [0, 1], frameRate: 2, repeat: -1 },
  { key: 'boss.throw', group: 'boss', frames: [2, 2, 1], frameRate: 6, repeat: 0 },
  { key: 'barrel.roll', group: 'barrel', frames: [0, 1, 2, 3], frameRate: 12, repeat: -1 },
  { key: 'rescue.idle', group: 'rescue', frames: [0, 1], frameRate: 3, repeat: -1 },
  { key: 'rescue.complete', group: 'rescue', frames: [2], frameRate: 1, repeat: 0 },
]);

export function getCoreAnimationDefinitions() {
  return CORE_ANIMATIONS.map((definition) => ({ ...definition, frames: [...definition.frames] }));
}

// Maps an animation group to its sheet key, verifying the manifest provides it.
export function resolveAnimationSpriteKey(group, manifest = assetManifest) {
  const key = ANIMATION_SHEETS[group];
  if (!key) throw new Error(`Unknown animation group ${group}.`);
  const entry = (manifest.sprites ?? []).find((sprite) => sprite.key === key);
  if (!entry) throw new Error(`Asset manifest has no sprite sheet ${key} for animation group ${group}.`);
  return key;
}

// scene: anything with anims.exists / anims.create / anims.generateFrameNumbers.
export function registerCoreAnimations(scene, { manifest = assetManifest } = {}) {
  const created = [];
  for (const definition of CORE_ANIMATIONS) {
    if (scene.anims.exists(definition.key)) continue;
    const sheetKey = resolveAnimationSpriteKey(definition.group, manifest);
    scene.anims.create({
      key: definition.key,
      frames: scene.anims.generateFrameNumbers(sheetKey, { frames: definition.frames }),
      frameRate: definition.frameRate,
      repeat: definition.repeat,
    });
    created.push(definition.key);
  }
  return created;
}

// Chooses the player animation from controller state and velocity.
export function selectPlayerAnimation({ state, grounded, climbing, velocityX }) {
  if (state === 'hit' || state === 'dead') return 'player.hit';
  if (climbing) return 'player.climb';
  if (!grounded) return 'player.jump';
  return Math.abs(velocityX) > 1 ? 'player.walk' : 'player.idle';
}

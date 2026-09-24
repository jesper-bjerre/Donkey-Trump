// Plays the hit, retry and rescue cues: an optional sound plus a visual effect
// described by JSON in src/assets/effects. Sound failures never interrupt play,
// and reduced motion swaps in each descriptor's calmer variant.

export const FEEDBACK_MOMENTS = Object.freeze(['hit', 'retry', 'rescue']);

export const audioKeyFor = (moment) => `feedback.${moment}.audio`;
export const effectKeyFor = (moment) => `feedback.${moment}.effect`;

export function resolveFeedbackEffect(descriptor, { reducedMotion }) {
  if (!descriptor) return null;
  const { reducedMotion: calmer, ...base } = descriptor;
  return reducedMotion && calmer ? { ...base, ...calmer } : base;
}

export class FeedbackSystem {
  constructor(scene, { reducedMotion = false } = {}) {
    this.scene = scene;
    this.reducedMotion = reducedMotion;
  }

  play(moment, targets = {}) {
    this.playSound(moment);
    return this.playEffect(moment, targets);
  }

  playSound(moment) {
    const { sound, cache } = this.scene;
    const key = audioKeyFor(moment);
    try {
      if (!sound || sound.locked || !cache?.audio?.exists(key)) return false;
      return sound.play(key, { volume: 0.5 });
    } catch {
      return false;
    }
  }

  playEffect(moment, { player, rescue } = {}) {
    const effect = resolveFeedbackEffect(this.scene.cache?.json?.get(effectKeyFor(moment)), { reducedMotion: this.reducedMotion });
    if (!effect) return null;
    const { scene } = this;
    if (effect.kind === 'burst' && player && scene.textures?.exists(effect.textureKey)) {
      const flash = scene.add.image(player.x, player.y, effect.textureKey).setDepth(20);
      scene.tweens.add({ targets: flash, scale: effect.scaleTo, alpha: effect.fadeOut ? 0 : 1, duration: effect.durationMs, onComplete: () => flash.destroy() });
      if (effect.screenShake) scene.cameras?.main?.shake(effect.screenShake.durationMs, effect.screenShake.intensity);
    } else if (effect.kind === 'blink' && player) {
      if (effect.blinkIntervalMs > 0) {
        scene.tweens.add({
          targets: player,
          alpha: 0.2,
          duration: effect.blinkIntervalMs,
          yoyo: true,
          repeat: Math.max(0, Math.floor(effect.durationMs / (effect.blinkIntervalMs * 2)) - 1),
          onComplete: () => player.setAlpha(1),
        });
      } else {
        player.setAlpha(0.6);
        scene.time?.delayedCall(effect.durationMs, () => player.setAlpha(1));
      }
    } else if (effect.kind === 'float-text' && rescue) {
      const label = scene.add
        .text(rescue.x, rescue.y + effect.offsetY, effect.text, { fontFamily: 'monospace', fontSize: '16px', color: effect.color })
        .setOrigin(0.5)
        .setDepth(30);
      scene.tweens.add({ targets: label, y: label.y - effect.riseBy, alpha: 0, duration: effect.durationMs, onComplete: () => label.destroy() });
    }
    return effect;
  }
}

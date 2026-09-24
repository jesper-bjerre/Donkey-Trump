// Game sound effects, jingles and the background loop. Every call is safe when
// audio is missing, locked or failing: sound never interrupts play. Mute (M key)
// satisfies WCAG 1.4.2 because the background loop runs longer than 3 seconds.
import { getSoundMuted, setSoundMuted } from '../config/playerSettings.js';

export const SOUND_KEYS = Object.freeze({
  step: 'sfx.step.audio',
  jump: 'sfx.jump.audio',
  score: 'sfx.score.audio',
  throw: 'sfx.throw.audio',
  levelStart: 'jingle.levelStart.audio',
  gameOver: 'jingle.gameOver.audio',
  victory: 'jingle.victory.audio',
  intro: 'jingle.intro.audio',
  music: 'music.loop.audio',
});

const VOLUMES = { step: 0.25, jump: 0.45, score: 0.5, throw: 0.4, levelStart: 0.55, gameOver: 0.55, victory: 0.55, intro: 0.55 };
export const MUSIC_VOLUME = 0.22;
export const STEP_INTERVAL_MS = 170;
// Later levels play the loop slightly faster to raise the tension.
export const MUSIC_RATE_STEP = 0.08;
// Endless levels keep speeding up, but the loop stops at a still-musical tempo.
export const MAX_MUSIC_RATE = 1.6;

export function musicRateForLevel(levelIndex) {
  return Math.min(MAX_MUSIC_RATE, 1 + Math.max(0, levelIndex) * MUSIC_RATE_STEP);
}

export class SoundSystem {
  constructor(scene, { muted = getSoundMuted() } = {}) {
    this.scene = scene;
    this.music = null;
    this.lastStepAt = -Infinity;
    this.stepFlip = false;
    this.applyMuted(muted);
  }

  get manager() {
    return this.scene.sound;
  }

  has(key) {
    return Boolean(this.manager && this.scene.cache?.audio?.exists(key));
  }

  play(name, config = {}) {
    const key = SOUND_KEYS[name];
    try {
      if (!this.has(key) || this.manager.locked) return false;
      return this.manager.play(key, { volume: VOLUMES[name] ?? 0.5, ...config });
    } catch {
      return false;
    }
  }

  stop(name) {
    try {
      this.manager?.stopByKey?.(SOUND_KEYS[name]);
    } catch {
      // Nothing playing.
    }
  }

  // Throttled footstep that alternates pitch between left and right steps.
  playStep(nowMs) {
    if (nowMs - this.lastStepAt < STEP_INTERVAL_MS) return false;
    this.lastStepAt = nowMs;
    this.stepFlip = !this.stepFlip;
    return this.play('step', { rate: this.stepFlip ? 1 : 1.15 });
  }

  startMusic(levelIndex = 0) {
    this.stopMusic();
    if (!this.has(SOUND_KEYS.music)) return false;
    const begin = () => {
      try {
        this.music = this.manager.add(SOUND_KEYS.music, { loop: true, volume: MUSIC_VOLUME, rate: musicRateForLevel(levelIndex) });
        this.music.play();
      } catch {
        this.music = null;
      }
    };
    // Browsers unlock audio on the first key press; start the loop as soon as they do.
    if (this.manager.locked) this.manager.once?.('unlocked', begin);
    else begin();
    return true;
  }

  pauseMusic() {
    if (this.music?.isPlaying) this.music.pause();
  }

  resumeMusic() {
    if (this.music?.isPaused) this.music.resume();
  }

  stopMusic() {
    if (!this.music) return;
    try {
      this.music.stop();
      this.music.destroy();
    } catch {
      // Already torn down with the scene.
    }
    this.music = null;
  }

  applyMuted(muted) {
    this.muted = muted;
    if (this.manager) this.manager.mute = muted;
  }

  toggleMute() {
    const muted = !this.muted;
    setSoundMuted(muted);
    this.applyMuted(muted);
    return muted;
  }
}

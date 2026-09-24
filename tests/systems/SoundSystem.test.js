import { afterEach, describe, expect, it, vi } from 'vitest';
import { MUSIC_RATE_STEP, SOUND_KEYS, STEP_INTERVAL_MS, SoundSystem, musicRateForLevel } from '../../src/systems/SoundSystem.js';
import { getSoundMuted, setSoundMuted } from '../../src/config/playerSettings.js';

afterEach(() => setSoundMuted(false));

function fakeMusic() {
  const music = { isPlaying: false, isPaused: false };
  music.play = vi.fn(() => Object.assign(music, { isPlaying: true, isPaused: false }));
  music.pause = vi.fn(() => Object.assign(music, { isPlaying: false, isPaused: true }));
  music.resume = vi.fn(() => Object.assign(music, { isPlaying: true, isPaused: false }));
  music.stop = vi.fn();
  music.destroy = vi.fn();
  return music;
}

function fakeScene({ locked = false, available = true } = {}) {
  const handlers = {};
  const sound = {
    locked,
    mute: false,
    play: vi.fn(() => true),
    add: vi.fn(() => fakeMusic()),
    once: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
  };
  return { sound, handlers, cache: { audio: { exists: () => available } } };
}

describe('SoundSystem', () => {
  it('plays effects by name with their key', () => {
    const scene = fakeScene();
    new SoundSystem(scene).play('jump');
    expect(scene.sound.play).toHaveBeenCalledWith(SOUND_KEYS.jump, expect.objectContaining({ volume: expect.any(Number) }));
  });

  it('stays silent and never throws when audio is missing, locked or broken', () => {
    expect(new SoundSystem(fakeScene({ available: false })).play('jump')).toBe(false);
    expect(new SoundSystem(fakeScene({ locked: true })).play('jump')).toBe(false);
    const broken = fakeScene();
    broken.sound.play.mockImplementation(() => {
      throw new Error('decode failed');
    });
    expect(() => new SoundSystem(broken).play('score')).not.toThrow();
    expect(() => new SoundSystem({}).play('jump')).not.toThrow();
  });

  it('throttles footsteps and alternates their pitch', () => {
    const scene = fakeScene();
    const sounds = new SoundSystem(scene);
    sounds.playStep(0);
    sounds.playStep(STEP_INTERVAL_MS - 1);
    sounds.playStep(STEP_INTERVAL_MS);
    const rates = scene.sound.play.mock.calls.map(([, config]) => config.rate);
    expect(rates).toEqual([1, 1.15]);
  });

  it('loops music faster on later levels and restarts it per level', () => {
    const scene = fakeScene();
    const sounds = new SoundSystem(scene);
    sounds.startMusic(0);
    const first = sounds.music;
    sounds.startMusic(2);
    expect(first.stop).toHaveBeenCalled();
    expect(scene.sound.add).toHaveBeenLastCalledWith(SOUND_KEYS.music, expect.objectContaining({ loop: true, rate: 1 + 2 * MUSIC_RATE_STEP }));
    expect(musicRateForLevel(0)).toBe(1);
    expect(musicRateForLevel(200)).toBe(1.6);
  });

  it('pauses, resumes and stops the loop', () => {
    const sounds = new SoundSystem(fakeScene());
    sounds.startMusic(0);
    const music = sounds.music;
    sounds.pauseMusic();
    expect(music.pause).toHaveBeenCalled();
    sounds.resumeMusic();
    expect(music.resume).toHaveBeenCalled();
    sounds.stopMusic();
    expect(music.destroy).toHaveBeenCalled();
    expect(sounds.music).toBeNull();
  });

  it('waits for the browser to unlock audio before starting music', () => {
    const scene = fakeScene({ locked: true });
    const sounds = new SoundSystem(scene);
    sounds.startMusic(1);
    expect(scene.sound.add).not.toHaveBeenCalled();
    scene.handlers.unlocked();
    expect(sounds.music.play).toHaveBeenCalled();
  });

  it('toggles mute on the sound manager and remembers it for the session', () => {
    const scene = fakeScene();
    const sounds = new SoundSystem(scene);
    expect(sounds.toggleMute()).toBe(true);
    expect(scene.sound.mute).toBe(true);
    expect(getSoundMuted()).toBe(true);
    expect(new SoundSystem(fakeScene()).muted).toBe(true);
    sounds.toggleMute();
    expect(scene.sound.mute).toBe(false);
  });
});

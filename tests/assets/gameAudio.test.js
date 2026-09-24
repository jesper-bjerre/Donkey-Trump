import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOUND_KEYS } from '../../src/systems/SoundSystem.js';
import { hasProhibitedAssetName } from '../../src/assets/assetValidation.js';
import { repoRoot, readJson } from './assetFs.js';

const manifest = readJson('src/assets/assetManifest.json');
const register = readJson('src/assets/assetRegister.json');

// Parses the 44-byte PCM WAV header written by scripts/generate-feedback-audio.mjs.
function readWav(relative) {
  const buffer = fs.readFileSync(path.join(repoRoot, relative));
  return {
    riff: buffer.toString('ascii', 0, 4),
    wave: buffer.toString('ascii', 8, 12),
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
    dataBytes: buffer.readUInt32LE(40),
  };
}

describe('game audio', () => {
  const entries = Object.values(SOUND_KEYS).map((key) => manifest.audio.find((entry) => entry.key === key));

  it('has a manifest entry for every SoundSystem key', () => {
    for (const [index, entry] of entries.entries()) expect(entry, Object.values(SOUND_KEYS)[index]).toBeDefined();
  });

  it('ships every sound as a valid, small 8-bit mono WAV', () => {
    for (const entry of entries) {
      const wav = readWav(entry.path);
      expect(wav).toMatchObject({ riff: 'RIFF', wave: 'WAVE', channels: 1, bitsPerSample: 8, sampleRate: 22050 });
      expect(wav.dataBytes).toBeGreaterThan(0);
      expect(wav.dataBytes).toBeLessThan(100 * 1024);
      expect(hasProhibitedAssetName(entry.path)).toBe(false);
    }
  });

  it('makes the background loop exactly 4 seconds so it loops on the beat', () => {
    const loop = readWav(manifest.audio.find((entry) => entry.key === SOUND_KEYS.music).path);
    expect(loop.dataBytes / loop.sampleRate).toBe(4);
  });

  it('marks all audio optional and tracks each file in the originality register', () => {
    for (const entry of entries) {
      expect(entry.optional).toBe(true);
      const item = register.requiredAssets.find((asset) => asset.id === entry.registerId);
      expect(item.intendedPath).toBe(entry.path);
      expect(item.copiedAssetProhibited).toBe(true);
      expect(item.notes).toMatch(/no transcription of existing games/);
    }
  });
});

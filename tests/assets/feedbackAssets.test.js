import { describe, expect, it } from 'vitest';
import { hasProhibitedAssetName } from '../../src/assets/assetValidation.js';
import { fileExists, fileSize, readJson } from './assetFs.js';

const manifest = readJson('src/assets/assetManifest.json');
const register = readJson('src/assets/assetRegister.json');
const AUDIO_KEYS = ['feedback.hit.audio', 'feedback.retry.audio', 'feedback.rescue.audio'];
const EFFECT_KEYS = ['feedback.hit.effect', 'feedback.retry.effect', 'feedback.rescue.effect'];
const REGISTER_IDS = ['hitAudio', 'retryAudio', 'rescueAudio', 'hitEffect', 'retryEffect', 'rescueEffect'];

function checkFeedbackEntry(entry) {
  const problems = [];
  const isAudio = entry.type === 'audio';
  if (!entry.path.startsWith(isAudio ? 'src/assets/audio/' : 'src/assets/effects/')) problems.push('folder');
  if (isAudio ? !/\.(ogg|wav)$/.test(entry.path) : !/\.(json|png|webp|svg)$/.test(entry.path)) problems.push('extension');
  if (hasProhibitedAssetName(entry.path)) problems.push('name');
  if (!fileExists(entry.path)) problems.push('missing');
  else if (fileSize(entry.path) === 0) problems.push('empty');
  return problems;
}

describe('feedback assets', () => {
  const entries = [...manifest.audio, ...manifest.effects].filter((entry) => [...AUDIO_KEYS, ...EFFECT_KEYS].includes(entry.key));

  it('registers hit, retry and rescue audio and effect keys', () => {
    expect(manifest.audio.map((entry) => entry.key)).toEqual(expect.arrayContaining(AUDIO_KEYS));
    expect(manifest.effects.map((entry) => entry.key)).toEqual(expect.arrayContaining(EFFECT_KEYS));
  });

  it('commits every feedback file, non-empty, in the right folder with an allowed extension', () => {
    for (const entry of entries) expect(checkFeedbackEntry(entry), entry.path).toEqual([]);
  });

  it('links register entries to the committed files with a review status', () => {
    for (const id of REGISTER_IDS) {
      const item = register.requiredAssets.find((asset) => asset.id === id);
      expect(entries.some((entry) => entry.path === item.intendedPath), id).toBe(true);
      expect(['needs-review', 'approved']).toContain(item.reviewStatus);
    }
  });

  it('describes effects with a kind and a calmer reduced-motion variant', () => {
    for (const key of EFFECT_KEYS) {
      const entry = manifest.effects.find((effect) => effect.key === key);
      const descriptor = readJson(entry.path);
      expect(descriptor.key).toBe(key);
      expect(['burst', 'blink', 'float-text']).toContain(descriptor.kind);
      expect(descriptor.reducedMotion).toBeTypeOf('object');
    }
  });

  it('marks audio optional so blocked sound never stops boot', () => {
    for (const entry of manifest.audio) expect(entry.optional).toBe(true);
  });
});

describe('feedback fixture', () => {
  it('flags missing files and disallowed names or extensions', () => {
    const fixture = readJson('tests/fixtures/feedbackAssets.manifest.fixture.json');
    const results = Object.fromEntries([...fixture.audio, ...fixture.effects].map((entry) => [entry.key, checkFeedbackEntry(entry)]));
    expect(results['feedback.hit.audio']).toEqual([]);
    expect(results['feedback.hit.effect']).toEqual([]);
    expect(results['feedback.retry.audio']).toEqual(['missing']);
    expect(results['feedback.rescue.audio']).toEqual(expect.arrayContaining(['extension', 'name', 'missing']));
  });
});

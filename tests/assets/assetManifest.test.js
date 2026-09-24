import { describe, expect, it } from 'vitest';
import { listManifestEntries, validateAssetManifest } from '../../src/assets/assetValidation.js';
import { fileExists, readJson } from './assetFs.js';

const manifest = readJson('src/assets/assetManifest.json');
const register = readJson('src/assets/assetRegister.json');

describe('src/assets/assetManifest.json', () => {
  it('lists the required shell-critical placeholder keys', () => {
    expect(manifest.criticalStartupKeys).toEqual(
      expect.arrayContaining([
        'player.placeholder',
        'boss.placeholder',
        'rescue.placeholder',
        'barrel.placeholder',
        'platform.placeholder',
        'ladder.placeholder',
        'hud.lifeIcon.placeholder',
      ]),
    );
  });

  it('references only committed files under the sprites, audio or effects folders', () => {
    for (const entry of listManifestEntries(manifest)) {
      expect(entry.path).toMatch(/^src\/assets\/(sprites|audio|effects)\//);
      expect(fileExists(entry.path), entry.path).toBe(true);
    }
  });

  it('resolves each critical startup key to exactly one preloaded entry', () => {
    const entries = listManifestEntries(manifest);
    for (const key of manifest.criticalStartupKeys) {
      const matches = entries.filter((entry) => entry.key === key);
      expect(matches).toHaveLength(1);
      expect(matches[0].preload).toBe(true);
    }
  });

  it('passes full validation including register consistency', () => {
    expect(validateAssetManifest(manifest, { fileExists, register })).toEqual([]);
  });
});

describe('manifest fixtures', () => {
  it('accepts the valid fixture', () => {
    expect(validateAssetManifest(readJson('tests/fixtures/assetManifest.valid.json'), { fileExists, register })).toEqual([]);
  });

  it('reports a missing file', () => {
    const errors = validateAssetManifest(readJson('tests/fixtures/assetManifest.missing-file.json'), { fileExists, register });
    expect(errors.join('\n')).toMatch(/file not found: src\/assets\/sprites\/does-not-exist\.svg/);
  });

  it('rejects duplicate keys and unsupported types', () => {
    const broken = {
      ...manifest,
      sprites: [...manifest.sprites, { ...manifest.sprites[0] }, { ...manifest.sprites[1], key: 'odd', type: 'video' }],
    };
    const errors = validateAssetManifest(broken).join('\n');
    expect(errors).toMatch(/duplicate manifest key player\.placeholder/);
    expect(errors).toMatch(/odd has unsupported type video/);
  });
});

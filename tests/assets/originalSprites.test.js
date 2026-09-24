import { describe, expect, it } from 'vitest';
import { hasProhibitedAssetName } from '../../src/assets/assetValidation.js';
import { fileExists, fileSize, readJson } from './assetFs.js';

const manifest = readJson('src/assets/assetManifest.json');
const register = readJson('src/assets/assetRegister.json');
const CHARACTER_KEYS = {
  'player.jumpman': 'player',
  'rescue.motzfeldt': 'rescue',
  'boss.trumpInspired': 'boss',
  'barrel.original': 'barrel',
};
const ALLOWED_EXTENSION = /\.(png|webp|svg)$/;

function checkSprite(entry) {
  const problems = [];
  if (!ALLOWED_EXTENSION.test(entry.path)) problems.push('extension');
  if (hasProhibitedAssetName(entry.path)) problems.push('name');
  if (!fileExists(entry.path)) problems.push('missing');
  else if (fileSize(entry.path) === 0) problems.push('empty');
  return problems;
}

describe('original character sprites', () => {
  const characterEntries = manifest.sprites.filter((entry) => entry.key in CHARACTER_KEYS);

  it('registers non-placeholder keys for the player, rescue, boss and barrel', () => {
    expect(characterEntries.map((entry) => entry.key).sort()).toEqual(Object.keys(CHARACTER_KEYS).sort());
  });

  it('commits each sprite as a non-empty png, webp or svg with a safe name', () => {
    for (const entry of characterEntries) {
      expect(checkSprite(entry), entry.path).toEqual([]);
    }
  });

  it('links each sprite to a register entry that is under review or approved', () => {
    for (const entry of characterEntries) {
      const item = register.requiredAssets.find((asset) => asset.id === CHARACTER_KEYS[entry.key]);
      expect(item.intendedPath).toBe(entry.path);
      expect(['needs-review', 'approved']).toContain(item.reviewStatus);
    }
  });
});

describe('sprite validation fixture', () => {
  it('flags copied names, missing files and disallowed extensions', () => {
    const fixture = readJson('tests/fixtures/originalSprites.manifest.fixture.json');
    const results = Object.fromEntries(fixture.sprites.map((entry) => [entry.key, checkSprite(entry)]));
    expect(results['player.jumpman']).toEqual([]);
    expect(results['barrel.copied']).toEqual(expect.arrayContaining(['name', 'missing']));
    expect(results['boss.gif']).toEqual(expect.arrayContaining(['extension', 'missing']));
  });
});

import { describe, expect, it } from 'vitest';
import { ORIGINALITY_STATUSES, REVIEW_STATUSES, REQUIRED_ASSET_IDS, validateAssetRegister } from '../../src/assets/assetValidation.js';
import { readJson } from './assetFs.js';

const register = readJson('src/assets/assetRegister.json');

describe('src/assets/assetRegister.json', () => {
  it('passes validation with every launch category present', () => {
    expect(validateAssetRegister(register)).toEqual([]);
    expect(register.requiredAssets.map((item) => item.id)).toEqual(expect.arrayContaining(REQUIRED_ASSET_IDS));
  });

  it('prohibits copied assets and uses only allowed originality and review statuses', () => {
    for (const item of register.requiredAssets) {
      expect(item.copiedAssetProhibited).toBe(true);
      expect(ORIGINALITY_STATUSES).toContain(item.originalityStatus);
      expect(REVIEW_STATUSES).toContain(item.reviewStatus);
    }
  });

  it('contains no protected-IP words in intended paths', () => {
    const banned = /donkey-kong|nintendo|mario|dk|ripped|rom|sprite-rip/i;
    for (const item of register.requiredAssets) {
      const fileName = item.intendedPath.split('/').pop();
      expect(fileName).not.toMatch(banned);
    }
  });

  it('has unique ids', () => {
    const ids = register.requiredAssets.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('register fixtures', () => {
  it('accepts the valid fixture', () => {
    expect(validateAssetRegister(readJson('tests/fixtures/assetRegister.valid.json'))).toEqual([]);
  });

  it('reports every problem in the invalid fixture', () => {
    const errors = validateAssetRegister(readJson('tests/fixtures/assetRegister.invalid.json')).join('\n');
    expect(errors).toMatch(/copiedAssetProhibited must be true/);
    expect(errors).toMatch(/invalid originalityStatus borrowed/);
    expect(errors).toMatch(/prohibited name/);
    expect(errors).toMatch(/invalid reviewStatus maybe/);
    expect(errors).toMatch(/duplicate id platform/);
    expect(errors).toMatch(/missing required asset ladder/);
  });
});

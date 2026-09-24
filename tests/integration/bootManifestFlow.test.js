import { describe, expect, it } from 'vitest';
import validManifest from '../fixtures/assetManifest.valid.json';
import missingAssetManifest from '../fixtures/assetManifest.missingAsset.json';
import { runBoot } from '../helpers/bootHarness.js';

describe('BootScene manifest flow', () => {
  it('queues every manifest asset and transitions to TitleScene', () => {
    const { scene, fake } = runBoot({ manifest: validManifest });
    const count = (type) => [...validManifest.sprites, ...validManifest.audio, ...validManifest.effects].filter((entry) => entry.type === type).length;
    expect(scene.load.svg).toHaveBeenCalledTimes(count('svg'));
    expect(scene.load.spritesheet).toHaveBeenCalledTimes(count('spritesheet'));
    expect(scene.load.audio).toHaveBeenCalledTimes(count('audio'));
    expect(scene.load.json).toHaveBeenCalledTimes(count('json'));
    expect(scene.recoveryReason).toBeNull();
    expect(fake.scene.start).toHaveBeenCalledWith('TitleScene');
  });

  it('records asset-failure for a missing file and does not start TitleScene', () => {
    const { scene, fake } = runBoot({ manifest: missingAssetManifest });
    expect(scene.recoveryReason).toBe('asset-failure');
    expect(fake.scene.start).not.toHaveBeenCalled();
  });

  it('records asset-failure when the loader reports an error', () => {
    const { scene, fake } = runBoot({ manifest: validManifest, failLoads: true });
    expect(scene.recoveryReason).toBe('asset-failure');
    expect(fake.scene.start).not.toHaveBeenCalled();
  });

  it('keeps booting when an optional sound fails to load', () => {
    const { scene, fake } = runBoot({ manifest: validManifest, failLoads: true, failKey: 'feedback.hit.audio' });
    expect(scene.recoveryReason).toBeNull();
    expect(scene.optionalFailures).toEqual(['feedback.hit.audio']);
    expect(fake.scene.start).toHaveBeenCalledWith('TitleScene');
  });

  it('records unsupported-browser before loading anything', () => {
    const { scene, fake } = runBoot({ manifest: validManifest, environment: { canvas: false, webgl: false, keyboard: true } });
    expect(scene.recoveryReason).toBe('unsupported-browser');
    expect(scene.load.svg).not.toHaveBeenCalled();
    expect(fake.scene.start).not.toHaveBeenCalled();
  });
});

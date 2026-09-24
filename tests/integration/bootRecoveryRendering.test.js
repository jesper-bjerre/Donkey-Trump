import { describe, expect, it } from 'vitest';
import missingAssetManifest from '../fixtures/assetManifest.missingAsset.json';
import { runBoot } from '../helpers/bootHarness.js';

describe('BootScene recovery rendering', () => {
  it('renders the asset-failure state with a keyboard reload action', () => {
    const { scene, fake } = runBoot({ manifest: missingAssetManifest });
    expect(scene.recoveryState).toMatchObject({ reason: 'asset-failure', primaryAction: 'reload' });
    const rendered = fake.created.map((text) => text.text);
    expect(rendered).toEqual(expect.arrayContaining([scene.recoveryState.title, scene.recoveryState.message, scene.recoveryState.primaryActionLabel]));
    expect(fake.input.keyboard.once).toHaveBeenCalledWith('keydown-ENTER', expect.any(Function));
  });
});

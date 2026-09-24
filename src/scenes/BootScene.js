import * as Phaser from 'phaser';
import assetManifest from '../assets/assetManifest.json';
import { resolveAssetUrl } from '../assets/assetUrls.js';
import { listManifestEntries } from '../assets/assetValidation.js';
import uiText from '../config/uiText.en.json';
import { RECOVERY_REASONS, getLoadingRecoveryState, renderLoadingRecoveryState } from '../ui/LoadingRecoveryState.js';
import { announce } from '../ui/announce.js';

export const LOADING_TEXT_DELAY_MS = 2000;

export function detectBootEnvironment(win = globalThis.window) {
  const doc = win?.document;
  let canvas = false;
  let webgl = false;
  try {
    const probe = doc?.createElement('canvas');
    canvas = Boolean(probe?.getContext?.('2d'));
    webgl = Boolean(probe?.getContext?.('webgl2') || probe?.getContext?.('webgl'));
  } catch {
    // A throwing probe means the capability is unavailable.
  }
  return { canvas, webgl, keyboard: typeof win?.KeyboardEvent === 'function' };
}

export function checkBootCapabilities(environment) {
  const missing = [];
  if (!environment?.canvas && !environment?.webgl) missing.push('rendering');
  if (!environment?.keyboard) missing.push('keyboard');
  return missing.length === 0
    ? { supported: true, reason: null, missing }
    : { supported: false, reason: RECOVERY_REASONS.UNSUPPORTED_BROWSER, missing };
}

// Turns manifest entries into loader instructions. Throws on entries without a key
// or path, or whose file is not part of the build, so boot can fail closed.
export function normalizePreloadManifest(manifest, resolveUrl = resolveAssetUrl) {
  return listManifestEntries(manifest)
    .filter((entry) => entry?.preload !== false)
    .map((entry, index) => {
      if (!entry || typeof entry.key !== 'string' || entry.key === '') {
        throw new Error(`Asset manifest entry ${index} is missing a key.`);
      }
      const path = entry.path ?? entry.url;
      if (typeof path !== 'string' || path === '') {
        throw new Error(`Asset manifest entry ${entry.key} is missing a url.`);
      }
      const url = resolveUrl(path);
      if (!url) throw new Error(`Asset manifest entry ${entry.key} points to a missing file.`);
      return {
        key: entry.key,
        type: entry.type,
        url,
        width: entry.width,
        height: entry.height,
        frameWidth: entry.frameWidth,
        frameHeight: entry.frameHeight,
        optional: entry.optional === true,
      };
    });
}

// Shows the "still loading" message only if loading outlasts delayMs.
export function createLoadingIndicator({ show, delayMs = LOADING_TEXT_DELAY_MS, schedule = setTimeout, cancel = clearTimeout }) {
  let handle = null;
  let visible = false;
  return {
    start() {
      handle = schedule(() => {
        visible = true;
        show();
      }, delayMs);
    },
    stop() {
      if (handle !== null) cancel(handle);
      handle = null;
    },
    get visible() {
      return visible;
    },
  };
}

export class BootScene extends Phaser.Scene {
  constructor(options = {}) {
    super('BootScene');
    this.manifest = options.manifest ?? assetManifest;
    this.environment = options.environment ?? null;
    this.resolveUrl = options.resolveUrl ?? resolveAssetUrl;
    this.recoveryReason = null;
    this.recoveryState = null;
  }

  preload() {
    const capabilities = checkBootCapabilities(this.environment ?? detectBootEnvironment());
    if (!capabilities.supported) {
      this.recoveryReason = capabilities.reason;
      return;
    }

    let entries;
    try {
      entries = normalizePreloadManifest(this.manifest, this.resolveUrl);
    } catch {
      this.recoveryReason = RECOVERY_REASONS.ASSET_FAILURE;
      return;
    }

    const { width, height } = this.scale;
    const preparing = this.add
      .text(width / 2, height / 2, uiText.loading.preparing, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5);
    this.loadingIndicator = createLoadingIndicator({
      show: () => {
        preparing.setText(uiText.loading.slow);
        announce(uiText.loading.slow);
      },
    });
    this.loadingIndicator.start();

    // Optional assets (sound) may fail or be blocked without stopping the game.
    const optionalKeys = new Set(entries.filter((entry) => entry.optional).map((entry) => entry.key));
    this.optionalFailures = [];
    this.load.on('loaderror', (file) => {
      if (optionalKeys.has(file?.key)) this.optionalFailures.push(file.key);
      else this.recoveryReason = RECOVERY_REASONS.ASSET_FAILURE;
    });
    for (const entry of entries) this.queueAsset(entry);
  }

  queueAsset(entry) {
    switch (entry.type) {
      case 'svg':
        this.load.svg(entry.key, entry.url, { width: entry.width, height: entry.height });
        break;
      case 'spritesheet':
        this.load.spritesheet(entry.key, entry.url, { frameWidth: entry.frameWidth, frameHeight: entry.frameHeight });
        break;
      case 'audio':
        this.load.audio(entry.key, entry.url);
        break;
      case 'json':
        this.load.json(entry.key, entry.url);
        break;
      default:
        this.load.image(entry.key, entry.url);
    }
  }

  create() {
    this.loadingIndicator?.stop();
    if (this.recoveryReason) {
      this.showRecovery(this.recoveryReason);
      return;
    }
    this.scene.start('TitleScene');
  }

  showRecovery(reason) {
    this.children?.removeAll?.();
    this.recoveryState = getLoadingRecoveryState(reason);
    renderLoadingRecoveryState(this, this.recoveryState, {
      onPrimaryAction: () => globalThis.location?.reload(),
    });
    announce(`${this.recoveryState.title}. ${this.recoveryState.message} ${this.recoveryState.primaryActionLabel}`);
  }
}

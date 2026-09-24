import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOADING_TEXT_DELAY_MS, checkBootCapabilities, createLoadingIndicator, normalizePreloadManifest } from '../../src/scenes/BootScene.js';
import validManifest from '../fixtures/assetManifest.valid.json';

afterEach(() => vi.useRealTimers());

describe('checkBootCapabilities', () => {
  it('reports unsupported-browser when rendering support is absent', () => {
    expect(checkBootCapabilities({ canvas: false, webgl: false, keyboard: true })).toMatchObject({
      supported: false,
      reason: 'unsupported-browser',
      missing: ['rendering'],
    });
  });

  it('reports unsupported-browser when keyboard support is absent', () => {
    expect(checkBootCapabilities({ canvas: true, webgl: true, keyboard: false }).reason).toBe('unsupported-browser');
  });

  it('accepts Canvas-only or WebGL-only browsers with a keyboard', () => {
    expect(checkBootCapabilities({ canvas: true, webgl: false, keyboard: true }).supported).toBe(true);
    expect(checkBootCapabilities({ canvas: false, webgl: true, keyboard: true }).supported).toBe(true);
  });
});

describe('normalizePreloadManifest', () => {
  it('resolves every preload entry to a built URL', () => {
    const entries = normalizePreloadManifest(validManifest);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(typeof entry.url).toBe('string');
  });

  it('rejects an asset entry without a key or url', () => {
    expect(() => normalizePreloadManifest({ sprites: [{ path: 'src/assets/sprites/barrel-original.svg' }] })).toThrow(/missing a key/);
    expect(() => normalizePreloadManifest({ sprites: [{ key: 'barrel' }] })).toThrow(/missing a url/);
  });

  it('rejects entries whose file is not in the build', () => {
    expect(() => normalizePreloadManifest({ sprites: [{ key: 'ghost', path: 'src/assets/sprites/ghost.svg' }] })).toThrow(/missing file/);
  });
});

describe('createLoadingIndicator', () => {
  it('shows delayed loading text at 2000 milliseconds, not before', () => {
    vi.useFakeTimers();
    const show = vi.fn();
    const indicator = createLoadingIndicator({ show });
    indicator.start();
    vi.advanceTimersByTime(LOADING_TEXT_DELAY_MS - 1);
    expect(indicator.visible).toBe(false);
    vi.advanceTimersByTime(1);
    expect(LOADING_TEXT_DELAY_MS).toBe(2000);
    expect(indicator.visible).toBe(true);
    expect(show).toHaveBeenCalledOnce();
  });

  it('never shows when loading finishes quickly', () => {
    vi.useFakeTimers();
    const show = vi.fn();
    const indicator = createLoadingIndicator({ show });
    indicator.start();
    vi.advanceTimersByTime(500);
    indicator.stop();
    vi.advanceTimersByTime(5000);
    expect(show).not.toHaveBeenCalled();
  });
});

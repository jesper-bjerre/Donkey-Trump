import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PERFORMANCE_BUDGETS } from '../../src/config/performance.js';
import { collectDistAssets, evaluateStartupBudget } from '../../scripts/performanceBudget.js';
import * as fx from '../fixtures/performanceBudget.fixture.js';

const distDir = path.resolve(import.meta.dirname, '../../dist');
const hasBuild = fs.existsSync(path.join(distDir, 'index.html'));

describe('budget constants', () => {
  it('encodes the 5 MB compressed startup budget and the 45 FPS gameplay floor', () => {
    expect(PERFORMANCE_BUDGETS.startupCompressedBytes).toBe(5 * 1024 * 1024);
    expect(PERFORMANCE_BUDGETS.minimumGameplayFps).toBeGreaterThanOrEqual(45);
    expect(PERFORMANCE_BUDGETS.targetFps).toBeGreaterThanOrEqual(PERFORMANCE_BUDGETS.minimumGameplayFps);
    // One frame at the floor rate must fit the frame budget.
    expect(1000 / PERFORMANCE_BUDGETS.minimumGameplayFps).toBeLessThanOrEqual(22.3);
  });
});

describe('evaluateStartupBudget', () => {
  it('passes an under-budget artifact', () => {
    expect(evaluateStartupBudget(fx.underBudget)).toMatchObject({ withinBudget: true, overBy: 0 });
  });

  it('fails an over-budget artifact and names the largest asset', () => {
    const result = evaluateStartupBudget(fx.overBudget);
    expect(result.withinBudget).toBe(false);
    expect(result.largest.path).toBe('assets/huge-intro-video.webm');
    expect(result.message).toContain('assets/huge-intro-video.webm');
    expect(result.overBy).toBeGreaterThan(0);
  });

  it('also enforces the uncompressed artifact ceiling', () => {
    expect(evaluateStartupBudget(fx.overUncompressedOnly).withinBudget).toBe(false);
  });
});

describe('collectDistAssets', () => {
  it('reports a missing dist directory instead of throwing', () => {
    const missing = path.join(os.tmpdir(), 'donkey-trump-no-dist-here');
    expect(collectDistAssets(missing)).toMatchObject({ error: 'dist-missing', assets: [] });
  });

  it.skipIf(!hasBuild)('keeps the real build under budget (run npm run build first)', () => {
    const { error, assets } = collectDistAssets(distDir);
    expect(error).toBeNull();
    expect(assets.some((asset) => asset.path === 'index.html')).toBe(true);
    const result = evaluateStartupBudget(assets);
    expect(result.withinBudget, result.message).toBe(true);
  });
});

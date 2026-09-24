import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RELEASE_QA_ROUTE, findDevRoute, getDevRoutes } from '../../src/routes/devRoutes.js';
import * as fx from '../fixtures/devRoutes.fixture.js';

const QA_PATTERN = /dev|qa|accessibility-release|AccessibilityReleaseQASettingsPage/;

describe('getDevRoutes', () => {
  it('includes the release QA page in development', () => {
    const routes = getDevRoutes(fx.development);
    expect(routes.map((route) => route.path)).toContain(RELEASE_QA_ROUTE.path);
    expect(routes[0].component).toBe('AccessibilityReleaseQASettingsPage');
    expect(routes[0].modulePath).toBe('src/pages/AccessibilityReleaseQASettingsPage.js');
  });

  it('returns no route targeting the QA page in production', () => {
    const routes = getDevRoutes(fx.production);
    expect(routes).toEqual([]);
    expect(JSON.stringify(routes)).not.toMatch(QA_PATTERN);
  });

  it('fails closed when the environment input is missing or not exactly true', () => {
    expect(getDevRoutes()).toEqual([]);
    expect(getDevRoutes(fx.missing)).toEqual([]);
    expect(getDevRoutes(fx.ambiguous)).toEqual([]);
  });

  it('lazily loads the page module in development', async () => {
    const page = await getDevRoutes(fx.development)[0].load();
    expect(typeof page.AccessibilityReleaseQASettingsPage).toBe('function');
  });
});

describe('findDevRoute', () => {
  it('resolves direct paths and hashes only in development', () => {
    for (const location of fx.qaLocations) {
      expect(findDevRoute(location, fx.development)?.id).toBe(RELEASE_QA_ROUTE.id);
      expect(findDevRoute(location, fx.production)).toBeNull();
      expect(findDevRoute(location, fx.missing)).toBeNull();
    }
  });

  it('returns null for unknown locations', () => {
    expect(findDevRoute('/admin', fx.development)).toBeNull();
    expect(findDevRoute('', fx.development)).toBeNull();
  });
});

describe('entrypoint gating', () => {
  it('imports dev routes only inside an import.meta.env.DEV branch', () => {
    const main = fs.readFileSync(path.resolve(import.meta.dirname, '../../src/main.js'), 'utf8');
    const devBranch = main.slice(main.indexOf('if (import.meta.env.DEV) {\n  import('));
    expect(devBranch).toContain("import('./routes/devRoutes.js')");
    expect(main).not.toMatch(/^import .*devRoutes/m);
    expect(main).toContain('isDev: import.meta.env.DEV');
  });
});

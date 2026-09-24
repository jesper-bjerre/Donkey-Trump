import { afterEach, describe, expect, it } from 'vitest';
import { AccessibilityReleaseQASettingsPage, getContrastResults, renderAccessibilityReleaseQASettingsPage } from '../../src/pages/AccessibilityReleaseQASettingsPage.js';
import { getReducedMotionOverride, setReducedMotionOverride } from '../../src/config/playerSettings.js';
import { runAnalyticsDisabledChecks } from '../../src/ui/AnalyticsDisabledChecklist.js';
import { summarizeAssetRegister } from '../../src/ui/AssetRegisterPanel.js';

afterEach(() => setReducedMotionOverride(null));

describe('AccessibilityReleaseQASettingsPage', () => {
  it('renders every panel', () => {
    const page = AccessibilityReleaseQASettingsPage();
    const headings = [...page.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings).toEqual(
      expect.arrayContaining(['Text contrast (WCAG 2.1 AA)', 'Reduced motion', 'Asset originality register', 'Analytics disabled checklist']),
    );
    expect(page.querySelector('[data-panel="asset-register"] tbody').children.length).toBeGreaterThan(10);
  });

  it('toggles the reduced-motion override from its buttons', () => {
    const container = document.createElement('main');
    renderAccessibilityReleaseQASettingsPage(container);
    const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Force reduced motion');
    button.click();
    expect(getReducedMotionOverride()).toBe(true);
    expect(container.querySelector('[role="status"]').textContent).toMatch(/on \(overridden/);
  });

  it('reports passing contrast and analytics checks', () => {
    expect(getContrastResults().every((result) => result.passes)).toBe(true);
    expect(runAnalyticsDisabledChecks().every((check) => check.passed)).toBe(true);
  });

  it('flags assets still awaiting originality review', () => {
    const summary = summarizeAssetRegister();
    expect(summary.problems).toEqual([]);
    expect(summary.launchReady).toBe(false);
    expect(summary.pendingReview).toContain('boss');
  });

  it('never renders markup from data', () => {
    const page = AccessibilityReleaseQASettingsPage();
    expect(page.querySelector('script')).toBeNull();
  });
});

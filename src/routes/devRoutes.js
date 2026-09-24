// Development-only routes. Production builds get an empty route table, so the
// release QA tools can never be reached by URL in a deployed game. Callers must
// pass isDev explicitly (import.meta.env.DEV); anything else fails closed.

export const RELEASE_QA_ROUTE = Object.freeze({
  id: 'accessibility-release-qa',
  path: '/dev/release-qa',
  hash: '#/dev/release-qa',
  title: 'Release QA settings',
  component: 'AccessibilityReleaseQASettingsPage',
  modulePath: 'src/pages/AccessibilityReleaseQASettingsPage.js',
});

export function getDevRoutes({ isDev } = {}) {
  if (isDev !== true) return [];
  return [{ ...RELEASE_QA_ROUTE, load: () => import('../pages/AccessibilityReleaseQASettingsPage.js') }];
}

// Accepts a pathname or a location hash.
export function findDevRoute(location, options) {
  const normalized = String(location ?? '').replace(/\/+$/, '');
  return getDevRoutes(options).find((route) => route.path === normalized || route.hash === normalized) ?? null;
}

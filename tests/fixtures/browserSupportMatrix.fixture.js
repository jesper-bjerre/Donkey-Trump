export const complete = [
  { family: 'chromium', versions: ['current-stable', 'previous-major'], platforms: ['Windows', 'macOS'] },
  { family: 'firefox', versions: ['current-stable', 'previous-major'], platforms: ['Windows'] },
  { family: 'safari', versions: ['current-stable', 'previous-major'], platforms: ['macOS'] },
];
export const missingSafari = complete.filter((browser) => browser.family !== 'safari');
export const currentOnlyFirefox = complete.map((browser) => (browser.family === 'firefox' ? { ...browser, versions: ['current-stable'] } : browser));
export const withMobile = complete.map((browser) => (browser.family === 'safari' ? { ...browser, platforms: ['macOS', 'iOS'] } : browser));

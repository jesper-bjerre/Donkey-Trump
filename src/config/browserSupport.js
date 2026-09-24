// Supported launch browsers: desktop only, keyboard required (touch is post-MVP).

export const SUPPORTED_VERSION_POLICY = Object.freeze(['current-stable', 'previous-major']);

export const SUPPORTED_DESKTOP_BROWSERS = Object.freeze([
  { family: 'chromium', names: ['Chrome', 'Edge'], engine: 'Blink', platforms: ['Windows', 'macOS', 'Linux'], versions: SUPPORTED_VERSION_POLICY },
  { family: 'firefox', names: ['Firefox'], engine: 'Gecko', platforms: ['Windows', 'macOS', 'Linux'], versions: SUPPORTED_VERSION_POLICY },
  { family: 'safari', names: ['Safari'], engine: 'WebKit', platforms: ['macOS'], versions: SUPPORTED_VERSION_POLICY },
]);

export const REQUIRED_BROWSER_CAPABILITIES = Object.freeze(['canvas-or-webgl', 'keyboard-events', 'es-modules']);

export const REQUIRED_FAMILIES = Object.freeze(['chromium', 'firefox', 'safari']);

// Returns problems with a support matrix; an empty list means it is complete.
export function validateSupportMatrix(matrix) {
  const problems = [];
  for (const family of REQUIRED_FAMILIES) {
    const entry = matrix.find((browser) => browser.family === family);
    if (!entry) {
      problems.push(`missing ${family}`);
      continue;
    }
    for (const version of SUPPORTED_VERSION_POLICY) {
      if (!entry.versions?.includes(version)) problems.push(`${family} missing ${version}`);
    }
    if (entry.platforms?.some((platform) => /android|ios|mobile/i.test(platform))) problems.push(`${family} lists a mobile platform`);
  }
  return problems;
}

export const development = { isDev: true };
export const production = { isDev: false };
export const missing = {};
// Truthy but not boolean true: must still fail closed.
export const ambiguous = { isDev: 'true' };
export const qaLocations = ['/dev/release-qa', '#/dev/release-qa', '/dev/release-qa/'];

// Deterministic matchMedia stubs for reduced-motion tests.
const windowWith = (matches) => ({ matchMedia: (query) => ({ matches: matches && query === '(prefers-reduced-motion: reduce)', media: query }) });

export const reduceWindow = windowWith(true);
export const noPreferenceWindow = windowWith(false);
export const windowWithoutMatchMedia = {};
export const throwingWindow = {
  matchMedia: () => {
    throw new Error('matchMedia unavailable');
  },
};

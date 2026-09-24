// WCAG 2.1 relative luminance and contrast ratio for #rrggbb colors.

export const WCAG_AA = Object.freeze({ normalText: 4.5, largeText: 3 });

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Expected a #rrggbb color, got ${hex}.`);
  const n = Number.parseInt(match[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(foreground, background) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function meetsWcagAA({ foreground, background, largeText = false }) {
  const ratio = contrastRatio(foreground, background);
  return { ratio, required: largeText ? WCAG_AA.largeText : WCAG_AA.normalText, passes: ratio >= (largeText ? WCAG_AA.largeText : WCAG_AA.normalText) };
}

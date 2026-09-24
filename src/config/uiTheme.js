// Shared UI palette. Every text/background pairing used by menus and overlays is
// listed in TEXT_CONTRAST_PAIRS so QA tests can verify WCAG 2.1 AA contrast.

export const UI_COLORS = Object.freeze({
  background: '#0b0b14',
  panel: '#10101e',
  text: '#f4f4f8',
  muted: '#c9c9d6',
  accent: '#ffd23f',
  focusBackground: '#ffd23f',
  focusText: '#0b0b14',
  title: '#ff5a3c',
  hudBackground: '#000000',
  alertBackground: '#c8102e',
  alertText: '#ffffff',
});

export const toColorNumber = (hex) => Number.parseInt(hex.slice(1), 16);

// Markers make focus visible without relying on color alone.
export const FOCUS_MARKERS = Object.freeze({ before: '▶ ', after: ' ◀' });

export const TEXT_CONTRAST_PAIRS = Object.freeze([
  { name: 'menu text', foreground: UI_COLORS.text, background: UI_COLORS.background },
  { name: 'muted hint', foreground: UI_COLORS.muted, background: UI_COLORS.background },
  { name: 'focused menu item', foreground: UI_COLORS.focusText, background: UI_COLORS.focusBackground },
  { name: 'modal heading', foreground: UI_COLORS.accent, background: UI_COLORS.panel },
  { name: 'modal body', foreground: UI_COLORS.text, background: UI_COLORS.panel },
  { name: 'game title', foreground: UI_COLORS.title, background: UI_COLORS.background, largeText: true },
  { name: 'HUD text', foreground: UI_COLORS.text, background: UI_COLORS.hudBackground },
  { name: 'HUD objective', foreground: UI_COLORS.accent, background: UI_COLORS.hudBackground },
  { name: 'rescue callout', foreground: UI_COLORS.alertText, background: UI_COLORS.alertBackground },
]);

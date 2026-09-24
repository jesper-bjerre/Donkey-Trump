// Dev-only release readiness page: accessibility checks, reduced-motion setting,
// asset originality and analytics status. Reached only through devRoutes in dev builds.
import { getReducedMotionOverride, getReducedMotionPreference, setReducedMotionOverride } from '../config/playerSettings.js';
import { FOCUS_MARKERS, TEXT_CONTRAST_PAIRS } from '../config/uiTheme.js';
import { SUPPORTED_DESKTOP_BROWSERS, SUPPORTED_TOUCH_BROWSERS } from '../config/browserSupport.js';
import { meetsWcagAA } from '../qa/contrast.js';
import { AnalyticsDisabledChecklist } from '../ui/AnalyticsDisabledChecklist.js';
import { AssetRegisterPanel } from '../ui/AssetRegisterPanel.js';
import { el } from '../ui/dom.js';

export function getContrastResults() {
  return TEXT_CONTRAST_PAIRS.map((pair) => ({ ...pair, ...meetsWcagAA(pair) }));
}

function ContrastPanel() {
  const rows = getContrastResults().map((result) =>
    el('tr', {}, [
      el('th', { scope: 'row', text: result.name }),
      el('td', { text: `${result.foreground} on ${result.background}` }),
      el('td', { text: result.ratio.toFixed(2) }),
      el('td', { text: `${result.passes ? 'PASS' : 'FAIL'} (needs ${result.required})` }),
    ]),
  );
  return el('section', { 'aria-labelledby': 'contrast-heading' }, [
    el('h2', { id: 'contrast-heading', text: 'Text contrast (WCAG 2.1 AA)' }),
    el('div', { class: 'table-wrap' }, el('table', {}, [
      el('thead', {}, el('tr', {}, ['Pairing', 'Colors', 'Ratio', 'Result'].map((label) => el('th', { scope: 'col', text: label })))),
      el('tbody', {}, rows),
    ])),
    el('p', { text: `Focused menu items also show the markers "${FOCUS_MARKERS.before.trim()}" and "${FOCUS_MARKERS.after.trim()}", so focus never relies on color alone.` }),
  ]);
}

function ReducedMotionPanel() {
  const status = el('p', { role: 'status' });
  const refresh = () => {
    const override = getReducedMotionOverride();
    status.textContent = `Reduced motion is ${getReducedMotionPreference() ? 'on' : 'off'} (${override === null ? 'following the OS setting' : 'overridden for this session'}).`;
  };
  const choice = (label, value) => el('button', { type: 'button', text: label, onClick: () => { setReducedMotionOverride(value); refresh(); } });
  refresh();
  return el('section', { 'aria-labelledby': 'motion-heading' }, [
    el('h2', { id: 'motion-heading', text: 'Reduced motion' }),
    status,
    el('div', { class: 'button-row' }, [choice('Follow OS setting', null), choice('Force reduced motion', true), choice('Allow motion', false)]),
  ]);
}

function KeyboardChecklist() {
  const items = [
    'Title menu: Up/Down to move focus, Enter or Space to activate, Escape closes modals and returns focus to the trigger.',
    'Pause overlay: P or Escape opens from play; Up/Down, Enter; Escape or P resumes.',
    'Recovery screens: Enter reloads.',
    'Game over: Enter plays again, Escape returns to title. Victory: Enter returns to title.',
    'Screen readers: menu focus, modals and outcomes are mirrored into the #sr-status live region.',
  ];
  return el('section', { 'aria-labelledby': 'keyboard-heading' }, [
    el('h2', { id: 'keyboard-heading', text: 'Keyboard operability (manual check)' }),
    el('ul', {}, items.map((item) => el('li', { text: item }))),
  ]);
}

function BrowserPanel() {
  return el('section', { 'aria-labelledby': 'browser-heading' }, [
    el('h2', { id: 'browser-heading', text: 'Supported browsers' }),
    el('ul', {}, SUPPORTED_DESKTOP_BROWSERS.map((browser) => el('li', { text: `${browser.names.join(' / ')} (${browser.engine}): ${browser.versions.join(' and ')}` }))),
    el('h3', { text: 'Touch devices (landscape, on-screen controls)' }),
    el('ul', {}, SUPPORTED_TOUCH_BROWSERS.map((browser) => el('li', { text: `${browser.names.join(' / ')} (${browser.engine}): ${browser.versions.join(' and ')}` }))),
  ]);
}

export function AccessibilityReleaseQASettingsPage() {
  return el('div', { class: 'qa-page', 'data-page': 'accessibility-release-qa' }, [
    el('h1', { text: 'Donkey Trump release QA' }),
    el('p', { text: 'Development build only. This page is not part of production routes.' }),
    ContrastPanel(),
    ReducedMotionPanel(),
    KeyboardChecklist(),
    BrowserPanel(),
    AssetRegisterPanel(),
    AnalyticsDisabledChecklist(),
    el('p', {}, el('a', { href: './', text: 'Back to the game' })),
  ]);
}

export function renderAccessibilityReleaseQASettingsPage(container) {
  container.replaceChildren(AccessibilityReleaseQASettingsPage());
  document.title = 'Release QA · Donkey Trump';
}

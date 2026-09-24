// Converts boot failure reasons into safe, player-facing English copy. Never
// includes error objects or stack traces.
import uiText from '../config/uiText.en.json';
import { UI_COLORS } from '../config/uiTheme.js';

export const RECOVERY_REASONS = Object.freeze({
  UNSUPPORTED_BROWSER: 'unsupported-browser',
  ASSET_FAILURE: 'asset-failure',
});

const STATES = {
  [RECOVERY_REASONS.UNSUPPORTED_BROWSER]: {
    title: uiText.errors.unsupportedBrowserTitle,
    message: uiText.errors.unsupportedBrowser,
    primaryActionLabel: uiText.errors.reload,
    primaryAction: 'reload',
  },
  [RECOVERY_REASONS.ASSET_FAILURE]: {
    title: uiText.errors.assetLoadFailureTitle,
    message: uiText.errors.assetLoadFailure,
    primaryActionLabel: uiText.errors.reload,
    primaryAction: 'reload',
  },
};

export function getLoadingRecoveryState(reason) {
  const known = STATES[reason] ? reason : RECOVERY_REASONS.ASSET_FAILURE;
  return { reason: known, ...STATES[known], secondaryActionLabel: null };
}

// Draws the recovery screen with Phaser text and wires Enter to the primary action.
export function renderLoadingRecoveryState(scene, state, { onPrimaryAction }) {
  const { width, height } = scene.scale;
  scene.add
    .text(width / 2, height / 2 - 70, state.title, { fontFamily: 'monospace', fontSize: '28px', color: UI_COLORS.accent })
    .setOrigin(0.5);
  scene.add
    .text(width / 2, height / 2, state.message, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: UI_COLORS.text,
      align: 'center',
      wordWrap: { width: width - 120 },
    })
    .setOrigin(0.5);
  scene.add
    .text(width / 2, height / 2 + 90, state.primaryActionLabel, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: UI_COLORS.focusText,
      backgroundColor: UI_COLORS.focusBackground,
      padding: { x: 12, y: 6 },
    })
    .setOrigin(0.5);
  scene.input?.keyboard?.once('keydown-ENTER', onPrimaryAction);
  return state;
}

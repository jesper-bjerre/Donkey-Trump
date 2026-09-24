// Score, lives and level display. Formatting is pure; rendering is a thin layer
// over scene.add.text so tests can use text doubles.
import uiText from '../config/uiText.en.json';
import { UI_COLORS } from '../config/uiTheme.js';
import { GAME_STATES } from '../state/GameStateMachine.js';

const toCount = (value) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

const STATE_MESSAGES = {
  [GAME_STATES.PLAY]: uiText.hud.objective,
  [GAME_STATES.PAUSE]: uiText.pause.heading,
  [GAME_STATES.LIFE_LOSS]: uiText.retry.lifeLost,
  [GAME_STATES.RETRY]: uiText.retry.retrying,
  [GAME_STATES.LEVEL_COMPLETE]: uiText.levelComplete.heading,
  [GAME_STATES.GAME_OVER]: uiText.gameOver.heading,
  [GAME_STATES.VICTORY]: uiText.victory.heading,
};

export function formatHudState(snapshot) {
  const level = toCount(snapshot?.levelIndex) + 1;
  // Endless runs have no total, so show just the level number.
  const endless = snapshot?.totalLevels === Infinity;
  const total = Math.max(level, toCount(snapshot?.totalLevels));
  return {
    score: `${uiText.hud.score}: ${toCount(snapshot?.score)}`,
    lives: `${uiText.hud.lives}: ${toCount(snapshot?.lives)}`,
    level: endless ? `${uiText.hud.level} ${level}` : `${uiText.hud.level} ${level}/${total}`,
    message: STATE_MESSAGES[snapshot?.currentState] ?? '',
  };
}

const TEXT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: UI_COLORS.text,
  backgroundColor: UI_COLORS.hudBackground,
  padding: { x: 6, y: 3 },
};

export class HudSystem {
  constructor(scene) {
    this.scene = scene;
    this.texts = {
      score: scene.add.text(12, 8, '', TEXT_STYLE).setDepth(100),
      lives: scene.add.text(12, 36, '', TEXT_STYLE).setDepth(100),
      level: scene.add.text(scene.scale.width - 12, 8, '', TEXT_STYLE).setOrigin(1, 0).setDepth(100),
      message: scene.add.text(scene.scale.width - 12, 36, '', { ...TEXT_STYLE, fontSize: '16px', color: UI_COLORS.accent }).setOrigin(1, 0).setDepth(100),
      sound: scene.add.text(scene.scale.width - 12, scene.scale.height - 12, '', { ...TEXT_STYLE, fontSize: '14px' }).setOrigin(1, 1).setDepth(100),
    };
    this.lastFormatted = null;
  }

  // Text rather than an icon, so the muted state is readable without color or symbols.
  setSoundIndicator(label) {
    this.texts.sound.setText(label);
    this.texts.sound.setVisible(label !== '');
  }

  static createHud(scene) {
    return new HudSystem(scene);
  }

  updateFromState(snapshot) {
    const formatted = formatHudState(snapshot);
    for (const key of Object.keys(formatted)) {
      if (this.lastFormatted?.[key] !== formatted[key]) this.texts[key].setText(formatted[key]);
    }
    this.lastFormatted = formatted;
    return formatted;
  }
}

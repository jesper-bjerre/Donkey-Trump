// In-play pause menu with keyboard help. Owns only menu state and drawing;
// PlayScene supplies callbacks for resume, restart and return-to-title.
import uiText from '../config/uiText.en.json';
import { getReducedMotionPreference } from '../config/playerSettings.js';
import { FOCUS_MARKERS, UI_COLORS, toColorNumber } from '../config/uiTheme.js';
import { announce } from './announce.js';

export const PAUSE_ACTIONS = Object.freeze(['resume', 'restart', 'returnToTitle']);

export function getPauseHelpContent(text = uiText) {
  const i = text.instructions;
  return {
    heading: text.pause.heading,
    actions: [
      { id: 'resume', label: text.pause.resume },
      { id: 'restart', label: text.pause.restart },
      { id: 'returnToTitle', label: text.pause.returnToTitle },
    ],
    helpHeading: text.pause.helpHeading,
    helpLines: [i.left, i.right, i.jump, i.up, i.down, i.pause, i.resume, i.retry],
    hint: text.pause.hint,
  };
}

// Decorative motion is dropped entirely when the player prefers reduced motion.
export function getPauseOverlayPresentation({ reducedMotion }) {
  return {
    reducedMotion,
    previewAnimationClass: reducedMotion ? null : 'rolling-preview',
    hintPulse: !reducedMotion,
  };
}

export function createPauseHelpState({ onResume, onRestart, onReturnToTitle }) {
  const handlers = { resume: onResume, restart: onRestart, returnToTitle: onReturnToTitle };
  let open = false;
  let selectedIndex = 0;

  const state = {
    get isOpen() {
      return open;
    },
    get selectedAction() {
      return PAUSE_ACTIONS[selectedIndex];
    },
    open() {
      open = true;
      selectedIndex = 0;
    },
    close() {
      open = false;
    },
    selectNextAction() {
      if (open) selectedIndex = (selectedIndex + 1) % PAUSE_ACTIONS.length;
    },
    selectPreviousAction() {
      if (open) selectedIndex = (selectedIndex - 1 + PAUSE_ACTIONS.length) % PAUSE_ACTIONS.length;
    },
    activateSelectedAction() {
      if (!open) return null;
      const action = state.selectedAction;
      open = false;
      handlers[action]?.();
      return action;
    },
    // Accepts the InputMapper snapshot. Escape and the pause key always resume.
    handleInput(input) {
      if (!open) return null;
      if (input.escapePressed || input.pausePressed) {
        selectedIndex = 0;
        return state.activateSelectedAction();
      }
      if (input.upPressed) state.selectPreviousAction();
      if (input.downPressed) state.selectNextAction();
      if (input.confirmPressed) return state.activateSelectedAction();
      return null;
    },
  };
  return state;
}

export class PauseHelpOverlay {
  constructor(scene, { onResume, onRestart, onReturnToTitle }, { reducedMotion = getReducedMotionPreference() } = {}) {
    this.scene = scene;
    this.content = getPauseHelpContent();
    this.presentation = getPauseOverlayPresentation({ reducedMotion });
    this.state = createPauseHelpState({
      onResume: () => {
        this.hide();
        onResume();
      },
      onRestart: () => {
        this.hide();
        onRestart();
      },
      onReturnToTitle: () => {
        this.hide();
        onReturnToTitle();
      },
    });
    this.build();
    this.hide();
  }

  build() {
    const { scene, content } = this;
    const { width, height } = scene.scale;
    const font = { fontFamily: 'monospace' };
    const panel = scene.add.rectangle(width / 2, height / 2, 600, 460, toColorNumber(UI_COLORS.panel), 0.96).setStrokeStyle(3, toColorNumber(UI_COLORS.accent));
    const heading = scene.add.text(width / 2, height / 2 - 200, content.heading, { ...font, fontSize: '32px', color: UI_COLORS.accent }).setOrigin(0.5);
    this.actionTexts = content.actions.map((action, index) =>
      scene.add.text(width / 2, height / 2 - 140 + index * 40, action.label, { ...font, fontSize: '22px', padding: { x: 10, y: 4 } }).setOrigin(0.5),
    );
    const helpHeading = scene.add.text(width / 2, height / 2 - 12, content.helpHeading, { ...font, fontSize: '18px', color: UI_COLORS.accent }).setOrigin(0.5);
    const help = scene.add
      .text(width / 2, height / 2 + 14, content.helpLines.join('\n'), { ...font, fontSize: '15px', color: UI_COLORS.text, align: 'left', lineSpacing: 3 })
      .setOrigin(0.5, 0);
    this.hint = scene.add.text(width / 2, height / 2 + 205, content.hint, { ...font, fontSize: '14px', color: UI_COLORS.muted }).setOrigin(0.5);
    const children = [panel, heading, ...this.actionTexts, helpHeading, help, this.hint];

    // Decorative barrel rolling along the panel's bottom edge.
    if (this.presentation.previewAnimationClass && scene.textures?.exists('barrel.original')) {
      this.preview = scene.add.image(width / 2 - 260, height / 2 + 180, 'barrel.original');
      children.push(this.preview);
    }
    this.container = scene.add.container(0, 0, children).setDepth(300);
  }

  get isOpen() {
    return this.state.isOpen;
  }

  open() {
    this.state.open();
    this.container.setVisible(true);
    this.startMotion();
    this.render();
  }

  hide() {
    this.state.close();
    this.container.setVisible(false);
    this.stopMotion();
  }

  update(input) {
    const before = this.state.selectedAction;
    const activated = this.state.handleInput(input);
    if (!activated && this.state.isOpen && before !== this.state.selectedAction) this.render();
    return activated;
  }

  render() {
    this.content.actions.forEach((action, index) => {
      const focused = action.id === this.state.selectedAction;
      this.actionTexts[index]
        .setText(focused ? `${FOCUS_MARKERS.before}${action.label}${FOCUS_MARKERS.after}` : action.label)
        .setStyle({
          color: focused ? UI_COLORS.focusText : UI_COLORS.text,
          backgroundColor: focused ? UI_COLORS.focusBackground : '#00000000',
        });
    });
    const label = this.content.actions.find((action) => action.id === this.state.selectedAction).label;
    announce(`${this.content.heading}. ${label}. ${this.content.hint}`);
  }

  startMotion() {
    if (!this.scene.tweens) return;
    if (this.preview) {
      this.preview.x = this.scene.scale.width / 2 - 260;
      this.previewTween = this.scene.tweens.add({ targets: this.preview, x: this.preview.x + 520, angle: 720, duration: 4000, repeat: -1 });
    }
    if (this.presentation.hintPulse) {
      this.hintTween = this.scene.tweens.add({ targets: this.hint, alpha: 0.85, duration: 700, yoyo: true, repeat: -1 });
    }
  }

  stopMotion() {
    this.previewTween?.stop();
    this.hintTween?.stop();
    this.previewTween = null;
    this.hintTween = null;
    this.hint?.setAlpha?.(1);
  }
}

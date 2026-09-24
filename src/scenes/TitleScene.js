import * as Phaser from 'phaser';
import uiText from '../config/uiText.en.json';
import { getControlCopy } from '../config/controlCopy.js';
import { getSoundMuted, setSoundMuted } from '../config/playerSettings.js';
import { FOCUS_MARKERS, UI_COLORS, toColorNumber } from '../config/uiTheme.js';
import { announce } from '../ui/announce.js';

// Component definitions: pure data so copy and focus rules are testable without a canvas.

export function TitleStartPage(text = uiText) {
  return {
    title: text.title.gameTitle,
    tagline: text.title.tagline,
    accountFree: getControlCopy().accountFree,
    hint: getControlCopy().menuHint,
    parody: text.title.parody,
    actions: [
      { id: 'start', label: text.title.start },
      { id: 'instructions', label: text.title.instructions },
      { id: 'privacy', label: text.title.privacy },
    ],
  };
}

export function InstructionsModal(text = uiText) {
  const i = text.instructions;
  return {
    id: 'instructions',
    heading: i.heading,
    lines: getControlCopy(undefined, text).instructionLines,
    closeHint: i.close,
  };
}

export function PrivacyModal(text = uiText) {
  const p = text.privacy;
  return {
    id: 'privacy',
    heading: p.heading,
    lines: [p.local, p.noAccounts, p.noAnalytics, p.noStorage],
    closeHint: p.close,
  };
}

const MODALS = { instructions: InstructionsModal, privacy: PrivacyModal };

// Keyboard/pointer menu state. Only one modal can be open, and start fires once.
export function createTitleMenuModel({ onStart, onChange = () => {} }) {
  const page = TitleStartPage();
  let selectedIndex = 0;
  let modal = null;
  let started = false;

  const changed = () => onChange(model);

  const model = {
    page,
    get selectedAction() {
      return page.actions[selectedIndex].id;
    },
    get focusKey() {
      return modal ? `${modal}-modal` : page.actions[selectedIndex].id;
    },
    get modal() {
      return modal;
    },
    get modalContent() {
      return modal ? MODALS[modal]() : null;
    },
    get started() {
      return started;
    },
    select(actionId) {
      const index = page.actions.findIndex((action) => action.id === actionId);
      if (index >= 0 && !modal && index !== selectedIndex) {
        selectedIndex = index;
        changed();
      }
    },
    selectNext() {
      if (modal) return;
      selectedIndex = (selectedIndex + 1) % page.actions.length;
      changed();
    },
    selectPrevious() {
      if (modal) return;
      selectedIndex = (selectedIndex - 1 + page.actions.length) % page.actions.length;
      changed();
    },
    requestStart() {
      if (started || modal) return false;
      started = true;
      onStart();
      return true;
    },
    openInstructions() {
      model.openModal('instructions');
    },
    openPrivacy() {
      model.openModal('privacy');
    },
    openModal(id) {
      if (modal) return;
      modal = id;
      model.select(id);
      changed();
    },
    // Focus returns to the trigger that opened the modal.
    closeModal() {
      if (!modal) return;
      const trigger = modal;
      modal = null;
      selectedIndex = page.actions.findIndex((action) => action.id === trigger);
      changed();
    },
    activate(actionId = model.selectedAction) {
      if (actionId === 'start') return model.requestStart();
      if (actionId === 'instructions') model.openInstructions();
      if (actionId === 'privacy') model.openPrivacy();
      return true;
    },
    handleKey(key) {
      if (modal) {
        if (key === 'Escape' || key === 'Enter' || key === ' ') model.closeModal();
        return;
      }
      if (key === 'ArrowDown' || key === 's' || key === 'S') model.selectNext();
      else if (key === 'ArrowUp' || key === 'w' || key === 'W') model.selectPrevious();
      else if (key === 'Enter' || key === ' ') model.activate();
    },
  };
  return model;
}

const COLORS = { text: UI_COLORS.text, accent: UI_COLORS.accent, focusBg: UI_COLORS.focusBackground, focusText: UI_COLORS.focusText, muted: UI_COLORS.muted };

// Focused items get marker glyphs as well as colors, so focus never relies on color alone.
export function formatMenuLabel(label, focused) {
  return focused ? `${FOCUS_MARKERS.before}${label}${FOCUS_MARKERS.after}` : label;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    this.model = createTitleMenuModel({
      onStart: () => this.scene.start('PlayScene'),
      onChange: () => this.render(),
    });
    const page = this.model.page;

    this.add.text(width / 2, 70, page.title, { fontFamily: 'monospace', fontSize: '56px', color: UI_COLORS.title, stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(width / 2, 125, page.tagline, { fontFamily: 'monospace', fontSize: '20px', color: COLORS.text }).setOrigin(0.5);
    if (this.textures.exists('boss.trumpInspired')) this.add.image(width - 150, 230, 'boss.trumpInspired').setScale(1.6);
    if (this.textures.exists('player.jumpman')) this.add.image(150, 250, 'player.jumpman').setScale(2);
    if (this.textures.exists('rescue.motzfeldt')) this.add.image(215, 243, 'rescue.motzfeldt').setScale(1.5);

    this.buttons = page.actions.map((action, index) =>
      this.add
        .text(width / 2, 240 + index * 56, action.label, { fontFamily: 'monospace', fontSize: '26px', padding: { x: 16, y: 6 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.model.select(action.id))
        .on('pointerdown', () => this.model.activate(action.id)),
    );
    this.add.text(width / 2, 430, page.accountFree, { fontFamily: 'monospace', fontSize: '16px', color: COLORS.text }).setOrigin(0.5);
    this.add.text(width / 2, 460, page.hint, { fontFamily: 'monospace', fontSize: '16px', color: COLORS.muted }).setOrigin(0.5);
    this.add.text(width / 2, height - 24, page.parody, { fontFamily: 'monospace', fontSize: '13px', color: COLORS.muted }).setOrigin(0.5);

    this.modalLayer = this.add.container(0, 0).setDepth(10);
    // Phaser can re-deliver queued DOM events when several keys land in one frame;
    // handle each native event once.
    const handled = new WeakSet();
    this.input.keyboard.on('keydown', (event) => {
      if (handled.has(event)) return;
      handled.add(event);
      if (event.key === 'm' || event.key === 'M') this.toggleMute();
      else this.model.handleKey(event.key);
    });
    this.sound.mute = getSoundMuted();
    this.game.canvas?.setAttribute?.('tabindex', '0');
    this.game.canvas?.focus?.();
    this.render();
  }

  toggleMute() {
    const muted = !getSoundMuted();
    setSoundMuted(muted);
    this.sound.mute = muted;
    announce(muted ? uiText.hud.soundOff : uiText.hud.soundOn);
  }

  render() {
    this.buttons.forEach((button, index) => {
      const focused = !this.model.modal && this.model.page.actions[index].id === this.model.selectedAction;
      button.setStyle({
        color: focused ? COLORS.focusText : COLORS.text,
        backgroundColor: focused ? COLORS.focusBg : '#00000000',
      });
      button.setText(formatMenuLabel(this.model.page.actions[index].label, focused));
    });
    this.renderModal();
    const content = this.model.modalContent;
    if (content) {
      announce(`${content.heading}. ${content.lines.join(' ')} ${content.closeHint}`);
    } else {
      const label = this.model.page.actions.find((action) => action.id === this.model.selectedAction).label;
      announce(`${label}. ${this.model.page.hint}`);
    }
  }

  renderModal() {
    this.modalLayer.removeAll(true);
    const content = this.model.modalContent;
    if (!content) return;
    const { width, height } = this.scale;
    const panel = this.add.rectangle(width / 2, height / 2, width - 80, height - 80, toColorNumber(UI_COLORS.panel), 0.97).setStrokeStyle(3, toColorNumber(UI_COLORS.accent));
    const heading = this.add.text(width / 2, 70, content.heading, { fontFamily: 'monospace', fontSize: '30px', color: COLORS.accent }).setOrigin(0.5, 0);
    const body = this.add.text(80, 125, content.lines.join('\n\n'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: COLORS.text,
      wordWrap: { width: width - 160 },
      lineSpacing: 2,
    });
    const close = this.add.text(width / 2, height - 70, content.closeHint, { fontFamily: 'monospace', fontSize: '16px', color: COLORS.accent }).setOrigin(0.5);
    this.modalLayer.add([panel, heading, body, close]);
  }
}

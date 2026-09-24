// Centered message panel for pause, life loss, level complete, game over and
// victory. Mirrors its text into the aria-live region.
import { UI_COLORS, toColorNumber } from '../config/uiTheme.js';
import { announce } from './announce.js';

export class PlayOverlay {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.panel = scene.add.rectangle(width / 2, height / 2, 660, 230, toColorNumber(UI_COLORS.panel), 0.95).setStrokeStyle(3, toColorNumber(UI_COLORS.accent));
    this.heading = scene.add.text(width / 2, height / 2 - 60, '', { fontFamily: 'monospace', fontSize: '34px', color: UI_COLORS.accent }).setOrigin(0.5);
    this.body = scene.add
      .text(width / 2, height / 2 + 20, '', { fontFamily: 'monospace', fontSize: '18px', color: UI_COLORS.text, align: 'center', lineSpacing: 8, wordWrap: { width: 620 } })
      .setOrigin(0.5);
    this.container = scene.add.container(0, 0, [this.panel, this.heading, this.body]).setDepth(200);
    this.hide();
  }

  show(heading, lines = []) {
    this.heading.setText(heading);
    this.body.setText(lines.join('\n'));
    this.container.setVisible(true);
    announce([heading, ...lines].join('. '));
  }

  hide() {
    this.container.setVisible(false);
  }

  get visible() {
    return this.container.visible;
  }
}

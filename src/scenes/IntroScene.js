import * as Phaser from 'phaser';
import uiText from '../config/uiText.en.json';
import { getControlCopy } from '../config/controlCopy.js';
import { getReducedMotionPreference } from '../config/playerSettings.js';
import { UI_COLORS, toColorNumber } from '../config/uiTheme.js';
import { LevelManager } from '../levels/LevelManager.js';
import { ANIMATION_SHEETS } from '../rendering/AnimationRegistry.js';
import { drawLevel } from '../rendering/LevelRenderer.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { getYAtX } from '../systems/SlopeResolver.js';
import { announce } from '../ui/announce.js';
import {
  buildIntroTimeline,
  girderTiltsAt,
  introPhaseAt,
  ladderAtTilt,
  ladderFloors,
  samplePath,
  tiltGirder,
} from './introTimeline.js';

// Opening cutscene before a new game: Donkey Trump carries Motzfeldt up flat
// girders, leaves her at the top and signs an executive order that slants every
// girder. Any confirm key, Space, Escape or a tap skips straight to play.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    this.level = new LevelManager().getLevel(0);
    this.timeline = buildIntroTimeline(this.level);
    this.links = ladderFloors(this.level);
    this.bossFloor = this.level.girders.length - 2;
    this.elapsed = 0;
    this.finished = false;
    this.nextThump = this.level.girders.length - 1;

    this.graphics = this.add.graphics().setDepth(1);
    const bossKey = this.textures.exists(ANIMATION_SHEETS.boss) ? ANIMATION_SHEETS.boss : this.level.boss.spriteKey;
    const rescueKey = this.textures.exists(ANIMATION_SHEETS.rescue) ? ANIMATION_SHEETS.rescue : this.level.rescue.spriteKey;
    this.boss = this.add.sprite(0, 0, bossKey).setOrigin(0.5, 1).setDepth(5);
    this.hostage = this.add.sprite(0, 0, rescueKey).setOrigin(0.5, 1).setDepth(6);
    this.buildOrder();
    this.buildCard();
    this.add
      .text(this.scale.width - 12, this.scale.height - 10, getControlCopy().introSkip, { fontFamily: 'monospace', fontSize: '14px', color: UI_COLORS.muted })
      .setOrigin(1, 1)
      .setDepth(50);

    this.sounds = new SoundSystem(this);
    this.sounds.play('intro');
    announce(uiText.intro.announce);

    // Phaser can re-deliver one DOM event per scene update; handle each key once.
    const handled = new WeakSet();
    this.input.keyboard.on('keydown', (event) => {
      if (handled.has(event)) return;
      handled.add(event);
      if (['Enter', ' ', 'Escape', 'p', 'P'].includes(event.key)) this.finish();
    });
    this.input.on('pointerdown', () => this.finish());

    // Reduced motion: skip the choreography and show the finished scene with the card.
    if (getReducedMotionPreference()) this.elapsed = this.timeline.tiltEnd;
    this.render();
  }

  buildOrder() {
    // Beside the boss, below the top edge and clear of Motzfeldt's platform.
    const x = Math.min(this.scale.width - 140, this.level.boss.x - 150);
    const y = Math.max(62, this.level.boss.y - 70);
    const paper = this.add.rectangle(0, 0, 250, 92, toColorNumber('#f5ecd2')).setStrokeStyle(3, toColorNumber('#8a6a2c'));
    const title = this.add.text(0, -26, uiText.intro.orderTitle, { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#2b1a10', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add
      .text(0, 8, uiText.intro.orderText, { fontFamily: 'monospace', fontSize: '12px', color: '#2b1a10', align: 'center', wordWrap: { width: 230 } })
      .setOrigin(0.5);
    this.signature = this.add.text(40, 32, '', { fontFamily: 'cursive', fontSize: '18px', color: '#1f2d8a' }).setOrigin(0.5);
    this.order = this.add.container(x, y, [paper, title, body, this.signature]).setDepth(20).setVisible(false);
  }

  buildCard() {
    const { width, height } = this.scale;
    const panel = this.add.rectangle(0, 0, 520, 150, toColorNumber(UI_COLORS.panel), 0.95).setStrokeStyle(3, toColorNumber(UI_COLORS.accent));
    const heading = this.add
      .text(0, -30, `${uiText.hud.level} 1: ${this.level.name}`, { fontFamily: 'monospace', fontSize: '28px', color: UI_COLORS.accent })
      .setOrigin(0.5);
    const goal = this.add.text(0, 24, uiText.intro.cardGoal, { fontFamily: 'monospace', fontSize: '20px', color: UI_COLORS.text }).setOrigin(0.5);
    this.card = this.add.container(width / 2, height / 2, [panel, heading, goal]).setDepth(30).setVisible(false);
  }

  update(_time, delta) {
    if (this.finished) return;
    this.elapsed += delta;
    this.render();
    if (introPhaseAt(this.timeline, this.elapsed) === 'done') this.finish();
  }

  render() {
    const { level, timeline, elapsed } = this;
    const phase = introPhaseAt(timeline, elapsed);
    const tilts = girderTiltsAt(timeline, level.girders.length, elapsed);
    const girders = level.girders.map((girder, index) => tiltGirder(girder, tilts[index]));
    const ladders = this.links.map((link) => ladderAtTilt(link, girders));
    drawLevel(this.graphics, { girders, ladders });

    // Each girder lands its tilt with a thump and a small shake.
    const tilting = tilts.findIndex((tilt) => tilt > 0 && tilt < 1);
    if (tilting !== -1 && tilting <= this.nextThump) {
      this.nextThump = tilting - 1;
      this.sounds.play('throw');
      if (!getReducedMotionPreference()) this.cameras.main.shake(120, 0.004);
    }

    const pose = samplePath(timeline.path, elapsed);
    const bossX = phase === 'path' ? pose.x : level.boss.x;
    const bossY = phase === 'path' ? pose.y : getYAtX(level.boss.x, girders[this.bossFloor]);
    this.boss.setPosition(bossX, bossY).setFlipX(phase === 'path' && pose.facingLeft);
    this.setBossFrame(phase, pose);

    const rescueX = level.rescue.x + level.rescue.width / 2;
    if (phase === 'path' && pose.carrying) this.hostage.setPosition(bossX - 22, bossY - 34);
    else this.hostage.setPosition(rescueX, getYAtX(rescueX, girders[girders.length - 1]));
    if (this.hostage.texture.key === ANIMATION_SHEETS.rescue) this.hostage.setFrame(Math.floor(elapsed / 300) % 2);

    this.order.setVisible(phase === 'sign' || phase === 'tilt');
    if (phase === 'sign') {
      const progress = (elapsed - timeline.pathEnd) / timeline.timing.signMs;
      this.signature.setText('D. T.'.slice(0, Math.ceil(progress * 5)));
    }
    this.card.setVisible(phase === 'card');
  }

  setBossFrame(phase, pose) {
    if (this.boss.texture.key !== ANIMATION_SHEETS.boss) return;
    if (phase === 'sign' || phase === 'tilt') this.boss.setFrame(2);
    else if (phase === 'path' && pose.action !== 'drop') this.boss.setFrame(Math.floor(this.elapsed / 180) % 2);
    else this.boss.setFrame(0);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.sounds.stop('intro');
    this.scene.start('PlayScene');
  }
}

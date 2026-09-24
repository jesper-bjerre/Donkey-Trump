import * as Phaser from 'phaser';
import uiText from '../config/uiText.en.json';
import { getControlCopy } from '../config/controlCopy.js';
import { MAX_FALL_SPEED } from '../config/physics.js';
import { getReducedMotionPreference } from '../config/playerSettings.js';
import { UI_COLORS } from '../config/uiTheme.js';
import { ANALYTICS_EVENTS, toScoreBand, trackAnalyticsEvent } from '../analytics/AnalyticsAdapter.js';
import { BossController } from '../controllers/BossController.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { InputMapper } from '../input/InputMapper.js';
import { LevelManager } from '../levels/LevelManager.js';
import { ANIMATION_SHEETS, registerCoreAnimations, selectPlayerAnimation } from '../rendering/AnimationRegistry.js';
import { drawLevel } from '../rendering/LevelRenderer.js';
import { GAME_STATES, createGameStateMachine } from '../state/GameStateMachine.js';
import { SCORE_RULES } from '../state/ScoreLivesRules.js';
import { BarrelSystem } from '../systems/BarrelSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { FeedbackSystem } from '../systems/FeedbackSystem.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { HudSystem } from '../systems/HudSystem.js';
import { LadderSystem } from '../systems/LadderSystem.js';
import { ObjectiveSystem } from '../systems/ObjectiveSystem.js';
import { resolveBodyToSlope } from '../systems/SlopeResolver.js';
import { getBodyBounds, getBodyCenterX, placeBodyBottom } from '../systems/bodyPlacement.js';
import { PauseHelpOverlay } from '../ui/PauseHelpOverlay.js';
import { announce } from '../ui/announce.js';
import { PlayOverlay } from '../ui/PlayOverlay.js';

export const PLAY_TIMINGS = {
  lifeLossMs: 1200,
  retryMs: 600,
  levelCompleteMs: 1800,
};

// Composition root for one run of the game. Gameplay rules live in the systems;
// this scene wires them together and sequences level transitions.
export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  create() {
    try {
      this.levelManager = new LevelManager();
    } catch {
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, uiText.errors.invalidLevelData, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
        .setOrigin(0.5);
      return;
    }

    this.reducedMotion = getReducedMotionPreference();
    this.animated = this.textures.exists(ANIMATION_SHEETS.player);
    if (this.animated) registerCoreAnimations(this);

    this.stateMachine = createGameStateMachine({ totalLevels: this.levelManager.count });
    this.inputMapper = new InputMapper(this.input.keyboard);
    this.levelGraphics = this.add.graphics().setDepth(1);
    this.hud = new HudSystem(this);
    this.overlay = new PlayOverlay(this);
    this.pauseOverlay = new PauseHelpOverlay(
      this,
      {
        onResume: () => this.resumeGame(),
        onRestart: () => this.restartFromPause(),
        onReturnToTitle: () => this.returnToTitle(),
      },
      { reducedMotion: this.reducedMotion },
    );
    this.feedback = new FeedbackSystem(this, { reducedMotion: this.reducedMotion });
    this.sounds = new SoundSystem(this);
    // Phaser keeps sounds alive across scene changes, so stop the loop on exit.
    this.events.once('shutdown', () => this.sounds.stopMusic());
    this.hud.setSoundIndicator(this.sounds.muted ? uiText.hud.soundOff : '');
    this.stateMachine.subscribe((snapshot) => this.hud.updateFromState(snapshot));

    this.player = this.physics.add.sprite(0, 0, this.animated ? ANIMATION_SHEETS.player : 'player.jumpman').setDepth(10);
    // 36x48 frames: a slimmer 22x45 body keeps hits fair, with the feet on the frame bottom.
    this.player.body.setSize(22, 45).setOffset(7, 3);
    this.player.body.setMaxVelocity(400, MAX_FALL_SPEED);
    this.player.setCollideWorldBounds(true);
    this.playerController = new PlayerController(this.player);
    this.ladderSystem = new LadderSystem({ player: this.player, controller: this.playerController, ladders: [] });
    this.collisionSystem = new CollisionSystem({ stateMachine: this.stateMachine });
    this.objectiveSystem = new ObjectiveSystem({ rescue: null, stateMachine: this.stateMachine });
    this.barrelGroup = this.physics.add.group();

    this.startSession();
  }

  startSession() {
    this.inputTracked = false;
    trackAnalyticsEvent(ANALYTICS_EVENTS.SESSION_START, { inputType: 'keyboard' });
    this.stateMachine.startGame();
    this.loadLevel(0);
  }

  playAnimation(sprite, key) {
    if (this.animated && sprite?.anims) sprite.play(key, true);
  }

  // Seams overridden by tests.
  schedule(delayMs, callback) {
    return this.time.delayedCall(delayMs, callback);
  }

  pauseWorld() {
    this.physics.pause();
    this.sounds?.pauseMusic();
  }

  resumeWorld() {
    this.physics.resume();
    this.sounds?.resumeMusic();
  }

  // A retry reloads the same level quietly; a new level gets its jingle and music.
  loadLevel(index, { retry = false } = {}) {
    this.level = this.levelManager.getLevel(index);
    this.buildLevel(this.level);
    this.ladderSystem.setLadders(this.level.ladders);
    this.objectiveSystem.reset(this.level.rescue);
    this.collisionSystem.reset();
    this.resetPlayer();
    const snapshot = this.stateMachine.getSnapshot();
    this.hud?.updateFromState(snapshot);
    if (!retry) {
      this.sounds?.startMusic(index);
      this.sounds?.play('levelStart');
    }
    trackAnalyticsEvent(ANALYTICS_EVENTS.LEVEL_START, {
      level: index + 1,
      lives: snapshot.lives,
      scoreBand: toScoreBand(snapshot.score),
      inputType: 'keyboard',
    });
    return this.level;
  }

  buildLevel(level) {
    drawLevel(this.levelGraphics, level);
    this.boss?.destroy();
    this.boss = new BossController(level, { scene: this });

    this.rescueSprite?.destroy();
    this.helpText?.destroy();
    const { rescue } = level;
    const rescueKey = this.animated ? ANIMATION_SHEETS.rescue : rescue.spriteKey;
    this.rescueSprite = this.add.sprite(rescue.x + rescue.width / 2, rescue.y + rescue.height, rescueKey).setOrigin(0.5, 1).setDepth(5);
    this.playAnimation(this.rescueSprite, 'rescue.idle');
    this.helpText = this.add
      .text(rescue.x + rescue.width + 6, rescue.y - 4, 'HELP!', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: UI_COLORS.alertText,
        backgroundColor: UI_COLORS.alertBackground,
        padding: { x: 4, y: 2 },
      })
      .setDepth(5);

    this.barrelSystem?.reset();
    this.barrelGroup.clear(true, true);
    this.barrelSystem = new BarrelSystem({
      level,
      getSpawnPoint: () => this.boss.getBarrelSpawnPoint(),
      createBarrelSprite: () => this.createBarrelSprite(level.barrels.spriteKey),
      getTarget: () => ({ x: getBodyCenterX(this.player.body), feet: this.player.body.y + this.player.body.height }),
      onSpawn: () => {
        this.boss.playThrow();
        this.sounds?.play('throw');
      },
    });
  }

  createBarrelSprite(key) {
    const sprite = this.barrelGroup.create(0, 0, this.animated ? ANIMATION_SHEETS.barrel : key).setDepth(8);
    sprite.body.setCircle(9);
    sprite.body.setMaxVelocity(400, MAX_FALL_SPEED);
    this.playAnimation(sprite, 'barrel.roll');
    return sprite;
  }

  resetPlayer() {
    const spawn = this.level.playerSpawn;
    this.ladderSystem.activeLadder = null;
    this.playerController.reset();
    this.player.body.setAllowGravity(true);
    this.player.body.reset(spawn.x, spawn.y - this.player.displayHeight / 2);
    this.player.setFlipX(false).clearTint().setAlpha(1);
    this.playAnimation(this.player, 'player.idle');
  }

  update(time, delta) {
    if (!this.stateMachine) return;
    const input = this.inputMapper.read();
    if (input.mutePressed) this.toggleMute();
    this.trackFirstInput(input);
    const { currentState } = this.stateMachine.getSnapshot();

    if (currentState === GAME_STATES.PLAY) {
      if (input.pausePressed || input.escapePressed) this.pauseGame();
      else this.stepPlay(input, time, delta);
    } else if (currentState === GAME_STATES.PAUSE) {
      this.pauseOverlay.update(input);
    } else if (currentState === GAME_STATES.GAME_OVER) {
      if (input.confirmPressed) this.playAgain();
      else if (input.escapePressed || input.pausePressed) this.returnToTitle();
    } else if (currentState === GAME_STATES.VICTORY) {
      if (input.confirmPressed || input.escapePressed) this.returnToTitle();
    }
  }

  trackFirstInput(input) {
    if (this.inputTracked) return;
    if (input.left || input.right || input.up || input.down || input.jumpPressed) {
      this.inputTracked = true;
      trackAnalyticsEvent(ANALYTICS_EVENTS.INPUT_USED, { inputType: 'keyboard', level: this.stateMachine.getSnapshot().levelIndex + 1 });
    }
  }

  // Frame order: ladders decide climbing, then movement, then slope snapping
  // (skipped while climbing so the player can pass through girders on a ladder).
  stepMechanics(input, now) {
    this.ladderSystem.update(input);
    this.playerController.update(input, now);
    if (!this.ladderSystem.isClimbing) this.applySlope(now);
  }

  applySlope(now) {
    const body = this.player.body;
    const contact = resolveBodyToSlope(
      { x: getBodyCenterX(body), bottom: body.y + body.height, velocityY: body.velocity.y },
      this.level.girders,
    );
    if (contact.grounded) {
      placeBodyBottom(this.player, contact.bottom);
      if (body.velocity.y > 0) body.setVelocityY(0);
    }
    this.playerController.setGrounded(contact.grounded, now);
    return contact;
  }

  updatePlayerAnimation() {
    const key = selectPlayerAnimation({
      state: this.playerController.state,
      grounded: this.playerController.isGrounded(),
      climbing: this.ladderSystem.isClimbing,
      velocityX: this.player.body.velocity.x,
    });
    this.playAnimation(this.player, key);
    // Freeze the climb cycle while the player hangs still on a ladder.
    if (this.animated && key === 'player.climb') {
      if (this.player.body.velocity.y === 0) this.player.anims.pause();
      else this.player.anims.resume();
    }
  }

  stepPlay(input, time, delta) {
    const wasJumping = this.playerController.state === 'jumping';
    this.stepMechanics(input, time);
    this.playMovementSounds(wasJumping, time);
    this.updatePlayerAnimation();
    this.barrelSystem.update(delta);

    const playerBounds = getBodyBounds(this.player.body);
    const barrels = this.barrelSystem.getActiveBarrels();
    const airborne = !this.playerController.isGrounded() && !this.ladderSystem.isClimbing;
    for (const barrel of this.collisionSystem.detectBarrelJumps(playerBounds, barrels, airborne)) {
      this.stateMachine.addScore(SCORE_RULES.barrelJumpPoints);
      this.sounds?.play('score');
      this.floatText(barrel.sprite.x, barrel.sprite.y - 20, `+${SCORE_RULES.barrelJumpPoints}`);
    }

    const hit = this.collisionSystem.update(playerBounds, barrels, time);
    if (hit) {
      this.onPlayerHit(hit);
      return;
    }
    const rescued = this.objectiveSystem.update(playerBounds);
    if (rescued && !rescued.rejected) this.onRescue(rescued);
  }

  onPlayerHit(snapshot) {
    this.pauseWorld();
    this.playerController.setHit();
    this.player.setTint?.(0xff5555);
    this.playAnimation(this.player, 'player.hit');
    this.feedback?.play('hit', { player: this.player });
    trackAnalyticsEvent(ANALYTICS_EVENTS.PLAYER_DEATH, { level: snapshot.levelIndex + 1, lives: snapshot.lives, cause: 'barrel' });

    if (snapshot.currentState === GAME_STATES.GAME_OVER) {
      this.sounds?.stopMusic();
      this.sounds?.play('gameOver');
      this.overlay.show(uiText.gameOver.heading, [
        `${uiText.gameOver.finalScore}: ${snapshot.score}`,
        `${uiText.gameOver.levelReached}: ${snapshot.levelIndex + 1}`,
        getControlCopy().gameOverRetry,
        getControlCopy().gameOverTitle,
      ]);
      return;
    }
    this.overlay.show(uiText.retry.lifeLost, [`${uiText.hud.lives}: ${snapshot.lives}`]);
    this.schedule(PLAY_TIMINGS.lifeLossMs, () => {
      this.stateMachine.retryLevel();
      this.overlay.show(uiText.retry.retrying);
      this.schedule(PLAY_TIMINGS.retryMs, () => {
        this.loadLevel(this.stateMachine.getSnapshot().levelIndex, { retry: true });
        this.stateMachine.startLevel();
        this.overlay.hide();
        this.resumeWorld();
        this.feedback?.play('retry', { player: this.player });
      });
    });
  }

  onRescue(snapshot) {
    this.pauseWorld();
    this.helpText?.setText('SAVED!');
    this.playAnimation(this.rescueSprite, 'rescue.complete');
    this.feedback?.play('rescue', { rescue: this.rescueSprite });

    if (snapshot.currentState === GAME_STATES.VICTORY) {
      this.sounds?.stopMusic();
      this.sounds?.play('victory');
      trackAnalyticsEvent(ANALYTICS_EVENTS.VICTORY_COMPLETE, { level: snapshot.levelIndex + 1, lives: snapshot.lives, scoreBand: toScoreBand(snapshot.score) });
      this.overlay.show(uiText.victory.heading, [uiText.victory.message, `${uiText.victory.finalScore}: ${snapshot.score}`, getControlCopy().victoryReplay]);
      return;
    }
    trackAnalyticsEvent(ANALYTICS_EVENTS.LEVEL_COMPLETE, { level: snapshot.levelIndex + 1, lives: snapshot.lives, scoreBand: toScoreBand(snapshot.score) });
    this.overlay.show(uiText.levelComplete.heading, [`+${SCORE_RULES.levelCompletePoints}`, uiText.levelComplete.next]);
    this.schedule(PLAY_TIMINGS.levelCompleteMs, () => {
      const next = this.stateMachine.startNextLevel();
      this.loadLevel(next.levelIndex);
      this.overlay.hide();
      this.resumeWorld();
    });
  }

  // The pause/help overlay opens only from active play, never over game over or victory.
  pauseGame() {
    const snapshot = this.stateMachine.pauseGame();
    if (snapshot.rejected) return snapshot;
    this.pauseWorld();
    this.player.anims?.pause();
    this.pauseOverlay.open();
    return snapshot;
  }

  resumeGame() {
    const snapshot = this.stateMachine.resumeGame();
    if (snapshot.rejected) return snapshot;
    this.pauseOverlay.hide();
    this.player.anims?.resume();
    this.resumeWorld();
    return snapshot;
  }

  restartFromPause() {
    this.pauseOverlay.hide();
    this.playAgain();
  }

  playAgain() {
    this.stateMachine.restartGame();
    this.stateMachine.startGame();
    this.loadLevel(0);
    this.overlay.hide();
    this.resumeWorld();
  }

  playMovementSounds(wasJumping, now) {
    if (!this.sounds) return;
    if (!wasJumping && this.playerController.state === 'jumping') this.sounds.play('jump');
    const body = this.player.body;
    const walking = this.playerController.isGrounded() && body.velocity.x !== 0;
    const climbing = this.ladderSystem.isClimbing && body.velocity.y !== 0;
    if (walking || climbing) this.sounds.playStep(now);
  }

  toggleMute() {
    if (!this.sounds) return;
    const muted = this.sounds.toggleMute();
    const label = muted ? uiText.hud.soundOff : uiText.hud.soundOn;
    this.hud?.setSoundIndicator?.(muted ? uiText.hud.soundOff : '');
    announce(label);
  }

  returnToTitle() {
    this.stateMachine.restartGame();
    this.scene.start('TitleScene');
  }

  floatText(x, y, text) {
    if (!this.add) return;
    const label = this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '16px', color: UI_COLORS.accent }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: label, y: this.reducedMotion ? y : y - 30, alpha: 0, duration: 800, onComplete: () => label.destroy() });
  }
}

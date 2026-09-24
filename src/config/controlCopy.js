// Player-facing control prompts for the active input style (keyboard or touch).
import uiText from './uiText.en.json';
import { isTouchMode } from '../input/deviceDetection.js';

export function getControlCopy(touch = isTouchMode(), text = uiText) {
  const i = text.instructions;
  if (touch) {
    return {
      accountFree: text.touch.accountFree,
      introSkip: text.intro.touchSkip,
      menuHint: text.touch.menuHint,
      instructionLines: [i.goal, ...text.touch.instructions, i.ladderNote],
      pauseHelpLines: text.touch.instructions,
      pauseHint: text.touch.pauseHint,
      gameOverRetry: text.touch.gameOverRetry,
      gameOverTitle: text.touch.gameOverTitle,
      victoryReplay: text.touch.victoryReplay,
    };
  }
  return {
    accountFree: text.title.accountFree,
    introSkip: text.intro.skip,
    menuHint: text.title.menuHint,
    instructionLines: [i.goal, i.left, i.right, i.jump, i.up, i.down, i.pause, i.resume, i.retry, i.mute, i.ladderNote],
    pauseHelpLines: [i.left, i.right, i.jump, i.up, i.down, i.pause, i.resume, i.retry, i.mute],
    pauseHint: text.pause.hint,
    gameOverRetry: text.gameOver.retry,
    gameOverTitle: text.gameOver.title,
    victoryReplay: text.victory.replay,
  };
}

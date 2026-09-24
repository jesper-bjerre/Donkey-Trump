import './styles.css';
import { bootstrapGame } from './GameBootstrap.js';
import { setTouchMode, shouldUseTouchControls } from './input/deviceDetection.js';
import { mountTouchControls } from './ui/TouchControls.js';

function startGame() {
  // Touch-only devices get the handheld layout with on-screen controls.
  const touch = shouldUseTouchControls();
  setTouchMode(touch);
  // Wrap #game before Phaser boots so the canvas is sized for the handheld layout.
  const controls = touch ? mountTouchControls() : null;
  const game = bootstrapGame();
  controls?.attachGame(game);
  // Dev-only handle for local debugging and scripted playtests; stripped from production builds.
  if (import.meta.env.DEV) window.__DONKEY_TRUMP__ = game;
}

// Release QA tools exist only in dev builds: this whole branch, including the
// route table and page modules, is removed from production bundles.
if (import.meta.env.DEV) {
  import('./routes/devRoutes.js').then(({ findDevRoute }) => {
    const route = findDevRoute(window.location.hash, { isDev: import.meta.env.DEV });
    if (!route) return startGame();
    return route.load().then((page) => page.renderAccessibilityReleaseQASettingsPage(document.querySelector('main')));
  });
} else {
  startGame();
}

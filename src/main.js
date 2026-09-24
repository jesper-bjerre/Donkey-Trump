import './styles.css';
import { bootstrapGame } from './GameBootstrap.js';

function startGame() {
  const game = bootstrapGame();
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

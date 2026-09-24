# Donkey-Trump

Donkey Trump is a browser-based retro arcade platformer and political satire. You play Jumpman Løkke, climbing sloped girders and ladders to rescue Motzfeldt while a Trump-inspired boss rolls barrels at you. It is a static Phaser 3 + Vite app with no backend, no accounts and no analytics transport.

Product and architecture docs live in [`docs/`](docs/).

## Commands

```sh
npm ci                   # install from the lockfile (Node 22+)
npm run dev              # local dev server
npm run build            # static build in dist/
npm run preview          # serve dist/
npm run lint             # ESLint
npm test                 # all Vitest suites (non-watch)
npm run test:integration # tests/integration only
npm run bundle:report    # dist sizes vs the 5 MB gzip startup budget (after build)
npm run licenses         # production dependency license allow-list
npm run smoke -- <url>   # post-deploy smoke test against a deployed site
```

Development builds also serve a release QA page at `http://localhost:5173/#/dev/release-qa`. It covers contrast results, a reduced-motion override, keyboard checks, the asset originality register and the analytics-disabled checks. Production builds contain no route to it.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move, and climb when on a ladder |
| Space | Jump (it can't reach the next floor, so use the ladders) |
| P or Escape | Pause menu (resume, restart, return to title, controls) |
| Enter | Select, and play again after game over |

On phones and tablets without a keyboard the game switches to a handheld layout, played in landscape: a D-pad on the left, and JUMP, START, PAUSE, SOUND and FULL SCREEN buttons on the right. Holding the device in portrait pauses the game and asks the player to turn it. On Android and iPad the first tap goes fullscreen and locks landscape. iPhone Safari doesn't allow fullscreen for web pages, so on iPhone the game shows how to use Add to Home Screen; launched from there it runs fullscreen as a web app (`public/manifest.webmanifest`). Add `?touch=1` to the URL to try the layout on a desktop.

## Layout

| Path | Responsibility |
|---|---|
| `src/GameBootstrap.js` | Phaser config and scene registration |
| `src/scenes/` | `BootScene` (capability checks, manifest preload, recovery), `TitleScene` (menu and modals), `PlayScene` (composition root) |
| `src/systems/SlopeResolver.js` | Line-segment slope math. Arcade Physics has no slopes, so bodies are snapped onto girders each frame |
| `src/systems/bodyPlacement.js` | Moves sprite, body and `prevFrame` together so corrections made in `Scene.update` survive Arcade's sync |
| `src/systems/LadderSystem.js` | Overlap-gated climbing with gravity suppression |
| `src/systems/BarrelSystem.js`, `CollisionSystem.js`, `ObjectiveSystem.js`, `HudSystem.js` | Barrels, hits, rescue and HUD |
| `src/state/` | `GameStateMachine` (flow) and `ScoreLivesRules` (pure score and lives math) |
| `src/levels/` | Level JSON, `level.schema.json`, and `LevelManager`, which validates levels with a CSP-safe schema interpreter |
| `src/assets/` | Original SVG sprites, `assetManifest.json` (runtime keys) and `assetRegister.json` (originality governance) |
| `src/analytics/AnalyticsAdapter.js` | Allow-listed no-op event sink. Analytics is disabled for the MVP |
| `src/config/uiText.en.json`, `uiTheme.js` | All English UI copy, and the color palette with its WCAG contrast pairs |
| `src/config/playerSettings.js` | Reduced-motion preference: follows `prefers-reduced-motion`, with an in-memory override |
| `src/rendering/AnimationRegistry.js`, `src/systems/FeedbackSystem.js` | Sprite animations, and hit/retry/rescue sound and effects |
| `src/ui/PauseHelpOverlay.js` | Pause menu with keyboard help |
| `src/routes/devRoutes.js`, `src/pages/` | Dev-only release QA page |
| `scripts/` | Sprite sheet and sound generators, bundle report, license check, smoke test |

## Default tuning

The defaults resolve open PRD questions and can be changed in config:
- 3 lives.
- Scoring: +1000 per rescue, +100 per barrel jumped, and +500 per remaining life on the final rescue.
- A hit retries the current level and keeps the score.
- Game over restarts from level 1.

Rules live in `src/state/ScoreLivesRules.js`, movement in `src/controllers/PlayerController.js`, and per-level difficulty in `src/levels/level*.json`.

## Delivery

`.github/workflows/static-web-app.yml` runs on every trigger:
- **Validation:** lint, unit and integration tests.
- **Security scan:** dependency review, `npm audit`, gitleaks and the license check.
- **Build:** the static build, bundle and performance budget checks, and upload of a `static-site-<sha>` artifact.

It then deploys to Azure Static Web Apps:
- Pull requests get a preview environment.
- **Every push to `main` deploys straight to production** (no manual approval), followed by a fail-closed smoke test.
- The `staging` environment deploys only on a manual run (**Run workflow**, target `staging`).

Every action is pinned to a full commit SHA and the gitleaks image to a digest; Dependabot proposes updates weekly.

The repo needs the secret `AZURE_STATIC_WEB_APPS_API_TOKEN` and the variables `PRODUCTION_URL` and `STAGING_URL`. The `production` environment only accepts deployments from `main`. Rollback steps are in [docs/production-smoke-and-rollback.md](docs/production-smoke-and-rollback.md). Security headers, the CSP and cache rules live in `staticwebapp.config.json`, which the build copies into `dist`.

## Asset originality

Every sprite is an original programmer-drawn SVG, and every sound is synthesized by `scripts/generate-feedback-audio.mjs`. All are marked `needs-review` in `src/assets/assetRegister.json`. The animation sheets are generated by `scripts/generate-sprite-sheets.mjs`. No Nintendo or Donkey Kong material may be added; `tests/assets/` enforces the register rules and rejects prohibited file names.

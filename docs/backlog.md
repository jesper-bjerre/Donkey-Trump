---

**Changelog** (2026-09-23T10:02:31.976Z): Tasks: 80 change(s).

- Epic/feature structure changed
- Removed: WO-002
- Removed: WO-003
- Removed: WO-005
- Removed: WO-009
- Removed: WO-006
- Removed: WO-010
- Removed: WO-011
- Removed: WO-012
- Removed: WO-014
- Removed: WO-015
- Removed: WO-008
- Removed: WO-017
- Removed: WO-021
- Removed: WO-025
- Removed: WO-018
- Removed: WO-019
- Removed: WO-022
- Removed: WO-026
- Removed: WO-027
- Removed: WO-007
- Removed: WO-013
- Removed: WO-028
- Removed: WO-031
- Removed: WO-033
- Removed: WO-034
- Removed: WO-029
- Removed: WO-032
- Removed: WO-036
- Removed: WO-037
- Removed: WO-038
- Removed: WO-016
- Removed: WO-020
- Removed: WO-023
- Removed: WO-024
- Removed: WO-039
- Removed: WO-030
- Removed: WO-035
- Removed: WO-040
- Removed: WO-041
- Removed: WO-042
- Removed: WO-043
- Added: WO-044
- Added: WO-046
- Added: WO-047
- Added: WO-048
- Added: WO-052
- Added: WO-079
- Added: WO-053
- Added: WO-055
- Added: WO-057
- Added: WO-060
- Added: WO-061
- Added: WO-062
- Added: WO-050
- Added: WO-054
- Added: WO-059
- Added: WO-064
- Added: WO-065
- Added: WO-066
- Added: WO-067
- Added: WO-068
- Added: WO-051
- Added: WO-063
- Added: WO-069
- Added: WO-072
- Added: WO-074
- Added: WO-045
- Added: WO-049
- Added: WO-056
- Added: WO-070
- Added: WO-071
- Added: WO-058
- Added: WO-073
- Added: WO-075
- Added: WO-076
- Added: WO-077
- Added: WO-078
- Revised: WO-001
- Revised: WO-004

## Static Phaser Client Foundation and Delivery Controls

### [P0] Scaffold Phaser Vite Client

Create the initial Vite-powered Phaser 3 browser client so players can open Donkey Trump in a desktop browser without installation, accounts, or backend onboarding. The change belongs in the client bootstrap module at src/GameBootstrap.js, the browser entrypoint at src/main.js, the shell at index.html, and the npm manifest at package.json. The current repository is effectively a README-only baseline, so the target state is a runnable static app that can initialize Phaser and emit a deployable dist artifact. Stakeholders need this foundation because every later gameplay scene, level fixture, UI catalog, test command, and delivery workflow depends on a deterministic build surface. When complete, a developer can run npm ci, start the Vite development server, and build a static artifact that mounts a Phaser canvas into the page. The visible browser behavior should be a minimal canvas-backed launch shell with no login prompt, no account creation, no backend call, and no analytics network dependency. This story does not include BootScene, TitleScene, PlayScene registration beyond a placeholder-safe bootstrap seam, nor does it include player movement, ladders, barrels, sloped platform mechanics, scoring, final artwork, deployment automation, or Azure configuration. It depends only on the ability to commit a new npm-based static frontend project into the repository. The bootstrap should stay small enough that later scene registration and gameplay modules can compose through src/GameBootstrap.js without turning the entrypoint into a god file. Operationally, this provides the reproducible source-of-truth artifact path that later CI/CD controls can validate with clean checkouts.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:static-phaser-client-foundation, type:foundation, runtime:phaser, tooling:vite, complexity:medium |

**Acceptance Criteria**
- Running npm ci followed by npm run build from the repository root exits with code 0 and creates dist/index.html from index.html through the Vite build configured in package.json.
- package.json contains a dependencies entry for phaser, a devDependencies entry for vite, and scripts named dev, build, and preview that invoke Vite commands.
- src/GameBootstrap.js exports createGameConfig, and file inspection shows the returned object includes type set to Phaser.AUTO, parent set to game, numeric width and height values, and physics.default set to arcade.
- src/GameBootstrap.js exports bootstrapGame, and file inspection shows bootstrapGame throws an Error message containing game when document.getElementById('game') returns no element.
- src/main.js imports bootstrapGame from src/GameBootstrap.js and calls it after index.html provides an element with id game.
- Unit tests: N/A — the Vitest command and src/GameBootstrap.test.js are introduced by the separate local quality command capability.
- System integration tests: N/A — this story creates a static browser shell with no backend API, database, or external service boundary to exercise.
- Mock data/fixtures: N/A — gameplay fixtures and declarative level data are introduced by the level contract capability.

### [P0] Centralize English Launch Copy

Create the English UI text catalog so every launch-facing message for Donkey Trump has a single source of truth and stakeholders can verify the MVP is English-only. The change belongs in the configuration module at src/config/uiText.en.json. The repository currently has no committed UI copy catalog, so title text, controls, instructions, HUD labels, loading recovery, unsupported browser messaging, retry copy, privacy text, and victory text would otherwise be scattered through future scenes. Centralized copy reduces release risk because product review, accessibility review, and future localization planning can inspect one static JSON document. When complete, a developer can parse the catalog and see all required launch states represented by stable keys with non-empty English strings. The observable behavior for later scenes is that they can import or load the catalog instead of hardcoding player-facing text inline. This story does not implement TitleScene rendering, HUD rendering, pause overlays, modal interaction, localization switching, or non-English translations. It depends on the browser client structure being available under src so future Vite modules can consume the JSON file. The copy should reinforce MVP constraints such as no account requirement, keyboard-first desktop play, analytics disabled at launch, original satirical assets, and no complex onboarding. The file should be easy for future coding agents to traverse without guessing which text belongs to loading, recovery, gameplay, or completion states.

| Field | Value |
|---|---|
| Story Points | 2 |
| Hours | 20h |
| Priority | P0 |
| Labels | epic:static-phaser-client-foundation, type:configuration, scope:english-only, accessibility:copy, complexity:low |

**Acceptance Criteria**
- src/config/uiText.en.json is valid JSON as verified by running node -e "JSON.parse(require('fs').readFileSync('src/config/uiText.en.json','utf8'));" from the repository root.
- src/config/uiText.en.json contains top-level keys title, instructions, privacy, hud, pause, retry, gameOver, victory, loading, and errors, and each key contains at least one non-empty string value.
- The errors object in src/config/uiText.en.json includes non-empty English strings for unsupportedBrowser, assetLoadFailure, and invalidLevelData.
- The hud object in src/config/uiText.en.json includes labels for score, lives, level, and objective.
- File inspection of src/config/uiText.en.json finds no locale selector, no Danish copy object, and no additional locale file is created under src/config.
- Unit tests: N/A — this story creates a static JSON catalog and can be verified by JSON parsing until the test runner capability is added.
- System integration tests: N/A — the catalog has no service, API, database, or deployment boundary to exercise.
- Mock data/fixtures: N/A — this catalog is product copy, while gameplay mock level fixtures are committed with the level contract capability.

### [P0] Define Declarative Level Contract

Create the declarative level schema and committed fixtures so future Donkey Trump gameplay systems can load platforms, ladders, barrels, boss placement, rescue zones, and difficulty metadata without hardcoding level layouts in a Phaser scene. The change belongs in the level configuration module at src/levels/level.schema.json and the fixture file at src/levels/level.fixtures.json. The current client scaffold has no level contract, so there is no stable way for a future LevelManager, SlopeResolver, LadderSystem, BarrelSystem, or PlayScene to agree on configuration shape. Stakeholders need this because the MVP must ship as a small complete game with 3–4 levels and increasing difficulty while keeping content maintainable. When complete, file inspection should show a JSON Schema modeling level identity, dimensions, player spawn, sloped girders, ladder zones, Trump-inspired boss placement, barrel tuning, Motzfeldt rescue position, and difficulty metadata. The observable developer behavior is that a coding agent can author future LevelManager loading code against these files without reverse-engineering gameplay assumptions from one monolithic scene. This story does not implement runtime validation, LevelManager loading, collision behavior, slope math, barrel movement, player controls, rescue transitions, or rendering. It depends on the static client scaffold because the level artifacts live under src and are intended for Vite-bundled client modules. The fixtures should include exactly three original placeholder levels, not copied Donkey Kong layouts, and should exercise representative geometry for future tests. The schema should explicitly support Arcade Physics workarounds by representing visual sloped girders and collision metadata declaratively instead of assuming native sloped collision.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:static-phaser-client-foundation, type:schema, gameplay:levels, configuration:fixtures, complexity:medium |

**Acceptance Criteria**
- src/levels/level.schema.json is valid JSON as verified by running node -e "JSON.parse(require('fs').readFileSync('src/levels/level.schema.json','utf8'));" from the repository root.
- src/levels/level.fixtures.json is valid JSON as verified by running node -e "JSON.parse(require('fs').readFileSync('src/levels/level.fixtures.json','utf8'));" from the repository root.
- src/levels/level.schema.json contains required properties for id, name, order, dimensions, playerSpawn, girders, ladders, boss, barrels, rescue, and difficulty.
- The girders schema in src/levels/level.schema.json includes numeric x1, y1, x2, y2 fields plus visualKey and collisionMode fields so future slope logic can compute line-segment positions.
- The ladders schema in src/levels/level.schema.json includes numeric x, y, width, height, snapX, and climbSpeedOverride fields so future ladder logic can create overlap zones rather than ordinary platforms.
- Mock data/fixtures: src/levels/level.fixtures.json is committed with exactly 3 level entries, and each entry includes at least one girder, one ladder, one boss object, one barrels object, one rescue object, and difficulty metadata.
- Unit tests: N/A — this story defines schema and fixture assets before schema validation code is introduced; JSON parse verification is required in this story.
- System integration tests: N/A — level data remains static client configuration and does not cross a service, API, or database boundary.

**Depends on:** WO-001

### [P0] Configure Test And Lint Commands

Add Vitest and ESLint commands so every future change to the Donkey Trump client can be validated locally and by automation before it reaches static hosting. The change belongs in the quality command surface in package.json, with supporting configuration in eslint.config.js and initial tests in src/GameBootstrap.test.js. The scaffolded client currently has no lint or test baseline, which would make the Phaser bootstrap difficult to operate safely as more gameplay modules are added. Stakeholders need this early because the product has no backend safety net, so broken JavaScript would otherwise ship directly as static assets. When complete, a developer can run npm run lint and npm run test:run from a clean checkout and receive deterministic exit codes. The observable behavior should include at least one unit test around the createGameConfig seam without instantiating a full Phaser.Game or requiring a browser canvas. This story does not implement gameplay mechanics, browser automation, deployment workflow logic, accessibility audits, production smoke checks, or cloud test infrastructure. It depends on the Phaser client scaffold because tests and lint rules need concrete JavaScript modules to validate. The configuration should favor single-responsibility modules, explicit browser globals, and no coupling to Azure, secrets, or external services. The result becomes the local validation gate that later workflow automation can call before building or deploying the static artifact.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:static-phaser-client-foundation, type:quality, tooling:vitest, tooling:eslint, complexity:medium |

**Acceptance Criteria**
- package.json contains scripts named lint, test, and test:run, where lint invokes ESLint and test:run invokes Vitest in non-watch mode.
- eslint.config.js exists at the repository root, ignores dist and node_modules, and running npm run lint exits with code 0 against src/GameBootstrap.js, src/main.js, and src/GameBootstrap.test.js.
- src/GameBootstrap.test.js contains a Vitest assertion that createGameConfig returns physics.default equal to arcade and physics.arcade.debug equal to false.
- Running npm run test:run exits with code 0 and reports src/GameBootstrap.test.js as an executed test file.
- Unit tests: src/GameBootstrap.test.js is committed and validates the bootstrap configuration without constructing a Phaser.Game instance.
- System integration tests: N/A — this story adds local quality gates for a static frontend and does not introduce a service, API, deployment boundary, or browser automation flow.
- Mock data/fixtures: N/A — no gameplay fixture data is needed to test the bootstrap configuration seam.

**Depends on:** WO-001

### [P1] Harden Static Web Headers

Create the Azure Static Web Apps configuration so Donkey Trump is delivered with explicit browser security headers and cache controls suitable for a lightweight static game. The change belongs in the static hosting configuration module at staticwebapp.config.json. The scaffolded client currently has no Static Web Apps configuration, so routing, headers, and asset caching would rely entirely on platform defaults. Stakeholders need this because a static game still executes JavaScript in players' browsers and must reduce XSS, content-sniffing, referrer leakage, unnecessary browser permissions, and rollback-hostile caching. When complete, file inspection should show HSTS, content type protection, referrer limits, permissions restrictions, a conservative content security policy, SPA fallback routing, and long-lived immutable cache headers for built assets. The observable delivery behavior after deployment is that versioned assets under /assets/* can be cached aggressively while the app shell remains recoverable. This story does not deploy the site, provision Azure resources, configure DNS, create certificates, add runtime observability, write gameplay error overlays, or create real secrets. It depends on the client scaffold because the config is tailored to the Vite static artifact shape and app shell routing. The security posture should remain compatible with MVP constraints by avoiding third-party analytics domains, dynamic script loading, and external API dependencies. Operationally, this reduces blast radius from delivery misconfiguration and supports title-screen readiness through browser caching without weakening the app shell recovery path.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P1 |
| Labels | epic:static-phaser-client-foundation, type:security, hosting:azure-static-web-apps, cache:immutable-assets, complexity:medium |

**Acceptance Criteria**
- staticwebapp.config.json is valid JSON as verified by running node -e "JSON.parse(require('fs').readFileSync('staticwebapp.config.json','utf8'));" from the repository root.
- staticwebapp.config.json contains globalHeaders entries for Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- The Content-Security-Policy value in staticwebapp.config.json includes default-src 'self', script-src 'self', style-src 'self' 'unsafe-inline', img-src 'self' data:, and connect-src 'self'.
- staticwebapp.config.json contains a route for /assets/* with Cache-Control including public, max-age=31536000, and immutable.
- staticwebapp.config.json contains navigationFallback with rewrite set to /index.html and excludes at least /assets/* so static asset requests are not rewritten to the app shell.
- Unit tests: N/A — this story changes static hosting configuration and is verified by JSON parsing and file inspection rather than application unit tests.
- System integration tests: N/A — this story does not call Azure or deploy the site; actual response header checks are validated by the deployment workflow and hosting environment later.
- Mock data/fixtures: N/A — security and cache header configuration does not consume gameplay fixtures or test data.

**Depends on:** WO-001

### [P0] Register Core Phaser Scenes

Register BootScene, TitleScene, and PlayScene in the Phaser bootstrap so Donkey Trump has a clear scene lifecycle for loading, starting, and future gameplay composition. The change belongs in src/GameBootstrap.js with new scene modules under src/scenes/BootScene.js, src/scenes/TitleScene.js, and src/scenes/PlayScene.js. The current bootstrap can create a Phaser game configuration, but it has no named scene chain for loading states, title/start interaction, or active play. Stakeholders need this because the MVP must include start/play, instructions, fail/retry, level completion, and victory states, and those flows need a reliable scene registration seam before gameplay systems are added. When complete, createGameConfig should expose a scene array containing the three core scene classes in boot order, and the browser should start at the boot scene rather than an anonymous placeholder. Observable behavior for a developer is that importing src/GameBootstrap.js reveals explicit scene imports and a deterministic order of BootScene, TitleScene, and PlayScene. The initial scene modules may render minimal placeholder text or empty lifecycle hooks, but they must be concrete Phaser.Scene subclasses with stable scene keys. This story does not implement full asset loading, title UI art, keyboard menu navigation, player movement, level loading, barrels, rescue transitions, HUD, pause overlays, analytics, or deployment automation. It depends on the client scaffold because scene registration builds on the existing Vite and Phaser bootstrap seam. It also prepares future systems by keeping scene lifecycle code separate from player, ladder, slope, barrel, and game-state modules.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:static-phaser-client-foundation, type:runtime, runtime:phaser, gameplay:scenes, complexity:medium |

**Acceptance Criteria**
- src/scenes/BootScene.js exists and exports a BootScene class that extends Phaser.Scene with the scene key BootScene.
- src/scenes/TitleScene.js exists and exports a TitleScene class that extends Phaser.Scene with the scene key TitleScene.
- src/scenes/PlayScene.js exists and exports a PlayScene class that extends Phaser.Scene with the scene key PlayScene.
- src/GameBootstrap.js imports BootScene from src/scenes/BootScene.js, TitleScene from src/scenes/TitleScene.js, and PlayScene from src/scenes/PlayScene.js, and createGameConfig returns a scene array in that order.
- src/GameBootstrap.test.js includes a Vitest assertion that createGameConfig().scene maps to scene keys BootScene, TitleScene, and PlayScene in order, and running npm run test:run exits with code 0.
- Running npm run lint exits with code 0 for src/GameBootstrap.js, src/scenes/BootScene.js, src/scenes/TitleScene.js, src/scenes/PlayScene.js, and src/GameBootstrap.test.js.
- Unit tests: src/GameBootstrap.test.js is updated to validate registered scene ordering without constructing a Phaser.Game instance.
- System integration tests: N/A — this story registers internal Phaser scene classes and does not cross a network, deployment, database, or external service boundary.
- Mock data/fixtures: N/A — core scene registration does not require gameplay level fixtures or mock data.

**Depends on:** WO-001

### [P1] Automate Static Web Deployment

Create the GitHub Actions workflow for Azure Static Web Apps so the Phaser client is validated, built, packaged, and handed off to Azure through source-controlled automation. The change belongs in the delivery control module at .github/workflows/static-web-app.yml. The repository currently has no workflow file, so there is no repeatable operational gate for dependency installation, linting, unit tests, build output, artifact retention, or Azure Static Web Apps deployment. Stakeholders need this because the MVP is intentionally static-first, and production reliability depends on automated release controls instead of manual uploads from a developer workstation. When complete, pull requests and main-branch changes should execute validation before any deploy step can run. The observable behavior in GitHub should be a workflow that installs with npm ci, runs npm run lint, runs npm run test:run, builds the Vite artifact, uploads dist as an artifact, and invokes the Azure Static Web Apps deployment action only after validation succeeds. This story does not provision Azure resources, create real secrets, configure DNS, configure branch protection, implement runtime monitoring, write gameplay features, or add production smoke and rollback procedures. It depends on the client build capability, local quality commands, and static hosting configuration because the workflow should reuse package.json scripts and include the committed Azure Static Web Apps config in the dist handoff. The workflow must reference placeholder secret names only and must not commit deployment tokens or environment-specific credentials. Operationally, this creates the automated release seam that later smoke and rollback controls can extend.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:static-phaser-client-foundation, type:ci-cd, platform:github-actions, hosting:azure-static-web-apps, complexity:medium |

**Acceptance Criteria**
- .github/workflows/static-web-app.yml exists and contains triggers for pull_request, push to main, and workflow_dispatch.
- .github/workflows/static-web-app.yml uses actions/setup-node with node-version 22 and runs npm ci before npm run lint, npm run test:run, and npm run build.
- .github/workflows/static-web-app.yml uploads the dist directory as a GitHub Actions artifact using actions/upload-artifact and a named artifact after npm run build succeeds.
- .github/workflows/static-web-app.yml contains an Azure Static Web Apps deploy step that references secrets.AZURE_STATIC_WEB_APPS_API_TOKEN and uses app_location set to / and output_location set to dist.
- .github/workflows/static-web-app.yml does not contain literal Azure token values, subscription IDs, passwords, connection strings, or private key material as verified by file inspection for secrets.AZURE_STATIC_WEB_APPS_API_TOKEN usage only.
- Unit tests: N/A — this workflow does not add application logic, but .github/workflows/static-web-app.yml must run npm run test:run as a required validation step before deployment.
- System integration tests: .github/workflows/static-web-app.yml validates the GitHub-to-Azure deployment boundary by configuring Azure/static-web-apps-deploy with the dist output and a GitHub secret reference, without committing any secret value.
- Mock data/fixtures: N/A — deployment automation does not require gameplay fixture data, and level fixtures are managed by the declarative level contract capability.

**Depends on:** WO-001, WO-004, WO-047

### [P1] Add Smoke And Rollback Runbook

Extend the Azure Static Web Apps workflow with production smoke verification and a rollback procedure so operators can detect bad releases quickly and recover by redeploying a known-good artifact. The change belongs in .github/workflows/static-web-app.yml, with operational documentation committed in docs/production-smoke-and-rollback.md. The current deployment workflow can validate, build, upload, and deploy the static client, but it does not yet prove the production URL serves the app shell or document a time-bounded recovery path. Stakeholders need this because the release operations target requires rollback or redeploy of the previous release within 15 minutes while keeping the source repository as the system of record. When complete, the workflow should support a production smoke step that checks HTTPS availability, the root app shell, and at least one static asset path without collecting runtime telemetry or player data. The observable behavior should be that tagged or approved production deployments create an artifact trail, run smoke commands against a configurable production URL secret or variable, and leave a rollback runbook that operators can execute without tribal knowledge. This story does not provision Azure resources, create production secrets, enable runtime observability, add third-party analytics, implement browser gameplay automation, or configure GitHub branch protection. It depends on production deployment automation, a validated static client artifact, and downstream gameplay smoke surfaces that expose enough static or browser-visible state for release checks. The smoke checks must fail closed after deployment by marking the workflow failed if the configured URL does not return the expected HTTP status or expected app-shell content. The rollback documentation should use placeholder secret and environment names only, and it must not instruct operators to paste tokens into source files.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:static-phaser-client-foundation, type:release-operations, platform:github-actions, reliability:rollback, complexity:medium |

**Acceptance Criteria**
- .github/workflows/static-web-app.yml contains a production smoke step after the Azure/static-web-apps-deploy step that uses curl with --fail against a configurable production URL variable or secret.
- .github/workflows/static-web-app.yml smoke commands verify the root path returns HTTP 200 and that the response body contains the index.html game container id game or the configured app shell marker.
- .github/workflows/static-web-app.yml stores or references the deployable dist artifact name in the production deployment path so the artifact can be identified for rollback investigation.
- docs/production-smoke-and-rollback.md exists and contains step-by-step rollback instructions referencing GitHub Actions workflow_dispatch, the previous successful artifact or release tag, and the Azure Static Web Apps deployment action.
- docs/production-smoke-and-rollback.md states a target recovery time of 15 minutes and includes a verification command using curl -I against the production URL returning HTTP 200.
- .github/workflows/static-web-app.yml and docs/production-smoke-and-rollback.md contain no literal Azure tokens, passwords, connection strings, private keys, or deployment credentials as verified by file inspection.
- Unit tests: N/A — this story changes workflow and runbook controls; application unit logic is not modified, but the workflow must still retain the npm run test:run validation step before deployment.
- System integration tests: .github/workflows/static-web-app.yml validates the production delivery boundary by issuing HTTPS curl smoke checks against the configured production URL after deployment.
- Mock data/fixtures: N/A — smoke and rollback controls operate on built static artifacts and do not require gameplay fixtures or synthetic player data.

**Depends on:** WO-052, WO-072, WO-078

---

## Game Shell Scenes and Runtime State

### [P0] Implement Arcade State Transitions

Implement the arcade runtime state transitions so Donkey Trump has a single in-memory authority for start, play, pause, life loss, level completion, game over, retry, and final victory. The work belongs in the GameStateMachine module at src/state/GameStateMachine.js, with later consumers in PlayScene, HudSystem, and pause overlays. The current target state lacks a dedicated state contract, so gameplay scenes and UI systems would otherwise duplicate transition rules and create hard-to-debug edge cases. This matters because the MVP is judged as a small complete arcade game, not just a mechanics demo, and players need predictable recovery from death, completion, game over, and restart flows. When complete, the module should expose state names and transition methods such as startGame, pauseGame, resumeGame, loseLife, completeLevel, retryLevel, restartGame, addScore, and completeFinalLevel. Each transition should return a deterministic snapshot containing currentState, score, lives, levelIndex, totalLevels, and a rejection reason when a transition is not allowed. Score, lives, and level state must remain ephemeral in browser memory and must not create local profiles, backend calls, leaderboards, or persistent storage. This story does not include rendering the HUD, building levels, detecting actual barrel collisions, implementing the rescue zone, or drawing pause overlays. It depends on the JavaScript test baseline and the Phaser shell only as consumers; the state machine itself should remain framework-light and import no Phaser classes. The implementation should act like an internal API for gameplay systems so later modules can subscribe to state snapshots without needing to know transition internals.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, runtime:state, testability:pure-logic, complexity:medium |

**Acceptance Criteria**
- File inspection of src/state/GameStateMachine.js shows exported state constants or equivalent names for start, play, pause, life-loss, level-complete, game-over, retry, and victory.
- File inspection of src/state/GameStateMachine.js shows exported transition methods or reducer actions named startGame, pauseGame, resumeGame, loseLife, completeLevel, retryLevel, restartGame, addScore, and completeFinalLevel.
- File inspection of src/state/GameStateMachine.js shows transition snapshots include currentState, score, lives, levelIndex, totalLevels, and lastTransition fields, and invalid transition results include attemptedAction and reason fields.
- Unit tests: npm test -- tests/unit/GameStateMachine.test.js exits with code 0 and asserts start-to-play, play-to-pause-to-play, play-to-life-loss, life-loss-to-retry, play-to-level-complete, level-complete-to-play, final-level-to-victory, and game-over-to-start transitions.
- System integration tests: npm run test:integration -- tests/integration/gameStateConsumerBoundary.test.js exits with code 0 and asserts src/state/GameStateMachine.js can be imported by src/systems/HudSystem.js or a test consumer without importing Phaser from the state module.
- Mock data/fixtures: tests/fixtures/gameStateScenarios.json is committed with initial lives, totalLevels, scoring deltas, and transition sequences referenced by tests/unit/GameStateMachine.test.js.

**Depends on:** WO-048

### [P0] Handle Boot Manifest Loading

Implement capability checks and preload manifest handling so Donkey Trump either reaches the title screen quickly in supported browsers or produces a deterministic recovery reason instead of a blank canvas. The change belongs in the BootScene module at src/scenes/BootScene.js, using the already registered Phaser scene flow from the browser shell. The current scene is expected to be a thin startup shell after earlier setup, and the target is a boot orchestrator that validates minimum browser support before loading shell-critical assets from a manifest. This matters because stakeholders promised instant no-install play, but reliability depends on failing closed when Canvas or WebGL support, keyboard input, or required assets are unavailable. When complete, a fast successful preload should transition to TitleScene, while a slow preload should expose English loading feedback after the configured delay and keep loading until completion. Asset failures should produce an asset-failure recovery payload that a recovery UI can render, and unsupported browsers should produce an unsupported-browser payload before expensive preload work begins. This story does not include the final recovery renderer, title screen content, gameplay systems, production art integration, deployment automation, runtime telemetry, or external analytics. It depends on the browser app scaffold, registered Phaser scenes, local quality commands, and an agreed placeholder asset manifest capability being available. The implementation should keep capability and manifest validation separable from Phaser loader side effects so Vitest can simulate success, delay, and failure paths without network access.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, runtime:phaser, resilience:loading, complexity:medium |

**Acceptance Criteria**
- File inspection of src/scenes/BootScene.js shows exported or locally testable functions named checkBootCapabilities and normalizePreloadManifest, and BootScene.preload reads asset entries from a manifest object or manifest JSON rather than hard-coding every loader call inline.
- File inspection of src/scenes/BootScene.js shows checkBootCapabilities verifies Canvas or WebGL rendering support and keyboard input support before BootScene calls this.load.image, this.load.audio, this.load.json, or this.scene.start("TitleScene").
- File inspection of src/scenes/BootScene.js shows BootScene records recovery reasons named unsupported-browser and asset-failure and does not call this.scene.start("TitleScene") after either reason is set.
- Unit tests: npm test -- tests/unit/BootScene.test.js exits with code 0 and asserts checkBootCapabilities returns an unsupported-browser result when rendering support is absent, normalizePreloadManifest rejects an asset entry without key or url, and delayed loading text becomes visible at 2000 milliseconds.
- System integration tests: npm run test:integration -- tests/integration/bootManifestFlow.test.js exits with code 0 and asserts src/scenes/BootScene.js transitions to TitleScene with tests/fixtures/assetManifest.valid.json and records asset-failure with tests/fixtures/assetManifest.missingAsset.json.
- Mock data/fixtures: tests/fixtures/assetManifest.valid.json and tests/fixtures/assetManifest.missingAsset.json are committed, contain only local placeholder asset paths, and are referenced by tests/unit/BootScene.test.js or tests/integration/bootManifestFlow.test.js.

**Depends on:** WO-044, WO-048, WO-049

### [P0] Display Score And Lives

Implement the score and lives display so players can see arcade progress and remaining chances during the Donkey Trump gameplay loop. The work belongs in the HudSystem module at src/systems/HudSystem.js, consuming snapshots from src/state/GameStateMachine.js and rendering through the active Phaser scene. The current HUD target is either a placeholder system or absent from the shell, and the target is a deterministic renderer for score, lives, level, and game-state messages that later PlayScene composition can update. This matters because score and lives feedback is part of the MVP acceptance path and helps players understand life loss, retry, game over, level completion, and victory outcomes. When complete, HudSystem should create score and lives text objects, expose updateFromState for state snapshots, and avoid displaying negative lives or undefined score values. The display should use English labels such as Score and Lives, and it should keep formatting logic testable separately from Phaser text creation. This story does not include defining the final scoring model, implementing hazard collisions, decrementing lives from barrels, designing final typography, adding analytics, or building leaderboards. It depends on the runtime state machine capability for authoritative score, lives, level index, and arcade state snapshots, plus the Phaser shell capability to create text. The implementation should keep HUD behavior local to browser memory and should never persist or transmit player score data. Tests should prove formatting and update behavior without requiring final art assets or a production level.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, runtime:phaser, ui:hud, complexity:medium |

**Acceptance Criteria**
- File inspection of src/systems/HudSystem.js shows a HudSystem class or factory exporting createHud, updateFromState, or equivalent methods that accept state snapshots from src/state/GameStateMachine.js.
- File inspection of src/systems/HudSystem.js shows English labels for Score and Lives and formatting logic that displays numeric score and lives values from state.currentState snapshots.
- File inspection of src/systems/HudSystem.js shows lives formatting clamps display output at 0 or handles exhausted lives without rendering negative values.
- Unit tests: npm test -- tests/unit/HudSystem.test.js exits with code 0 and asserts formatHudState or equivalent returns Score: 0, Lives: 3, updated score text, updated lives text, and Lives: 0 when the GameStateMachine snapshot has zero lives.
- System integration tests: npm run test:integration -- tests/integration/hudStateBoundary.test.js exits with code 0 and asserts HudSystem.updateFromState updates Phaser text doubles or scene test objects after GameStateMachine.addScore and GameStateMachine.loseLife transitions.
- Mock data/fixtures: tests/fixtures/hudStateSnapshots.json is committed with start, play, life-loss, game-over, level-complete, and victory snapshots used by tests/unit/HudSystem.test.js.

**Depends on:** WO-044, WO-053

### [P0] Build Title Scene Entry

Build TitleStartPage, InstructionsModal, and PrivacyModal so players can start Donkey Trump, learn controls, and understand the account-free privacy posture before gameplay. The work belongs in the TitleScene module at src/scenes/TitleScene.js, using the successful boot route from BootScene as its entry point. The current title scene is expected to be a placeholder shell after boot, and the target is a keyboard-first English launch page with deterministic modal state. This matters because instant play still needs a clear start action, readable instructions, and privacy reassurance that there are no accounts, persistent profiles, or third-party analytics in the MVP. When complete, TitleScene should render or compose a TitleStartPage with the Donkey Trump title, start action, instructions action, privacy action, and a visible account-free launch message. InstructionsModal should show keyboard controls for left, right, jump, climb up, climb down, pause, resume, and retry, while PrivacyModal should state that gameplay is local and analytics transmission is disabled for launch. The start action should transition to PlayScene once per activation, and modal open or close actions should be available by keyboard and pointer without stacking invisible dialogs. This story does not include PauseHelpOverlay during gameplay, HUD rendering, final art polish, audio, level selection, analytics event transmission, or recovery UI. It depends on the browser shell, boot manifest flow, and scene registration capability already routing players into TitleScene after assets load. The implementation should keep UI copy centralized within src/scenes/TitleScene.js or exported helpers so tests can assert English-only content and focus behavior without relying on visual screenshots.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, runtime:phaser, accessibility:keyboard, complexity:medium |

**Acceptance Criteria**
- File inspection of src/scenes/TitleScene.js shows named functions, classes, or exported helpers for TitleStartPage, InstructionsModal, and PrivacyModal, and TitleScene.create composes those three components or component definitions.
- File inspection of src/scenes/TitleScene.js shows the start action calls this.scene.start("PlayScene") through a single guarded handler that prevents duplicate starts from repeated Enter, Space, or pointer activation.
- File inspection of src/scenes/TitleScene.js shows InstructionsModal English copy mentions left, right, jump, up, down, pause, resume, and retry controls.
- File inspection of src/scenes/TitleScene.js shows PrivacyModal English copy contains the phrases no accounts, no persistent profiles, and no third-party analytics for the MVP or equivalent static strings.
- Unit tests: npm test -- tests/unit/TitleScene.test.js exits with code 0 and asserts modal state transitions for openInstructions, openPrivacy, closeModal, Escape close behavior, and guarded start routing to PlayScene.
- System integration tests: npm run test:integration -- tests/integration/titleSceneKeyboardFlow.test.js exits with code 0 and asserts Enter activates the focused Start action, Escape closes InstructionsModal, and the focusKey or selectedAction returns to the instructions trigger.
- Mock data/fixtures: N/A — src/scenes/TitleScene.js uses static English copy; tests/unit/TitleScene.test.js must import or inspect those copy constants directly without external fixture files.

**Depends on:** WO-044, WO-055

### [P0] Render Loading Recovery UI

Render unsupported-browser and asset-failure loading recovery states so players get actionable English guidance when Donkey Trump cannot boot successfully. The work belongs in the LoadingRecoveryState module at src/ui/LoadingRecoveryState.js, with BootScene passing the recovery reason produced by capability checks or manifest loading. The current boot flow can identify failure reasons after the manifest story, but it needs a dedicated UI renderer that converts those reasons into safe player-facing messages and retry actions. This matters because the game is a static browser experience with no support desk in the flow, so recovery copy must reduce abandonment and avoid exposing raw technical failures. When complete, unsupported-browser should explain that the player needs a modern desktop browser with Canvas or WebGL and keyboard support, while asset-failure should explain that game files could not load and offer a reload action. The renderer should expose deterministic state for title, message, primary action label, reason, and optional secondary action so tests can verify copy without screenshot comparison. The module should be keyboard-operable for the primary action and should integrate with BootScene without adding telemetry, third-party scripts, or external error reporting. This story does not include invalid level data recovery, runtime monitoring, deployment health checks, title screen content, gameplay state transitions, or production hosting changes. It depends on BootScene setting structured recovery reasons from capability and asset manifest handling, plus the browser UI scaffold and test commands. The implementation should keep recovery state data pure and renderer behavior thin so future visual polish can change layout without changing reason-code behavior.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, resilience:recovery, accessibility:keyboard, complexity:medium |

**Acceptance Criteria**
- File inspection of src/ui/LoadingRecoveryState.js shows exported recovery reason constants or accepted reason values for unsupported-browser and asset-failure.
- File inspection of src/ui/LoadingRecoveryState.js shows a function named getLoadingRecoveryState, renderLoadingRecoveryState, or equivalent that returns title, message, primaryActionLabel, and reason fields for unsupported-browser and asset-failure.
- File inspection of src/scenes/BootScene.js shows unsupported-browser and asset-failure branches call src/ui/LoadingRecoveryState.js or pass its returned state into the BootScene renderer instead of leaving only console errors.
- Unit tests: npm test -- tests/unit/LoadingRecoveryState.test.js exits with code 0 and asserts unsupported-browser copy references a modern desktop browser, Canvas or WebGL, and keyboard support in src/ui/LoadingRecoveryState.js.
- Unit tests: npm test -- tests/unit/LoadingRecoveryState.test.js exits with code 0 and asserts asset-failure copy references game files or assets, includes a reload primaryActionLabel, and omits stack trace text from src/ui/LoadingRecoveryState.js output.
- System integration tests: npm run test:integration -- tests/integration/bootRecoveryRendering.test.js exits with code 0 and asserts tests/fixtures/assetManifest.missingAsset.json causes BootScene to expose a rendered or renderable asset-failure state from src/ui/LoadingRecoveryState.js.
- Mock data/fixtures: tests/fixtures/assetManifest.missingAsset.json is committed and referenced by tests/integration/bootRecoveryRendering.test.js; N/A for unsupported-browser fixture because tests/unit/LoadingRecoveryState.test.js can simulate capability output directly.

**Depends on:** WO-044, WO-055

### [P1] Implement Pause Help Overlay

Implement PauseHelpOverlay controls so players can pause active gameplay, review keyboard help, resume, restart, or return to the title without losing the score and lives context. The work belongs in the PauseHelpOverlay module at src/ui/PauseHelpOverlay.js, consuming GameStateMachine pause and resume transitions and coexisting with HudSystem output. The current gameplay shell has state and HUD capabilities after earlier stories, but it lacks an in-play overlay that exposes instructions during the arcade loop. This matters because pause and instructions are a committed MVP state, and keyboard-first desktop players need a predictable way to stop action, inspect controls, and recover without account onboarding or mobile-specific UI. When complete, the overlay should expose visible English controls for Resume, Restart, Return to Title, and keyboard instructions for movement, jump, climbing, pause, and retry. Pressing the configured pause key should request GameStateMachine.pauseGame from play state, Escape or Resume should request resumeGame from pause state, and overlay focus state should remain deterministic for tests. The overlay should not own gameplay physics, barrel timers, score calculations, or HUD rendering, but it should provide callbacks that PlayScene can use to stop or resume scene-level activity. This story does not include title scene modals, final visual polish, accessibility sign-off, analytics, deployment changes, or new gameplay mechanics. It depends on runtime state transitions and score/lives HUD capability so the overlay can display or preserve current score and lives context while paused. The implementation should keep overlay copy and state in a pure helper where possible, making the pause path observable in automated tests before manual browser QA.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:game-shell-scenes-runtime-state, type:feature, runtime:phaser, accessibility:keyboard, ui:overlay, complexity:medium |

**Acceptance Criteria**
- File inspection of src/ui/PauseHelpOverlay.js shows exported PauseHelpOverlay construction or state helpers with actions named resume, restart, returnToTitle, and close or equivalent action identifiers.
- File inspection of src/ui/PauseHelpOverlay.js shows English keyboard help copy referencing left, right, jump, up, down, pause, resume, and retry controls.
- File inspection of src/ui/PauseHelpOverlay.js shows the overlay accepts callbacks or dependencies for onResume, onRestart, and onReturnToTitle instead of importing PlayScene directly.
- File inspection of src/scenes/PlayScene.js shows the configured pause key or Escape path opens PauseHelpOverlay only when GameStateMachine currentState is play or pause and does not open it from game-over or victory states.
- Unit tests: npm test -- tests/unit/PauseHelpOverlay.test.js exits with code 0 and asserts open, close, selectNextAction, selectPreviousAction, activateSelectedAction, and Escape resume behavior for src/ui/PauseHelpOverlay.js.
- System integration tests: npm run test:integration -- tests/integration/pauseOverlayFlow.test.js exits with code 0 and asserts PlayScene pause input calls GameStateMachine.pauseGame, displays PauseHelpOverlay, keeps HudSystem score and lives text unchanged, and resume input calls GameStateMachine.resumeGame.
- Mock data/fixtures: tests/fixtures/pauseOverlayState.json is committed with play-state and pause-state snapshots containing score and lives values used by tests/unit/PauseHelpOverlay.test.js or tests/integration/pauseOverlayFlow.test.js.

**Depends on:** WO-044, WO-053, WO-057

---

## Core Movement, Ladder, and Slope Mechanics

### [P0] Implement Slope Segment Resolver

Implement deterministic line-segment slope math so Jumpman Løkke and later moving hazards can be aligned to visible sloped girders without relying on unsupported native Arcade Physics slope collision. The change belongs in the SlopeResolver module at src/systems/SlopeResolver.js. The current project baseline treats sloped platforms as a known technical risk, and isolating the math here gives stakeholders a verifiable workaround before full level production starts. When complete, the module can answer whether an x position is inside a slope segment, calculate the matching y position by interpolation, choose the nearest supporting segment, and return a corrected body position without mutating unrelated gameplay state. Developers should be able to verify ascending, descending, flat, vertical, out-of-range, and malformed segment cases with Vitest rather than launching a browser scene. This story does not draw sloped art, create collision rectangles, move the player, move barrels, load complete level data, or wire the resolver into PlayScene. It depends on the Phaser/Vite project scaffold and the declarative level-data shape for girder segments being available. It also depends on the local test command being available so the slope helper can remain a low-blast-radius pure module. Invalid segment definitions should fail predictably with descriptive errors during test execution instead of producing NaN positions that would be hard to debug during a playtest.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:core-movement-ladder-slope, mechanics:slope, test:unit, complexity:medium |

**Acceptance Criteria**
- File inspection of src/systems/SlopeResolver.js shows named exports normalizeSlopeSegment, isWithinSegment, getYAtX, findSupportingSegment, and resolveBodyToSlope with no Phaser Scene imports.
- Running npm test -- tests/systems/SlopeResolver.test.js exits with code 0 and includes an assertion that getYAtX(50, { x1: 0, y1: 120, x2: 100, y2: 140 }) returns 130.
- Running npm test -- tests/systems/SlopeResolver.test.js exits with code 0 and includes assertions that isWithinSegment returns true for boundary x values and false for x values outside the segment range in src/systems/SlopeResolver.js.
- Running npm test -- tests/systems/SlopeResolver.test.js exits with code 0 and includes an assertion that findSupportingSegment returns null when no fixture segment in tests/fixtures/slopeSegments.fixture.js matches the provided x and y tolerance.
- System integration tests: N/A — src/systems/SlopeResolver.js is a pure local helper with no browser, Phaser Scene, network endpoint, or service boundary; src/scenes/PlayScene.js integration is covered by the later vertical-slice story.
- Mock data and fixtures are committed in tests/fixtures/slopeSegments.fixture.js with ascending, descending, flat, vertical, out-of-range, and malformed segment examples used by tests/systems/SlopeResolver.test.js.

**Depends on:** WO-046, WO-004

### [P0] Implement Jumpman Movement Controller

Implement Jumpman Løkke horizontal movement and reduced jumping so players can dodge hazards and navigate platforms without bypassing ladder-based vertical progression. The change belongs in the PlayerController module at src/controllers/PlayerController.js. The current gameplay plan requires keyboard-first desktop controls, but the player feel must be bounded so a jump cannot carry the character directly from one floor to the next. When complete, pressing left or right should set predictable horizontal velocity, pressing jump while grounded should apply one tuned jump impulse, releasing jump early should reduce the jump arc, and repeated airborne jump presses should not create an unintended double jump. The controller should expose state hooks that allow the ladder system to suspend normal movement while climbing and restore normal movement afterward. The implementation should be observable through unit tests using a mocked Arcade Physics sprite and should not require a real canvas or browser session. This story does not implement ladder overlap detection, slope y-correction, hit or fail behavior, sprite art, animation state machines, barrels, score, lives, pause, rescue completion, or scene wiring. It depends on the client input scaffolding and the Arcade Physics sprite/body seam being available. It also depends on level geometry and tuning assumptions that define the maximum allowed jump height relative to floor spacing.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:core-movement-ladder-slope, mechanics:player, controls:keyboard, test:unit, complexity:medium |

**Acceptance Criteria**
- File inspection of src/controllers/PlayerController.js shows exported PlayerController and DEFAULT_PLAYER_MOVEMENT definitions with moveSpeed, jumpVelocity, reducedJumpGravityMultiplier, maxJumpHeightPx, and coyoteTimeMs fields.
- Running npm test -- tests/controllers/PlayerController.test.js exits with code 0 and includes assertions that update sets player.body.velocity.x below 0 for left input, above 0 for right input, and 0 when neither direction is pressed.
- Running npm test -- tests/controllers/PlayerController.test.js exits with code 0 and includes an assertion that handleJump applies jumpVelocity only when isGrounded returns true and does not apply a second jump while player.body.blocked.down is false.
- Running npm test -- tests/controllers/PlayerController.test.js exits with code 0 and includes an assertion that handleJumpRelease applies reducedJumpGravityMultiplier or clamps upward velocity when the jump input is released during ascent.
- System integration tests: N/A — src/controllers/PlayerController.js has no browser, HTTP, database, or cross-service boundary; the scene-level integration with LadderSystem and SlopeResolver is validated in src/scenes/PlayScene.js by the vertical-slice story.
- Mock data and fixtures are committed in tests/fixtures/playerMovement.fixture.js with grounded, airborne, climbing, left-input, right-input, jump-pressed, and jump-released cases used by tests/controllers/PlayerController.test.js.

**Depends on:** WO-004, WO-048

### [P0] Implement Ladder Zone Climbing

Implement ladder-zone climbing so Jumpman Løkke can move vertically only when overlapping a configured ladder and intentionally pressing up or down. The change belongs in the LadderSystem module at src/systems/LadderSystem.js. Stakeholders require vertical progression to depend on ladders rather than oversized jumps, so this system must enforce overlap-gated climbing and predictable gravity control. When complete, the system should detect the active ladder zone, snap or align the player to the configured ladder center when climbing begins, stop or constrain horizontal velocity, disable Arcade Physics gravity while climbing, apply vertical climb speed, and restore normal gravity on exit. The observable behavior should include no climbing outside ladder bounds, climb entry only on up or down input, vertical movement while held, idle suspension while no vertical input is held, and exit when jumping or leaving the ladder zone. The module should integrate with PlayerController through explicit state methods rather than duplicating normal movement logic. This story does not create ladder art, draw level geometry, tune final level layouts, implement slope correction, implement barrels, or wire the PlayScene update loop. It depends on declarative ladder-zone data and a player controller that can enter and leave a climbing state. It should remain testable with mocked Arcade Physics bodies and fixture ladder rectangles rather than requiring a browser run.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:core-movement-ladder-slope, mechanics:ladder, controls:keyboard, test:unit, test:integration, complexity:medium |

**Acceptance Criteria**
- File inspection of src/systems/LadderSystem.js shows exported LadderSystem and DEFAULT_LADDER_SETTINGS definitions with climbSpeed, snapToLadder, exitPaddingPx, and horizontalLock fields.
- Running npm test -- tests/systems/LadderSystem.test.js exits with code 0 and includes assertions that findOverlappingLadder returns a fixture ladder from tests/fixtures/ladderZones.fixture.js only when the player bounds intersect that ladder rectangle.
- Running npm test -- tests/systems/LadderSystem.test.js exits with code 0 and includes assertions that update enters climbing only when up or down input is pressed while overlapping a ladder zone in src/systems/LadderSystem.js.
- Running npm test -- tests/systems/LadderSystem.test.js exits with code 0 and includes assertions that update calls player.body.setAllowGravity(false) while climbing and player.body.setAllowGravity(true) after jump exit or leaving the ladder zone.
- Running npm test -- tests/systems/LadderSystem.integration.test.js exits with code 0 and includes assertions that LadderSystem calls PlayerController.setClimbing(true) on climb entry and PlayerController.setClimbing(false) on climb exit.
- Mock data and fixtures are committed in tests/fixtures/ladderZones.fixture.js with overlapping, non-overlapping, top-exit, bottom-exit, snapX, and climbSpeedOverride cases used by tests/systems/LadderSystem.test.js.

**Depends on:** WO-051, WO-054

### [P0] Wire Mechanics Vertical Slice

Wire the player controller, ladder system, and slope resolver into PlayScene so the mechanics vertical slice can be played and verified in one browser scene. The change belongs in the PlayScene module at src/scenes/PlayScene.js. Stakeholders need a concrete slice that proves reduced jumping, ladder-only vertical progression, and sloped girder y-correction before barrels, rescue flow, HUD, and full level content build on top of it. When complete, PlayScene should load a player Arcade sprite, read slope segment and ladder-zone definitions from level data or fixtures, instantiate PlayerController and LadderSystem, and call ladder, movement, and slope resolution in a deterministic frame order. Observable behavior should include left and right movement, one reduced jump that cannot clear the configured floor gap, climb entry only while overlapping a ladder and pressing up or down, gravity suppression while climbing, gravity restoration after climb exit, and visible y-position correction while standing on configured slope segments. The scene should remain a composition root rather than absorbing slope interpolation, ladder state, or movement tuning logic. This story does not implement barrel spawning, boss behavior, rescue completion, score or lives HUD, pause overlays, final victory, production art, analytics, deployment, or infrastructure. It depends on slope math, player movement, ladder-zone data, ladder behavior, and the Phaser client scene scaffold already being available. The integration should be testable with a lightweight PlayScene mechanics test and committed fixtures so future gameplay systems can reuse the same update contract without expanding scene complexity.

| Field | Value |
|---|---|
| Story Points | 8 |
| Hours | 80h |
| Priority | P0 |
| Labels | epic:core-movement-ladder-slope, mechanics:vertical-slice, scene:play, test:integration, complexity:high |

**Acceptance Criteria**
- File inspection of src/scenes/PlayScene.js shows imports from src/controllers/PlayerController.js, src/systems/LadderSystem.js, and src/systems/SlopeResolver.js and no duplicated getYAtX interpolation logic inside PlayScene.
- File inspection of src/scenes/PlayScene.js shows create constructs a player Arcade sprite, creates or reads ladder zone data, creates or reads slope segment data, instantiates PlayerController, and instantiates LadderSystem.
- File inspection of src/scenes/PlayScene.js shows update calls LadderSystem.update before PlayerController.update and applies resolveBodyToSlope after normal movement unless the player is climbing.
- Running npm test -- tests/scenes/PlayScene.mechanics.test.js exits with code 0 and includes an assertion that the update order is LadderSystem, PlayerController, then SlopeResolver for a non-climbing frame.
- Running npm test -- tests/scenes/PlayScene.mechanics.test.js exits with code 0 and includes assertions that climb frames skip slope correction and that leaving a ladder restores player.body.setAllowGravity(true).
- Unit tests are written in tests/scenes/PlayScene.mechanics.test.js for scene composition seams in src/scenes/PlayScene.js and exit with code 0 when run with npm test -- tests/scenes/PlayScene.mechanics.test.js.
- System integration tests are written in tests/scenes/PlayScene.mechanics.test.js and validate the module boundary among src/scenes/PlayScene.js, src/controllers/PlayerController.js, src/systems/LadderSystem.js, and src/systems/SlopeResolver.js without requiring external services.
- Mock data and fixtures are committed in tests/fixtures/mechanicsVerticalSlice.fixture.js with playerSpawn, slopes, ladders, and floorGapPx data used by tests/scenes/PlayScene.mechanics.test.js.

**Depends on:** WO-053, WO-051, WO-050, WO-054, WO-059

---

## Barrel Hazard, Boss, and Rescue Systems

### [P0] Spawn Right-Side Trump Boss

Implement the Trump-inspired boss spawn behavior so players see the satirical antagonist anchored on the right side of each level and understand where barrel pressure will originate. The change belongs in the BossController module at src/controllers/BossController.js. The current gameplay slice depends on level metadata for boss placement, but the target state needs a concrete controller that reads that metadata, creates or positions the boss sprite, and exposes a deterministic barrel spawn anchor for downstream hazard logic. This matters to stakeholders because the boss is a core part of the Donkey Trump premise and makes the right-to-left barrel flow immediately legible to players. When the story is complete, a level with a boss definition should place the boss near the configured right-side platform area, keep the boss visible during active play, and publish or return spawn coordinates that barrel logic can consume without duplicating placement calculations. The implementation should favor data-driven configuration from level definitions rather than hardcoded per-level coordinates, because the MVP needs three to four levels with increasing difficulty. This story does not implement barrel sprite creation, barrel movement, player collision consequences, rescue completion, score/lives HUD changes, pause overlays, deployment, or production art approval. It depends on the browser game scaffold, Phaser scene composition, level metadata loading, player movement, ladder/slope vertical-slice behavior, and game-state capability already existing. If final caricature art is not available, the controller may use an approved placeholder asset key while keeping the sprite key configurable so original art can be swapped without changing spawn logic.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:barrel-boss-rescue, type:feature, runtime:phaser, complexity:medium, priority:P0 |

**Acceptance Criteria**
- Running npm test -- tests/controllers/BossController.test.js exits with code 0 and asserts createBossController or the exported BossController constructor in src/controllers/BossController.js resolves boss.x within the rightmost 25 percent of the level width when given a level fixture containing boss.x, boss.y, and boss.spawnAnchorOffset.
- File inspection of src/controllers/BossController.js shows an exported method or property named getBarrelSpawnPoint that returns numeric x and y coordinates derived from the active level boss configuration rather than hardcoded constants.
- Running npm test -- tests/controllers/BossController.test.js exits with code 0 and asserts getBarrelSpawnPoint in src/controllers/BossController.js returns an x value less than or equal to the boss sprite x coordinate when the configured spawnAnchorOffset points toward the playfield.
- Unit tests: tests/controllers/BossController.test.js is committed and covers boss placement, missing optional animation config, and barrel spawn anchor calculation for at least one fixture from src/levels/level.fixtures.json.
- System integration tests: N/A — this story changes client-side Phaser controller behavior only and introduces no HTTP endpoint, service boundary, database table, or external API contract; scene-level integration is deferred to the barrel hazard story that consumes src/controllers/BossController.js.
- Mock data/fixtures: src/levels/level.fixtures.json contains a boss object with x, y, spriteKey, and spawnAnchorOffset fields that tests/controllers/BossController.test.js imports or loads without network access.

**Depends on:** WO-051, WO-056, WO-064

### [P0] Detect Motzfeldt Rescue Zone

Implement Motzfeldt rescue zone detection so reaching the top objective completes the current level or ends the game with final victory. The change belongs in the ObjectiveSystem module at src/systems/ObjectiveSystem.js. The current project architecture expects rescue data in level definitions, but the runtime still needs a dedicated system that detects Jumpman Løkke entering the configured Motzfeldt zone and emits the correct progression signal. This matters because the rescue moment is the player’s win condition and proves the climb, ladders, slopes, hazards, and level progression loop are connected. When complete, the system should create or register a rescue zone from level data, detect player overlap or boundary entry, ensure completion fires only once per level attempt, and call the existing game-state progression capability with level-complete or final-victory intent. The observable player behavior should be that reaching Motzfeldt at the top of a non-final level transitions to level complete, while reaching Motzfeldt on the final configured level transitions to final victory. This story does not implement barrel hazards, barrel collisions, score calculations, HUD rendering, new levels, production art, pause overlays, or deployment changes. It depends on the active play scene, level manager, player sprite, state-machine progression capability, and existing level rescue metadata. The detection should be testable with pure rectangle or bounds logic so the rescue rule remains reliable even when Phaser rendering assets are placeholders.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:barrel-boss-rescue, type:feature, runtime:phaser, complexity:medium, priority:P0 |

**Acceptance Criteria**
- Running npm test -- tests/systems/ObjectiveSystem.test.js exits with code 0 and asserts isPlayerInRescueZone or the exported detection method in src/systems/ObjectiveSystem.js returns true when the player bounds overlap the rescue rectangle from src/levels/level.fixtures.json.
- Running npm test -- tests/systems/ObjectiveSystem.test.js exits with code 0 and asserts ObjectiveSystem in src/systems/ObjectiveSystem.js invokes the level-complete transition method on a provided GameStateMachine double exactly once for a non-final level overlap.
- Running npm test -- tests/systems/ObjectiveSystem.test.js exits with code 0 and asserts ObjectiveSystem in src/systems/ObjectiveSystem.js invokes the final-victory transition method on a provided GameStateMachine double exactly once when the fixture marks the active level as final.
- File inspection of src/systems/ObjectiveSystem.js shows rescue zone x, y, width, height, and objective sprite or label fields are read from level rescue metadata rather than hardcoded top-of-screen coordinates.
- Unit tests: tests/systems/ObjectiveSystem.test.js is committed and covers overlap boundaries, non-overlap, one-shot completion, non-final level completion, and final-level victory behavior.
- System integration tests: N/A — this story has no HTTP endpoint, external service, or database boundary; the observable integration is an in-memory call from src/systems/ObjectiveSystem.js to the existing game-state progression capability.
- Mock data/fixtures: src/levels/level.fixtures.json contains rescue metadata with x, y, width, height, spriteKey or objectiveKey, and isFinalLevel or equivalent final-level metadata used by tests/systems/ObjectiveSystem.test.js.

**Depends on:** WO-053, WO-051, WO-056, WO-064

### [P0] Roll Barrels Right To Left

Implement right-to-left barrel hazards so the boss can release moving obstacles that create the core arcade challenge for Jumpman Løkke. The change belongs in the BarrelSystem module at src/systems/BarrelSystem.js. The current project plan separates barrel spawning and movement from boss placement, and this story turns the boss spawn anchor into visible rotating hazard sprites that travel into the playfield. This is valuable to stakeholders because barrels are the primary pressure mechanic that makes the rescue climb feel like a complete Donkey Kong-style arcade loop rather than a static platforming demo. When complete, a barrel spawned from the boss area should start with negative horizontal velocity, rotate visually as it moves, obey configured speed and spawn interval values, and update through the active scene without requiring backend state. The system should be deterministic enough for tests while still allowing level data to tune difficulty across the MVP levels. This story does not apply life-loss consequences, alter the score/lives HUD, implement rescue-zone completion, add true torque physics, introduce Matter.js, or create deployment automation. It depends on boss spawn anchor behavior, level barrel metadata, Phaser Arcade Physics setup, and the slope or platform-following capability already being available. Any optional ladder descent or semi-random routing should remain behind configuration and should not be required for the first vertical slice unless level data already exposes a route decision field.

| Field | Value |
|---|---|
| Story Points | 8 |
| Hours | 80h |
| Priority | P0 |
| Labels | epic:barrel-boss-rescue, type:feature, runtime:phaser, complexity:high, priority:P0 |

**Acceptance Criteria**
- Running npm test -- tests/systems/BarrelSystem.test.js exits with code 0 and asserts spawnBarrel or the exported BarrelSystem spawn method in src/systems/BarrelSystem.js creates a barrel with body.velocity.x less than 0 when given a boss spawn point from src/controllers/BossController.js.
- Running npm test -- tests/systems/BarrelSystem.test.js exits with code 0 and asserts update in src/systems/BarrelSystem.js changes barrel.rotation in the expected direction when the barrel has nonzero horizontal velocity.
- File inspection of src/systems/BarrelSystem.js shows spawn interval and speed values are read from level barrel configuration fields such as barrels.spawnIntervalMs, barrels.speedMin, and barrels.speedMax instead of being fixed literals inside the update loop.
- Running npm test -- tests/systems/BarrelSystem.test.js exits with code 0 and asserts barrels are removed or recycled when their x position moves beyond the left level boundary defined by the fixture level width in src/levels/level.fixtures.json.
- Unit tests: tests/systems/BarrelSystem.test.js is committed and covers spawn timing, negative initial velocity, rotation update, and cleanup or pooling behavior for barrels leaving the level bounds.
- System integration tests: N/A — this story is a client-only Phaser gameplay module with no service, HTTP API, database, or cross-process boundary; integration with CollisionSystem is covered by the collision life-loss story.
- Mock data/fixtures: src/levels/level.fixtures.json contains a barrels object with spawnIntervalMs, speedMin, speedMax, spriteKey, gravityY or platformFollowMode, and optional route fields used by tests/systems/BarrelSystem.test.js.

**Depends on:** WO-050, WO-065

### [P0] Apply Barrel Life Loss

Apply barrel collision life-loss handling so contact with a barrel has the clear arcade consequence players expect from a damaging hazard. The change belongs in the CollisionSystem module at src/systems/CollisionSystem.js. The barrel system can create moving hazards, but the game still needs collision handling that detects overlap with Jumpman Løkke and delegates life-loss state changes without letting duplicate contacts drain multiple lives in a single hit. This matters because score/lives, retry, and game-over flows depend on a trustworthy hazard consequence that players can learn and recover from quickly. When complete, an active barrel overlapping the player during normal play should trigger a single life-loss transition, mark or consume the collision event, and respect any existing respawn or invulnerability window. The observable behavior should be that barrel contact produces one hit event for the state machine while non-barrel objects and inactive barrels do not decrement lives. This story does not implement barrel spawning or movement, boss placement, rescue completion, score tuning, new HUD layout, sound assets, analytics, backend work, or deployment changes. It depends on player movement and hit/fail behavior, the barrel hazard system, active game-state transitions, and level lifecycle behavior already being available. The implementation should keep CollisionSystem responsible for detecting and routing collision outcomes while leaving lives counters and retry/game-over branching to the existing state-machine or score/lives component.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:barrel-boss-rescue, type:feature, runtime:phaser, complexity:medium, priority:P0 |

**Acceptance Criteria**
- Running npm test -- tests/systems/CollisionSystem.test.js exits with code 0 and asserts handleBarrelPlayerOverlap or the exported collision handler in src/systems/CollisionSystem.js calls the life-loss transition method exactly once when active player and active barrel bounds overlap.
- Running npm test -- tests/systems/CollisionSystem.test.js exits with code 0 and asserts src/systems/CollisionSystem.js does not call the life-loss transition method when the barrel object has active set to false or damageEnabled set to false.
- Running npm test -- tests/systems/CollisionSystem.test.js exits with code 0 and asserts repeated calls to the barrel overlap handler during a configured invulnerability or hit-cooldown window in src/systems/CollisionSystem.js do not decrement lives more than once.
- File inspection of src/systems/CollisionSystem.js shows barrel collision handling delegates life-loss, retry, or game-over decisions to the existing game-state or lives component rather than mutating unrelated HUD rendering directly.
- Unit tests: tests/systems/CollisionSystem.test.js is committed and covers active overlap, inactive barrel ignore behavior, cooldown or invulnerability guarding, and delegation to the game-state dependency.
- System integration tests: N/A — this story has no service, HTTP endpoint, database table, or external API boundary; the integration is client-side in-memory coordination between src/systems/CollisionSystem.js and the existing game-state dependency.
- Mock data/fixtures: tests/fixtures/collision.fixture.js or src/levels/level.fixtures.json provides deterministic player and barrel bounds used by tests/systems/CollisionSystem.test.js without loading image assets or a browser canvas.

**Depends on:** WO-053, WO-054, WO-067

---

## Level Progression, Score, Lives, and Content Build

### [P0] Validate Declarative Level JSON

Implement strict validation for declarative level JSON so malformed level content is rejected before players encounter broken platforms, ladders, barrels, or rescue objectives. The change belongs in the LevelManager module at src/levels/LevelManager.js, with supporting schema and fixture coverage in src/levels/level.schema.json and src/levels/level.fixtures.json. The current project direction expects levels to be data-driven, but unvalidated JSON would make failures appear later inside Phaser scene construction where they are harder to diagnose and recover from. Stakeholders need this because the MVP depends on three playable levels with predictable difficulty progression and a low-friction static-web launch, not runtime surprises during gameplay. When complete, LevelManager can load valid level definitions, return normalized level objects for downstream systems, and produce explicit validation errors for missing or out-of-bounds fields. Observable behavior includes deterministic acceptance of fixtures containing dimensions, player spawn, girder line segments, ladder zones, boss placement, barrel settings, rescue zones, and difficulty metadata. This story does not implement PlayScene rendering, Phaser Arcade Physics bodies, barrel behavior, score and lives rules, or production level layouts. It depends on the project having a browser client scaffold and prior level schema/fixture capability available for LevelManager to consume. The validation should remain local and deterministic so the game can continue to run without a backend, network access, accounts, or runtime telemetry.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:level-progression-score-lives-content, type:feature, area:levels, complexity:medium |

**Acceptance Criteria**
- Running npm test -- tests/levels/LevelManager.test.js exits with code 0 and asserts that loadLevelDefinition or the exported LevelManager validation function in src/levels/LevelManager.js accepts src/levels/level.fixtures.json entries containing dimensions, playerSpawn, girders, ladders, boss, barrels, rescue, and difficulty fields.
- Running npm test -- tests/levels/LevelManager.test.js exits with code 0 and asserts that src/levels/LevelManager.js rejects a fixture missing ladders[0].x with an Error message containing the path ladders[0].x.
- File inspection of src/levels/level.schema.json shows required root properties for id, name, dimensions, playerSpawn, girders, ladders, boss, barrels, rescue, difficulty, and tuning with numeric bounds for coordinates, sizes, barrel speeds, and spawn intervals.
- Mock data / fixtures: src/levels/level.fixtures.json is committed and contains at least three original placeholder level objects that exercise slope line segments, ladder zones, boss/barrel configuration, rescue zones, and increasing difficulty metadata.
- System integration tests: N/A — this story validates local static JSON consumed by src/levels/LevelManager.js and introduces no network endpoint, backend service, database table, or cross-service API boundary.
- Running npm test -- tests/levels/LevelManager.test.js exits with code 0 and asserts that validation errors from src/levels/LevelManager.js do not include stack traces or secret-like environment values such as process.env in player-facing error text.

**Depends on:** WO-046, WO-004

### [P0] Implement Score And Lives Rules

Implement deterministic score and lives rules so hazard hits, retries, level completion, game over, and final victory all update gameplay state consistently for players. The change belongs in the ScoreLivesRules module at src/state/ScoreLivesRules.js, with local unit tests covering every rule branch. The current MVP needs arcade-style feedback through a HUD, but embedding life and score decisions directly in scene code would make retries and level progression hard to debug. Stakeholders recognize this as a core product requirement because score/lives feedback is part of the complete game loop, not optional polish. When complete, rule functions should calculate starting state, life loss outcomes, level-complete scoring, retry eligibility, game-over transitions, and victory bonus behavior without requiring Phaser objects. Observable behavior includes a life being decremented only once for a valid hit event, score changes being predictable, and exhausted lives returning a game-over outcome rather than a retry outcome. This story does not render HUD text, create overlays, author level layouts, spawn barrels, or wire keyboard retry input in PlayScene. It depends on the existing game-state transition capability and the hazard collision capability because the rules module needs to consume collision outcomes and emit state decisions. The module should be pure and automation-friendly so Vitest can validate it without a canvas, network, accounts, analytics, or persistent storage.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:level-progression-score-lives-content, type:feature, area:state, complexity:medium |

**Acceptance Criteria**
- Running npm test -- tests/state/ScoreLivesRules.test.js exits with code 0 and asserts that createInitialScoreLivesState from src/state/ScoreLivesRules.js returns score 0, lives greater than 0, levelIndex 0, and status play or an equivalent documented active status.
- Running npm test -- tests/state/ScoreLivesRules.test.js exits with code 0 and asserts that applyHazardHit in src/state/ScoreLivesRules.js decrements lives by exactly 1 when lives remain and returns an outcome containing retry or lifeLost for PlayScene consumption.
- Running npm test -- tests/state/ScoreLivesRules.test.js exits with code 0 and asserts that applyHazardHit in src/state/ScoreLivesRules.js returns a gameOver outcome when the previous state has 1 remaining life.
- Running npm test -- tests/state/ScoreLivesRules.test.js exits with code 0 and asserts that applyLevelComplete in src/state/ScoreLivesRules.js increases score by a documented level-complete amount and returns nextLevel for non-final levels and victory for the final level.
- Mock data / fixtures: tests/state/ScoreLivesRules.test.js includes committed in-test fixture states for initial play, hit with remaining lives, hit with final life, non-final level completion, and final level completion so the test suite runs without Phaser or external data.
- System integration tests: N/A — src/state/ScoreLivesRules.js is a pure client-side rules module and introduces no service endpoint, HTTP status code, database table, or cross-service boundary.

**Depends on:** WO-053, WO-057

### [P0] Author Three MVP Levels

Author the three MVP level JSON files so Donkey Trump has a small complete game with increasing difficulty rather than a single mechanics demo. The change belongs in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json, using the validated level structure consumed by src/levels/LevelManager.js. The current project needs production-ready declarative content, and placeholder fixtures alone cannot satisfy the launch promise of three playable rescue levels. Stakeholders need this because the game’s perceived completeness depends on players climbing multiple levels, facing escalating barrel pressure, and reaching a final victory state. When complete, each JSON file should define dimensions, player spawn, sloped girder data, ladder zones, right-side boss placement, barrel tuning, Motzfeldt rescue zone, difficulty metadata, and jump-clearance tuning. Observable behavior includes LevelManager accepting all three files and downstream PlayScene systems having enough data to place platforms, ladders, barrels, the boss, and rescue objective without hardcoded per-level layouts. This story does not implement Phaser rendering, barrel AI, ScoreLivesRules, HUD overlays, final art assets, sound effects, analytics, or deployment behavior. It depends on validated level JSON capability plus existing slope, ladder, barrel, and rescue-zone consumers being able to read the declared fields. The level data must be original, English-neutral where text appears, and suitable for static browser delivery without copied Nintendo layouts or external data dependencies.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:level-progression-score-lives-content, type:content, area:levels, complexity:medium |

**Acceptance Criteria**
- File inspection of src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json shows each file contains id, name, dimensions, playerSpawn, girders, ladders, boss, barrels, rescue, difficulty, and tuning root properties.
- Running npm test -- tests/levels/LevelManager.test.js exits with code 0 and asserts that src/levels/LevelManager.js accepts src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json without validation errors.
- Running npm test -- tests/levels/level-content.test.js exits with code 0 and asserts that barrels.spawnIntervalMs in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json is monotonically non-increasing by level order.
- Running npm test -- tests/levels/level-content.test.js exits with code 0 and asserts that barrels.speedMax in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json is monotonically non-decreasing by level order.
- Mock data / fixtures: src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json are committed as static testable game data and contain original placeholder-safe geometry, boss/barrel settings, and rescue coordinates.
- System integration tests: Running npm test -- tests/levels/level-content.test.js exits with code 0 and verifies that the production level JSON files can be loaded through src/levels/LevelManager.js, which is the local integration boundary between authored data and gameplay systems.

**Depends on:** WO-051, WO-067, WO-066

### [P0] Wire Progression And End Flows

Implement the level-complete, retry, game-over, and final-victory flows so players can experience the full three-level arcade loop from first start through final rescue. The change belongs in the PlayScene module at src/scenes/PlayScene.js, orchestrating validated levels from src/levels/LevelManager.js and rule outcomes from src/state/ScoreLivesRules.js. The current gameplay shell is expected to host movement, barrels, rescue, HUD, and overlays, but the MVP is not complete until those systems produce visible state transitions after wins and failures. Stakeholders need this because a browser game that starts but cannot retry, advance, fail, or finish would not meet the small complete game promise. When complete, reaching Motzfeldt’s rescue zone on a non-final level advances to the next validated level, while reaching the final rescue zone shows a victory state. Observable behavior includes a barrel hit triggering life loss and retry when lives remain, game over when lives are exhausted, and keyboard retry restarting from the appropriate level or initial game state according to the accepted rules. This story does not author new level geometry, implement scoring formulas, create new character art, add analytics, build an admin surface, or change deployment automation. It depends on validated level data, barrel hazard collisions, rescue-zone detection, HUD capability, and pure score/lives rules already being available. The implementation should keep PlayScene as an orchestration layer so recovery paths are reliable and rule changes remain localized outside the Phaser scene.

| Field | Value |
|---|---|
| Story Points | 8 |
| Hours | 80h |
| Priority | P0 |
| Labels | epic:level-progression-score-lives-content, type:feature, area:scene-flow, complexity:high |

**Acceptance Criteria**
- Running npm test -- tests/scenes/PlayScene.progression.test.js exits with code 0 and asserts that src/scenes/PlayScene.js calls src/levels/LevelManager.js to load the next level after a rescue-zone completion on a non-final level.
- Running npm test -- tests/scenes/PlayScene.progression.test.js exits with code 0 and asserts that src/scenes/PlayScene.js enters a victory state or invokes the documented victory overlay path after the rescue-zone completion for src/levels/level3.json.
- Running npm test -- tests/scenes/PlayScene.progression.test.js exits with code 0 and asserts that a barrel hazard hit handled by src/scenes/PlayScene.js uses applyHazardHit from src/state/ScoreLivesRules.js and enters a life-loss or retry state when lives remain.
- Running npm test -- tests/scenes/PlayScene.progression.test.js exits with code 0 and asserts that a barrel hazard hit handled by src/scenes/PlayScene.js enters gameOver when src/state/ScoreLivesRules.js returns a gameOver outcome.
- File inspection of src/scenes/PlayScene.js shows progression logic imports or receives src/state/ScoreLivesRules.js and src/levels/LevelManager.js rather than duplicating score/lives formulas or hardcoding all three level layouts inline.
- Mock data / fixtures: tests/scenes/PlayScene.progression.test.js includes committed test doubles or fixture states for rescue completion, hazard hit with remaining lives, hazard hit on final life, and final-level completion.
- System integration tests: Running npm test -- tests/scenes/PlayScene.progression.test.js exits with code 0 and validates the local integration boundary among src/scenes/PlayScene.js, src/levels/LevelManager.js, src/state/ScoreLivesRules.js, and the three src/levels/level*.json files without external services.

**Depends on:** WO-066, WO-068, WO-057, WO-063, WO-069

### [P1] Tune Difficulty Bounds

Tune and enforce difficulty bounds so the three MVP levels become progressively harder without creating unfair jumps in barrel pressure, platform gaps, or ladder reachability. The change belongs in tests/levels/tuning-bounds.test.js and the authored level files under src/levels/*.json, especially src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json. The current content may be valid JSON, but validity alone does not prove the player can progress or that later levels escalate within an acceptable range. Stakeholders need this because completion rates and player trust depend on level 1 being approachable, later levels feeling harder, and no level becoming impossible under the reduced-jump ladder-based design. When complete, the tuning test should enforce monotonic barrel difficulty, sane speed and spawn bounds, feasible ladder rectangles, and jump-clearance constraints tied to the accepted movement model. Observable behavior includes a single local test command failing when a level violates spawn interval ordering, barrel speed ordering, vertical gap bounds, or required tuning metadata. This story does not change core movement physics, implement new barrel AI, add analytics measurement, introduce extra levels, or adjust deployment operations. It depends on score/lives rules, authored level data, and PlayScene flows being present so tuning checks reflect the actual game loop rather than isolated placeholder data. The tuning should remain data-only unless a small helper is required to read existing movement constants for verifiable jump-clearance assertions.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:level-progression-score-lives-content, type:tuning, area:levels, complexity:medium |

**Acceptance Criteria**
- Running npm test -- tests/levels/tuning-bounds.test.js exits with code 0 and asserts that barrels.spawnIntervalMs values in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json are monotonically non-increasing by level order.
- Running npm test -- tests/levels/tuning-bounds.test.js exits with code 0 and asserts that barrels.speedMax values in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json are monotonically non-decreasing by level order and remain within the documented bounds in the test file.
- Running npm test -- tests/levels/tuning-bounds.test.js exits with code 0 and asserts that every src/levels/level*.json file contains tuning.jumpClearanceRequired and that vertical platform gaps exceed the configured maximum direct-jump clearance where applicable.
- Running npm test -- tests/levels/tuning-bounds.test.js exits with code 0 and asserts that ladder rectangles in src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json stay within level dimensions and overlap the intended vertical traversal bands.
- Mock data / fixtures: N/A — this story uses the committed production-like fixtures src/levels/level1.json, src/levels/level2.json, and src/levels/level3.json as the test data under review.
- System integration tests: N/A — tests/levels/tuning-bounds.test.js validates static client gameplay data and introduces no service endpoint, HTTP boundary, database table, or cross-service workflow.

**Depends on:** WO-063, WO-069, WO-072

---

## Original Art, Animation, Audio, and Legal Asset Boundary

### [P0] Create Asset Originality Checklist

Create a minimum asset checklist so the team can prove the launch game uses original satire assets and avoids copied Nintendo or other protected material. The change belongs in the AssetRegister module at src/assets/assetRegister.json, with validation coverage in tests/assets/assetRegister.test.js and fixture examples under tests/fixtures. Stakeholders need this artifact because the first release depends on Jumpman Løkke, Motzfeldt, the Trump-inspired boss, barrels, platforms, effects, and audio being traceable to original sources before beta or launch. The current repository baseline has no committed asset governance file, so reviewers have no operational way to inspect required assets, source notes, legal boundary status, or replacement ownership. When complete, a developer can open src/assets/assetRegister.json and see every minimum launch asset category, required runtime key, expected path, asset type, originality status, reviewer fields, and launch readiness state. The checklist should be machine-readable JSON rather than prose so future release QA surfaces and tests can consume it without manual parsing. This story does not create final artwork, placeholder images, sound files, Phaser preload code, animation definitions, or any deployment automation. It depends on the agreed launch asset scope and the original-art legal boundary being treated as product requirements, but it does not require the runtime game shell to be finished. The implementation should be conservative about data classification by treating artwork metadata as internal project data and avoiding personal information, contact details, or unreviewed external source URLs in the register.

| Field | Value |
|---|---|
| Story Points | 2 |
| Hours | 20h |
| Priority | P0 |
| Labels | epic:original-assets, asset-governance, legal-boundary, complexity:low |

**Acceptance Criteria**
- File inspection of src/assets/assetRegister.json shows top-level fields version, dataClassification, lastReviewed, requiredAssets, and legalBoundaryNotes, with requiredAssets entries for player, rescue, boss, barrel, platform, ladder, hud, hitAudio, retryAudio, rescueAudio, hitEffect, retryEffect, and rescueEffect.
- File inspection of src/assets/assetRegister.json shows each requiredAssets item has id, runtimeKey, displayName, type, intendedPath, requiredForLaunch, originalityStatus, copiedAssetProhibited, reviewStatus, reviewer, replacementOwner, and notes fields.
- Running npm test -- tests/assets/assetRegister.test.js exits with code 0 and asserts every requiredAssets item in src/assets/assetRegister.json has copiedAssetProhibited set to true and originalityStatus set to one of original-required, original-placeholder, original-approved, or needs-review.
- Running npm test -- tests/assets/assetRegister.test.js exits with code 0 and asserts src/assets/assetRegister.json contains no asset path with donkey-kong, nintendo, mario, dk, ripped, rom, or sprite-rip in the intendedPath value.
- Unit tests: tests/assets/assetRegister.test.js is committed and validates the src/assets/assetRegister.json shape, required launch categories, allowed reviewStatus values, and duplicate id prevention.
- System integration tests: N/A — src/assets/assetRegister.json is a static governance artifact with no service, endpoint, Phaser scene, or browser runtime boundary in this story.
- Mock data/fixtures: tests/fixtures/assetRegister.valid.json and tests/fixtures/assetRegister.invalid.json are committed and are loaded by tests/assets/assetRegister.test.js without requiring network access or external files.

### [P0] Create Shell Placeholder Manifest

Create shell-critical placeholder assets and register them in the runtime asset manifest so the browser game can boot with original stand-ins before final art lands. The change belongs in the AssetManifest module at src/assets/assetManifest.json, with placeholder files under src/assets/sprites and validation in tests/assets/assetManifest.test.js. Stakeholders need this because the title screen, loading flow, instructions preview, and first playable shell cannot depend on copied art or missing final artwork. The current repository baseline has no manifest contract tying preload keys to asset files, so a future Phaser preload scene would either hard-code paths or fail late when an asset is absent. When complete, src/assets/assetManifest.json will list stable keys for the player, boss, rescue target, barrel, sloped platform, ladder, HUD marker, and minimal feedback effect placeholders, and every listed placeholder file will exist in the repository. The placeholder visuals should be intentionally simple and original, with clear filenames that identify them as temporary launch-shell assets rather than production art. This story does not create final caricature sprite sheets, polished audio, gameplay animation registration, level data, or any deployment workflow. It depends on the browser shell/preload capability and the minimum asset checklist so the manifest can use consistent runtime keys and required categories. The implementation should preserve startup reliability by keeping placeholders small, local, and deterministic with no network dependencies.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:original-assets, asset-manifest, startup-assets, complexity:medium |

**Acceptance Criteria**
- File inspection of src/assets/assetManifest.json shows top-level fields version, criticalStartupKeys, sprites, audio, effects, and manifestNotes, with criticalStartupKeys containing player.placeholder, boss.placeholder, rescue.placeholder, barrel.placeholder, platform.placeholder, ladder.placeholder, and hud.lifeIcon.placeholder.
- Running npm test -- tests/assets/assetManifest.test.js exits with code 0 and asserts every path referenced by src/assets/assetManifest.json exists under src/assets/sprites, src/assets/audio, or src/assets/effects.
- Running npm test -- tests/assets/assetManifest.test.js exits with code 0 and asserts every criticalStartupKeys value in src/assets/assetManifest.json resolves to exactly one manifest entry with preload set to true.
- File inspection of src/assets/sprites confirms placeholder sprite files referenced by src/assets/assetManifest.json are committed and use original neutral shapes or caricature-safe silhouettes rather than copied Nintendo or Donkey Kong imagery.
- Unit tests: tests/assets/assetManifest.test.js is committed and validates path existence, duplicate key prevention, startup key resolution, type allow-listing, and consistency with src/assets/assetRegister.json asset ids.
- System integration tests: tests/assets/assetManifest.test.js performs a filesystem-level integration check across src/assets/assetManifest.json, src/assets/assetRegister.json, src/assets/sprites, src/assets/audio, and src/assets/effects so the static asset boundary is validated without a running browser.
- Mock data/fixtures: tests/fixtures/assetManifest.valid.json and tests/fixtures/assetManifest.missing-file.json are committed and are used by tests/assets/assetManifest.test.js for positive and negative manifest validation.

**Depends on:** WO-001, WO-045

### [P0] Add Original Character Sprites

Add original caricature sprite assets for Jumpman Løkke, Motzfeldt, the Trump-inspired boss, and the barrel so gameplay can move beyond shell placeholders without legal asset risk. The change belongs under src/assets/sprites, with manifest and checklist updates in src/assets/assetManifest.json and src/assets/assetRegister.json plus validation in tests/assets/originalSprites.test.js. Stakeholders need these assets because the satire premise is core to the product and the release cannot ship with copied Nintendo sprites or generic unreviewed stand-ins. The current state has only the asset governance and placeholder manifest capability, so the target is a committed set of original sprite files with metadata that identifies them as launch-candidate caricature assets. When complete, file inspection will show separate player, rescue, boss, and barrel sprite assets under src/assets/sprites with matching manifest keys and register entries marked for originality review or approval. The sprites should support the planned animation states by using predictable frame dimensions or per-frame files, but this story does not wire animation names or frame-rate behavior into Phaser. This story does not create audio, visual feedback effects, final animation registration, level placement, collision logic, boss barrel spawning, or release sign-off. It depends on the approved minimum asset checklist and shell placeholder manifest so the final sprite keys can replace or complement placeholders without breaking preload consumers. The implementation should maintain startup discipline by keeping sprite dimensions and file sizes modest enough for a lightweight static browser game.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P0 |
| Labels | epic:original-assets, sprites, satire-art, complexity:medium |

**Acceptance Criteria**
- File inspection of src/assets/sprites shows committed original sprite assets for player-jumpman-lokke, rescue-motzfeldt, boss-trump-inspired, and barrel-original using paths referenced by src/assets/assetManifest.json.
- File inspection of src/assets/assetManifest.json shows non-placeholder sprite entries with runtime keys player.jumpman, rescue.motzfeldt, boss.trumpInspired, and barrel.original, each pointing to a file under src/assets/sprites.
- File inspection of src/assets/assetRegister.json shows the player, rescue, boss, and barrel requiredAssets entries reference the committed src/assets/sprites paths and have reviewStatus set to needs-review or approved, not missing.
- Running npm test -- tests/assets/originalSprites.test.js exits with code 0 and asserts each committed sprite path from src/assets/assetManifest.json exists, is non-empty, and has an allowed image extension png, webp, or svg.
- Running npm test -- tests/assets/originalSprites.test.js exits with code 0 and asserts no final sprite path or filename under src/assets/sprites contains donkey-kong, nintendo, mario, dk-rip, rom, ripped, or copied.
- Unit tests: tests/assets/originalSprites.test.js is committed and validates final sprite file existence, allowed extension, non-zero byte size, manifest linkage, and register linkage for src/assets/sprites.
- System integration tests: tests/assets/originalSprites.test.js validates the integration boundary across src/assets/sprites, src/assets/assetManifest.json, and src/assets/assetRegister.json without requiring Phaser rendering.
- Mock data/fixtures: tests/fixtures/originalSprites.manifest.fixture.json is committed and used by tests/assets/originalSprites.test.js to verify validation behavior without mutating src/assets/assetManifest.json.

**Depends on:** WO-045, WO-049

### [P1] Register Core Sprite Animations

Register player, boss, barrel, and rescue animations so Phaser scenes can use original sprite assets through a single deterministic animation registry. The change belongs in the AnimationRegistry module at src/rendering/AnimationRegistry.js, with asset metadata read from src/assets/assetManifest.json and validation in tests/rendering/AnimationRegistry.test.js. Stakeholders need this because the game’s arcade feel depends on visible movement, barrel rotation, hit/fail cues, and rescue feedback using original caricature assets rather than ad hoc scene-specific animation setup. The current state has sprite assets and manifest keys, but no central module defining animation keys, frame ranges, frame rates, repeat behavior, or duplicate-prevention behavior for Phaser animation registration. When complete, a scene can call registerCoreAnimations with a Phaser-like animation manager and receive registered animation definitions for player idle, walk, jump, climb, hit, boss idle, boss throw, barrel roll, rescue idle, and rescue complete. The module should be testable without a real Canvas or Phaser runtime by accepting a scene-like object with anims.exists, anims.create, and anims.generateFrameNumbers seams. This story does not create new artwork, adjust player controller state transitions, implement barrel physics, add rescue-zone game state transitions, or add audio and visual feedback assets. It depends on the game rendering seam, final or launch-candidate sprite assets, and gameplay systems that will later request animation keys during state changes. The implementation should fail safely by skipping duplicate animation creation when an animation key already exists, because Phaser scenes may re-enter after retry or level transitions.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:original-assets, animations, phaser, complexity:medium |

**Acceptance Criteria**
- File inspection of src/rendering/AnimationRegistry.js shows exported functions registerCoreAnimations, getCoreAnimationDefinitions, and resolveAnimationSpriteKey.
- Running npm test -- tests/rendering/AnimationRegistry.test.js exits with code 0 and asserts registerCoreAnimations creates animation keys player.idle, player.walk, player.jump, player.climb, player.hit, boss.idle, boss.throw, barrel.roll, rescue.idle, and rescue.complete.
- Running npm test -- tests/rendering/AnimationRegistry.test.js exits with code 0 and asserts registerCoreAnimations does not call anims.create for an animation key when the supplied anims.exists function returns true for that key.
- Running npm test -- tests/rendering/AnimationRegistry.test.js exits with code 0 and asserts resolveAnimationSpriteKey maps player, boss, barrel, and rescue animation groups to sprite keys present in src/assets/assetManifest.json.
- File inspection of src/rendering/AnimationRegistry.js shows barrel.roll has repeat set to -1 and a frameRate greater than 0, while player.hit and rescue.complete have finite repeat behavior.
- Unit tests: tests/rendering/AnimationRegistry.test.js is committed and validates animation definitions, duplicate registration skipping, manifest key resolution, and frame metadata without creating a real Phaser.Game instance.
- System integration tests: tests/rendering/AnimationRegistry.test.js validates the module boundary between src/rendering/AnimationRegistry.js and src/assets/assetManifest.json using a fake Phaser animation manager object with anims.exists, anims.create, and anims.generateFrameNumbers.
- Mock data/fixtures: tests/fixtures/animationManifest.fixture.json is committed and used by tests/rendering/AnimationRegistry.test.js to validate behavior when required sprite keys are present or missing.

**Depends on:** WO-054, WO-056, WO-065, WO-067, WO-066

### [P1] Add Original Feedback Assets

Add non-copied hit, retry, and rescue feedback assets so life loss, retry, and rescue moments can communicate clearly even before final polish. The change belongs in src/assets/audio and src/assets/effects, with registration metadata in src/assets/assetManifest.json and originality tracking in src/assets/assetRegister.json. Stakeholders need this because the arcade loop requires understandable feedback when Jumpman Løkke is hit by a barrel, retries after failure, or reaches Motzfeldt, and those cues must not borrow protected game sounds or visual effects. The current state has character sprite assets and a manifest structure, but no committed original feedback files for the hit, retry, or rescue states. When complete, developers can inspect src/assets/audio for original audio cues and src/assets/effects for matching visual effect descriptors or lightweight assets, with all paths referenced by the manifest. The implementation should support graceful degradation by allowing gameplay to continue if audio playback is blocked while visual effect assets remain available. This story does not implement the scoring model, life decrement logic, retry state machine, rescue-zone detection, final victory screen, or browser audio unlock UX. It depends on the original sprite asset set and the gameplay feedback trigger capability so these assets can be mapped to existing hit, retry, and rescue moments without inventing new game states. The assets should remain lightweight and local to preserve the static-web startup budget and avoid any runtime network calls.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P1 |
| Labels | epic:original-assets, audio, feedback-effects, complexity:medium |

**Acceptance Criteria**
- File inspection of src/assets/audio shows committed hit, retry, and rescue audio files referenced by src/assets/assetManifest.json, with filenames that do not contain nintendo, donkey-kong, mario, ripped, copied, rom, or sample-pack.
- File inspection of src/assets/effects shows committed hit, retry, and rescue visual feedback assets or descriptors referenced by src/assets/assetManifest.json.
- File inspection of src/assets/assetManifest.json shows audio keys feedback.hit.audio, feedback.retry.audio, and feedback.rescue.audio plus effect keys feedback.hit.effect, feedback.retry.effect, and feedback.rescue.effect.
- File inspection of src/assets/assetRegister.json shows hitAudio, retryAudio, rescueAudio, hitEffect, retryEffect, and rescueEffect entries reference the committed src/assets/audio and src/assets/effects paths with reviewStatus set to needs-review or approved.
- Running npm test -- tests/assets/feedbackAssets.test.js exits with code 0 and asserts every feedback path from src/assets/assetManifest.json exists, is non-empty, and is under src/assets/audio or src/assets/effects.
- Running npm test -- tests/assets/feedbackAssets.test.js exits with code 0 and asserts audio files under src/assets/audio use the allowed extension ogg or wav and visual effect files under src/assets/effects use the allowed extension json, png, webp, or svg.
- Unit tests: tests/assets/feedbackAssets.test.js is committed and validates path existence, extension allow-listing, non-zero byte size, unsafe-name rejection, manifest linkage, and register linkage for feedback assets.
- System integration tests: tests/assets/feedbackAssets.test.js validates the static integration boundary across src/assets/audio, src/assets/effects, src/assets/assetManifest.json, and src/assets/assetRegister.json without requiring live audio playback in a browser.
- Mock data/fixtures: tests/fixtures/feedbackAssets.manifest.fixture.json is committed and used by tests/assets/feedbackAssets.test.js to validate positive and missing-asset scenarios.

**Depends on:** WO-056, WO-068

---

## Privacy, Analytics Adapter, Accessibility, and Release QA

### [P0] Implement Disabled Analytics Allow List

Implement a disabled analytics event allow-list so Donkey Trump can accept privacy-reviewed gameplay event candidates without sending data and without risking personal-data collection. The change belongs in the AnalyticsAdapter module at src/analytics/AnalyticsAdapter.js, with local tests and fixtures added around that module. Stakeholders need this boundary because the product wants future engagement measurement while the MVP must launch with analytics disabled, no third-party services, no accounts, no persistent identifiers, and no hidden telemetry transport. The current target state is a small public adapter API that recognizes only approved event names, normalizes or rejects unexpected payload keys, and returns a safe no-op result that gameplay code can call without blocking the frame loop. When complete, a developer can inspect src/analytics/AnalyticsAdapter.js and see that event names are explicit constants rather than free-form strings, that payload fields are allow-listed, and that no fetch, XMLHttpRequest, navigator.sendBeacon, third-party SDK, localStorage identifier, or cookie access is introduced. The observable runtime behavior is that allowed candidate events return an accepted no-op result, disallowed names return a rejected or ignored no-op result, and malformed payloads never throw into gameplay callers. This story does not wire gameplay systems to emit events, create dashboards, persist telemetry, add a backend endpoint, configure retention jobs, or select an analytics provider. It depends on the browser client scaffold and local test runner capability being present so the adapter can be verified through fast unit tests. It also depends on the approved analytics event vocabulary and privacy-minimized payload policy from product and privacy planning.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P0 |
| Labels | epic:privacy-analytics-accessibility-qa, area:analytics, area:privacy, complexity:medium |

**Acceptance Criteria**
- File inspection of src/analytics/AnalyticsAdapter.js shows exported allowed event names for session_start, level_start, player_death, input_used, level_complete, and victory_complete, and shows no references to fetch, XMLHttpRequest, navigator.sendBeacon, localStorage, sessionStorage, document.cookie, or third-party analytics imports.
- Running npm test -- tests/analytics/AnalyticsAdapter.test.js exits with code 0 and asserts that trackAnalyticsEvent('level_start', { level: 1, lives: 3, scoreBand: '0-999', inputType: 'keyboard' }) returns a no-op accepted result without performing any network call.
- Running npm test -- tests/analytics/AnalyticsAdapter.test.js exits with code 0 and asserts that trackAnalyticsEvent('free_form_note', { message: 'hello' }) is rejected or ignored by src/analytics/AnalyticsAdapter.js without throwing.
- Unit tests written and passing: tests/analytics/AnalyticsAdapter.test.js covers isAllowedAnalyticsEvent, sanitizeAnalyticsPayload, and trackAnalyticsEvent for allowed names, unknown names, extra payload fields, invalid numeric bounds, and disabled transport behavior.
- System integration tests validating service/API boundaries: N/A — src/analytics/AnalyticsAdapter.js must not call any backend endpoint or external service in MVP; tests must instead assert that browser network primitives are not invoked.
- Mock data/fixtures generated and committed: tests/fixtures/analyticsEvents.fixture.js contains allowed and rejected payload examples used by tests/analytics/AnalyticsAdapter.test.js, including a fixture with PII-like extra fields that are removed or rejected.

**Depends on:** WO-004, WO-053

### [P1] Add Reduced Motion Handling

Implement reduced-motion handling so players who prefer less animation can use the pause/help surface without avoidable motion while preserving the arcade gameplay loop. The change belongs in the player settings module at src/config/playerSettings.js and the PauseHelpOverlay UI module at src/ui/PauseHelpOverlay.js. Stakeholders need this because accessibility hardening explicitly calls for reduced-motion support where feasible, and the pause/help overlay is one of the most important non-gameplay UI surfaces for instructions, retry guidance, and keyboard-first play. The current state is expected to have player settings and a pause/help overlay, but no canonical reduced-motion setting that the overlay can read and apply consistently. The target state is a settings helper that derives a default from the browser reduced-motion preference when available, exposes a deterministic override path for tests and UI state, and lets PauseHelpOverlay suppress decorative motion or animated preview effects when reduced motion is enabled. When complete, file inspection should show that the overlay reads from src/config/playerSettings.js rather than duplicating matchMedia logic or hardcoding animation decisions. Observable behavior is that enabling reduced motion removes or disables overlay animation classes, rolling preview motion, pulsing hints, and nonessential transitions while keeping English instructions, pause controls, focus behavior, and gameplay restart actions available. This story does not retune Phaser physics, change player jump height, disable essential gameplay animation, add mobile/touch controls, or implement a full settings persistence system. It depends on the browser UI scaffold, pause/help overlay capability, and accessible overlay keyboard focus patterns already existing in the client.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P1 |
| Labels | epic:privacy-analytics-accessibility-qa, area:accessibility, area:ui, complexity:medium |

**Acceptance Criteria**
- File inspection of src/config/playerSettings.js shows an exported reduced-motion setting helper that reads window.matchMedia('(prefers-reduced-motion: reduce)') when available and falls back to a deterministic default when window or matchMedia is unavailable.
- File inspection of src/ui/PauseHelpOverlay.js shows the overlay consumes the reduced-motion helper from src/config/playerSettings.js and applies a reduced-motion class, property, or render branch that disables nonessential overlay animation.
- Running npm test -- tests/ui/PauseHelpOverlay.reducedMotion.test.js exits with code 0 and asserts that PauseHelpOverlay renders no rolling preview animation class when the reduced-motion preference is true.
- Unit tests written and passing: tests/config/playerSettings.test.js covers matchMedia reduce, matchMedia no-preference, missing window, missing matchMedia, and explicit override behavior in src/config/playerSettings.js.
- System integration tests validating service/API boundaries: N/A — reduced-motion handling is client-only UI behavior and does not cross a service or HTTP API boundary.
- Mock data/fixtures generated and committed: tests/fixtures/playerSettings.fixture.js contains deterministic matchMedia stubs for reduce and no-preference cases used by tests/config/playerSettings.test.js and tests/ui/PauseHelpOverlay.reducedMotion.test.js.

**Depends on:** WO-044, WO-070, WO-062

### [P1] Wire Gameplay Events To Adapter

Wire candidate gameplay events to the disabled analytics adapter so the game has privacy-safe instrumentation seams without enabling telemetry transport. The integration centers on src/analytics/AnalyticsAdapter.js and the existing gameplay modules responsible for session start, level start, input usage, life loss, level completion, and final victory. Stakeholders need this because manual QA and future anonymous measurement both require consistent event names, but the launch posture must remain no-op, anonymous, and non-blocking. The current state after the adapter story is expected to provide an allow-listed module, while gameplay flow still has no standardized calls into that module. The target behavior is that important gameplay state transitions call trackAnalyticsEvent with minimized payloads such as level number, lives count, score band, and input type, and those calls are ignored locally by the disabled adapter. When complete, a developer can play through or inspect the lifecycle code and see event hooks at session start, each level start, first keyboard input, player death or life loss, level completion, and victory completion. This story does not enable a remote analytics provider, add a dashboard, store raw events, add accounts, add persistent session IDs, or change scoring and level tuning. It depends on the no-op adapter allow-list, the gameplay state machine, the level progression flow, the input handling flow, and the score/lives fail/retry flow being available. The implementation should fail operationally safe: if the adapter rejects an event or an import changes, gameplay must continue and the player must not see analytics-related errors.

| Field | Value |
|---|---|
| Story Points | 5 |
| Hours | 50h |
| Priority | P1 |
| Labels | epic:privacy-analytics-accessibility-qa, area:analytics, area:gameplay-integration, complexity:medium |

**Acceptance Criteria**
- File inspection confirms gameplay lifecycle code imports trackAnalyticsEvent from src/analytics/AnalyticsAdapter.js and emits only allow-listed event names for session_start, level_start, input_used, player_death, level_complete, and victory_complete.
- Running npm test -- tests/analytics/gameplayAnalyticsWiring.test.js exits with code 0 and asserts that starting level 1 emits trackAnalyticsEvent('level_start', expect.objectContaining({ level: 1 })) through the disabled adapter seam.
- Running npm test -- tests/analytics/gameplayAnalyticsWiring.test.js exits with code 0 and asserts that a simulated player death or life loss emits trackAnalyticsEvent('player_death', expect.objectContaining({ level: expect.any(Number), lives: expect.any(Number) })) without changing the game-state transition result.
- Unit tests written and passing: tests/analytics/gameplayAnalyticsWiring.test.js covers candidate event emission for session start, level start, first keyboard input, player death, level completion, and final victory using local fakes or fixtures.
- System integration tests validating service/API boundaries: tests/analytics/gameplayAnalyticsWiring.test.js verifies that the gameplay modules communicate only with src/analytics/AnalyticsAdapter.js and do not call fetch, XMLHttpRequest, navigator.sendBeacon, localStorage, or document.cookie.
- Mock data/fixtures generated and committed: tests/fixtures/gameplayAnalytics.fixture.js contains deterministic sample game-state transitions for level start, death, level completion, and victory so analytics wiring tests do not require live Phaser rendering or external services.

**Depends on:** WO-058, WO-066, WO-068, WO-072

### [P1] Gate Release QA Dev Route

Gate the AccessibilityReleaseQASettingsPage behind a dev-only route so release-readiness tools exist for builders without creating a production admin surface. The change belongs in src/routes/devRoutes.js and should protect src/pages/AccessibilityReleaseQASettingsPage.js plus its supporting panels in src/ui/AssetRegisterPanel.js and src/ui/AnalyticsDisabledChecklist.js. Stakeholders need this because the MVP architecture explicitly excludes admin surfaces, and production builds must fail closed rather than merely hiding a link. The current state is expected to include a release QA settings page or supporting components, but route access is not yet guaranteed to be development-only. The target behavior is that development mode can register and render the QA page for accessibility, asset originality, and disabled-analytics checks, while production mode returns no route entry and cannot expose the page by direct URL through the app route table. When complete, a developer can inspect src/routes/devRoutes.js and see an environment-gated route factory or exported route list that omits AccessibilityReleaseQASettingsPage unless the build is explicitly in development mode. The observable UI behavior is that local development can open the dev QA route, but production route generation contains no path that maps to the QA page. This story does not add authentication, an operator dashboard, production monitoring, deployment configuration, or any runtime admin capability. It depends on the disabled analytics adapter, reduced-motion settings, and existing accessibility release QA page components being available so the page can remain useful in development without expanding launch surface area.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P1 |
| Labels | epic:privacy-analytics-accessibility-qa, area:accessibility, area:routing, area:release-qa, complexity:medium |

**Acceptance Criteria**
- File inspection of src/routes/devRoutes.js shows that AccessibilityReleaseQASettingsPage from src/pages/AccessibilityReleaseQASettingsPage.js is included only when a development-mode condition such as import.meta.env.DEV or an injected isDev flag is true.
- Running npm test -- tests/routes/devRoutes.test.js exits with code 0 and asserts that getDevRoutes({ isDev: true }) includes the route path for AccessibilityReleaseQASettingsPage and that getDevRoutes({ isDev: false }) returns no route targeting src/pages/AccessibilityReleaseQASettingsPage.js.
- Running npm test -- tests/routes/devRoutes.test.js exits with code 0 and asserts that the production route list does not include dev, qa, accessibility-release, or AccessibilityReleaseQASettingsPage component references from src/routes/devRoutes.js.
- Unit tests written and passing: tests/routes/devRoutes.test.js covers development mode, production mode, missing environment input, and direct-route lookup behavior for src/routes/devRoutes.js.
- System integration tests validating service/API boundaries: N/A — route gating is a client-side static route-table behavior with no HTTP API, authentication service, or backend boundary in MVP.
- Mock data/fixtures generated and committed: tests/fixtures/devRoutes.fixture.js contains deterministic development and production environment inputs for src/routes/devRoutes.js tests.

**Depends on:** WO-045, WO-058, WO-073

### [P2] Add Game Performance Budget Tests

Add startup payload and FPS budget checks so Donkey Trump keeps its instant-play promise and arcade responsiveness before release. The change belongs in the performance test module at tests/performance/gamePerformanceBudget.test.js, with assertions tied to the Vite build output and the gameplay performance thresholds from the product architecture. Stakeholders need this because the title screen should be ready within 5 seconds for supported desktop QA sessions, critical startup resources should stay lightweight, and normal gameplay should maintain at least 45 FPS. The current state has performance goals in product artifacts, but no dedicated local test that fails when startup assets grow beyond budget or the FPS floor is not encoded as a release gate. The target behavior is a deterministic test that can run after npm run build, inspect dist output or build metadata, and assert compressed startup payload limits plus an explicit frame-rate budget constant. When complete, a developer can run the performance test and see a clear pass or fail for the critical startup payload threshold and the minimum gameplay FPS threshold. This story does not add runtime monitoring, browser telemetry, cloud load testing, Lighthouse automation, deployment configuration, or real-user observability. It depends on the Vite build artifact, level/content assets, and gameplay loop performance configuration being available from earlier build and content stories. The test should be operationally useful by producing failure messages that tell maintainers which artifact or threshold exceeded budget, enabling a quick rollback or asset-size correction before release.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P2 |
| Labels | epic:privacy-analytics-accessibility-qa, area:performance, area:qa, complexity:medium |

**Acceptance Criteria**
- Running npm run build followed by npm test -- tests/performance/gamePerformanceBudget.test.js exits with code 0 and asserts that critical startup resources under dist are at or below a 5 MB compressed budget.
- Running npm test -- tests/performance/gamePerformanceBudget.test.js exits with code 0 and asserts that the minimumGameplayFps budget referenced by the test is at least 45 FPS for normal gameplay.
- Running npm test -- tests/performance/gamePerformanceBudget.test.js exits with code 0 and reports the largest dist asset path when a fixture or simulated bundle exceeds the startup payload budget.
- Unit tests written and passing: tests/performance/gamePerformanceBudget.test.js covers under-budget assets, over-budget assets, missing dist directory or manifest behavior, and the 45 FPS minimum threshold.
- System integration tests validating service/API boundaries: N/A — performance budget validation is local static-artifact and configuration testing with no backend API or service boundary in the MVP.
- Mock data/fixtures generated and committed: tests/fixtures/performanceBudget.fixture.js contains representative asset-size and frame-budget inputs used by tests/performance/gamePerformanceBudget.test.js without requiring external downloads.

**Depends on:** WO-052, WO-072, WO-074

### [P1] Add Browser WCAG QA Checks

Add automated browser-support and WCAG-oriented checks so release QA can verify the supported desktop matrix, keyboard-first UI expectations, reduced-motion behavior, and non-gameplay accessibility requirements before launch. The change belongs in the QA test module at tests/qa/browserSupportMatrix.test.js, with assertions that reference the client modules responsible for reduced motion and dev-only release QA route gating. Stakeholders need this because the product promises instant browser play, English-only accessible UI, keyboard-first desktop support, and no production admin surface, and these items should be codified as repeatable checks rather than manual memory. The current state has accessibility and browser-support requirements in product artifacts, but no dedicated local test file that enforces them for release candidates. The target behavior is a Vitest-based QA test that runs locally, requires no cloud browser farm, and fails when the support matrix omits required desktop browser families or when accessibility release criteria drift from the implemented modules. When complete, a developer can run the specific QA test and see assertions for current and previous major Chromium-based desktop browsers, Firefox desktop, Safari desktop, keyboard operability expectations for critical non-gameplay UI, reduced-motion coverage, and the dev-only QA page being absent from production routes. This story does not add Playwright, Cypress, visual regression testing, mobile browser certification, screen-reader certification, deployment automation, or manual QA sign-off. It depends on the browser support matrix being defined, critical UI overlays being implemented, reduced-motion support existing, and the dev-only QA route gate being in place. The checks should be deterministic and low-blast-radius so they can run in CI or locally without external services.

| Field | Value |
|---|---|
| Story Points | 3 |
| Hours | 30h |
| Priority | P1 |
| Labels | epic:privacy-analytics-accessibility-qa, area:qa, area:accessibility, area:browser-support, complexity:medium |

**Acceptance Criteria**
- Running npm test -- tests/qa/browserSupportMatrix.test.js exits with code 0 and asserts that tests/qa/browserSupportMatrix.test.js defines or imports supported desktop coverage for Chromium-based browsers, Firefox, and Safari with current-stable and previous-major expectations where applicable.
- Running npm test -- tests/qa/browserSupportMatrix.test.js exits with code 0 and asserts that reduced-motion support is covered by referencing src/config/playerSettings.js and src/ui/PauseHelpOverlay.js expectations.
- Running npm test -- tests/qa/browserSupportMatrix.test.js exits with code 0 and asserts that production route checks reference src/routes/devRoutes.js and confirm AccessibilityReleaseQASettingsPage is not part of the production route list.
- Running npm test -- tests/qa/browserSupportMatrix.test.js exits with code 0 and includes WCAG-oriented assertions for keyboard operability, visible focus, readable contrast threshold text, English-only launch UI expectation, and no critical information conveyed by color alone for non-gameplay UI.
- Unit tests written and passing: tests/qa/browserSupportMatrix.test.js is the required Vitest QA test file and covers browser matrix completeness, reduced-motion expectations, keyboard accessibility checklist items, and dev-only route gating.
- System integration tests validating service/API boundaries: N/A — the MVP has no backend API for browser support or WCAG checks; this test validates static client release criteria and internal module boundaries.
- Mock data/fixtures generated and committed: tests/fixtures/browserSupportMatrix.fixture.js contains representative supported and unsupported browser matrix entries used by tests/qa/browserSupportMatrix.test.js.

**Depends on:** WO-060, WO-061, WO-062, WO-073, WO-076
# AGENTS.md — Xantar

## Project

Xantar is an arcade game inspired by **BurgerTime** (Data East, 1982): the
player controls a chef who walks across giant burger ingredients to make them
fall and stack on plates, while anthropomorphic food enemies chase him. It is
the author's own version of the classic, not a port or a clone of the original
assets.

The game is written in **TypeScript** with **Phaser 4** and bundled with
**Vite**. The same code runs in the browser and ships as a desktop app through
**Electron + electron-builder**. It is currently a single-screen POC; the
mechanics will be refined and extended over time.

## Stack and constraints

- Phaser `^4.2.1`, TypeScript `~5.9`, Vite `~7`, Electron `~44`,
  electron-builder `~26`.
- Fixed logical resolution **640×480** with `Phaser.Scale.FIT`, built on a
  **32 px grid** (20×15). Keep coordinates tied to `src/config.ts`; do not
  hardcode screen positions.
- Movement is **custom** (platform/ladder grid), not Arcade Physics. There is
  no `arcade`/`matter` physics plugin in use.
- Assets live in `public/` and are copied as-is to `dist/`; reference them with
  root-relative paths (`assets/foo.png`). Keep
  `loader.imageLoadType: 'HTMLImageElement'` in `src/main.ts`: Phaser defaults
  to XHR, which is blocked under `file://` inside Electron.
- Do not add new runtime dependencies without an approved OpenSpec change.

## Commands

| Command                           | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | Web dev server (http://localhost:5173)                 |
| `npm run dev:desktop`             | Vite + Electron window (renderer hot-reload)           |
| `npm run build`                   | Type-check renderer + web build into `dist/`           |
| `npm run preview`                 | Serve `dist/` to test the production web build         |
| `npm run build:electron`          | Compile `electron/*.ts` into `dist-electron/`          |
| `npm run build:desktop`           | Type-check + web + Electron + installers in `release/` |
| `npm run build:desktop:dir`       | Same, unpacked app (fast local test)                   |
| `npm run typecheck`               | Type-check renderer **and** Electron process           |
| `npm run lint` / `lint:fix`       | ESLint                                                 |
| `npm run format` / `format:check` | Prettier                                               |

Before handing off a change, run `npm run lint && npm run format:check &&
npm run typecheck && npm run build` and keep a runnable build. Opening
`index.html` directly does **not** work: use the Vite dev server or the built
`dist/`.

## Code conventions

- ES2022 with private `#` fields, as used in the scene/object classes.
- Type-only imports are required (`verbatimModuleSyntax` is on): use
  `import { type Foo } from ...` for types.
- `override` is mandatory when overriding base members (`noImplicitOverride`).
- Renderer code (`tsconfig.json`) is browser-only (`types: []`): never import
  Node APIs such as `fs` or `path` from `src/`. Electron-only code goes in
  `electron/` and uses `tsconfig.electron.json`.
- Code, identifiers and comments in English.
- No comments unless they add information the code cannot express.
- Formatting/lint are enforced by Prettier and ESLint.

## Language and files

- Use English for source, identifiers, comments, scripts, technical docs,
  commits and pull requests.
- GitHub issues and milestones: titles and descriptions always in English.
- OpenSpec artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/*.md`) and
  conversation with the user remain in **Spanish**.
- `README.md` is the public, player-facing manual (English): what the game is,
  how to play and where to run it. Update it when gameplay or distribution
  changes.
- `docs/MANUAL.md` is the developer manual, kept in **Spanish** as the single
  documented exception to the English rule: architecture, tooling and
  workflows. Keep it in sync with structural changes.
- This `AGENTS.md` is durable context versioned in the repository, so it
  survives clones/moves. `openspec/`, `.opencode/`, `.claude/` and `.vscode/`
  are private working material and are git-ignored: do not reference them from
  published files such as `README.md`.

## OpenSpec

OpenSpec is the default workflow for changes. For each change: create
`proposal.md` and `design.md` (plus `tasks.md` and any required `specs/`
deltas), then **STOP** until the user approves proposal and design. Do not start
implementing tasks until then. Archive only after the user confirms.

This is not mandatory. If the programmer explicitly states that OpenSpec should
not be used (or that the change should be made directly), skip the workflow and
implement the change directly.

Artifact language: prose in `proposal.md`, `design.md`, `tasks.md` and
`specs/*.md` is written in Spanish, except the fixed labels imposed by the
OpenSpec skills, which stay in English as-is (`Why`, `What Changes`,
`Capabilities`, `Impact`, `Context`, `Goals`/`Non-Goals`, `Decisions`,
`Risks / Trade-offs`, `Migration Plan`, `Open Questions`, `Purpose`,
`ADDED`/`MODIFIED`/`REMOVED`/`RENAMED Requirements`, `Requirement:`,
`Scenario:`, `WHEN`/`THEN`/`AND`, `SHALL`/`MUST`). Code identifiers stay in
English inside the Spanish text.

## Working preferences

- Conversation with the user in Spanish; durable context in repo files (this
  `AGENTS.md`) rather than internal memory.
- The agent does **not** commit on its own: work stays uncommitted until the
  user validates it, including visual verification. Push only when the user
  asks.
- Leave the working tree in a compiling, runnable state after each change.
- Prefer small, reviewable increments; the game is a POC that will grow.

## GitHub workflow (issues, branches, PRs)

Repository: `git@github.com:madialeva/xantar.git` (default branch `main`).

1. OpenSpec proposal approved by the user.
2. GitHub issue for the change, linking its `openspec/changes/<name>/` folder.
3. Branch from `main`, named like `change/<slug>`.
4. Implementation on the branch. The agent never commits on its own; the user
   validates first (including running the game).
5. PR toward `main` with `Closes #<n>` in the description; the user reviews the
   diff.
6. Squash merge as the norm (one change = one clean commit on `main`).

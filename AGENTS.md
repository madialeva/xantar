# AGENTS.md — Xantar

## Project

Xantar is an arcade game inspired by **BurgerTime** (Data East, 1982): the
player controls a chef who walks across giant burger ingredients to make them
fall and stack on plates, while anthropomorphic food enemies chase him. It is
the author's own version of the classic, not a port or a clone of the original
assets.

The game is written in **TypeScript** with **Phaser 4** and bundled with
**Vite**. The same code runs in the browser and ships as a desktop app through
**Electron + electron-builder**. It is currently a single-screen game with one
classic level; the mechanics and the content will be extended over time. The
roadmap lives in the GitHub issues and in the README.

## Stack and constraints

- Phaser `^4.2.1`, TypeScript `^7` (native compiler), Vite `^8`, Vitest `^5`,
  Oxlint (+ tsgolint) for linting, Prettier for formatting, Electron `^44`,
  electron-builder `^26`. Node `>=22.12` (development on Node 24, see
  `.nvmrc`).
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
| `npm run lint` / `lint:fix`       | Oxlint with type-aware rules                           |
| `npm run test` / `test:watch`     | Vitest (simulation core and pure logic)                |
| `npm run format` / `format:check` | Prettier                                               |

Before handing off a change, run `npm run lint && npm run format:check &&
npm run typecheck && npm run test && npm run build` and keep a runnable build. Opening
`index.html` directly does **not** work: use the Vite dev server or the built
`dist/`.

## Code conventions

- ES2022 with ES private `#` fields for class internals (runtime-private, not
  the TypeScript `private` keyword); `protected` only for deliberate subclass
  extension points; `readonly` for fields that never change after construction.
- Type-only imports are required (`verbatimModuleSyntax` is on): use
  `import { type Foo } from ...` for types.
- `override` is mandatory when overriding base members (`noImplicitOverride`).
- Renderer code (`tsconfig.json`) is browser-only (`types: []`): never import
  Node APIs such as `fs` or `path` from `src/`. Electron-only code goes in
  `electron/` and uses `tsconfig.electron.json`.
- Code, identifiers and comments in English.
- Every class has a short doc comment (`/** ... */`, one to three lines, in English)
  right above it saying what it is for and, when it helps, which role it plays in
  the design (for example a Strategy or a State). The same goes for the interfaces
  that define a collaborator role. The name of a class is not always enough for
  someone who is just reading files. Apart from that, no comments unless they add
  information the code cannot express.
- Formatting is enforced by Prettier and linting by Oxlint (with type-aware
  rules). `src/sim/` has extra lint guards: no Phaser, DOM or Node imports, no
  browser globals, no `Date` and no `Math.random` (inject an `Rng`).
- Dependencies follow the latest stable versions that are compatible with each
  other; no compatibility paths for old Node versions or browsers. The minimum
  Node version is the one required by the toolchain (currently Vite and
  Vitest).
- Run Electron from a shell where `ELECTRON_RUN_AS_NODE` is unset (some editor
  terminals set it, which makes the app behave as plain Node).

## Design philosophy

The code is **object-oriented first**, in the Java/C# tradition, and uses the
functional and structural features of TypeScript where they are the better
tool. This is a deliberate choice of the author: keep it when adding code.

- **Objects model things with identity, state and lifecycle** (the simulation,
  chef, enemies, ingredients, the level…). State is encapsulated and the
  behavior lives with the data it works on. Avoid anemic data bags operated by
  free functions.
- **Program to interfaces.** Collaborators (random source, event sink, input
  source, audio…) are injected through constructors as interfaces, so they can
  be substituted in tests. Prefer **composition over inheritance**; inheritance
  only for a real is-a with shared behavior, at most two levels. Where behavior
  varies (enemy AI, entity states, game phases), use Strategy/State objects
  instead of `switch` chains on a type tag.
- **Dependency injection is manual constructor injection**, wired in a single
  composition root (the scene or `main.ts` creates the objects and passes their
  collaborators). No DI container, no decorators or `reflect-metadata`: they add
  runtime weight and magic that TypeScript does not need. Factories and plain
  functions are acceptable injection points.
- The author is experienced in Java/.NET OOP and delegates the choice of the
  most idiomatic, modern TypeScript approach to the agent: recommend and justify
  when a different technique serves better than the classic OO one.
- **Use design patterns by name when they fit** (Strategy, State, Observer,
  Factory, Command), without ceremony.
- **Functional where it is the better tool:** pure functions for stateless
  computation (geometry, unit conversion, level loading and validation,
  scoring); immutable data (`readonly`, discriminated unions for events and
  values); array pipelines (`map`/`filter`/`reduce`) and higher-order functions
  instead of hand-written loops when clearer. In those pure parts, return new
  values instead of mutating arguments.
- **Idiomatic TypeScript, not transliterated Java:** structural typing and
  interfaces without an `I` prefix; module-level functions instead of
  static-only utility classes; union types or `as const` objects instead of
  `enum`; no getter/setter boilerplate (use `readonly` fields; accessors only to
  enforce an invariant); no namespaces.
- **Layering:** domain logic (rules, state, AI, level data) must not depend on
  Phaser, the DOM or Node. The Phaser layer (scenes, game objects) only
  presents: it reads the domain model, collects input and reacts to its events.
  Dependencies flow view → domain, never the reverse. The domain core lives in
  `src/sim/`.
- Every domain object is testable without a canvas; add the test with the
  behavior.

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
  survives clones/moves. `openspec/` (specs, changes and their archive) is
  versioned too: it is the project's design record, written in Spanish.
  `.opencode/`, `.claude/` and `.vscode/` are private working material and are
  git-ignored: do not reference them from published files such as `README.md`.

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
- Commits, pull request descriptions, issues and comments carry no
  `Co-Authored-By` trailer, "Generated with ..." line or any other AI
  attribution: the author is the only author. This overrides the default
  attribution of the tooling.
- Leave the working tree in a compiling, runnable state after each change.
- Prefer small, reviewable increments; the game will keep growing.

## GitHub workflow (issues, branches, PRs)

Repository: `git@github.com:madialeva/xantar.git`.

There is no `main`/`master`. The long-lived, default branch is
`develop/vX.Y.Z` (for example `develop/v1.0.0`), which holds the version
currently under development. Releasing cuts `release/vX.Y.Z` from it and tags
`vX.Y.Z`; hotfixes bump the patch digit. When a new cycle starts,
`develop/vX.Y.Z` is created from the released tag and becomes the default
branch. The program version lives as the single source of truth in
`package.json` (`version`) and must match the branch suffix. Until the CI
workflow exists, check it by hand when cutting a branch; the CI change adds the
automatic check on `develop/**` and `release/**` pushes.

Each OpenSpec change is tracked on GitHub with this cycle:

1. Planned changes may have a GitHub issue **before** their OpenSpec proposal
   exists (roadmap issue: scope and rationale, in English). The proposal is
   written when the change is picked up.
2. OpenSpec proposal approved by the user.
3. The change has a GitHub issue (create it if it does not exist yet) linking
   its `openspec/changes/` folder, assigned to the milestone of its target
   version (one milestone per version, named `vX.Y.Z`; the Projects board, if
   any, stays light: Todo / In progress / Done). While active, the change
   folder is named `is<n>-<slug>` after its issue; the date prefix is added
   only when the change is archived.
4. Branch created from the issue (Development panel → "Create a branch"; name
   like `change/is<n>-<slug>`) starting from `develop/vX.Y.Z`.
5. Implementation on the branch + push (pushes are done by the user). The agent
   never commits on its own: work stays uncommitted on the branch until the
   user validates it (including running the game); commit only after the user
   explicitly confirms.
6. PR toward `develop/vX.Y.Z` with `Closes #<n>` in the description → the CI
   (once it exists) validates the PR → the user reviews the diff.
7. Squash merge as the norm (one change = one clean commit on the development
   branch). Exception: PRs whose intermediate commits have standalone value
   (e.g. massive deletions separated from new code) → normal merge.
8. The last commit on the branch may be the archiving of the change (only
   after user confirmation), so merged PR = closed issue (automatic via
   `Closes`) = archived change.
9. After archiving a change, always review its Non-Goals section. For each
   line leaving useful pending work, create a follow-up issue (English) that
   explains the pending scope, links the archived change, keeps the relation to
   the original Non-Goal, and carries the milestone of the version where it is
   planned. Skip Non-Goals already covered by an existing roadmap issue: link
   to that issue instead of duplicating it.

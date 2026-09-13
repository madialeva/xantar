<h1 align="center">Xantar</h1>

<p align="center"><em>An own take on the classic arcade BurgerTime (Data East, 1982)</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/Phaser-4-8A2BE2" alt="Phaser 4" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white" alt="Electron" />
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/platforms-Browser%20%2F%20Desktop-blue" alt="Browser and desktop" />
</p>

**Xantar** is a single-screen arcade game where you control a chef running over
giant burger ingredients. Walking across an ingredient from side to side makes
it fall down the platforms and stack on the plates, eventually building whole
burgers. Meanwhile, anthropomorphic food (hot dogs, pickles and eggs) chases
you across walkways and ladders.

It is written in **TypeScript** with the **Phaser** engine and bundled with
**Vite**. The same code runs in the browser and ships as a desktop application
through **Electron** (like VS Code or Discord).

> **Note:** this repository currently holds an initial **proof of concept
> (POC)**. Its purpose was to explore and validate the game's core mechanics
> (moving over ingredients, chain falls, enemies and pepper); it is not the
> final version. The final game will be developed on top of this POC.

---

## Status

| Status | Feature                                                |
| :----: | ------------------------------------------------------ |
|   ✅   | Title screen ("CLICK TO PLAY")                         |
|   ✅   | Chef controllable across platforms and ladders         |
|   ✅   | Ingredients that fall in chains and stack on the plate |
|   ✅   | Three chasing enemies (hot dog, pickle, egg)           |
|   ✅   | Pepper to stun enemies                                 |
|   ✅   | Scoring, lives and levels                              |
|   ✅   | Desktop application (Electron)                         |
|   ⬜   | Bonus food (ice cream, coffee, fries)                  |
|   ⬜   | Music and sound effects in-game                        |
|   ⬜   | Touch controls for mobile                              |
|   ⬜   | Public web deployment                                  |

---

## How to play

### Goal

Assemble **every burger** on the screen. Each burger has four pieces: bottom
bun, patty, lettuce and top bun. They start spread over the platforms and you
must bring them all the way down to the plate.

### Controls

| Action                            | Key                     |
| --------------------------------- | ----------------------- |
| Move                              | Left/right arrows       |
| Climb up and down ladders         | Up/down arrows          |
| Throw pepper                      | `Space`                 |
| Confirm (level clear / game over) | `Enter`                 |
| Back to the title                 | `Esc` or the `✕` button |

You can also play with the `W`, `A`, `S`, `D` keys.

### Ingredients and falls

- When the chef **walks an ingredient from side to side**, it falls one platform
  down and pushes whatever ingredients are below it: a **chain reaction**.
- The pieces stack on the plate in the right order (bottom bun first, then
  patty, lettuce and finally the top bun).
- By walking over them again, the burger moves down level by level until it is
  complete.
- Every piece that falls is worth **50 points**.

### Enemies

- **Mr. Hot Dog**, **Mr. Pickle** and **Mr. Egg** roam the maze and chase you
  using the ladders.
- If they touch you, you **lose a life**.
- You can **crush them** by dropping an ingredient on top of them. They respawn
  after a few seconds.
- Crushing enemies in a row increases the scoring multiplier.

### Pepper

- You start with **5 pepper shots**.
- When thrown, the chef creates a cloud in the direction he is facing and
  **stuns** the enemies it touches, so you can walk through them safely.
- Completing a burger grants one extra shot.

### Scoring

| Action             | Points      |
| ------------------ | ----------- |
| Drop an ingredient | 50          |
| Complete a burger  | 400         |
| Crush an enemy     | 100 × combo |

### Lives and game over

- You have **3 lives**.
- Every touch from a non-stunned enemy costs a life.
- Complete all four burgers to advance to the next level (difficulty increases).
- When you lose every life, **GAME OVER** appears; press `Enter` to restart.

---

## Where to play

### Browser

The game is a static web application. For now it runs locally:

```sh
npm install
npm run dev
```

Open http://localhost:5173. The production build is generated with
`npm run build` and tested with `npm run preview`.

### Desktop

It can also be packaged as a desktop application with Electron:

```sh
npm install
npm run build:desktop:dir   # unpacked app (fast to launch)
./release/linux-unpacked/xantar
```

To generate installers (AppImage on Linux, `.exe` on Windows, `.dmg` on macOS):

```sh
npm run build:desktop
```

Installers are written to `release/`. Only the format of the host system can be
built; publishing for several platforms requires building on each of them.

---

## Technologies

| Technology           | Use                                   |
| -------------------- | ------------------------------------- |
| **TypeScript**       | Game language (strict typing)         |
| **Phaser 4**         | Game engine (scenes, objects, tweens) |
| **Vite**             | Dev server and web bundling           |
| **Electron**         | Desktop application wrapper           |
| **electron-builder** | Installer generation                  |

---

## Requirements

- **Node.js** 20.19+ or 22.12+ (tested with 24).
- A modern browser (Chrome, Firefox, Edge or Safari).
- For desktop packaging, the tooling that belongs to each operating system.

---

## Development

The project supports web and desktop development from the same code:

| Command                     | Description                    |
| --------------------------- | ------------------------------ |
| `npm run dev`               | Web dev server with hot reload |
| `npm run dev:desktop`       | Vite + Electron window         |
| `npm run build`             | Web build into `dist/`         |
| `npm run build:desktop:dir` | Unpacked desktop app           |
| `npm run build:desktop`     | Installers into `release/`     |
| `npm run typecheck`         | Type checking                  |
| `npm run lint` / `format`   | ESLint and Prettier            |

The full technical documentation (architecture, internal mechanics and
workflow) lives in [`docs/MANUAL.md`](docs/MANUAL.md).

---

## License

Released under the **MIT License**. You are free to use, modify, and distribute
this software, including in proprietary projects, provided you retain the
original copyright notice. See [LICENSE.md](LICENSE.md) for details.

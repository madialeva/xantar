import { describe, expect, it } from 'vitest';
import type { Difficulty } from './difficulty';
import { assembleLevel } from './level/assembleLevel';
import type { Level } from './level/Level';
import type { LevelEntry } from './level/LevelDocument';
import { NO_INPUT } from './SimInput';
import { Simulation } from './Simulation';
import { documentFromGrid, tinyGrid } from './testing/grids';
import { StubRng } from './testing/rng';
import { skipReady } from './testing/simulation';

/** Enemies that stay off the board for the whole test, so they never catch the chef. */
const LATE = 60_000;

/** A one-burger screen the chef clears by walking left from his start. */
const screen = (name: string, actors: readonly string[], entries: LevelEntry[] = []): Level =>
  assembleLevel({
    ...documentFromGrid({
      name,
      structure: tinyGrid.structure,
      ingredients: [
        '........',
        '........',
        '........',
        '........',
        '........',
        '.BBBB...',
        '........',
        '........'
      ],
      actors
    }),
    entries
  });

const actors = (top: string, bottom: string): string[] => [
  '........',
  '........',
  top,
  '........',
  '........',
  bottom,
  '........',
  '........'
];

const first = screen('First', actors('........', '......C.'));
const second = screen('Second', actors('.......e', '.......C'), [
  { row: 2, col: 7, delayMs: LATE }
]);
const third = screen('Third', actors('h......h', '......C.'), [
  { row: 2, col: 0, delayMs: LATE },
  { row: 2, col: 7, delayMs: LATE }
]);

const game = (
  screens: readonly Level[],
  difficulty: Difficulty = 'normal',
  startLevel?: number
): Simulation =>
  skipReady(
    new Simulation({
      screens,
      rng: new StubRng(0.99),
      difficulty,
      ...(startLevel === undefined ? {} : { startLevel })
    })
  );

/** Clears the board by dropping its burger, skips the level clear and the ready countdown. */
const clearBoard = (sim: Simulation): void => {
  for (let i = 0; i < 600 && sim.phase === 'playing'; i++) sim.step({ ...NO_INPUT, left: true });
  expect(sim.phase).toBe('levelClear');
  sim.step({ ...NO_INPUT, confirm: true });
  skipReady(sim);
};

const played = (sim: Simulation): [number, string] => [sim.stats.level, sim.level.name];

describe('Simulation: order of the screens', () => {
  it('plays the next screen after each cleared board on normal', () => {
    const sim = game([first, second, third]);
    expect(played(sim)).toEqual([1, 'First']);
    clearBoard(sim);
    expect(played(sim)).toEqual([2, 'Second']);
    clearBoard(sim);
    expect(played(sim)).toEqual([3, 'Third']);
  });

  it('sets up the board of the next screen: its chef, its ingredients and its enemies', () => {
    const sim = game([first, second]);
    clearBoard(sim);
    const fresh = game([second]);
    expect([sim.chef.row, sim.chef.x]).toEqual([fresh.chef.row, fresh.chef.x]);
    expect(sim.chef.x).not.toBe(game([first]).chef.x);
    expect(sim.ingredients.map((ingredient) => [ingredient.phase, ingredient.row])).toEqual([
      ['idle', 5]
    ]);
    expect(sim.plates.map((plate) => plate.landed)).toEqual([0]);
    expect(sim.enemies.map((enemy) => [enemy.kind, enemy.active])).toEqual([['egg', false]]);
  });

  it('goes back to the first screen after the last one, on hard', () => {
    const sim = game([first, second, third], 'hard', 3);
    expect(played(sim)).toEqual([3, 'Third']);
    expect(sim.enemies.map((enemy) => enemy.kind)).toEqual(['hotdog', 'hotdog']);
    clearBoard(sim);
    expect(played(sim)).toEqual([4, 'First']);
    expect(sim.enemies).toEqual([]);
  });

  it('plays each screen on two boards in a row on easy, back to the first after the last', () => {
    const sim = game([first, second], 'easy');
    const boards: [number, string][] = [played(sim)];
    for (let board = 0; board < 4; board++) {
      clearBoard(sim);
      boards.push(played(sim));
    }
    expect(boards).toEqual([
      [1, 'First'],
      [2, 'First'],
      [3, 'Second'],
      [4, 'Second'],
      [5, 'First']
    ]);
  });

  it('keeps the same enemies while a screen is replayed and brings new ones with a new screen', () => {
    const sim = game([second, third], 'easy');
    const enemies = sim.enemies;
    clearBoard(sim);
    expect(sim.enemies).toBe(enemies);
    clearBoard(sim);
    expect(sim.enemies).not.toBe(enemies);
    expect(sim.enemies.map((enemy) => enemy.kind)).toEqual(['hotdog', 'hotdog']);
  });

  it('stays on the same screen and level after losing a life', () => {
    const caught = screen('Caught', actors('........', '.....hC.'));
    const sim = game([first, caught], 'normal', 2);
    for (let i = 0; i < 400 && sim.phase === 'playing'; i++) sim.step(NO_INPUT);
    expect(sim.phase).toBe('dying');
    for (let i = 0; i < 600 && sim.phase !== 'playing'; i++) sim.step(NO_INPUT);
    expect(sim.phase).toBe('playing');
    expect([sim.stats.lives, ...played(sim)]).toEqual([2, 2, 'Caught']);
  });

  it('starts a new game on the first level and the first screen', () => {
    const sim = game([first, second, third]);
    clearBoard(sim);
    clearBoard(sim);
    sim.newGame();
    expect(sim.phase).toBe('ready');
    expect(played(sim)).toEqual([1, 'First']);
    expect(sim.enemies).toEqual([]);
  });

  it('starts on the level asked for, on its screen for the difficulty, and goes back to it', () => {
    expect(played(game([first, second, third], 'normal', 2))).toEqual([2, 'Second']);
    const easy = game([first, second, third], 'easy', 3);
    expect(played(easy)).toEqual([3, 'Second']);
    clearBoard(easy);
    easy.newGame();
    expect(played(easy)).toEqual([3, 'Second']);
  });

  it('needs at least one screen', () => {
    expect(() => new Simulation({ screens: [], rng: new StubRng(0.99) })).toThrow(/screen/);
  });
});

import { describe, expect, it } from 'vitest';
import type { Difficulty } from './difficulty';
import { assembleLevel } from './level/assembleLevel';
import type { LevelEntry } from './level/LevelDocument';
import { ORIGINAL_CELL_UNITS, READY_TICKS, START_LIVES } from './rules';
import { NO_INPUT, type SimInput } from './SimInput';
import { Simulation } from './Simulation';
import { type GridSpec, documentFromGrid } from './testing/grids';
import { StubRng } from './testing/rng';
import { skipReady } from './testing/simulation';

const simulate = (
  grid: GridSpec,
  difficulty?: Difficulty,
  entries?: readonly LevelEntry[]
): Simulation =>
  new Simulation({
    screens: [assembleLevel({ ...documentFromGrid(grid), ...(entries ? { entries } : {}) })],
    rng: new StubRng(0.99),
    ...(difficulty ? { difficulty } : {})
  });

const run = (sim: Simulation, ticks: number, input: Partial<SimInput> = {}): void => {
  for (let i = 0; i < ticks; i++) sim.step({ ...NO_INPUT, ...input });
};

/** A distance in cells or rows as measured on the original at ×2, where the speeds come from. */
const units = (cells: number): number => cells * ORIGINAL_CELL_UNITS;

/** An enemy on a floor of its own: it walks towards the chef's column but cannot reach him. */
const apart: GridSpec = {
  structure: [
    '..............................',
    '..............................',
    '==============================',
    '..............................',
    '..............................',
    '=============================='
  ],
  actors: [
    '..............................',
    '..............................',
    '...........................C..',
    '..............................',
    '..............................',
    '..z...........................'
  ]
};

/** An enemy at the foot of a ladder that leads up to the chef. */
const ladder: GridSpec = {
  structure: ['........', '===+====', '...H....', '...H....', '...H....', '===+===='],
  actors: ['........', '.......C', '........', '........', '........', '...z....']
};

/** A one-ingredient board the chef clears by walking left; its enemy comes much later. */
const quickBoard: GridSpec = {
  structure: ['........', '========', '........', '.____...'],
  ingredients: ['........', '.TTTT...', '........', '........'],
  actors: ['........', '......Cz', '........', '........']
};
const lateEnemy: readonly LevelEntry[] = [{ row: 1, col: 7, delayMs: 600_000 }];

const walked = (sim: Simulation, ticks: number): number => {
  const [enemy] = sim.enemies;
  const x = enemy.x;
  run(sim, ticks);
  return units(enemy.x - x);
};

const climbed = (sim: Simulation, ticks: number): number => {
  const [enemy] = sim.enemies;
  run(sim, 1);
  expect(enemy.isClimbing).toBe(true);
  const y = enemy.y;
  run(sim, ticks);
  return units(y - enemy.y);
};

/** Clears the board by walking left over its ingredient and plays on into the next one. */
const clearBoard = (sim: Simulation): void => {
  for (let i = 0; i < 600 && sim.phase === 'playing'; i++) run(sim, 1, { left: true });
  expect(sim.phase).toBe('levelClear');
  run(sim, 1, { confirm: true });
  skipReady(sim);
};

describe('Simulation: enemy speed by difficulty', () => {
  it('keeps the enemies at 85 % of their speed on easy', () => {
    const sim = skipReady(simulate(apart, 'easy'));
    expect(walked(sim, 60)).toBeCloseTo(45.9, 6);
    run(sim, 7200);
    expect(sim.pace).toBe(0.85);
  });

  it('keeps the enemies at the fastest pace of the original on hard', () => {
    const sim = skipReady(simulate(ladder, 'hard'));
    expect(climbed(sim, 60)).toBeCloseTo(33.75, 6);
  });

  it('starts the enemies at the speeds of the original on normal', () => {
    expect(walked(skipReady(simulate(apart, 'normal')), 60)).toBeCloseTo(54, 6);
    expect(climbed(skipReady(simulate(ladder, 'normal')), 60)).toBeCloseTo(27, 6);
  });

  it('plays on normal when no difficulty is given', () => {
    const sim = skipReady(simulate(apart));
    expect(sim.difficulty).toBe('normal');
    run(sim, 1305);
    expect(sim.pace).toBe(1.03);
  });
});

describe('Simulation: pace on normal', () => {
  it('speeds the enemies up a step every 1305 ticks of play, up to the last one', () => {
    const sim = skipReady(simulate(apart, 'normal'));
    const paces: number[] = [];
    for (const ticks of [1304, 1, 1305, 1305, 6081]) {
      run(sim, ticks);
      paces.push(sim.pace);
    }
    expect(paces).toEqual([1, 1.03, 1.07, 1.25, 1.25]);
    expect(sim.stats.lives).toBe(START_LIVES);
  });

  it('moves the enemies at the pace of the moment, also when they walk in', () => {
    const sim = skipReady(
      simulate(
        { structure: ['----======', '..........'], actors: ['z........C', '..........'] },
        'normal',
        [{ row: 0, col: 0, delayMs: 22_000 }]
      )
    );
    run(sim, 1320);
    const [enemy] = sim.enemies;
    expect([enemy.active, enemy.entering, sim.pace]).toEqual([true, true, 1.03]);
    expect(walked(sim, 30)).toBeCloseTo((54 * 1.03) / 2, 6);
  });

  it('does not count the time out of play', () => {
    const sim = simulate(apart, 'normal');
    run(sim, READY_TICKS + 1304);
    expect([sim.phase, sim.pace]).toEqual(['playing', 1]);
    run(sim, 1);
    expect(sim.pace).toBe(1.03);
  });

  it('goes back to the first step when the chef loses a life', () => {
    const sim = skipReady(
      simulate(
        {
          structure: ['----======', '..........'],
          actors: ['z....C....', '..........']
        },
        'normal',
        [{ row: 0, col: 0, delayMs: 70_000 }]
      )
    );
    run(sim, 3915);
    expect(sim.pace).toBe(1.25);
    for (let i = 0; i < 600 && sim.phase === 'playing'; i++) run(sim, 1);
    expect(sim.stats.lives).toBe(START_LIVES - 1);
    for (let i = 0; i < 600 && sim.phase !== 'playing'; i++) run(sim, 1);
    expect(sim.pace).toBe(1);
    run(sim, 1304);
    expect(sim.pace).toBe(1);
    run(sim, 1);
    expect(sim.pace).toBe(1.03);
  });

  it('starts every new board on the first step', () => {
    const sim = skipReady(simulate(quickBoard, 'normal', lateEnemy));
    run(sim, 3915);
    expect(sim.pace).toBe(1.25);
    clearBoard(sim);
    expect([sim.stats.level, sim.phase, sim.pace]).toEqual([2, 'playing', 1]);
  });

  it('starts the boards from level 4 two steps ahead', () => {
    const sim = skipReady(simulate(quickBoard, 'normal', lateEnemy));
    for (let level = 1; level < 4; level++) clearBoard(sim);
    expect([sim.stats.level, sim.pace]).toEqual([4, 1.07]);
    run(sim, 1305);
    expect(sim.pace).toBe(1.25);
  });
});

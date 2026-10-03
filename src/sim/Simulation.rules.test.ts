import { describe, expect, it } from 'vitest';
import type { SimEvent } from './events';
import { START_LIVES, START_PEPPERS, STUN_TICKS } from './rules';
import { NO_INPUT, type SimInput } from './SimInput';
import { Simulation } from './Simulation';
import { type GridSpec, levelFromGrid, tinyGrid, withGrid } from './testing/grids';
import { StubRng } from './testing/rng';

const create = (grid: GridSpec): Simulation =>
  new Simulation({ level: levelFromGrid(grid), rng: new StubRng(0.99) });

const run = (sim: Simulation, ticks: number, input: Partial<SimInput> = {}): SimEvent[] => {
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks; i++) events.push(...sim.step({ ...NO_INPUT, ...input }));
  return events;
};

const ofType = <T extends SimEvent['type']>(events: readonly SimEvent[], type: T) =>
  events.filter((event): event is Extract<SimEvent, { type: T }> => event.type === type);

const arena = (actors: readonly string[]): GridSpec => ({
  structure: [
    '........',
    '........',
    '........',
    '........',
    '........',
    '========',
    '........',
    '........'
  ],
  actors
});

const chefAndEnemyOnRow5 = arena([
  '........',
  '........',
  '........',
  '........',
  '........',
  '.C.h....',
  '........',
  '........'
]);

describe('Simulation: stomping and crushing enemies', () => {
  const crushGrid = withGrid({
    actors: [
      '........',
      '........',
      '......C.',
      '........',
      '........',
      '..h.e...',
      '........',
      '........'
    ]
  });

  it('activates an ingredient only after the chef has stepped on all its segments', () => {
    const sim = create(crushGrid);
    const events = run(sim, 50, { left: true });
    expect(ofType(events, 'segmentStomped').map((event) => event.segment)).toEqual([3, 2]);
    expect(ofType(events, 'ingredientsTriggered')).toHaveLength(0);
  });

  it('crushes consecutive enemies with a growing combo', () => {
    const sim = create(crushGrid);
    const events = run(sim, 100, { left: true });
    expect(ofType(events, 'ingredientsTriggered')).toHaveLength(1);
    const crushed = ofType(events, 'enemySquashed');
    expect(crushed.map((event) => [event.points, event.combo])).toEqual([
      [100, 1],
      [200, 2]
    ]);
    expect(crushed[0]).toMatchObject({ enemyId: 0, points: 100 });
    expect(crushed[0].y).toBeGreaterThan(2);
    expect(crushed[0].y).toBeLessThanOrEqual(5);
    expect(sim.stats.combo).toBe(2);
    expect(sim.enemies.every((enemy) => !enemy.active)).toBe(true);
  });

  it('respawns the crushed enemies after the respawn delay at a spawn marker', () => {
    const sim = create(crushGrid);
    run(sim, 100, { left: true });
    const events = run(sim, 160);
    expect(ofType(events, 'enemyRespawned')).toHaveLength(2);
    expect(sim.enemies.every((enemy) => enemy.active)).toBe(true);
    expect(sim.enemies.map((enemy) => enemy.row)).toEqual([5, 5]);
  });
});

describe('Simulation: pepper', () => {
  it('stuns a nearby enemy in front and consumes a pepper', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 1);
    const events = run(sim, 1, { pepper: true });
    expect(ofType(events, 'pepperThrown')).toHaveLength(1);
    expect(ofType(events, 'enemyStunned')).toEqual([{ type: 'enemyStunned', enemyId: 0 }]);
    expect(sim.stats.peppers).toBe(START_PEPPERS - 1);
    expect(sim.enemies[0].stunned).toBe(true);
  });

  it('keeps the stunned enemy harmless even when the chef walks into it', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 2, { pepper: true });
    run(sim, 100, { right: true });
    expect(sim.stats.lives).toBe(START_LIVES);
  });

  it('releases the enemy when the stun ends', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 2, { pepper: true });
    run(sim, STUN_TICKS);
    expect(sim.enemies[0].stunned).toBe(false);
  });

  it('does nothing without peppers', () => {
    const sim = create(chefAndEnemyOnRow5);
    for (let i = 0; i < START_PEPPERS; i++) run(sim, 1, { pepper: true });
    const events = run(sim, 1, { pepper: true });
    expect(sim.stats.peppers).toBe(0);
    expect(ofType(events, 'pepperThrown')).toHaveLength(0);
  });

  it('consumes only one pepper for a single-tick press', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 1, { pepper: true });
    run(sim, 20);
    expect(sim.stats.peppers).toBe(START_PEPPERS - 1);
  });
});

describe('Simulation: contact and lives', () => {
  it('loses a life on contact and puts everyone back at the start', () => {
    const sim = create(chefAndEnemyOnRow5);
    let hits: SimEvent[] = [];
    for (let i = 0; i < 80 && hits.length === 0; i++) {
      hits = ofType(run(sim, 1), 'chefHit');
    }
    expect(hits).toEqual([{ type: 'chefHit', livesLeft: START_LIVES - 1 }]);
    expect(sim.stats.lives).toBe(START_LIVES - 1);
    expect(sim.status).toBe('playing');
    expect(sim.chef.x).toBe(1.5);
    expect(sim.enemies[0].x).toBe(3.5);
    expect([sim.enemies[0].prevX, sim.chef.prevX]).toEqual([3.5, 1.5]);
  });

  it('ends the game on the last life', () => {
    const sim = create(chefAndEnemyOnRow5);
    const events = run(sim, 300);
    expect(sim.status).toBe('gameOver');
    expect(sim.stats.lives).toBe(0);
    expect(ofType(events, 'chefHit')).toHaveLength(START_LIVES);
    expect(ofType(events, 'gameOver')).toHaveLength(1);
  });

  it('keeps the world still once the game is over', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 300);
    const before = [sim.chef.x, sim.chef.y, sim.enemies[0].x];
    const events = run(sim, 60, { right: true });
    expect(events).toEqual([]);
    expect([sim.chef.x, sim.chef.y, sim.enemies[0].x]).toEqual(before);
  });

  it('starts a new game from game over with the initial stats', () => {
    const sim = create(chefAndEnemyOnRow5);
    run(sim, 300);
    sim.newGame();
    expect([sim.stats.score, sim.stats.lives, sim.stats.peppers, sim.stats.level]).toEqual([
      0,
      START_LIVES,
      START_PEPPERS,
      1
    ]);
    expect(sim.status).toBe('playing');
    expect(run(sim, 1)).toEqual([{ type: 'boardStarted' }]);
  });

  it('does not touch an enemy that is on another platform', () => {
    const sim = create({
      structure: tinyGrid.structure,
      actors: [
        '........',
        '........',
        '.h......',
        '........',
        '........',
        '......C.',
        '........',
        '........'
      ]
    });
    run(sim, 30);
    expect(sim.stats.lives).toBe(START_LIVES);
  });
});

describe('Simulation: clearing a level', () => {
  const singleBurger = withGrid({
    ingredients: [
      '........',
      '........',
      '........',
      '........',
      '........',
      '.BBBB...',
      '........',
      '........'
    ]
  });

  it('clears the level when the last burger is completed', () => {
    const sim = create(singleBurger);
    const events = run(sim, 160, { left: true });
    expect(sim.status).toBe('levelClear');
    expect(ofType(events, 'burgerDone')).toHaveLength(1);
    expect(ofType(events, 'levelCleared')).toEqual([{ type: 'levelCleared', level: 2 }]);
    expect(sim.stats.level).toBe(2);
    expect(sim.stats.score).toBe(450);
  });

  it('continues to the next level keeping score, lives and peppers', () => {
    const sim = create(singleBurger);
    run(sim, 160, { left: true });
    sim.nextLevel();
    expect(sim.status).toBe('playing');
    expect([sim.stats.score, sim.stats.lives, sim.stats.peppers]).toEqual([
      450,
      START_LIVES,
      START_PEPPERS + 1
    ]);
    expect(sim.chef.x).toBe(6.5);
    expect(sim.plates.every((plate) => !plate.isComplete)).toBe(true);
    expect(run(sim, 1)).toEqual([{ type: 'boardStarted' }]);
  });

  it('does not run the world while the level is cleared', () => {
    const sim = create(singleBurger);
    run(sim, 160, { left: true });
    const x = sim.chef.x;
    run(sim, 30, { right: true });
    expect(sim.chef.x).toBe(x);
  });

  it('clears a level of mini burgers made of three casillas', () => {
    const sim = create({
      segments: 3,
      structure: ['........', '========', '........', '.___....'],
      ingredients: ['........', '.BBB....', '........', '........'],
      actors: ['........', '......C.', '........', '........']
    });
    run(sim, 160, { left: true });
    expect(sim.status).toBe('levelClear');
  });
});

describe('Simulation: chain of falls', () => {
  it('drops both ingredients of a column when the upper one is completed', () => {
    const sim = create(
      withGrid({
        actors: [
          '........',
          '........',
          '......C.',
          '........',
          '........',
          '........',
          '........',
          '........'
        ]
      })
    );
    const events = run(sim, 160, { left: true });
    expect(ofType(events, 'ingredientsTriggered')[0].ingredientIds).toEqual([1, 0]);
    expect(sim.stats.score).toBe(100);
    expect(sim.ingredients[1].phase).toBe('stacked');
    expect(sim.ingredients[0].row).toBe(5);
  });
});

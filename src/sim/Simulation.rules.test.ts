import { describe, expect, it } from 'vitest';
import type { SimEvent } from './events';
import {
  CHEF_SPEED,
  CONTACT_X,
  CONTACT_Y,
  DYING_TICKS,
  ENEMY_HEIGHT,
  LEVEL_CLEAR_TICKS,
  READY_TICKS,
  RESPAWN_TICKS,
  START_LIVES,
  START_PEPPERS,
  STUN_TICKS,
  TICK_SECONDS
} from './rules';
import { isCrushedBy } from './entities/crush';
import { NO_INPUT, type SimInput } from './SimInput';
import { Simulation } from './Simulation';
import { assembleLevel } from './level/assembleLevel';
import type { LevelEntry } from './level/LevelDocument';
import {
  type GridSpec,
  documentFromGrid,
  levelFromGrid,
  tinyGrid,
  withGrid
} from './testing/grids';
import { StubRng } from './testing/rng';
import { skipReady } from './testing/simulation';

const create = (grid: GridSpec): Simulation =>
  skipReady(new Simulation({ screens: [levelFromGrid(grid)], rng: new StubRng(0.99) }));

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

  /** Walks the chef left until `done` holds for the events so far, then `extra` ticks more. */
  const walkLeftUntil = (
    sim: Simulation,
    done: (events: readonly SimEvent[]) => boolean,
    extra = 0
  ): SimEvent[] => {
    const events: SimEvent[] = [];
    for (let i = 0; i < 300 && !done(events); i++) events.push(...run(sim, 1, { left: true }));
    events.push(...run(sim, extra, { left: true }));
    return events;
  };
  const triggered = (events: readonly SimEvent[]): boolean =>
    ofType(events, 'ingredientsTriggered').length > 0;

  it('activates an ingredient only after the chef has stepped on all its segments', () => {
    const sim = create(crushGrid);
    const events = walkLeftUntil(sim, (so) => ofType(so, 'segmentStomped').length === 2);
    expect(ofType(events, 'segmentStomped').map((event) => event.segment)).toEqual([3, 2]);
    expect(ofType(events, 'ingredientsTriggered')).toHaveLength(0);
    const rest = walkLeftUntil(sim, triggered);
    expect(ofType(rest, 'segmentStomped').map((event) => event.segment)).toEqual([1, 0]);
  });

  it('crushes consecutive enemies with a growing combo', () => {
    const sim = create(crushGrid);
    const events = walkLeftUntil(sim, (so) => ofType(so, 'enemySquashed').length === 2);
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

  it('crushes an enemy when the falling ingredient reaches it, not when the fall starts', () => {
    const sim = create({
      structure: [
        '........',
        '........',
        '========',
        '........',
        '........',
        '...=....',
        '........',
        '.____...'
      ],
      ingredients: [
        '........',
        '........',
        '.TTTT...',
        '........',
        '........',
        '........',
        '........',
        '........'
      ],
      actors: [
        '........',
        '........',
        '......C.',
        '........',
        '........',
        '...h....',
        '........',
        '........'
      ]
    });
    let tick = 0;
    for (
      ;
      tick < 200 && ofType(run(sim, 1, { left: true }), 'ingredientsTriggered').length === 0;
      tick++
    );
    expect(sim.enemies[0].active).toBe(true);
    const enemyY = sim.enemies[0].y;
    let squashed: SimEvent[] = [];
    for (; tick < 400 && squashed.length === 0; tick++)
      squashed = ofType(run(sim, 1), 'enemySquashed');
    expect(squashed).toHaveLength(1);
    const [top] = sim.ingredients;
    expect(top.y).toBeGreaterThan(enemyY - ENEMY_HEIGHT);
    expect(top.prevY).toBeLessThanOrEqual(enemyY - ENEMY_HEIGHT);
  });

  it('never crushes the chef, even with the base of a falling ingredient at his height', () => {
    const sim = create({
      structure: ['........', '.+======', '.H......', '.+======', '........', '.____...'],
      ingredients: ['........', '.TTTT...', '........', '.LLLL...', '........', '........'],
      actors: ['........', '......C.', '........', '........', '........', '........']
    });
    const events = run(sim, 90, { left: true });
    expect(ofType(events, 'ingredientsTriggered').length).toBeGreaterThan(0);
    let overlapped = false;
    for (let i = 0; i < 120; i++) {
      events.push(...run(sim, 1, { down: true }));
      overlapped ||= isCrushedBy(sim.ingredients[0], sim.chef);
    }
    expect(overlapped).toBe(true);
    expect(ofType(events, 'chefHit')).toEqual([]);
    expect([sim.stats.lives, sim.phase]).toEqual([START_LIVES, 'playing']);
  });

  it('respawns the crushed enemies after the respawn delay at a spawn marker', () => {
    const sim = create(crushGrid);
    walkLeftUntil(sim, (so) => ofType(so, 'enemySquashed').length === 2);
    const events = run(sim, 160);
    expect(ofType(events, 'enemyRespawned')).toHaveLength(2);
    expect(sim.enemies.every((enemy) => enemy.active)).toBe(true);
    expect(sim.enemies.map((enemy) => enemy.row)).toEqual([5, 5]);
  });
});

describe('Simulation: enemies entering the board', () => {
  const entering = (entries: readonly LevelEntry[]) =>
    skipReady(
      new Simulation({
        screens: [
          assembleLevel({
            ...documentFromGrid({
              structure: ['----===+==', '.......H..', '=======+==', '..........', '.____.....'],
              ingredients: ['..........', '..........', '.TTTT.....', '..........', '..........'],
              actors: ['h.......C.', '..........', '.........e', '..........', '..........']
            }),
            entries
          })
        ],
        rng: new StubRng(0.99)
      })
    );

  it('keeps the board empty until the first delay and brings the enemies in by order', () => {
    const sim = entering([
      { row: 0, col: 0, delayMs: 500 },
      { row: 2, col: 9, delayMs: 1000 }
    ]);
    const [hotdog, egg] = sim.enemies;
    run(sim, 29);
    expect([hotdog.active, egg.active]).toEqual([false, false]);
    run(sim, 1);
    expect([hotdog.active, hotdog.entering, hotdog.x, egg.active]).toEqual([
      true,
      true,
      0.5,
      false
    ]);
    run(sim, 30);
    expect(egg.active).toBe(true);
  });

  it('brings the enemies in again after the chef loses a life', () => {
    const sim = entering([{ row: 0, col: 0, delayMs: 500 }]);
    const [hotdog] = sim.enemies;
    for (let i = 0; i < 600 && sim.phase === 'playing'; i++) run(sim, 1);
    expect(sim.stats.lives).toBe(START_LIVES - 1);
    for (let i = 0; i < 600 && sim.phase !== 'playing'; i++) run(sim, 1);
    expect(hotdog.active).toBe(false);
    run(sim, 30);
    expect([hotdog.active, hotdog.x]).toEqual([true, 0.5]);
  });
});

describe('Simulation: climbing through a crossing', () => {
  it('does not stomp an ingredient over a crossing it climbs straight through', () => {
    const sim = create({
      structure: ['........', '===+====', '...H....', '===+====', '...H....', '===+===='],
      ingredients: ['........', '........', '........', '..TTTT..', '........', '........'],
      actors: ['........', '........', '........', '........', '........', '...C....']
    });
    const events = run(sim, 120, { up: true });
    expect(sim.chef.row).toBe(1);
    expect(ofType(events, 'segmentStomped')).toEqual([]);
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

  const ladderDuel = (chefRow: number, enemyRow: number): GridSpec => {
    const actors = Array.from({ length: 8 }, () => '........');
    actors[chefRow] = '...C....';
    actors[enemyRow] = '...h....';
    return { structure: tinyGrid.structure, actors };
  };

  const climbTowardsEnemy = (sim: Simulation, input: Partial<SimInput>): void => {
    for (let i = 0; i < 200; i++) {
      const [enemy] = sim.enemies;
      if (sim.chef.isClimbing && Math.abs(enemy.y - sim.chef.y) < 1.5) return;
      run(sim, 1, input);
    }
    throw new Error('the enemy never came close to the chef on the ladder');
  };

  it.each([
    { direction: 'up', chefRow: 5, enemyRow: 2, input: { up: true } },
    { direction: 'down', chefRow: 2, enemyRow: 5, input: { down: true } }
  ] as const)(
    'throws $direction along the ladder and stuns the enemy coming that way',
    ({ direction, chefRow, enemyRow, input }) => {
      const sim = create(ladderDuel(chefRow, enemyRow));
      climbTowardsEnemy(sim, input);
      const events = run(sim, 1, { pepper: true });
      expect(ofType(events, 'pepperThrown')[0]?.direction).toBe(direction);
      expect(ofType(events, 'enemyStunned')).toEqual([{ type: 'enemyStunned', enemyId: 0 }]);
      expect(sim.chef.isClimbing).toBe(true);
      expect(sim.stats.lives).toBe(START_LIVES);
    }
  );
});

const untilPhase = (
  sim: Simulation,
  phase: Simulation['phase'],
  input: Partial<SimInput> = {}
): SimEvent[] => {
  const events: SimEvent[] = [];
  for (let i = 0; i < 2000 && sim.phase !== phase; i++) {
    events.push(...sim.step({ ...NO_INPUT, ...input }));
  }
  return events;
};

describe('Simulation: contact and lives', () => {
  it('loses a life on contact and freezes everyone while the chef is dying', () => {
    const sim = create(chefAndEnemyOnRow5);
    let hits: SimEvent[] = [];
    for (let i = 0; i < 80 && hits.length === 0; i++) {
      hits = ofType(run(sim, 1), 'chefHit');
    }
    expect(hits).toEqual([{ type: 'chefHit', livesLeft: START_LIVES - 1 }]);
    expect(sim.stats.lives).toBe(START_LIVES - 1);
    expect(sim.phase).toBe('dying');
    const frozen = [sim.chef.x, sim.enemies[0].x];
    run(sim, DYING_TICKS - 1, { left: true });
    expect([sim.chef.x, sim.enemies[0].x]).toEqual(frozen);
  });

  it('puts everyone back at the start and gets ready after dying', () => {
    const sim = create(chefAndEnemyOnRow5);
    untilPhase(sim, 'dying');
    const events = run(sim, DYING_TICKS);
    expect(ofType(events, 'phaseChanged')).toEqual([
      { type: 'phaseChanged', from: 'dying', to: 'ready' }
    ]);
    expect(sim.chef.x).toBe(1.5);
    expect(sim.enemies[0].x).toBe(3.5);
    expect([sim.enemies[0].prevX, sim.chef.prevX]).toEqual([3.5, 1.5]);
    run(sim, READY_TICKS);
    expect(sim.phase).toBe('playing');
  });

  it('lifts the stomped segments of resting ingredients after losing a life', () => {
    const sim = create(
      withGrid({
        ingredients: [
          '........',
          '........',
          '........',
          '........',
          '........',
          '..BBBB..',
          '........',
          '........'
        ],
        actors: chefAndEnemyOnRow5.actors
      })
    );
    untilPhase(sim, 'dying', { right: true });
    const [bun] = sim.ingredients;
    expect(bun.stomped.some(Boolean)).toBe(true);
    expect(bun.sink.some((steps) => steps > 0)).toBe(true);
    untilPhase(sim, 'ready');
    expect([bun.stomped.some(Boolean), bun.sink.some((steps) => steps > 0)]).toEqual([
      false,
      false
    ]);
    untilPhase(sim, 'playing');
    expect([bun.phase, bun.stomped.some(Boolean)]).toEqual(['idle', false]);
  });

  it('needs every segment again after losing a life half way across an ingredient', () => {
    const sim = create(
      withGrid({
        structure: [
          '........',
          '........',
          '..........',
          '........',
          '........',
          '==========',
          '..........',
          '.____.....'
        ],
        ingredients: [
          '..........',
          '..........',
          '..........',
          '..........',
          '..........',
          '.BBBB.....',
          '..........',
          '..........'
        ],
        actors: [
          '..........',
          '..........',
          '..........',
          '..........',
          '..........',
          '.C...h....',
          '..........',
          '..........'
        ]
      })
    );
    const stomps = untilPhase(sim, 'dying', { right: true }).filter(
      (event) => event.type === 'segmentStomped'
    );
    expect(stomps.length).toBeGreaterThan(0);
    expect(stomps.length).toBeLessThan(4);
    untilPhase(sim, 'playing');
    const [bun] = sim.ingredients;
    expect(bun.stomped.every((stomped) => !stomped)).toBe(true);
  });

  it('keeps the stacked ingredients stacked after losing a life', () => {
    const sim = create(
      withGrid({
        actors: [
          '........',
          '........',
          '......h.',
          '........',
          '........',
          '......C.',
          '........',
          '........'
        ]
      })
    );
    untilPhase(sim, 'dying', { left: true });
    const stacked = sim.ingredients.filter((ingredient) => ingredient.phase === 'stacked');
    expect(stacked).toHaveLength(1);
    const before = stacked.map((ingredient) => [ingredient.y, ingredient.stackSlot]);
    untilPhase(sim, 'playing');
    expect(
      stacked.map((ingredient) => [ingredient.phase, ingredient.y, ingredient.stackSlot])
    ).toEqual(before.map(([y, slot]) => ['stacked', y, slot]));
  });

  it('lets an ingredient that was falling finish its fall after losing a life', () => {
    const sim = skipReady(
      new Simulation({
        screens: [
          assembleLevel({
            ...documentFromGrid({
              structure: ['........', '========', '........', '........', '========', '........'],
              ingredients: ['........', '.TTTT...', '........', '........', '........', '........'],
              actors: ['........', 'h.....C.', '........', '........', '........', '........']
            }),
            entries: [{ row: 1, col: 0, delayMs: 950 }]
          })
        ],
        rng: new StubRng(0.99)
      })
    );
    const events = untilPhase(sim, 'dying', { left: true });
    expect(ofType(events, 'ingredientsTriggered')).toHaveLength(1);
    const [top] = sim.ingredients;
    expect(top.phase).not.toBe('idle');
    const frozen = top.y;
    untilPhase(sim, 'playing');
    expect(top.y).toBe(frozen);
    for (let i = 0; i < 200 && top.phase !== 'idle'; i++) run(sim, 1);
    expect([top.phase, top.row, top.y]).toEqual(['idle', 4, 4]);
  });

  it('ends the game after dying with the last life', () => {
    const sim = create(chefAndEnemyOnRow5);
    const events = untilPhase(sim, 'gameOver');
    expect(sim.phase).toBe('gameOver');
    expect(sim.stats.lives).toBe(0);
    expect(ofType(events, 'chefHit')).toHaveLength(START_LIVES);
    expect(ofType(events, 'gameOver')).toHaveLength(1);
    expect(ofType(events, 'phaseChanged').at(-1)).toEqual({
      type: 'phaseChanged',
      from: 'dying',
      to: 'gameOver'
    });
  });

  it('keeps the world still once the game is over', () => {
    const sim = create(chefAndEnemyOnRow5);
    untilPhase(sim, 'gameOver');
    const before = [sim.chef.x, sim.chef.y, sim.enemies[0].x];
    const events = run(sim, 60, { right: true, confirm: true });
    expect(events).toEqual([]);
    expect([sim.chef.x, sim.chef.y, sim.enemies[0].x]).toEqual(before);
  });

  it('starts a new game from game over with the initial stats, getting ready first', () => {
    const sim = create(chefAndEnemyOnRow5);
    untilPhase(sim, 'gameOver');
    sim.newGame();
    expect([sim.stats.score, sim.stats.lives, sim.stats.peppers, sim.stats.level]).toEqual([
      0,
      START_LIVES,
      START_PEPPERS,
      1
    ]);
    expect(sim.phase).toBe('ready');
    expect(run(sim, 1)).toEqual([
      { type: 'boardStarted' },
      { type: 'phaseChanged', from: 'gameOver', to: 'ready' }
    ]);
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
    expect(sim.phase).toBe('levelClear');
    expect(ofType(events, 'burgerDone')).toHaveLength(1);
    expect(ofType(events, 'levelCleared')).toEqual([{ type: 'levelCleared', level: 2 }]);
    expect(sim.stats.level).toBe(2);
    expect(sim.stats.score).toBe(450);
  });

  it('waits for the last ingredient to bounce on its plate and rest before clearing', () => {
    const sim = create(singleBurger);
    let touched = false;
    for (let i = 0; i < 200 && !touched; i++) {
      touched = ofType(run(sim, 1, { left: true }), 'ingredientLanded').length > 0;
    }
    expect(touched).toBe(true);
    expect([sim.phase, sim.ingredients[0].phase]).toEqual(['playing', 'bouncing']);
    untilPhase(sim, 'levelClear');
    expect(sim.ingredients[0].phase).toBe('stacked');
  });

  it('continues on its own to the next level keeping score, lives and peppers', () => {
    const sim = create(singleBurger);
    untilPhase(sim, 'levelClear', { left: true });
    const waiting = run(sim, LEVEL_CLEAR_TICKS - 1);
    expect(sim.phase).toBe('levelClear');
    expect(ofType(waiting, 'boardStarted')).toEqual([]);
    expect(run(sim, 1)).toEqual([
      { type: 'boardStarted' },
      { type: 'phaseChanged', from: 'levelClear', to: 'ready' }
    ]);
    expect([sim.stats.score, sim.stats.lives, sim.stats.peppers]).toEqual([
      450,
      START_LIVES,
      START_PEPPERS + 1
    ]);
    expect(sim.chef.x).toBe(6.5);
    expect(sim.plates.every((plate) => !plate.isComplete)).toBe(true);
  });

  it('continues at once when confirm arrives during the level clear', () => {
    const sim = create(singleBurger);
    untilPhase(sim, 'levelClear', { left: true });
    run(sim, 10);
    expect(ofType(run(sim, 1, { confirm: true }), 'boardStarted')).toHaveLength(1);
    expect(sim.phase).toBe('ready');
  });

  it('ignores confirm while playing', () => {
    const sim = create(singleBurger);
    const events = run(sim, 5, { confirm: true });
    expect(sim.phase).toBe('playing');
    expect(ofType(events, 'boardStarted')).toEqual([]);
  });

  it('does not run the world while the level is cleared', () => {
    const sim = create(singleBurger);
    untilPhase(sim, 'levelClear', { left: true });
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
    expect(sim.phase).toBe('levelClear');
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
    const events = run(sim, 240, { left: true });
    expect(ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds)).toEqual([
      [0],
      [1]
    ]);
    expect(sim.stats.score).toBe(100);
    expect(sim.ingredients[1].phase).toBe('stacked');
    expect(sim.ingredients[0].row).toBe(5);
  });
});

const doubleRows = (grid: GridSpec): GridSpec => {
  const doubled = (rows: readonly string[]): string[] =>
    rows.flatMap((row) => [row, '.'.repeat(row.length)]);
  return {
    structure: doubled(grid.structure),
    ingredients: grid.ingredients && doubled(grid.ingredients),
    actors: grid.actors && doubled(grid.actors)
  };
};

describe('Simulation: enemies riding an ingredient', () => {
  /** Floors four rows (two chefs) apart, as the floors of the classic level. */
  const column = (actorsRow1: string): GridSpec =>
    doubleRows({
      structure: [
        '....................',
        '====================',
        '....................',
        '====================',
        '....................',
        '====================',
        '....................',
        '====================',
        '....................',
        '.____...............'
      ],
      ingredients: [
        '....................',
        '.TTTT...............',
        '....................',
        '.LLLL...............',
        '....................',
        '.PPPP...............',
        '....................',
        '.BBBB...............',
        '....................',
        '....................'
      ],
      actors: [
        '....................',
        actorsRow1,
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    });

  /** Stuns the enemy in front of the chef with pepper and drops the top bun with it on. */
  const dropWithRider = (sim: Simulation): SimEvent[] => {
    const events = [...run(sim, 1, { left: true }), ...run(sim, 1, { pepper: true })];
    expect(sim.enemies[0].stunned).toBe(true);
    for (let i = 0; i < 200 && ofType(events, 'ingredientsTriggered').length === 0; i++) {
      events.push(...run(sim, 1, { left: true }));
    }
    return events;
  };

  const untilTopRests = (sim: Simulation): SimEvent[] => {
    const events: SimEvent[] = [];
    const [top] = sim.ingredients;
    for (let i = 0; i < 2000 && !(top.phase === 'idle' && top.row === 14); i++) {
      events.push(...run(sim, 1));
    }
    return events;
  };

  it('carries the enemy down three floors and drops it with a bonus', () => {
    const sim = create(column('..h...C.............'));
    dropWithRider(sim);
    const [rider] = sim.enemies;
    const [top] = sim.ingredients;
    expect(rider.riding).toBe(true);
    const x = rider.x;
    const score = sim.stats.score;
    const events: SimEvent[] = [];
    let followed = true;
    for (let i = 0; i < 2000 && !(top.phase === 'idle' && top.row === 14); i++) {
      events.push(...run(sim, 1));
      if (rider.riding) followed &&= rider.x === x && rider.y === top.y;
    }
    expect(followed).toBe(true);
    expect([top.phase, top.row]).toEqual(['idle', 14]);
    expect(ofType(events, 'ridersDropped')).toEqual([
      { type: 'ridersDropped', ingredientId: 0, riders: [{ enemyId: 0, x, y: 14 }], points: 500 }
    ]);
    expect(ofType(events, 'enemySquashed')).toEqual([]);
    expect([rider.active, rider.riding, sim.stats.combo]).toEqual([false, false, 0]);
    const deltas = ofType(events, 'scoreChanged').map((event) => event.delta);
    expect(deltas.filter((delta) => delta === 500)).toHaveLength(1);
    expect(deltas.every((delta) => delta === 50 || delta === 500)).toBe(true);
    expect(sim.stats.score - score).toBe(deltas.reduce((sum, delta) => sum + delta, 0));
    const respawned = run(sim, 160);
    expect(ofType(respawned, 'enemyRespawned')).toHaveLength(1);
  });

  it('brings the rider back where its ingredient stopped', () => {
    const sim = create(column('..h...C.............'));
    dropWithRider(sim);
    const [rider] = sim.enemies;
    const x = rider.x;
    untilTopRests(sim);
    run(sim, RESPAWN_TICKS - 2);
    expect(rider.active).toBe(false);
    run(sim, 1);
    expect([rider.active, rider.row, rider.x]).toEqual([true, 14, x]);
  });

  it('brings riders that reach the plate back on the lowest floor above it', () => {
    const grid = column('...hh.C.............');
    const withSecondBurger = (rows: readonly string[] | undefined, row: number, piece: string) =>
      (rows ?? []).map((line, index) =>
        index === row ? line.slice(0, 12) + piece.repeat(4) + line.slice(16) : line
      );
    const sim = create({
      ...grid,
      structure: withSecondBurger(grid.structure, 18, '_'),
      ingredients: withSecondBurger(grid.ingredients, 2, 'T')
    });
    dropWithRider(sim);
    const riders = sim.enemies.filter((enemy) => enemy.riding);
    expect(riders).toHaveLength(2);
    const xs = riders.map((enemy) => enemy.x);
    const [top] = sim.ingredients;
    let dropped = false;
    for (let i = 0; i < 3000 && !dropped; i++) {
      dropped = ofType(run(sim, 1), 'ridersDropped').length > 0;
    }
    expect([top.phase, top.row]).toEqual(['stacked', 18]);
    run(sim, RESPAWN_TICKS - 2);
    expect(riders.some((enemy) => enemy.active)).toBe(false);
    run(sim, 1);
    expect(riders.map((enemy) => [enemy.active, enemy.row, enemy.x])).toEqual(
      xs.map((x) => [true, 14, x])
    );
  });

  it('gives no bonus when the chef loses a life during the ride', () => {
    const sim = create(column('..h...C.......o.....'));
    dropWithRider(sim);
    const [rider] = sim.enemies;
    expect(rider.riding).toBe(true);
    const events = untilTopRests(sim);
    expect(ofType(events, 'chefHit').length).toBeGreaterThan(0);
    expect(rider.riding).toBe(false);
    expect([sim.ingredients[0].phase, sim.ingredients[0].row]).toEqual(['idle', 14]);
    expect(ofType(events, 'ridersDropped')).toEqual([]);
  });
});

describe('Simulation: secured board', () => {
  const board = (grid: GridSpec, entries: readonly LevelEntry[] = []): Simulation =>
    skipReady(
      new Simulation({
        screens: [assembleLevel({ ...documentFromGrid(grid), entries })],
        rng: new StubRng(0.99)
      })
    );

  /** Plays until the chef is caught or the board is cleared, holding `input` until the drop. */
  const playOut = (sim: Simulation, input: Partial<SimInput>): SimEvent[] => {
    const events: SimEvent[] = [];
    for (let i = 0; i < 1500 && sim.phase === 'playing'; i++) {
      events.push(...run(sim, 1, sim.boardSecured ? {} : input));
    }
    return events;
  };

  /** Plays the caught chef's fall to its end, checking that only riders move meanwhile. */
  const lieDown = (sim: Simulation): { events: SimEvent[]; ticks: number } => {
    const events: SimEvent[] = [];
    let ticks = 0;
    for (; ticks < 1500 && sim.phase === 'dying'; ticks++) {
      const still = sim.enemies.filter((enemy) => !enemy.riding).map((enemy) => [enemy.x, enemy.y]);
      const free = sim.enemies.filter((enemy) => !enemy.riding);
      events.push(...run(sim, 1, { left: true, pepper: true }));
      expect(free.map((enemy) => [enemy.x, enemy.y])).toEqual(still);
    }
    return { events, ticks };
  };

  /** Whether a free enemy is close enough to the chef to take a life. */
  const touching = (sim: Simulation): boolean =>
    sim.enemies.some(
      (enemy) =>
        enemy.active &&
        !enemy.stunned &&
        !enemy.riding &&
        Math.abs(enemy.x - sim.chef.x) < CONTACT_X &&
        Math.abs(enemy.y - sim.chef.y) < CONTACT_Y
    );

  /** An enemy that walks in from the left just after the chef has crossed the ingredient. */
  const latecomer: LevelEntry = { row: 1, col: 0, delayMs: 950 };
  const lastOne: GridSpec = {
    structure: ['........', '========', '........', '.____...'],
    ingredients: ['........', '.TTTT...', '........', '........'],
    actors: ['........', 'h.....C.', '........', '........']
  };

  it('knocks the chef down without a life while the last ingredient falls, then clears', () => {
    const sim = board(lastOne, [latecomer]);
    const caught = playOut(sim, { left: true });
    const [top] = sim.ingredients;
    expect([sim.phase, sim.boardSecured, top.phase === 'stacked']).toEqual(['dying', true, false]);
    expect(ofType(caught, 'chefHit')).toEqual([{ type: 'chefHit', livesLeft: START_LIVES }]);
    const { events, ticks } = lieDown(sim);
    expect([sim.phase, sim.stats.lives, sim.stats.level, top.phase]).toEqual([
      'levelClear',
      START_LIVES,
      2,
      'stacked'
    ]);
    expect(ticks).toBeLessThan(DYING_TICKS);
    expect(ofType(events, 'levelCleared')).toHaveLength(1);
    expect(
      ofType([...caught, ...events], 'phaseChanged').map(({ from, to }) => [from, to])
    ).toEqual([
      ['playing', 'dying'],
      ['dying', 'levelClear']
    ]);
    expect(ofType(events, 'pepperThrown')).toEqual([]);
  });

  it('keeps playing to the level clear when nobody catches the chef', () => {
    const sim = board(lastOne, [{ row: 1, col: 0, delayMs: 600_000 }]);
    const events = playOut(sim, { left: true });
    expect([sim.phase, sim.stats.lives]).toEqual(['levelClear', START_LIVES]);
    expect(ofType(events, 'phaseChanged').map(({ from, to }) => [from, to])).toEqual([
      ['playing', 'levelClear']
    ]);
  });

  /** The chef peppers an enemy standing on the ingredient, then drops it with the enemy on. */
  const dropWithRider = (structure: readonly string[], ingredients: readonly string[]) => {
    const actors = structure.map((_, row) => (row === 1 ? 'e...h.C...' : '..........'));
    const sim = board({ structure, ingredients, actors }, [{ row: 1, col: 0, delayMs: 1000 }]);
    run(sim, 1, { left: true, pepper: true });
    expect(sim.enemies[1].stunned).toBe(true);
    const events: SimEvent[] = [];
    for (let i = 0; i < 300 && !sim.boardSecured; i++) {
      events.push(...run(sim, 1, { left: true }));
    }
    expect(sim.enemies[1].riding).toBe(true);
    events.push(...playOut(sim, { left: true }));
    expect([sim.phase, sim.stats.lives]).toEqual(['dying', START_LIVES]);
    events.push(...lieDown(sim).events);
    return { sim, events };
  };

  it('keeps the life when a rider takes the last ingredient down from two floors up', () => {
    const { sim, events } = dropWithRider(
      [
        '..........',
        '==========',
        '..........',
        '==========',
        '..........',
        '==========',
        '..........',
        '.____.....'
      ],
      [
        '..........',
        '.TTTT.....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........'
      ]
    );
    expect(ofType(events, 'ridersDropped').map((event) => event.points)).toEqual([500]);
    expect([sim.phase, sim.stats.lives, sim.enemies[1].riding]).toEqual([
      'levelClear',
      START_LIVES,
      false
    ]);
  });

  it('keeps the life when a ridden ingredient pushes the last one into the plate', () => {
    const { sim, events } = dropWithRider(
      ['..........', '==========', '..........', '==========', '..........', '.____.....'],
      ['..........', '.TTTT.....', '..........', '.BBBB.....', '..........', '..........']
    );
    expect(ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds)).toEqual([
      [0],
      [1]
    ]);
    expect([sim.phase, sim.stats.lives]).toEqual(['levelClear', START_LIVES]);
  });

  it('keeps the life when the enemy touches the chef on the tick of the last stomp', () => {
    const sim = board({
      structure: ['=+======', '.H......', '.H......', '=+======', '........', '.____...'],
      ingredients: ['........', '........', '........', '.TTTT...', '........', '........'],
      actors: ['......h.', '........', '........', '......C.', '........', '........']
    });
    const [enemy] = sim.enemies;
    for (let i = 0; i < 60 && sim.chef.x >= 3.05; i++) run(sim, 1, { left: true });
    for (let i = 0; i < 600 && !(enemy.isClimbing && enemy.y > 2); i++) run(sim, 1);
    run(sim, 1, { pepper: true });
    expect(enemy.stunned).toBe(true);
    const step = CHEF_SPEED * TICK_SECONDS;
    const walk = Math.floor((sim.chef.x - 2) / step) + 1;
    run(sim, STUN_TICKS - walk);
    run(sim, walk - 1, { left: true });
    expect([enemy.stunned, sim.boardSecured, sim.ingredients[0].phase]).toEqual([
      true,
      false,
      'idle'
    ]);
    const events = run(sim, 1, { left: true });
    expect([enemy.stunned, sim.boardSecured, touching(sim)]).toEqual([false, true, true]);
    expect(ofType(events, 'chefHit')).toEqual([{ type: 'chefHit', livesLeft: START_LIVES }]);
    expect([sim.phase, sim.stats.lives]).toEqual(['dying', START_LIVES]);
    lieDown(sim);
    expect([sim.phase, sim.stats.lives]).toEqual(['levelClear', START_LIVES]);
  });

  it('takes a life as usual when the drop does not finish the board', () => {
    const sim = board(
      {
        structure: [
          '........',
          '========',
          '........',
          '........',
          '========',
          '........',
          '.____...'
        ],
        ingredients: [
          '........',
          '.TTTT...',
          '........',
          '........',
          '.BBBB...',
          '........',
          '........'
        ],
        actors: ['........', 'h.....C.', '........', '........', '........', '........', '........']
      },
      [latecomer]
    );
    const events = playOut(sim, { left: true });
    expect(ofType(events, 'ingredientsTriggered').length).toBeGreaterThan(0);
    expect(sim.boardSecured).toBe(false);
    expect([sim.phase, sim.stats.lives]).toEqual(['dying', START_LIVES - 1]);
  });
});

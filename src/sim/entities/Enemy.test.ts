import { describe, expect, it } from 'vitest';
import { EventQueue } from '../events';
import type { Level } from '../level/Level';
import {
  EDGE_MARGIN,
  ENEMY_CLIMB_SPEED,
  ENEMY_WALK_SPEED,
  RESPAWN_TICKS,
  STUN_TICKS,
  TICK_SECONDS
} from '../rules';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { StubRng } from '../testing/rng';
import { levelFromShape } from '../testing/shapes';
import { Chef } from './Chef';
import { createEnemy } from './createEnemy';
import { type Enemy, type EnemyGait, enemyGait, entryAt } from './Enemy';

const rng = new StubRng(0.99);
const tiny = levelFromGrid(tinyGrid);

const spawn = (
  level: Level,
  row: number,
  x: number,
  spawns: readonly [number, number][] = [[row, x]]
): { enemy: Enemy; events: EventQueue } => {
  const events = new EventQueue();
  const places = spawns.map(([r, sx]) => entryAt(level.graph.placeAt(r, sx)));
  const enemy = createEnemy(0, 'hotdog', events, level.graph, places);
  enemy.reset(level.graph.placeAt(row, x), rng);
  return { enemy, events };
};

const chefAt = (level: Level, row: number, x: number): Chef =>
  new Chef(level.graph.placeAt(row, x));

const run = (enemy: Enemy, chef: Chef, ticks: number, gait: EnemyGait = enemyGait()): void => {
  for (let i = 0; i < ticks; i++) {
    enemy.beginTick();
    enemy.step(chef, rng, gait);
  }
};

describe('Enemy chasing', () => {
  it('walks towards the chef on the same platform', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    run(enemy, chefAt(tiny, 5, 6.5), 60);
    expect(enemy.x).toBeCloseTo(1.5 + ENEMY_WALK_SPEED, 6);
    expect(enemy.facing).toBe(1);
  });

  it('turns around when the chef is on its left', () => {
    const { enemy } = spawn(tiny, 5, 6.5);
    run(enemy, chefAt(tiny, 5, 1.5), 30);
    expect(enemy.x).toBeLessThan(6.5);
    expect(enemy.facing).toBe(-1);
  });

  it('goes down a ladder to reach a chef on a lower platform', () => {
    const { enemy } = spawn(tiny, 2, 0.5);
    run(enemy, chefAt(tiny, 5, 6.5), 400);
    expect([enemy.row, enemy.isClimbing, enemy.y]).toEqual([5, false, 5]);
  });

  it('goes up a ladder to reach a chef on a higher platform', () => {
    const { enemy } = spawn(tiny, 5, 6.5);
    run(enemy, chefAt(tiny, 2, 0.5), 400);
    expect([enemy.row, enemy.y]).toEqual([2, 2]);
  });

  it('keeps its row until it arrives at the end of the ladder', () => {
    const { enemy } = spawn(tiny, 2, 3.5);
    run(enemy, chefAt(tiny, 5, 6.5), 30);
    expect(enemy.isClimbing).toBe(true);
    expect(enemy.row).toBe(2);
    expect(enemy.y).toBeGreaterThan(2);
  });

  it('walks at the walking gait it is given', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    run(enemy, chefAt(tiny, 5, 6.5), 60, { walk: 2, climb: 1 });
    expect(enemy.x).toBeCloseTo(3.5, 6);
  });

  it('climbs at its climbing gait, half as fast as it walks', () => {
    const { enemy } = spawn(tiny, 2, 3.5);
    const chef = chefAt(tiny, 5, 6.5);
    run(enemy, chef, 1);
    const steps: number[] = [];
    while (enemy.isClimbing) {
      run(enemy, chef, 1);
      steps.push(enemy.y - enemy.prevY);
    }
    expect(ENEMY_CLIMB_SPEED * 2).toBe(ENEMY_WALK_SPEED);
    steps
      .slice(0, -1)
      .forEach((step) => expect(step).toBeCloseTo(ENEMY_CLIMB_SPEED * TICK_SECONDS, 10));
  });

  it('follows the shortest path in an irregular level, not the nearest ladder', () => {
    const level = levelFromShape({
      cols: 20,
      rows: 6,
      platforms: [
        [0, 0, 19],
        [2, 4, 8],
        [5, 0, 19]
      ],
      ladders: [
        [6, 0, 2],
        [16, 0, 5]
      ]
    });
    const { enemy } = spawn(level, 0, 5.5);
    run(enemy, chefAt(level, 5, 18.5), 1200);
    expect([enemy.row, enemy.y]).toEqual([5, 5]);
  });

  it('decides again as soon as it leaves a ladder, so it does not walk away from the chef', () => {
    const { enemy } = spawn(tiny, 2, 3.5);
    const chef = chefAt(tiny, 5, 0.6);
    run(enemy, chef, 1);
    while (enemy.isClimbing) run(enemy, chef, 1);
    expect([enemy.row, enemy.x]).toEqual([5, 3.5]);
    run(enemy, chef, 1);
    expect(enemy.facing).toBe(-1);
    expect(enemy.x).toBeLessThan(3.5);
  });

  it('walks towards the chef when there is no path', () => {
    const level = levelFromShape({
      cols: 12,
      rows: 6,
      platforms: [
        [1, 0, 11],
        [4, 0, 11]
      ],
      ladders: []
    });
    const { enemy } = spawn(level, 1, 2.5);
    run(enemy, chefAt(level, 4, 9.5), 60);
    expect(enemy.x).toBeGreaterThan(2.5);
    expect(enemy.row).toBe(1);
  });

  it('stays within its platform', () => {
    const { enemy } = spawn(tiny, 5, 6.5);
    run(enemy, chefAt(tiny, 5, 7.6), 600);
    expect(enemy.x).toBeLessThanOrEqual(8 - EDGE_MARGIN + 1e-9);
  });
});

describe('Enemy stun', () => {
  it('stays still while stunned and moves again afterwards', () => {
    const { enemy, events } = spawn(tiny, 5, 1.5);
    enemy.stun();
    expect(events.drain()).toEqual([{ type: 'enemyStunned', enemyId: 0 }]);
    expect(enemy.stunned).toBe(true);
    run(enemy, chefAt(tiny, 5, 6.5), STUN_TICKS);
    expect(enemy.x).toBe(1.5);
    expect(enemy.stunned).toBe(false);
    run(enemy, chefAt(tiny, 5, 6.5), 10);
    expect(enemy.x).toBeGreaterThan(1.5);
  });

  it('exposes the remaining stun ticks', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    enemy.stun();
    run(enemy, chefAt(tiny, 5, 6.5), 10);
    expect(enemy.stunTicksLeft).toBe(STUN_TICKS - 10);
  });
});

describe('Enemy squashing', () => {
  it('becomes inactive and respawns on one of the spawn places after the delay', () => {
    const { enemy, events } = spawn(tiny, 5, 1.5, [
      [5, 1.5],
      [2, 6.5]
    ]);
    enemy.squash();
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(tiny, 5, 7), RESPAWN_TICKS - 1);
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(tiny, 5, 7), 1);
    expect(enemy.active).toBe(true);
    expect([enemy.row, enemy.x]).toEqual([2, 6.5]);
    expect([enemy.prevX, enemy.prevY]).toEqual([6.5, 2]);
    expect(events.drain()).toEqual([{ type: 'enemyRespawned', enemyId: 0, x: 6.5, y: 2 }]);
  });

  it('does not move while inactive', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    enemy.squash();
    run(enemy, chefAt(tiny, 5, 6.5), 50);
    expect(enemy.x).toBe(1.5);
  });
});

describe('Enemy riding', () => {
  const carrier = (y: number) => ({ x: 3, y, prevX: 3, prevY: y });

  it('follows the height of the ingredient it rides, without walking or deciding', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    const ingredient = carrier(5);
    enemy.ride(ingredient);
    expect([enemy.riding, enemy.rides(ingredient), enemy.rides(carrier(5))]).toEqual([
      true,
      true,
      false
    ]);
    for (const y of [5.2, 5.4, 5.1]) {
      Object.assign(ingredient, { y });
      run(enemy, chefAt(tiny, 5, 6.5), 1);
      expect([enemy.x, enemy.y]).toEqual([1.5, y]);
    }
  });

  it('stops riding when it is squashed or put back at the start', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    enemy.ride(carrier(5));
    enemy.squash();
    expect(enemy.riding).toBe(false);
    enemy.reset(tiny.graph.placeAt(5, 1.5), rng);
    enemy.ride(carrier(5));
    enemy.reset(tiny.graph.placeAt(5, 1.5), rng);
    expect(enemy.riding).toBe(false);
  });
});

describe('Enemy entering from a walkway', () => {
  const walkway = levelFromGrid({
    structure: ['----====', '........'],
    actors: ['h.....C.', '........']
  });
  const entry = { place: walkway.graph.placeAt(0, 4.75), fromX: 0.5, delayTicks: 30 };
  const waiting = (): { enemy: Enemy; events: EventQueue } => {
    const events = new EventQueue();
    const enemy = createEnemy(0, 'hotdog', events, walkway.graph, [entry]);
    enemy.await(entry, rng);
    return { enemy, events };
  };
  const chef = chefAt(walkway, 0, 6.5);

  it('waits off the board until its entry delay and then appears on its marker', () => {
    const { enemy, events } = waiting();
    expect(enemy.active).toBe(false);
    run(enemy, chef, 29);
    expect(enemy.active).toBe(false);
    run(enemy, chef, 1);
    expect([enemy.active, enemy.entering, enemy.x, enemy.row]).toEqual([true, true, 0.5, 0]);
    expect(events.drain()).toEqual([]);
  });

  it('walks in at its speed until it reaches the platform, then chases', () => {
    const { enemy } = waiting();
    run(enemy, chef, 30);
    const steps: number[] = [];
    while (enemy.entering) {
      run(enemy, chef, 1);
      steps.push(enemy.x - enemy.prevX);
    }
    expect(enemy.x).toBe(4.75);
    steps.slice(0, -1).forEach((step) => expect(step).toBeCloseTo(ENEMY_WALK_SPEED / 60, 10));
    run(enemy, chef, 10);
    expect(enemy.x).toBeGreaterThan(4.75);
  });

  it('walks in at the walking gait it is given', () => {
    const { enemy } = waiting();
    const gait = { walk: 3, climb: 1.5 };
    run(enemy, chef, 31, gait);
    expect(enemy.x).toBeCloseTo(0.5 + gait.walk * TICK_SECONDS, 10);
  });

  it('stands still on the walkway while it is stunned', () => {
    const { enemy } = waiting();
    run(enemy, chef, 35);
    const x = enemy.x;
    enemy.stun();
    run(enemy, chef, 20);
    expect([enemy.x, enemy.entering]).toEqual([x, true]);
  });

  it('comes in at once when its entry has no delay and no walkway', () => {
    const events = new EventQueue();
    const place = walkway.graph.placeAt(0, 6.5);
    const enemy = createEnemy(0, 'hotdog', events, walkway.graph, [entryAt(place)]);
    enemy.await(entryAt(place), rng);
    expect([enemy.active, enemy.entering, enemy.x]).toEqual([true, false, 6.5]);
  });

  it('comes back on the given place after a ride and announces it', () => {
    const { enemy, events } = spawn(tiny, 5, 1.5);
    enemy.dropAt(tiny.graph.placeAt(2, 6.5));
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(tiny, 5, 1.5), RESPAWN_TICKS - 1);
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(tiny, 5, 1.5), 1);
    expect([enemy.active, enemy.row, enemy.x]).toEqual([true, 2, 6.5]);
    expect(events.drain()).toEqual([{ type: 'enemyRespawned', enemyId: 0, x: 6.5, y: 2 }]);
  });
});

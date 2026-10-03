import { describe, expect, it } from 'vitest';
import { EventQueue } from '../events';
import type { Level } from '../level/Level';
import { ENEMY_SPEED, RESPAWN_TICKS, STUN_TICKS } from '../rules';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { StubRng } from '../testing/rng';
import { levelFromShape } from '../testing/shapes';
import { Chef } from './Chef';
import { createEnemy } from './createEnemy';
import type { Enemy } from './Enemy';

const rng = new StubRng(0.99);
const tiny = levelFromGrid(tinyGrid);

const spawn = (
  level: Level,
  row: number,
  x: number,
  spawns: readonly [number, number][] = [[row, x]]
): { enemy: Enemy; events: EventQueue } => {
  const events = new EventQueue();
  const places = spawns.map(([r, sx]) => level.graph.placeAt(r, sx));
  const enemy = createEnemy(0, 'hotdog', events, level.graph, places);
  enemy.reset(level.graph.placeAt(row, x), rng);
  return { enemy, events };
};

const chefAt = (level: Level, row: number, x: number): Chef =>
  new Chef(level.graph.placeAt(row, x));

const run = (enemy: Enemy, chef: Chef, ticks: number): void => {
  for (let i = 0; i < ticks; i++) {
    enemy.beginTick();
    enemy.step(chef, rng);
  }
};

describe('Enemy chasing', () => {
  it('walks towards the chef on the same platform', () => {
    const { enemy } = spawn(tiny, 5, 1.5);
    run(enemy, chefAt(tiny, 5, 6.5), 60);
    expect(enemy.x).toBeCloseTo(1.5 + ENEMY_SPEED, 6);
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
    expect(enemy.x).toBeLessThanOrEqual(8 - 12 / 32 + 1e-9);
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

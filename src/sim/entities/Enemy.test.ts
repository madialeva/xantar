import { describe, expect, it } from 'vitest';
import { EventQueue } from '../events';
import { loadLevel } from '../level/loadLevel';
import { ENEMY_SPEED, RESPAWN_TICKS, STUN_TICKS } from '../rules';
import { chefAt } from '../testing/chef';
import { tinyLevelData } from '../testing/levels';
import { StubRng } from '../testing/rng';
import { createEnemy } from './createEnemy';
import type { Enemy } from './Enemy';

const level = loadLevel(tinyLevelData);
const rng = new StubRng(0.99);

const spawnEnemy = (row: number, x: number): { enemy: Enemy; events: EventQueue } => {
  const events = new EventQueue();
  const enemy = createEnemy(0, 'hotdog', events);
  enemy.reset({ row, x }, rng);
  return { enemy, events };
};

const run = (enemy: Enemy, chef: ReturnType<typeof chefAt>, ticks: number): void => {
  for (let i = 0; i < ticks; i++) {
    enemy.beginTick();
    enemy.step(chef, level, rng);
  }
};

describe('Enemy chasing', () => {
  it('walks towards the chef on the same row', () => {
    const { enemy } = spawnEnemy(5, 1.5);
    run(enemy, chefAt(5, 6.5), 60);
    expect(enemy.x).toBeCloseTo(1.5 + ENEMY_SPEED, 6);
    expect(enemy.facing).toBe(1);
  });

  it('turns around when the chef is on its left', () => {
    const { enemy } = spawnEnemy(5, 6.5);
    run(enemy, chefAt(5, 1.5), 30);
    expect(enemy.x).toBeLessThan(6.5);
    expect(enemy.facing).toBe(-1);
  });

  it('goes down a ladder to reach a chef on a lower row', () => {
    const { enemy } = spawnEnemy(2, 0.5);
    run(enemy, chefAt(5, 6.5), 400);
    expect(enemy.row).toBe(5);
    expect(enemy.isClimbing).toBe(false);
  });

  it('goes up a ladder to reach a chef on a higher row', () => {
    const { enemy } = spawnEnemy(5, 6.5);
    run(enemy, chefAt(2, 0.5), 400);
    expect(enemy.row).toBe(2);
  });

  it('keeps its row until it arrives at the end of the ladder', () => {
    const { enemy } = spawnEnemy(2, 3.5);
    run(enemy, chefAt(5, 6.5), 30);
    expect(enemy.isClimbing).toBe(true);
    expect(enemy.row).toBe(2);
    expect(enemy.y).toBeGreaterThan(2);
  });

  it('stays within its platform', () => {
    const { enemy } = spawnEnemy(5, 6.5);
    run(enemy, chefAt(5, 100), 600);
    expect(enemy.x).toBeCloseTo(8 - 12 / 32, 6);
  });
});

describe('Enemy stun', () => {
  it('stays still while stunned and moves again afterwards', () => {
    const { enemy, events } = spawnEnemy(5, 1.5);
    enemy.stun();
    expect(events.drain()).toEqual([{ type: 'enemyStunned', enemyId: 0 }]);
    expect(enemy.stunned).toBe(true);
    run(enemy, chefAt(5, 6.5), STUN_TICKS);
    expect(enemy.x).toBe(1.5);
    expect(enemy.stunned).toBe(false);
    run(enemy, chefAt(5, 6.5), 10);
    expect(enemy.x).toBeGreaterThan(1.5);
  });

  it('exposes the remaining stun ticks', () => {
    const { enemy } = spawnEnemy(5, 1.5);
    enemy.stun();
    run(enemy, chefAt(5, 6.5), 10);
    expect(enemy.stunTicksLeft).toBe(STUN_TICKS - 10);
  });
});

describe('Enemy squashing', () => {
  it('becomes inactive and respawns on a respawn point after the delay', () => {
    const { enemy, events } = spawnEnemy(5, 1.5);
    enemy.squash();
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(5, 6.5), RESPAWN_TICKS - 1);
    expect(enemy.active).toBe(false);
    run(enemy, chefAt(5, 6.5), 1);
    expect(enemy.active).toBe(true);
    expect([enemy.row, enemy.x]).toEqual([2, 7.5]);
    expect([enemy.prevX, enemy.prevY]).toEqual([7.5, 2]);
    expect(events.drain()).toEqual([{ type: 'enemyRespawned', enemyId: 0, x: 7.5, y: 2 }]);
  });

  it('does not move while inactive', () => {
    const { enemy } = spawnEnemy(5, 1.5);
    enemy.squash();
    run(enemy, chefAt(5, 6.5), 50);
    expect(enemy.x).toBe(1.5);
  });
});

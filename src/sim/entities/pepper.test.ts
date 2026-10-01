import { describe, expect, it } from 'vitest';
import { chefAt } from '../testing/chef';
import { EventQueue } from '../events';
import { createEnemy } from './createEnemy';
import { isHitByPepper, pepperCloudFor } from './pepper';

const enemyAt = (row: number, x: number, active = true) => {
  const enemy = createEnemy(0, 'pickle', new EventQueue());
  enemy.reset(
    { row, x },
    { next: () => 0.9, int: (min) => min, chance: () => false, pick: (items) => items[0] }
  );
  if (!active) enemy.squash();
  return enemy;
};

describe('pepper', () => {
  it('places the cloud in front of the chef', () => {
    const cloud = pepperCloudFor({ ...chefAt(5, 4), facing: -1 });
    expect(cloud.x).toBeCloseTo(4 - 24 / 32, 10);
    expect(cloud.direction).toBe(-1);
  });

  it('hits an enemy in front, close and on the same row', () => {
    const chef = chefAt(5, 2);
    const cloud = pepperCloudFor(chef);
    expect(isHitByPepper(cloud, chef, enemyAt(5, 3.5))).toBe(true);
  });

  it('misses an enemy behind the chef', () => {
    const chef = chefAt(5, 4);
    expect(isHitByPepper(pepperCloudFor(chef), chef, enemyAt(5, 3))).toBe(false);
  });

  it('misses an enemy that is too far from the cloud', () => {
    const chef = chefAt(5, 1);
    expect(isHitByPepper(pepperCloudFor(chef), chef, enemyAt(5, 5))).toBe(false);
  });

  it('misses an enemy on another row', () => {
    const chef = chefAt(5, 2);
    expect(isHitByPepper(pepperCloudFor(chef), chef, enemyAt(2, 3.5))).toBe(false);
  });

  it('misses an inactive enemy', () => {
    const chef = chefAt(5, 2);
    expect(isHitByPepper(pepperCloudFor(chef), chef, enemyAt(5, 3.5, false))).toBe(false);
  });
});

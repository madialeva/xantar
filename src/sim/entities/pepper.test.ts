import { describe, expect, it } from 'vitest';
import { EventQueue } from '../events';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { StubRng } from '../testing/rng';
import { createEnemy } from './createEnemy';
import { isHitByPepper, pepperCloudFor, type PepperSource } from './pepper';

const level = levelFromGrid(tinyGrid);
const rng = new StubRng(0.99);

const enemyAt = (row: number, x: number, active = true) => {
  const place = level.graph.placeAt(row, x);
  const enemy = createEnemy(0, 'pickle', new EventQueue(), level.graph, [place]);
  enemy.reset(place, rng);
  if (!active) enemy.squash();
  return enemy;
};

const chef = (x: number, y: number, facing: 1 | -1 = 1): PepperSource => ({ x, y, facing });

describe('pepper', () => {
  it('places the cloud in front of the chef', () => {
    const cloud = pepperCloudFor(chef(4, 5, -1));
    expect(cloud.x).toBeCloseTo(4 - 24 / 32, 10);
    expect(cloud.direction).toBe(-1);
  });

  it('hits an enemy in front, close and on the same row', () => {
    const source = chef(2, 5);
    expect(isHitByPepper(pepperCloudFor(source), source, enemyAt(5, 3.5))).toBe(true);
  });

  it('misses an enemy behind the chef', () => {
    const source = chef(4, 5);
    expect(isHitByPepper(pepperCloudFor(source), source, enemyAt(5, 3))).toBe(false);
  });

  it('misses an enemy that is too far from the cloud', () => {
    const source = chef(0.6, 5);
    expect(isHitByPepper(pepperCloudFor(source), source, enemyAt(5, 7))).toBe(false);
  });

  it('misses an enemy on another row', () => {
    const source = chef(2, 5);
    expect(isHitByPepper(pepperCloudFor(source), source, enemyAt(2, 3.5))).toBe(false);
  });

  it('misses an inactive enemy', () => {
    const source = chef(2, 5);
    expect(isHitByPepper(pepperCloudFor(source), source, enemyAt(5, 3.5, false))).toBe(false);
  });
});

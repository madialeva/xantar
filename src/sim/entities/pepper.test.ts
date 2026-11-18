import { describe, expect, it } from 'vitest';
import { EventQueue } from '../events';
import { NavPlace } from '../nav/NavPlace';
import { CELL_UNITS } from '../rules';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { StubRng } from '../testing/rng';
import { createEnemy } from './createEnemy';
import { isHitByPepper, pepperCloudFor, type PepperSource, type ThrowDirection } from './pepper';

const level = levelFromGrid(tinyGrid);
const rng = new StubRng(0.99);
const [ladder] = level.graph.ladders;

const enemyAtPlace = (place: NavPlace, active = true) => {
  const enemy = createEnemy(0, 'pickle', new EventQueue(), level.graph, [place]);
  enemy.reset(place, rng);
  if (!active) enemy.squash();
  return enemy;
};

const enemyAt = (row: number, x: number, active = true) =>
  enemyAtPlace(level.graph.placeAt(row, x), active);

const enemyOnLadder = (y: number) => enemyAtPlace(NavPlace.onLadder(ladder, y - ladder.topRow));

const chef = (x: number, y: number, throwDirection: ThrowDirection = 'right'): PepperSource => ({
  x,
  y,
  throwDirection
});

describe('pepper on a platform', () => {
  it('places the cloud in front of the chef', () => {
    const cloud = pepperCloudFor(chef(4, 5, 'left'));
    expect(cloud.x).toBeCloseTo(4 - 24 / CELL_UNITS, 10);
    expect(cloud.y).toBeCloseTo(5 - 2 / CELL_UNITS, 10);
    expect(cloud.direction).toBe('left');
  });

  it('hits an enemy in front, close and on the same row', () => {
    expect(isHitByPepper(chef(2, 5), enemyAt(5, 3.5))).toBe(true);
  });

  it('misses an enemy behind the chef', () => {
    expect(isHitByPepper(chef(4, 5), enemyAt(5, 3))).toBe(false);
  });

  it('misses an enemy that is too far from the cloud', () => {
    expect(isHitByPepper(chef(0.6, 5), enemyAt(5, 7))).toBe(false);
  });

  it('misses an enemy on another row', () => {
    expect(isHitByPepper(chef(2, 5), enemyAt(2, 3.5))).toBe(false);
  });

  it('misses an inactive enemy', () => {
    expect(isHitByPepper(chef(2, 5), enemyAt(5, 3.5, false))).toBe(false);
  });
});

describe('pepper on a ladder', () => {
  it('places the cloud above the chef when thrown up', () => {
    const cloud = pepperCloudFor(chef(3.5, 4, 'up'));
    expect(cloud.x).toBe(3.5);
    expect(cloud.y).toBeCloseTo(4 - 24 / CELL_UNITS - 2 / CELL_UNITS, 10);
    expect(cloud.direction).toBe('up');
  });

  it('places the cloud below the chef when thrown down', () => {
    const cloud = pepperCloudFor(chef(3.5, 3, 'down'));
    expect(cloud.x).toBe(3.5);
    expect(cloud.y).toBeCloseTo(3 + 24 / CELL_UNITS - 2 / CELL_UNITS, 10);
  });

  it('hits an enemy climbing the same ladder above', () => {
    expect(isHitByPepper(chef(3.5, 4, 'up'), enemyOnLadder(3))).toBe(true);
  });

  it('hits an enemy climbing the same ladder below', () => {
    expect(isHitByPepper(chef(3.5, 3, 'down'), enemyOnLadder(4))).toBe(true);
  });

  it('hits an enemy waiting on the platform at the top of the ladder', () => {
    expect(isHitByPepper(chef(3.5, 3.2, 'up'), enemyAt(2, 3.7))).toBe(true);
  });

  it('hits an enemy waiting on the platform at the bottom of the ladder', () => {
    expect(isHitByPepper(chef(3.5, 3.8, 'down'), enemyAt(5, 3.3))).toBe(true);
  });

  it('misses an enemy behind the throw', () => {
    expect(isHitByPepper(chef(3.5, 4, 'down'), enemyOnLadder(3))).toBe(false);
    expect(isHitByPepper(chef(3.5, 3, 'up'), enemyOnLadder(4))).toBe(false);
  });

  it('misses an enemy that is too far along the ladder', () => {
    const tall = levelFromGrid({
      structure: ['===+====', ...Array.from({ length: 8 }, () => '...H....'), '===+===='],
      actors: [...Array.from({ length: 9 }, () => '........'), 'C.......']
    });
    const far = createEnemy(0, 'pickle', new EventQueue(), tall.graph, [
      tall.graph.placeAt(0, 3.5)
    ]);
    far.reset(tall.graph.placeAt(0, 3.5), rng);
    expect(isHitByPepper(chef(3.5, 8.9, 'up'), far)).toBe(false);
  });

  it('misses an enemy on the platform away from the ladder', () => {
    expect(isHitByPepper(chef(3.5, 3, 'up'), enemyAt(2, 6))).toBe(false);
  });
});

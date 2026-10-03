import { describe, expect, it } from 'vitest';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { CHEF_SPEED, EDGE_MARGIN } from '../rules';
import { NO_INPUT, type SimInput } from '../SimInput';
import { Chef } from './Chef';

const level = levelFromGrid(tinyGrid);
const graph = level.graph;
const press = (keys: Partial<SimInput>): SimInput => ({ ...NO_INPUT, ...keys });

const chefAt = (row: number, x: number): Chef => new Chef(graph.placeAt(row, x));

const run = (chef: Chef, input: SimInput, ticks: number, nav = graph): void => {
  for (let i = 0; i < ticks; i++) {
    chef.beginTick();
    chef.step(input, nav);
  }
};

describe('Chef walking', () => {
  it('advances 115/32 casillas in 60 ticks and faces right', () => {
    const chef = chefAt(5, 1);
    run(chef, press({ right: true }), 60);
    expect(chef.x).toBeCloseTo(1 + CHEF_SPEED, 9);
    expect(chef.facing).toBe(1);
    expect(chef.isMoving).toBe(true);
  });

  it('faces left when walking left', () => {
    const chef = chefAt(5, 4);
    run(chef, press({ left: true }), 10);
    expect(chef.facing).toBe(-1);
    expect(chef.x).toBeLessThan(4);
  });

  it('does not move when both directions are pressed', () => {
    const chef = chefAt(5, 4);
    run(chef, press({ left: true, right: true }), 30);
    expect(chef.x).toBe(4);
    expect(chef.isMoving).toBe(false);
  });

  it('stops 12/32 casillas from the left end of its platform', () => {
    const chef = chefAt(5, 1);
    run(chef, press({ left: true }), 120);
    expect(chef.x).toBeCloseTo(EDGE_MARGIN, 9);
  });

  it('stops 12/32 casillas from the right end of its platform', () => {
    const chef = chefAt(5, 6);
    run(chef, press({ right: true }), 120);
    expect(chef.x).toBeCloseTo(8 - EDGE_MARGIN, 9);
  });

  it('stays on the platform row with the previous position kept', () => {
    const chef = chefAt(5, 2);
    run(chef, press({ right: true }), 1);
    expect([chef.y, chef.row, chef.onPlatform, chef.isClimbing]).toEqual([5, 5, true, false]);
    expect(chef.prevX).toBe(2);
  });
});

describe('Chef on ladders', () => {
  it('centers on a nearby ladder when up is pressed and does not move that tick', () => {
    const chef = chefAt(5, 3.8);
    run(chef, press({ up: true }), 1);
    expect(chef.isClimbing).toBe(true);
    expect([chef.x, chef.y]).toEqual([3.5, 5]);
    expect(chef.row).toBe(5);
  });

  it('climbs to the upper platform while up is held', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 120);
    expect([chef.row, chef.y, chef.x]).toEqual([2, 2, 3.5]);
    expect(chef.onPlatform).toBe(true);
  });

  it('descends from the upper platform while down is held', () => {
    const chef = chefAt(2, 3.5);
    run(chef, press({ down: true }), 120);
    expect([chef.row, chef.y]).toEqual([5, 5]);
  });

  it('keeps the row of the platform it left while it is on the ladder', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 30);
    expect(chef.onPlatform).toBe(false);
    expect(chef.row).toBe(5);
    expect(chef.y).toBeLessThan(5);
    expect(chef.y).toBeGreaterThan(2);
  });

  it('stops where it is when the input is released', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 30);
    const y = chef.y;
    run(chef, NO_INPUT, 40);
    expect(chef.y).toBe(y);
    expect(chef.isClimbing).toBe(true);
  });

  it('reverses in the middle of the ladder and goes back down', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 30);
    const highest = chef.y;
    run(chef, press({ down: true }), 10);
    expect(chef.y).toBeGreaterThan(highest);
    run(chef, press({ down: true }), 120);
    expect([chef.row, chef.y, chef.onPlatform]).toEqual([5, 5, true]);
  });

  it('can continue upwards after stopping and reversing', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 30);
    run(chef, press({ down: true }), 5);
    run(chef, press({ up: true }), 120);
    expect([chef.row, chef.y]).toEqual([2, 2]);
  });

  it('ignores lateral input while on the ladder', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true }), 20);
    run(chef, press({ left: true, up: true }), 20);
    expect(chef.x).toBe(3.5);
    expect(chef.isClimbing).toBe(true);
  });

  it('does not grab a ladder when none is within reach', () => {
    const chef = chefAt(5, 6);
    run(chef, press({ up: true }), 30);
    expect(chef.isClimbing).toBe(false);
    expect(chef.y).toBe(5);
  });

  it('does not grab a ladder that goes the other way', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ down: true }), 30);
    expect(chef.isClimbing).toBe(false);
  });

  it('does nothing when up and down are pressed together', () => {
    const chef = chefAt(5, 3.5);
    run(chef, press({ up: true, down: true }), 30);
    expect(chef.isClimbing).toBe(false);
  });

  it('keeps climbing through consecutive ladders while up is held', () => {
    const stacked = levelFromGrid({
      structure: ['...', '.+.', '.H.', '.+.', '.H.', '.+.'],
      actors: ['...', '.C.', '...', '...', '...', '...']
    });
    const chef = new Chef(stacked.graph.placeAt(5, 1.5));
    run(chef, press({ up: true }), 400, stacked.graph);
    expect([chef.row, chef.y, chef.onPlatform]).toEqual([1, 1, true]);
  });

  it('climbs monotonically without oscillating around the end', () => {
    const chef = chefAt(5, 3.5);
    let previous = chef.y;
    for (let i = 0; i < 200 && (i === 0 || chef.isClimbing); i++) {
      run(chef, press({ up: true }), 1);
      expect(chef.y).toBeLessThanOrEqual(previous);
      previous = chef.y;
    }
    expect(chef.row).toBe(2);
  });
});

describe('Chef stepping off a ladder', () => {
  const floors = levelFromGrid({
    structure: ['........', '===+====', '...H....', '===+====', '...H....', '===+===='],
    actors: ['........', '........', '........', '........', '........', '......C.']
  });
  const nav = floors.graph;
  const onFloors = (row: number, x: number): Chef => new Chef(nav.placeAt(row, x));

  const climbUntil = (chef: Chef, input: Partial<SimInput>, reached: () => boolean): void => {
    for (let i = 0; i < 400 && !reached(); i++) run(chef, press(input), 1, nav);
  };

  it('steps onto an intermediate platform when it reaches its height going up', () => {
    const chef = onFloors(5, 3.5);
    climbUntil(chef, { up: true }, () => chef.isClimbing && chef.y <= 3.3);
    expect(chef.isClimbing).toBe(true);
    run(chef, press({ left: true, up: true }), 1, nav);
    expect([chef.onPlatform, chef.row, chef.facing]).toEqual([true, 3, -1]);
    expect(chef.x).toBeLessThan(3.5);
    expect(chef.y).toBe(3);
  });

  it('steps onto an intermediate platform going down', () => {
    const chef = onFloors(1, 3.5);
    climbUntil(chef, { down: true }, () => chef.isClimbing && chef.y >= 2.7);
    run(chef, press({ right: true, down: true }), 1, nav);
    expect([chef.onPlatform, chef.row, chef.facing]).toEqual([true, 3, 1]);
    expect(chef.x).toBeGreaterThan(3.5);
  });

  it('steps off after stopping next to a platform', () => {
    const chef = onFloors(5, 3.5);
    climbUntil(chef, { up: true }, () => chef.isClimbing && chef.y <= 3.3);
    run(chef, NO_INPUT, 10, nav);
    run(chef, press({ right: true }), 1, nav);
    expect([chef.onPlatform, chef.row]).toEqual([true, 3]);
  });

  it('ignores lateral input far from a platform', () => {
    const chef = onFloors(5, 3.5);
    run(chef, press({ up: true }), 1, nav);
    run(chef, press({ up: true }), 30, nav);
    const y = chef.y;
    run(chef, press({ left: true }), 10, nav);
    expect([chef.x, chef.y, chef.isClimbing]).toEqual([3.5, y, true]);
  });

  it('keeps going through the platform when only up is held', () => {
    const chef = onFloors(5, 3.5);
    run(chef, press({ up: true }), 400, nav);
    expect([chef.row, chef.onPlatform]).toEqual([1, true]);
  });

  it('gives walking priority over grabbing a ladder on a platform', () => {
    const chef = onFloors(5, 3.5);
    run(chef, press({ up: true, right: true }), 10, nav);
    expect(chef.isClimbing).toBe(false);
    expect(chef.x).toBeGreaterThan(3.5);
  });
});

describe('Chef reset', () => {
  it('returns to the given place without an interpolation streak', () => {
    const chef = chefAt(5, 6);
    run(chef, press({ left: true }), 20);
    chef.reset(graph.placeAt(5, 6.5));
    expect([chef.x, chef.y, chef.prevX, chef.prevY]).toEqual([6.5, 5, 6.5, 5]);
    expect([chef.facing, chef.isClimbing, chef.row]).toEqual([1, false, 5]);
  });
});

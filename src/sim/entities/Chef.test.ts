import { describe, expect, it } from 'vitest';
import { loadLevel } from '../level/loadLevel';
import { NO_INPUT, type SimInput } from '../SimInput';
import { tinyLevelData } from '../testing/levels';
import { CHEF_SPEED, EDGE_MARGIN } from '../rules';
import { Chef } from './Chef';

const level = loadLevel(tinyLevelData);
const press = (keys: Partial<SimInput>): SimInput => ({ ...NO_INPUT, ...keys });

const run = (chef: Chef, input: SimInput, ticks: number): void => {
  for (let i = 0; i < ticks; i++) {
    chef.beginTick();
    chef.step(input, level);
  }
};

describe('Chef walking', () => {
  it('advances 115/32 tiles in 60 ticks and faces right', () => {
    const chef = new Chef(5, 1);
    run(chef, press({ right: true }), 60);
    expect(chef.x).toBeCloseTo(1 + CHEF_SPEED, 9);
    expect(chef.facing).toBe(1);
    expect(chef.isMoving).toBe(true);
  });

  it('faces left when walking left', () => {
    const chef = new Chef(5, 4);
    run(chef, press({ left: true }), 10);
    expect(chef.facing).toBe(-1);
    expect(chef.x).toBeLessThan(4);
  });

  it('does not move when both directions are pressed', () => {
    const chef = new Chef(5, 4);
    run(chef, press({ left: true, right: true }), 30);
    expect(chef.x).toBe(4);
    expect(chef.isMoving).toBe(false);
  });

  it('stops 12/32 tiles from the left end of its platform', () => {
    const chef = new Chef(5, 1);
    run(chef, press({ left: true }), 120);
    expect(chef.x).toBeCloseTo(EDGE_MARGIN, 9);
  });

  it('stops 12/32 tiles from the right end of its platform', () => {
    const chef = new Chef(5, 6);
    run(chef, press({ right: true }), 120);
    expect(chef.x).toBeCloseTo(8 - EDGE_MARGIN, 9);
  });
});

describe('Chef ladders', () => {
  it('centers on a nearby ladder and climbs to the upper platform', () => {
    const chef = new Chef(5, 3.8);
    chef.beginTick();
    chef.step(press({ up: true }), level);
    expect(chef.isClimbing).toBe(true);
    expect(chef.x).toBe(3.5);
    run(chef, NO_INPUT, 90);
    expect(chef.isClimbing).toBe(false);
    expect(chef.row).toBe(2);
    expect(chef.y).toBe(2);
  });

  it('descends a ladder from the upper platform', () => {
    const chef = new Chef(2, 3.5);
    run(chef, press({ down: true }), 1);
    run(chef, NO_INPUT, 90);
    expect(chef.row).toBe(5);
    expect(chef.y).toBe(5);
  });

  it('does not climb without a ladder within reach', () => {
    const chef = new Chef(5, 6);
    run(chef, press({ up: true }), 30);
    expect(chef.isClimbing).toBe(false);
    expect(chef.y).toBe(5);
  });

  it('does not climb when the ladder goes the other way', () => {
    const chef = new Chef(5, 3.5);
    run(chef, press({ down: true }), 30);
    expect(chef.isClimbing).toBe(false);
    expect(chef.row).toBe(5);
  });

  it('ignores lateral input and direction changes while climbing', () => {
    const chef = new Chef(5, 3.5);
    run(chef, press({ up: true }), 1);
    run(chef, press({ left: true, down: true }), 20);
    expect(chef.x).toBe(3.5);
    expect(chef.y).toBeLessThan(5);
    expect(chef.isClimbing).toBe(true);
  });

  it('climbs monotonically without oscillating around the target', () => {
    const chef = new Chef(5, 3.5);
    run(chef, press({ up: true }), 1);
    let previous = chef.y;
    let ticks = 0;
    while (chef.isClimbing && ticks < 200) {
      run(chef, NO_INPUT, 1);
      expect(chef.y).toBeLessThanOrEqual(previous);
      previous = chef.y;
      ticks += 1;
    }
    expect(chef.isClimbing).toBe(false);
    expect(ticks).toBeGreaterThan(60);
    expect(ticks).toBeLessThan(80);
  });
});

describe('Chef reset', () => {
  it('returns to the given position without interpolation streaks', () => {
    const chef = new Chef(5, 6);
    run(chef, press({ left: true }), 20);
    chef.reset(5, 6.5);
    expect([chef.x, chef.y, chef.prevX, chef.prevY]).toEqual([6.5, 5, 6.5, 5]);
    expect(chef.facing).toBe(1);
    expect(chef.isClimbing).toBe(false);
  });
});

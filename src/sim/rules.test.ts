import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_THRESHOLD,
  BOUNCE_HEIGHT,
  BOUNCE_HOLD_TICKS,
  BOUNCE_RISE_TICKS,
  CELL_UNITS,
  CHEF_SPEED,
  CLIMB_SPEED,
  CONTACT_X,
  CONTACT_Y,
  DECISION_MAX_TICKS,
  DECISION_MIN_TICKS,
  EDGE_MARGIN,
  ENEMY_HEIGHT,
  ENEMY_CLIMB_SPEED,
  ENEMY_WALK_SPEED,
  FALL_SPEED,
  HARD_PACE,
  INGREDIENT_THICKNESS,
  LADDER_GRAB_DISTANCE,
  ORIGINAL_CELL_UNITS,
  PEPPER_CLOUD_LIFT,
  PEPPER_CLOUD_OFFSET,
  PEPPER_REACH_ALONG,
  PEPPER_REACH_ACROSS,
  RESPAWN_TICKS,
  ROW_UNITS,
  STEP_OFF_DISTANCE,
  STUN_TICKS,
  TICK_MS,
  TICK_SECONDS,
  TICKS_PER_SECOND
} from './rules';

const PX_PER_TILE = ORIGINAL_CELL_UNITS;

describe('rules', () => {
  it('measures the original in characters at twice their size and draws a cell two units wider', () => {
    expect(ORIGINAL_CELL_UNITS).toBe(16);
    expect(CELL_UNITS).toBe(18);
  });

  it('keeps the speeds measured in the original game, enemies at 5/8 of the chef', () => {
    expect(CHEF_SPEED * PX_PER_TILE).toBe(86);
    expect(CLIMB_SPEED * PX_PER_TILE).toBe(43);
    expect(ENEMY_WALK_SPEED * PX_PER_TILE).toBe(54);
    expect(ENEMY_CLIMB_SPEED * PX_PER_TILE).toBe(27);
  });

  it('makes rows taller than cells are wide, so a ladder run leaves room for the chef', () => {
    const platform = 8;
    const chef = 32;
    expect(ROW_UNITS).toBe(21);
    expect(2 * ROW_UNITS - platform - chef).toBe(2);
  });

  it('converts the pixel thresholds to cells and the drawn heights to rows', () => {
    expect(ARRIVAL_THRESHOLD * PX_PER_TILE).toBe(3);
    expect(EDGE_MARGIN * PX_PER_TILE).toBe(12);
    expect(CONTACT_X * PX_PER_TILE).toBe(16);
    expect(CONTACT_Y * ROW_UNITS).toBeCloseTo(18, 10);
    const pepper = [PEPPER_CLOUD_OFFSET, PEPPER_REACH_ALONG, PEPPER_REACH_ACROSS];
    expect(pepper.map(({ cells }) => cells * PX_PER_TILE)).toEqual([24, 44, 26]);
    pepper.forEach(({ rows }, index) => {
      expect(rows * ROW_UNITS).toBeCloseTo([24, 44, 26][index] ?? 0, 10);
    });
    expect(PEPPER_CLOUD_LIFT * ROW_UNITS).toBeCloseTo(2, 10);
    expect(LADDER_GRAB_DISTANCE * PX_PER_TILE).toBeCloseTo(19.2, 10);
    expect(STEP_OFF_DISTANCE * ROW_UNITS).toBeCloseTo(12.8, 10);
    expect(ENEMY_HEIGHT * ROW_UNITS).toBeCloseTo(32, 10);
  });

  it('converts the durations of the proof of concept to ticks', () => {
    expect(TICKS_PER_SECOND).toBe(60);
    expect(TICK_MS).toBeCloseTo(16.667, 3);
    expect(STUN_TICKS).toBe(300);
    expect(RESPAWN_TICKS).toBe(150);
    expect(DECISION_MIN_TICKS).toBe(30);
    expect(DECISION_MAX_TICKS).toBe(66);
  });

  it('keeps the cadence of the falls measured in the original game', () => {
    expect(FALL_SPEED * PX_PER_TILE).toBe(113);
    expect(BOUNCE_HEIGHT * ROW_UNITS).toBeCloseTo(13, 10);
    expect([BOUNCE_RISE_TICKS, BOUNCE_HOLD_TICKS]).toEqual([5, 13]);
  });

  it('gives each ingredient the thickness of its art', () => {
    const thickness = Object.fromEntries(
      Object.entries(INGREDIENT_THICKNESS).map(([kind, rows]) => [kind, rows * ROW_UNITS])
    );
    expect(thickness.bunTop).toBeCloseTo(13, 10);
    expect(thickness.lettuce).toBeCloseTo(8, 10);
    expect(thickness.patty).toBeCloseTo(12, 10);
    expect(thickness.bunBottom).toBeCloseTo(11, 10);
  });

  it('advances less per tick than the alignment window, so ladders cannot be skipped', () => {
    expect(CLIMB_SPEED * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
    expect(ENEMY_WALK_SPEED * HARD_PACE * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
    expect(ENEMY_CLIMB_SPEED * HARD_PACE * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
    expect(CHEF_SPEED * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
  });
});

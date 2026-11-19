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
  ENEMY_SPEED,
  FALL_SPEED,
  INGREDIENT_THICKNESS,
  LADDER_GRAB_DISTANCE,
  PEPPER_CLOUD_OFFSET,
  PEPPER_REACH_ALONG,
  PEPPER_REACH_ACROSS,
  RESPAWN_TICKS,
  STEP_OFF_DISTANCE,
  STUN_TICKS,
  TICK_MS,
  TICK_SECONDS,
  TICKS_PER_SECOND
} from './rules';

const PX_PER_TILE = CELL_UNITS;

describe('rules', () => {
  it('measures a cell as one character of the original at twice its size, half a chef', () => {
    expect(CELL_UNITS).toBe(16);
  });

  it('converts the speeds of the proof of concept to tiles per second exactly', () => {
    expect(CHEF_SPEED * PX_PER_TILE).toBe(115);
    expect(CLIMB_SPEED * PX_PER_TILE).toBe(80);
    expect(ENEMY_SPEED * PX_PER_TILE).toBe(68);
  });

  it('converts the pixel thresholds to tiles exactly', () => {
    expect(ARRIVAL_THRESHOLD * PX_PER_TILE).toBe(3);
    expect(EDGE_MARGIN * PX_PER_TILE).toBe(12);
    expect(CONTACT_X * PX_PER_TILE).toBe(16);
    expect(CONTACT_Y * PX_PER_TILE).toBe(18);
    expect(PEPPER_CLOUD_OFFSET * PX_PER_TILE).toBe(24);
    expect(PEPPER_REACH_ALONG * PX_PER_TILE).toBe(44);
    expect(PEPPER_REACH_ACROSS * PX_PER_TILE).toBe(26);
    expect(LADDER_GRAB_DISTANCE * PX_PER_TILE).toBeCloseTo(19.2, 10);
    expect(STEP_OFF_DISTANCE * PX_PER_TILE).toBeCloseTo(12.8, 10);
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
    expect(BOUNCE_HEIGHT * PX_PER_TILE).toBe(13);
    expect([BOUNCE_RISE_TICKS, BOUNCE_HOLD_TICKS]).toEqual([5, 13]);
  });

  it('gives each ingredient the thickness of its art', () => {
    const thickness = Object.fromEntries(
      Object.entries(INGREDIENT_THICKNESS).map(([kind, rows]) => [kind, rows * PX_PER_TILE])
    );
    expect(thickness.bunTop).toBeCloseTo(13, 10);
    expect(thickness.lettuce).toBeCloseTo(8, 10);
    expect(thickness.patty).toBeCloseTo(12, 10);
    expect(thickness.bunBottom).toBeCloseTo(11, 10);
  });

  it('advances less per tick than the alignment window, so ladders cannot be skipped', () => {
    expect(CLIMB_SPEED * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
    expect(ENEMY_SPEED * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
    expect(CHEF_SPEED * TICK_SECONDS).toBeLessThan(2 * ARRIVAL_THRESHOLD);
  });
});

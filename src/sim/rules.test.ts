import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_THRESHOLD,
  CHEF_SPEED,
  CLIMB_SPEED,
  CONTACT_X,
  CONTACT_Y,
  DECISION_MAX_TICKS,
  DECISION_MIN_TICKS,
  EDGE_MARGIN,
  ENEMY_SPEED,
  FALL_STAGGER_TICKS,
  FALL_TICKS,
  PEPPER_CLOUD_OFFSET,
  PEPPER_REACH_X,
  PEPPER_REACH_Y,
  RESPAWN_TICKS,
  STUN_TICKS,
  TICK_MS,
  TICKS_PER_SECOND
} from './rules';

const PX_PER_TILE = 32;

describe('rules', () => {
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
    expect(PEPPER_REACH_X * PX_PER_TILE).toBe(44);
    expect(PEPPER_REACH_Y * PX_PER_TILE).toBe(26);
  });

  it('converts the durations of the proof of concept to ticks', () => {
    expect(TICKS_PER_SECOND).toBe(60);
    expect(TICK_MS).toBeCloseTo(16.667, 3);
    expect(STUN_TICKS).toBe(300);
    expect(RESPAWN_TICKS).toBe(150);
    expect(FALL_TICKS).toBe(12);
    expect(FALL_STAGGER_TICKS).toBe(7);
    expect(DECISION_MIN_TICKS).toBe(30);
    expect(DECISION_MAX_TICKS).toBe(66);
  });
});

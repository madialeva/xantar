import { describe, expect, it } from 'vitest';
import { chefAnimation, enemyAnimation } from './chooseAnimation';

describe('chefAnimation', () => {
  it('is idle when standing on a platform and walks when moving', () => {
    expect(chefAnimation({ isMoving: false, isClimbing: false }, false)).toBe('idle');
    expect(chefAnimation({ isMoving: true, isClimbing: false }, false)).toBe('walk');
  });

  it('holds the ladder when stopped on it and climbs when moving on it', () => {
    expect(chefAnimation({ isMoving: false, isClimbing: true }, false)).toBe('climbIdle');
    expect(chefAnimation({ isMoving: true, isClimbing: true }, false)).toBe('climb');
  });

  it('shows the hit over any other state', () => {
    expect(chefAnimation({ isMoving: true, isClimbing: true }, true)).toBe('hit');
    expect(chefAnimation({ isMoving: false, isClimbing: false }, true)).toBe('hit');
  });
});

describe('enemyAnimation', () => {
  const enemy = { active: true, stunned: false, isClimbing: false };

  it('walks on platforms and climbs on ladders', () => {
    expect(enemyAnimation(enemy)).toBe('walk');
    expect(enemyAnimation({ ...enemy, isClimbing: true })).toBe('climb');
  });

  it('is stunned while the simulation says so, even on a ladder', () => {
    expect(enemyAnimation({ ...enemy, stunned: true, isClimbing: true })).toBe('stunned');
  });

  it('is inactive when squashed or waiting to respawn', () => {
    expect(enemyAnimation({ ...enemy, active: false, stunned: true })).toBe('inactive');
  });
});

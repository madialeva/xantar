import { describe, expect, it } from 'vitest';
import { isStandingOn } from './riders';

const ingredient = { row: 3, left: 1, right: 5 };
const enemy = { active: true, riding: false, isClimbing: false, row: 3, x: 2.5 };

describe('isStandingOn', () => {
  it('is true for an enemy on the platform of the ingredient, within its casillas', () => {
    expect(isStandingOn(ingredient, enemy)).toBe(true);
    expect(isStandingOn(ingredient, { ...enemy, x: 1 })).toBe(true);
    expect(isStandingOn(ingredient, { ...enemy, x: 5 })).toBe(true);
  });

  it('is false outside its casillas or on another row', () => {
    expect(isStandingOn(ingredient, { ...enemy, x: 5.5 })).toBe(false);
    expect(isStandingOn(ingredient, { ...enemy, x: 0.5 })).toBe(false);
    expect(isStandingOn(ingredient, { ...enemy, row: 6 })).toBe(false);
  });

  it('is false for an enemy on a ladder that crosses the row', () => {
    expect(isStandingOn(ingredient, { ...enemy, isClimbing: true })).toBe(false);
  });

  it('is false for an inactive enemy or one already riding', () => {
    expect(isStandingOn(ingredient, { ...enemy, active: false })).toBe(false);
    expect(isStandingOn(ingredient, { ...enemy, riding: true })).toBe(false);
  });
});

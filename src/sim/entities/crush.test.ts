import { describe, expect, it } from 'vitest';
import { ENEMY_HEIGHT } from '../rules';
import { isCrushedBy } from './crush';

const ingredient = (y: number) => ({ left: 1, right: 5, y });

describe('isCrushedBy', () => {
  it('crushes an enemy once the base of the ingredient is lower than its head', () => {
    expect(isCrushedBy(ingredient(5 - ENEMY_HEIGHT), { x: 3, y: 5 })).toBe(false);
    expect(isCrushedBy(ingredient(5 - ENEMY_HEIGHT + 0.01), { x: 3, y: 5 })).toBe(true);
    expect(isCrushedBy(ingredient(5), { x: 3, y: 5 })).toBe(true);
  });

  it('does not crush an enemy far below the ingredient', () => {
    expect(isCrushedBy(ingredient(2.5), { x: 3, y: 5 })).toBe(false);
  });

  it('does not crush an enemy above the base, such as one left behind on a platform', () => {
    expect(isCrushedBy(ingredient(5.1), { x: 3, y: 5 })).toBe(false);
  });

  it('only crushes within the casillas of the ingredient, edges included', () => {
    expect(isCrushedBy(ingredient(4.5), { x: 1, y: 5 })).toBe(true);
    expect(isCrushedBy(ingredient(4.5), { x: 5, y: 5 })).toBe(true);
    expect(isCrushedBy(ingredient(4.5), { x: 0.9, y: 5 })).toBe(false);
    expect(isCrushedBy(ingredient(4.5), { x: 5.1, y: 5 })).toBe(false);
  });

  it('crushes an enemy on a ladder inside the casillas when the base reaches its height', () => {
    expect(isCrushedBy(ingredient(3.2), { x: 3.5, y: 3.7 })).toBe(true);
    expect(isCrushedBy(ingredient(2.6), { x: 3.5, y: 3.7 })).toBe(false);
  });
});

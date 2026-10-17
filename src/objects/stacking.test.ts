import { describe, expect, it } from 'vitest';
import type { IngredientKind, IngredientSnapshot } from '../sim';
import { INGREDIENT_STACK_HEIGHTS } from '../view/art/graphics';
import { stackLifts } from './stacking';

const ingredient = (
  id: number,
  kind: IngredientKind,
  stackSlot: number | null,
  col = 2
): IngredientSnapshot => ({
  id,
  kind,
  col,
  width: 4,
  left: col,
  right: col + 4,
  row: 13,
  phase: stackSlot === null ? 'idle' : 'stacked',
  stomped: [false, false, false, false],
  fallFromRow: 13,
  fallToRow: 14,
  fallProgress: 0,
  landsOnPlate: stackSlot !== null,
  stackSlot
});

describe('stackLifts', () => {
  it('leaves out ingredients that are not bound for a plate', () => {
    expect(stackLifts([ingredient(1, 'patty', null)]).has(1)).toBe(false);
  });

  it('puts the first ingredient on the plate itself', () => {
    expect(stackLifts([ingredient(1, 'bunBottom', 0)]).get(1)).toBe(0);
  });

  it('raises an ingredient by the stack heights of those below it on the same plate', () => {
    const lifts = stackLifts([
      ingredient(1, 'lettuce', 2),
      ingredient(2, 'bunBottom', 0),
      ingredient(3, 'patty', 1)
    ]);
    expect(lifts.get(1)).toBe(INGREDIENT_STACK_HEIGHTS.bunBottom + INGREDIENT_STACK_HEIGHTS.patty);
    expect(lifts.get(3)).toBe(INGREDIENT_STACK_HEIGHTS.bunBottom);
  });

  it('ignores ingredients stacked on other plates', () => {
    const lifts = stackLifts([ingredient(1, 'patty', 1), ingredient(2, 'bunBottom', 0, 11)]);
    expect(lifts.get(1)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import type { IngredientSpec } from '../level/Level';
import { FALL_STAGGER_TICKS, FALL_TICKS } from '../rules';
import {
  type FallPlan,
  Ingredient,
  type IngredientHost,
  type IngredientSnapshot
} from './Ingredient';

const spec = (width = 4): IngredientSpec => ({ id: 3, kind: 'patty', row: 5, col: 1, width });

class FakeHost implements IngredientHost {
  readonly started: number[] = [];
  readonly landings: FallPlan[] = [];

  constructor(private readonly plan: FallPlan) {}

  startFall(ingredient: IngredientSnapshot): FallPlan {
    this.started.push(ingredient.row);
    return this.plan;
  }

  landed(_ingredient: IngredientSnapshot, plan: FallPlan): void {
    this.landings.push(plan);
  }
}

const toPlatform: FallPlan = {
  fromRow: 5,
  toRow: 8,
  toPlate: false,
  plateId: null,
  stackSlot: null
};
const toPlate: FallPlan = { fromRow: 5, toRow: 10, toPlate: true, plateId: 0, stackSlot: 2 };

const stepTicks = (ingredient: Ingredient, ticks: number): void => {
  for (let i = 0; i < ticks; i++) ingredient.step();
};

const stompAll = (ingredient: Ingredient): void => {
  for (let segment = 0; segment < ingredient.width; segment++) ingredient.stomp(segment);
};

describe('Ingredient segments', () => {
  it('has the columns of its spec and no segment stomped at the start', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    expect([ingredient.left, ingredient.right, ingredient.row]).toEqual([1, 5, 5]);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(ingredient.allStomped).toBe(false);
  });

  it('finds the segment under a position', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    expect(ingredient.segmentAt(1)).toBe(0);
    expect(ingredient.segmentAt(2.4)).toBe(1);
    expect(ingredient.segmentAt(4.99)).toBe(3);
    expect(ingredient.segmentAt(5)).toBeUndefined();
    expect(ingredient.segmentAt(0.99)).toBeUndefined();
  });

  it('stomps a segment once and reports only the new ones', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    expect(ingredient.stomp(1)).toBe(true);
    expect(ingredient.stomp(1)).toBe(false);
    expect(ingredient.stomped).toEqual([false, true, false, false]);
  });

  it('ignores a segment outside the ingredient', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    expect(ingredient.stomp(9)).toBe(false);
    expect(ingredient.stomp(-1)).toBe(false);
  });

  it('has all its segments stomped only after stomping the last one', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    [0, 1, 2].forEach((segment) => ingredient.stomp(segment));
    expect(ingredient.allStomped).toBe(false);
    ingredient.stomp(3);
    expect(ingredient.allStomped).toBe(true);
  });

  it('keeps the stomped segments when it is activated later', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    ingredient.stomp(0);
    ingredient.stomp(2);
    expect(ingredient.stomped).toEqual([true, false, true, false]);
  });

  it('adapts the number of segments to the size of the unit', () => {
    for (const width of [3, 2]) {
      const ingredient = new Ingredient(spec(width), new FakeHost(toPlatform));
      expect(ingredient.stomped).toHaveLength(width);
      for (let segment = 0; segment < width - 1; segment++) ingredient.stomp(segment);
      expect(ingredient.allStomped).toBe(false);
      ingredient.stomp(width - 1);
      expect(ingredient.allStomped).toBe(true);
    }
  });
});

describe('Ingredient life cycle', () => {
  it('starts idle on its platform row', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlatform));
    expect([ingredient.phase, ingredient.row, ingredient.isIdle]).toEqual(['idle', 5, true]);
  });

  it('falls to the next platform in the configured ticks and becomes idle with fresh segments', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec(), host);
    stompAll(ingredient);
    ingredient.activate(0);
    expect(ingredient.phase).toBe('waiting');
    ingredient.step();
    expect(ingredient.phase).toBe('falling');
    expect(ingredient.row).toBe(8);
    expect([ingredient.fallFromRow, ingredient.fallToRow]).toEqual([5, 8]);
    expect(ingredient.stomped).toEqual([true, true, true, true]);
    stepTicks(ingredient, FALL_TICKS / 2);
    expect(ingredient.fallProgress).toBeCloseTo(0.5, 10);
    stepTicks(ingredient, FALL_TICKS / 2 - 1);
    expect(ingredient.phase).toBe('falling');
    ingredient.step();
    expect(ingredient.phase).toBe('idle');
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(host.landings).toEqual([toPlatform]);
  });

  it('stacks on the plate with its slot', () => {
    const host = new FakeHost(toPlate);
    const ingredient = new Ingredient(spec(), host);
    stompAll(ingredient);
    ingredient.activate(0);
    stepTicks(ingredient, 1 + FALL_TICKS);
    expect(ingredient.phase).toBe('stacked');
    expect([ingredient.stackSlot, ingredient.landsOnPlate, ingredient.row]).toEqual([2, true, 5]);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(host.landings).toEqual([toPlate]);
  });

  it('waits the requested ticks before starting to fall', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec(), host);
    ingredient.activate(FALL_STAGGER_TICKS);
    stepTicks(ingredient, FALL_STAGGER_TICKS);
    expect(host.started).toHaveLength(0);
    ingredient.step();
    expect(host.started).toHaveLength(1);
  });

  it('cannot be activated again while it is not idle', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec(), host);
    ingredient.activate(0);
    ingredient.activate(100);
    ingredient.step();
    expect(host.started).toHaveLength(1);
  });

  it('cannot be stomped while it is falling or stacked', () => {
    const ingredient = new Ingredient(spec(), new FakeHost(toPlate));
    ingredient.activate(0);
    ingredient.step();
    expect(ingredient.stomp(0)).toBe(false);
    stepTicks(ingredient, FALL_TICKS);
    expect(ingredient.phase).toBe('stacked');
    expect(ingredient.stomp(0)).toBe(false);
  });
});

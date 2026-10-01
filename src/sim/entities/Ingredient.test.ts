import { describe, expect, it } from 'vitest';
import type { IngredientSpec } from '../level/Level';
import { chefAt } from '../testing/chef';
import { FALL_STAGGER_TICKS, FALL_TICKS } from '../rules';
import {
  type FallPlan,
  Ingredient,
  type IngredientHost,
  type IngredientSnapshot
} from './Ingredient';

const spec: IngredientSpec = { id: 3, kind: 'patty', row: 5, left: 1.0625, right: 4.9375 };

class FakeHost implements IngredientHost {
  readonly started: IngredientSnapshot[] = [];
  readonly landings: FallPlan[] = [];

  constructor(private readonly plan: FallPlan) {}

  startFall(ingredient: IngredientSnapshot): FallPlan {
    this.started.push({ ...ingredient, row: ingredient.row });
    return this.plan;
  }

  landed(_ingredient: IngredientSnapshot, plan: FallPlan): void {
    this.landings.push(plan);
  }
}

const toPlatform: FallPlan = { fromRow: 5, toRow: 8, toPlate: false, stackSlot: null };
const toPlate: FallPlan = { fromRow: 5, toRow: 10, toPlate: true, stackSlot: 2 };

const stepTicks = (ingredient: Ingredient, ticks: number): void => {
  for (let i = 0; i < ticks; i++) ingredient.step();
};

describe('Ingredient traversal', () => {
  it('triggers when the chef walks from one end to the other', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    expect(ingredient.observeChef(chefAt(5, 1.1))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 3))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 4.8))).toBe(true);
  });

  it('works in both directions', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    expect(ingredient.observeChef(chefAt(5, 4.9))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 1.2))).toBe(true);
  });

  it('restarts the traversal when the chef leaves the range and comes back', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    ingredient.observeChef(chefAt(5, 1.2));
    expect(ingredient.observeChef(chefAt(5, 0.2))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 4.9))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 1.2))).toBe(true);
  });

  it('restarts the traversal when the chef changes row', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    ingredient.observeChef(chefAt(5, 1.2));
    expect(ingredient.observeChef(chefAt(2, 3))).toBe(false);
    expect(ingredient.observeChef(chefAt(5, 4.9))).toBe(false);
  });

  it('ignores a chef on another row', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    expect(ingredient.observeChef(chefAt(2, 1.2))).toBe(false);
    expect(ingredient.observeChef(chefAt(2, 4.8))).toBe(false);
  });

  it('can be triggered again after a completed traversal', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    ingredient.observeChef(chefAt(5, 1.2));
    expect(ingredient.observeChef(chefAt(5, 4.8))).toBe(true);
    expect(ingredient.observeChef(chefAt(5, 4.8))).toBe(false);
  });
});

describe('Ingredient life cycle', () => {
  it('starts idle on its platform row', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlatform));
    expect([ingredient.phase, ingredient.row, ingredient.isIdle]).toEqual(['idle', 5, true]);
  });

  it('falls to the next platform in the configured ticks and becomes idle there', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec, host);
    ingredient.activate(0);
    expect(ingredient.phase).toBe('waiting');
    ingredient.step();
    expect(ingredient.phase).toBe('falling');
    expect(ingredient.row).toBe(8);
    expect([ingredient.fallFromRow, ingredient.fallToRow]).toEqual([5, 8]);
    expect(ingredient.fallProgress).toBe(0);
    stepTicks(ingredient, FALL_TICKS / 2);
    expect(ingredient.fallProgress).toBeCloseTo(0.5, 10);
    stepTicks(ingredient, FALL_TICKS / 2 - 1);
    expect(ingredient.phase).toBe('falling');
    ingredient.step();
    expect(ingredient.phase).toBe('idle');
    expect(host.landings).toEqual([toPlatform]);
  });

  it('stacks on the plate with its slot', () => {
    const host = new FakeHost(toPlate);
    const ingredient = new Ingredient(spec, host);
    ingredient.activate(0);
    stepTicks(ingredient, 1 + FALL_TICKS);
    expect(ingredient.phase).toBe('stacked');
    expect([ingredient.stackSlot, ingredient.landsOnPlate, ingredient.row]).toEqual([2, true, 5]);
    expect(host.landings).toEqual([toPlate]);
  });

  it('waits the requested ticks before starting to fall', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec, host);
    ingredient.activate(FALL_STAGGER_TICKS);
    stepTicks(ingredient, FALL_STAGGER_TICKS);
    expect(host.started).toHaveLength(0);
    ingredient.step();
    expect(host.started).toHaveLength(1);
  });

  it('cannot be activated again while it is not idle', () => {
    const host = new FakeHost(toPlatform);
    const ingredient = new Ingredient(spec, host);
    ingredient.activate(0);
    ingredient.activate(100);
    ingredient.step();
    expect(host.started).toHaveLength(1);
  });

  it('does not react to the chef while it is falling or stacked', () => {
    const ingredient = new Ingredient(spec, new FakeHost(toPlate));
    ingredient.activate(0);
    ingredient.step();
    expect(ingredient.observeChef(chefAt(8, 1.2))).toBe(false);
    stepTicks(ingredient, FALL_TICKS);
    expect(ingredient.phase).toBe('stacked');
    ingredient.observeChef(chefAt(10, 1.2));
    expect(ingredient.observeChef(chefAt(10, 4.8))).toBe(false);
  });
});

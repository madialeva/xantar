import { describe, expect, it } from 'vitest';
import type { IngredientSpec } from '../level/Level';
import {
  BOUNCE_HEIGHT,
  BOUNCE_HOLD_TICKS,
  BOUNCE_RISE_TICKS,
  FALL_SPEED,
  INGREDIENT_THICKNESS,
  RIDER_STOP_TICKS,
  TICK_SECONDS
} from '../rules';
import {
  Ingredient,
  type IngredientHost,
  type IngredientPhase,
  type IngredientSnapshot,
  type Support
} from './Ingredient';

const FALL_STEP = FALL_SPEED * TICK_SECONDS;

const spec = (width = 4): IngredientSpec => ({ id: 3, kind: 'patty', row: 5, col: 1, width });

/**
 * A host with, at most, one resting ingredient below whose top is at `restingTop`, and the
 * supports `below` handed out in order to an ingredient that goes on after a stop.
 */
class FakeHost implements IngredientHost {
  readonly touches: Support[] = [];
  readonly rests: Support[] = [];
  readonly below: Support[] = [];
  restingTop: number | undefined;

  supportBelow(): Support | undefined {
    return this.below.shift();
  }

  strike(ingredient: IngredientSnapshot, toY: number): number | undefined {
    const top = this.restingTop;
    if (top === undefined || top <= ingredient.y || top > toY) return undefined;
    this.restingTop = undefined;
    return top;
  }

  touchedDown(_ingredient: IngredientSnapshot, support: Support): void {
    this.touches.push(support);
  }

  cameToRest(_ingredient: IngredientSnapshot, support: Support): void {
    this.rests.push(support);
  }
}

const floor = (row: number): Support => ({ row, y: row, plateId: null, stackSlot: null });
const plate: Support = { row: 10, y: 9.75, plateId: 0, stackSlot: 2 };

const tick = (ingredient: Ingredient, ticks = 1): void => {
  for (let i = 0; i < ticks; i++) {
    ingredient.beginTick();
    ingredient.step();
  }
};

/** Ticks while the ingredient is in a phase (a function, so the tests do not narrow `phase`). */
const tickWhile = (ingredient: Ingredient, phase: IngredientPhase): void => {
  while (ingredient.phase === phase) tick(ingredient);
};

const stompAll = (ingredient: Ingredient): void => {
  for (let segment = 0; segment < ingredient.width; segment++) ingredient.stomp(segment);
};

describe('Ingredient segments', () => {
  it('has the columns of its spec and no segment stomped at the start', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect([ingredient.left, ingredient.right, ingredient.row]).toEqual([1, 5, 5]);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(ingredient.allStomped).toBe(false);
  });

  it('finds the segment under a position', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect(ingredient.segmentAt(1)).toBe(0);
    expect(ingredient.segmentAt(2.4)).toBe(1);
    expect(ingredient.segmentAt(4.99)).toBe(3);
    expect(ingredient.segmentAt(5)).toBeUndefined();
    expect(ingredient.segmentAt(0.99)).toBeUndefined();
  });

  it('stomps a segment once and reports only the new ones', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect(ingredient.stomp(1)).toBe(true);
    expect(ingredient.stomp(1)).toBe(false);
    expect(ingredient.stomped).toEqual([false, true, false, false]);
  });

  it('ignores a segment outside the ingredient', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect(ingredient.stomp(9)).toBe(false);
    expect(ingredient.stomp(-1)).toBe(false);
  });

  it('has all its segments stomped only after stomping the last one', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    [0, 1, 2].forEach((segment) => ingredient.stomp(segment));
    expect(ingredient.allStomped).toBe(false);
    ingredient.stomp(3);
    expect(ingredient.allStomped).toBe(true);
  });

  it('keeps the stomped segments until it falls', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    ingredient.stomp(0);
    ingredient.stomp(2);
    expect(ingredient.stomped).toEqual([true, false, true, false]);
  });

  it('adapts the number of segments to the size of the unit', () => {
    for (const width of [3, 2]) {
      const ingredient = new Ingredient(spec(width), new FakeHost());
      expect(ingredient.stomped).toHaveLength(width);
      for (let segment = 0; segment < width - 1; segment++) ingredient.stomp(segment);
      expect(ingredient.allStomped).toBe(false);
      ingredient.stomp(width - 1);
      expect(ingredient.allStomped).toBe(true);
    }
  });

  it('lifts its segments again when it has nowhere to fall', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    stompAll(ingredient);
    ingredient.resetSegments();
    expect([ingredient.phase, ingredient.stomped]).toEqual(['idle', [false, false, false, false]]);
  });
});

describe('Ingredient position', () => {
  it('starts idle on its platform, at the centre of its casillas', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect([ingredient.phase, ingredient.isIdle]).toEqual(['idle', true]);
    expect([ingredient.x, ingredient.y, ingredient.prevY]).toEqual([3, 5, 5]);
  });

  it('has its top at its thickness above its base', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    expect(ingredient.top).toBeCloseTo(5 - INGREDIENT_THICKNESS.patty, 10);
  });
});

describe('Ingredient fall', () => {
  it('goes down the same amount every tick and reaches a floor 96 units below in 34 ticks', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    stompAll(ingredient);
    ingredient.fall(floor(11));
    const heights: number[] = [];
    for (let i = 0; i < 33; i++) {
      tick(ingredient);
      heights.push(ingredient.y);
    }
    expect(ingredient.phase).toBe('falling');
    expect(ingredient.stomped).toEqual([true, true, true, true]);
    heights.forEach((y, index) => expect(y).toBeCloseTo(5 + (index + 1) * FALL_STEP, 10));
    expect(host.touches).toEqual([]);
    tick(ingredient);
    expect([ingredient.y, ingredient.phase, ingredient.row]).toEqual([11, 'idle', 11]);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(host.touches).toEqual([floor(11)]);
    expect(host.rests).toEqual([floor(11)]);
  });

  it('keeps the previous height for the view to interpolate', () => {
    const ingredient = new Ingredient(spec(), new FakeHost());
    ingredient.fall(floor(8));
    tick(ingredient, 2);
    expect(ingredient.y - ingredient.prevY).toBeCloseTo(FALL_STEP, 10);
  });

  it('bounces when it meets an ingredient: rises, waits and goes down again', () => {
    const host = new FakeHost();
    host.restingTop = 7.5;
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(floor(8));
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y]).toEqual(['bouncing', 7.5]);
    const contact = ingredient.y;
    tick(ingredient, BOUNCE_RISE_TICKS);
    expect(ingredient.y).toBeCloseTo(contact - BOUNCE_HEIGHT, 10);
    tick(ingredient, BOUNCE_HOLD_TICKS - 1);
    expect([ingredient.phase, ingredient.y]).toEqual(['bouncing', contact - BOUNCE_HEIGHT]);
    tick(ingredient);
    expect([ingredient.phase, ingredient.y]).toEqual(['falling', contact - BOUNCE_HEIGHT]);
    tick(ingredient);
    expect(ingredient.y).toBeCloseTo(contact - BOUNCE_HEIGHT + FALL_STEP, 10);
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y]).toEqual(['idle', 8]);
    expect(host.touches).toHaveLength(1);
  });

  it('bounces on its plate and only comes to rest after going back down to its place', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(plate);
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y, ingredient.stackSlot]).toEqual(['bouncing', 9.75, 2]);
    expect(host.touches).toEqual([plate]);
    expect(host.rests).toEqual([]);
    tick(ingredient, BOUNCE_RISE_TICKS + BOUNCE_HOLD_TICKS);
    expect(ingredient.phase).toBe('falling');
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y, ingredient.row]).toEqual(['stacked', 9.75, 10]);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(host.touches).toEqual([plate]);
    expect(host.rests).toEqual([plate]);
  });

  it('does not start another fall while it is falling', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(floor(8));
    ingredient.fall(floor(12));
    tickWhile(ingredient, 'falling');
    expect(ingredient.y).toBe(8);
  });

  it('cannot be stomped while it falls, bounces or is stacked', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(plate);
    tick(ingredient);
    expect(ingredient.stomp(0)).toBe(false);
    tickWhile(ingredient, 'falling');
    expect(ingredient.stomp(0)).toBe(false);
    tickWhile(ingredient, 'bouncing');
    tickWhile(ingredient, 'falling');
    expect(ingredient.stomp(0)).toBe(false);
  });
});

describe('Ingredient carrying enemies', () => {
  it('stops on each floor and goes on to the next support until it has gone down all of them', () => {
    const host = new FakeHost();
    host.below.push(floor(11), floor(14));
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(floor(8), 3);
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y, ingredient.row]).toEqual(['stopped', 8, 8]);
    expect([host.touches, host.rests]).toEqual([[floor(8)], []]);
    expect(ingredient.stomp(0)).toBe(false);
    tick(ingredient, RIDER_STOP_TICKS - 1);
    expect([ingredient.phase, ingredient.y]).toEqual(['stopped', 8]);
    tick(ingredient);
    expect([ingredient.phase, ingredient.y]).toEqual(['falling', 8]);
    tick(ingredient);
    expect(ingredient.y).toBeCloseTo(8 + FALL_STEP, 10);
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y]).toEqual(['stopped', 11]);
    tickWhile(ingredient, 'stopped');
    tickWhile(ingredient, 'falling');
    expect([ingredient.phase, ingredient.y, ingredient.row]).toEqual(['idle', 14, 14]);
    expect(host.touches).toEqual([floor(8), floor(11), floor(14)]);
    expect(host.rests).toEqual([floor(14)]);
  });

  it('ends its fall on its plate even with supports left', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(plate, 5);
    tickWhile(ingredient, 'falling');
    tickWhile(ingredient, 'bouncing');
    tickWhile(ingredient, 'falling');
    expect(ingredient.phase).toBe('stacked');
    expect(host.rests).toEqual([plate]);
  });

  it('rests where it stopped when there is no support below', () => {
    const host = new FakeHost();
    const ingredient = new Ingredient(spec(), host);
    ingredient.fall(floor(8), 3);
    tickWhile(ingredient, 'falling');
    tickWhile(ingredient, 'stopped');
    expect([ingredient.phase, ingredient.y]).toEqual(['idle', 8]);
    expect(host.rests).toEqual([floor(8)]);
  });
});

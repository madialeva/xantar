import { describe, expect, it } from 'vitest';
import { classicLevel } from '../../levels/classic';
import { EventQueue, type SimEvent } from '../events';
import { GameStats } from '../GameStats';
import { loadLevel } from '../legacy-level/loadLevel';
import { FALL_STAGGER_TICKS, FALL_TICKS, START_PEPPERS } from '../rules';
import { chefAt } from '../testing/chef';
import { Burger, type CrushTarget } from './Burger';
import type { IngredientSnapshot } from './Ingredient';

const level = loadLevel(classicLevel);

interface CrushCall {
  left: number;
  right: number;
  fromRow: number;
  toRow: number;
}

const create = (): {
  burger: Burger;
  events: EventQueue;
  stats: GameStats;
  crushes: CrushCall[];
} => {
  const events = new EventQueue();
  const stats = new GameStats(events);
  const crushes: CrushCall[] = [];
  const crush: CrushTarget = {
    crush: (left, right, fromRow, toRow) => crushes.push({ left, right, fromRow, toRow })
  };
  return {
    burger: new Burger(level.columns[0], level, events, stats, crush),
    events,
    stats,
    crushes
  };
};

const byKind = (burger: Burger, kind: string): IngredientSnapshot => {
  const found = burger.ingredients.find((ingredient) => ingredient.kind === kind);
  if (found === undefined) throw new Error(`No ${kind} in the burger`);
  return found;
};

const kindOf = (burger: Burger, id: number): string =>
  burger.ingredients.find((ingredient) => ingredient.id === id)?.kind ?? 'unknown';

const walkOver = (burger: Burger, ingredient: IngredientSnapshot): void => {
  burger.step(chefAt(ingredient.row, ingredient.left + 0.05));
  burger.step(chefAt(ingredient.row, ingredient.right));
};

const run = (burger: Burger, ticks: number, chef = chefAt(0, 0)): void => {
  for (let i = 0; i < ticks; i++) burger.step(chef);
};

const settle = (burger: Burger): void => run(burger, FALL_STAGGER_TICKS * 4 + FALL_TICKS + 2);

const ofType = <T extends SimEvent['type']>(events: readonly SimEvent[], type: T) =>
  events.filter((event): event is Extract<SimEvent, { type: T }> => event.type === type);

describe('Burger triggering', () => {
  it('drops the whole column when the top ingredient is walked over', () => {
    const { burger, stats, events } = create();
    walkOver(burger, byKind(burger, 'bunTop'));
    expect(stats.score).toBe(200);
    const [triggered] = ofType(events.drain(), 'ingredientsTriggered');
    expect(triggered.ingredientIds.map((id) => kindOf(burger, id))).toEqual([
      'bunBottom',
      'patty',
      'lettuce',
      'bunTop'
    ]);
  });

  it('drops only the bottom ingredient when it is the one walked over', () => {
    const { burger, stats } = create();
    walkOver(burger, byKind(burger, 'bunBottom'));
    expect(stats.score).toBe(50);
    expect(burger.ingredients.filter((ingredient) => ingredient.phase !== 'idle')).toHaveLength(1);
  });

  it('does not retrigger ingredients that are already falling', () => {
    const { burger, stats } = create();
    walkOver(burger, byKind(burger, 'bunBottom'));
    run(burger, 3);
    walkOver(burger, byKind(burger, 'bunBottom'));
    expect(stats.score).toBe(50);
  });

  it('moves every ingredient down one platform when the top one is walked over', () => {
    const { burger } = create();
    walkOver(burger, byKind(burger, 'bunTop'));
    settle(burger);
    expect(burger.ingredients.map((ingredient) => ingredient.row)).toEqual([6, 9, 12, 12]);
    expect(byKind(burger, 'bunBottom').phase).toBe('stacked');
  });

  it('asks to crush enemies in the column between the origin and destination rows', () => {
    const { burger, crushes } = create();
    walkOver(burger, byKind(burger, 'bunTop'));
    settle(burger);
    expect(crushes).toContainEqual({ left: 1, right: 5, fromRow: 3, toRow: 6 });
    expect(crushes).toContainEqual({ left: 1, right: 5, fromRow: 12, toRow: 14 });
  });
});

describe('Burger stacking', () => {
  const buildBurger = (): ReturnType<typeof create> => {
    const context = create();
    const { burger } = context;
    walkOver(burger, byKind(burger, 'bunTop'));
    settle(burger);
    walkOver(burger, byKind(burger, 'patty'));
    settle(burger);
    for (let i = 0; i < 2; i++) {
      walkOver(burger, byKind(burger, 'lettuce'));
      settle(burger);
    }
    return context;
  };

  it('stacks the pieces on the plate in their original vertical order', () => {
    const { burger, events } = buildBurger();
    for (let i = 0; i < 3; i++) {
      walkOver(burger, byKind(burger, 'bunTop'));
      settle(burger);
    }
    const landed = ofType(events.drain(), 'ingredientLanded').filter(
      (event) => event.stackSlot !== null
    );
    expect(landed.map((event) => kindOf(burger, event.ingredientId))).toEqual([
      'bunBottom',
      'patty',
      'lettuce',
      'bunTop'
    ]);
    expect(landed.map((event) => event.stackSlot)).toEqual([0, 1, 2, 3]);
  });

  it('completes the burger with points and a pepper when the last piece lands', () => {
    const { burger, stats, events } = buildBurger();
    const scoreBefore = stats.score;
    for (let i = 0; i < 3; i++) {
      walkOver(burger, byKind(burger, 'bunTop'));
      settle(burger);
    }
    expect(burger.isComplete).toBe(true);
    expect(stats.peppers).toBe(START_PEPPERS + 1);
    expect(stats.score).toBe(scoreBefore + 3 * 50 + 400);
    expect(ofType(events.drain(), 'burgerDone')).toEqual([
      { type: 'burgerDone', burgerId: 0, points: 400 }
    ]);
  });

  it('does not complete the burger before the last piece has landed', () => {
    const { burger } = buildBurger();
    for (let i = 0; i < 2; i++) {
      walkOver(burger, byKind(burger, 'bunTop'));
      settle(burger);
    }
    walkOver(burger, byKind(burger, 'bunTop'));
    run(burger, FALL_TICKS - 1);
    expect(burger.isComplete).toBe(false);
    run(burger, 1);
    expect(burger.isComplete).toBe(true);
  });
});

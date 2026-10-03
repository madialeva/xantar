import { describe, expect, it } from 'vitest';
import { EventQueue, type SimEvent } from '../events';
import { GameStats } from '../GameStats';
import { FALL_STAGGER_TICKS, FALL_TICKS, START_PEPPERS } from '../rules';
import { chefAt } from '../testing/chef';
import { type GridSpec, levelFromGrid } from '../testing/grids';
import { type CrushTarget, IngredientField } from './IngredientField';

const columnGrid: GridSpec = {
  structure: [
    '........',
    '========',
    '........',
    '========',
    '........',
    '========',
    '........',
    '========',
    '........',
    '.____...'
  ],
  ingredients: [
    '........',
    '.TTTT...',
    '........',
    '.LLLL...',
    '........',
    '.PPPP...',
    '........',
    '.BBBB...',
    '........',
    '........'
  ],
  actors: [
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '......C.',
    '........',
    '........'
  ]
};

interface Crush {
  left: number;
  right: number;
  fromRow: number;
  toRow: number;
}

const create = (grid: GridSpec = columnGrid) => {
  const level = levelFromGrid(grid);
  const events = new EventQueue();
  const stats = new GameStats(events);
  const crushes: Crush[] = [];
  const crush: CrushTarget = {
    crush: (left, right, fromRow, toRow) => crushes.push({ left, right, fromRow, toRow })
  };
  return { field: new IngredientField(level, events, stats, crush), events, stats, crushes };
};

type Context = ReturnType<typeof create>;

const away = chefAt(0, 7.5);

const settle = ({ field }: Context, ticks = 80): void => {
  for (let i = 0; i < ticks; i++) field.step(away);
};

const stompAll = ({ field }: Context, id: number): void => {
  const ingredient = field.ingredients[id];
  for (let segment = 0; segment < ingredient.width; segment++) {
    field.step(chefAt(ingredient.row, ingredient.left + segment + 0.5));
  }
};

const ofType = <T extends SimEvent['type']>(events: readonly SimEvent[], type: T) =>
  events.filter((event): event is Extract<SimEvent, { type: T }> => event.type === type);

describe('IngredientField stomping', () => {
  it('stomps a segment when the chef steps into its casilla and announces it', () => {
    const context = create();
    context.field.step(chefAt(1, 2.5));
    expect(context.field.ingredients[0].stomped).toEqual([false, true, false, false]);
    expect(ofType(context.events.drain(), 'segmentStomped')).toEqual([
      { type: 'segmentStomped', ingredientId: 0, segment: 1 }
    ]);
  });

  it('announces a segment only the first time it is stomped', () => {
    const context = create();
    context.field.step(chefAt(1, 2.5));
    context.field.step(chefAt(1, 2.9));
    expect(ofType(context.events.drain(), 'segmentStomped')).toHaveLength(1);
  });

  it('activates the ingredient when the last segment is stomped, not before', () => {
    const context = create();
    for (const x of [1.5, 2.5, 3.5]) context.field.step(chefAt(1, x));
    expect(ofType(context.events.drain(), 'ingredientsTriggered')).toHaveLength(0);
    context.field.step(chefAt(1, 4.5));
    expect(ofType(context.events.drain(), 'ingredientsTriggered')).toHaveLength(1);
  });

  it('keeps the stomped segments when the chef walks away and comes back', () => {
    const context = create();
    context.field.step(chefAt(1, 1.5));
    context.field.step(chefAt(1, 2.5));
    settle(context, 30);
    expect(context.field.ingredients[0].stomped).toEqual([true, true, false, false]);
    context.field.step(chefAt(1, 3.5));
    context.field.step(chefAt(1, 4.5));
    expect(ofType(context.events.drain(), 'ingredientsTriggered')).toHaveLength(1);
  });

  it('does not stomp while the chef is on a ladder or on another row', () => {
    const context = create();
    context.field.step(chefAt(1, 2.5, false));
    context.field.step(chefAt(3, 2.5));
    context.field.step(chefAt(1, 5.5));
    expect(context.field.ingredients[0].stomped).toEqual([false, false, false, false]);
  });

  it('supports burgers of other sizes', () => {
    for (const segments of [3, 2]) {
      const mini = create({
        segments,
        structure: ['..........', '==========', '..........', '..........', '.______...'],
        ingredients: [
          '..........',
          `.${'T'.repeat(segments)}.....`.slice(0, 10).padEnd(10, '.'),
          '..........',
          '..........',
          '..........'
        ],
        actors: ['..........', '........C.', '..........', '..........', '..........']
      });
      const [ingredient] = mini.field.ingredients;
      expect(ingredient.width).toBe(segments);
      for (let segment = 0; segment < segments; segment++) {
        mini.field.step(chefAt(1, ingredient.left + segment + 0.5));
      }
      expect(ofType(mini.events.drain(), 'ingredientsTriggered')).toHaveLength(1);
    }
  });
});

describe('IngredientField chain', () => {
  it('drops the whole column when the top ingredient is completed, lowest first', () => {
    const context = create();
    stompAll(context, 0);
    expect(context.stats.score).toBe(200);
    const [triggered] = ofType(context.events.drain(), 'ingredientsTriggered');
    expect(triggered.ingredientIds).toEqual([3, 2, 1, 0]);
  });

  it('moves every ingredient down one platform and the lowest onto the plate', () => {
    const context = create();
    stompAll(context, 0);
    settle(context);
    expect(context.field.ingredients.map((ingredient) => ingredient.row)).toEqual([3, 5, 7, 7]);
    expect(context.field.ingredients[3].phase).toBe('stacked');
    expect(context.field.ingredients[0].stomped).toEqual([false, false, false, false]);
  });

  it('drops only the lowest ingredient when it is the one completed', () => {
    const context = create();
    stompAll(context, 3);
    expect(context.stats.score).toBe(50);
    settle(context);
    expect(context.field.ingredients.map((ingredient) => ingredient.row)).toEqual([1, 3, 5, 7]);
    expect(context.field.ingredients[3].phase).toBe('stacked');
  });

  it('starts the falls with the stagger between consecutive ingredients', () => {
    const context = create();
    stompAll(context, 0);
    const started = (id: number) => context.field.ingredients[id].phase === 'falling';
    expect([3, 2, 1, 0].map(started)).toEqual([true, false, false, false]);
    for (let i = 0; i < FALL_STAGGER_TICKS; i++) context.field.step(away);
    expect(started(2)).toBe(true);
    expect(started(1)).toBe(false);
  });

  it('does not push an ingredient that the falling one does not reach', () => {
    const gap = create({
      ...columnGrid,
      ingredients: [
        '........',
        '.TTTT...',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.BBBB...',
        '........',
        '........'
      ]
    });
    stompAll(gap, 0);
    settle(gap);
    expect(gap.field.ingredients.map((ingredient) => [ingredient.row, ingredient.phase])).toEqual([
      [3, 'idle'],
      [7, 'idle']
    ]);
    expect(gap.stats.score).toBe(50);
  });

  it('hits an ingredient that overlaps by a single casilla', () => {
    const partial = create({
      structure: ['.........', '=========', '.........', '=========', '.........', '.____....'],
      ingredients: ['.........', '.TTTT....', '.........', '....LLLL.', '.........', '.........'],
      actors: ['.........', '.........', '.........', '.......C.', '.........', '.........']
    });
    stompAll(partial, 0);
    const [triggered] = ofType(partial.events.drain(), 'ingredientsTriggered');
    expect(triggered.ingredientIds).toEqual([1, 0]);
  });

  it('does not hit an ingredient that only touches the edge', () => {
    const apart = create({
      structure: [
        '..........',
        '==========',
        '..........',
        '==========',
        '..........',
        '.____.....'
      ],
      ingredients: [
        '..........',
        '.TTTT.....',
        '..........',
        '.....LLLL.',
        '..........',
        '..........'
      ],
      actors: ['..........', '..........', '..........', '........C.', '..........', '..........']
    });
    stompAll(apart, 0);
    const [triggered] = ofType(apart.events.drain(), 'ingredientsTriggered');
    expect(triggered.ingredientIds).toEqual([0]);
  });

  it('asks to crush the enemies between the origin and the landing rows', () => {
    const context = create();
    stompAll(context, 0);
    settle(context);
    expect(context.crushes).toContainEqual({ left: 1, right: 5, fromRow: 1, toRow: 3 });
    expect(context.crushes).toContainEqual({ left: 1, right: 5, fromRow: 7, toRow: 9 });
  });

  it('falls in place when there is nothing below an ingredient', () => {
    const lost = create({
      structure: ['........', '========', '........'],
      ingredients: ['........', '.TTTT...', '........'],
      actors: ['........', '......C.', '........']
    });
    stompAll(lost, 0);
    settle(lost);
    expect(lost.field.ingredients[0].row).toBe(1);
    expect(lost.field.ingredients[0].phase).toBe('idle');
    expect(lost.crushes).toEqual([]);
  });
});

describe('IngredientField plates', () => {
  const build = (): Context => {
    const context = create();
    stompAll(context, 0);
    settle(context);
    stompAll(context, 2);
    settle(context);
    for (let i = 0; i < 2; i++) {
      stompAll(context, 1);
      settle(context);
    }
    return context;
  };

  const finish = (context: Context): void => {
    for (let i = 0; i < 3; i++) {
      stompAll(context, 0);
      settle(context);
    }
  };

  it('stacks the pieces on the plate in the order they land', () => {
    const context = build();
    finish(context);
    const landed = ofType(context.events.drain(), 'ingredientLanded').filter(
      (event) => event.plateId !== null
    );
    expect(landed.map((event) => event.ingredientId)).toEqual([3, 2, 1, 0]);
    expect(landed.map((event) => event.stackSlot)).toEqual([0, 1, 2, 3]);
  });

  it('completes the burger with points and a pepper when the last piece lands', () => {
    const context = build();
    const before = context.stats.score;
    finish(context);
    expect(context.field.plates[0].isComplete).toBe(true);
    expect(context.stats.peppers).toBe(START_PEPPERS + 1);
    expect(context.stats.score).toBe(before + 3 * 50 + 400);
    expect(ofType(context.events.drain(), 'burgerDone')).toEqual([
      { type: 'burgerDone', plateId: 0, points: 400 }
    ]);
    expect(context.field.isComplete).toBe(true);
  });

  it('does not complete the burger before the last piece has landed', () => {
    const context = build();
    for (let i = 0; i < 2; i++) {
      stompAll(context, 0);
      settle(context);
    }
    stompAll(context, 0);
    for (let i = 0; i < FALL_TICKS - 1; i++) context.field.step(away);
    expect(context.field.plates[0].isComplete).toBe(false);
    context.field.step(away);
    expect(context.field.plates[0].isComplete).toBe(true);
  });

  it('is complete only when every plate with ingredients is complete', () => {
    const two = create({
      structure: ['..........', '==========', '..........', '.____.____'],
      ingredients: ['..........', '.TTTT.LLLL', '..........', '..........'],
      actors: ['..........', '.........C', '..........', '..........']
    });
    stompAll(two, 0);
    settle(two);
    expect(two.field.plates.map((plate) => plate.isComplete)).toEqual([true, false]);
    expect(two.field.isComplete).toBe(false);
    stompAll(two, 1);
    settle(two);
    expect(two.field.isComplete).toBe(true);
  });

  it('is never complete in a level without ingredients', () => {
    const empty = create({
      structure: ['........', '========', '........', '.____...'],
      actors: ['........', '......C.', '........', '........']
    });
    expect(empty.field.isComplete).toBe(false);
  });
});

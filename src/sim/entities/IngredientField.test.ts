import { describe, expect, it } from 'vitest';
import { EventQueue, type SimEvent } from '../events';
import { GameStats } from '../GameStats';
import { INGREDIENT_THICKNESS, START_PEPPERS } from '../rules';
import { chefAt } from '../testing/chef';
import { type GridSpec, levelFromGrid } from '../testing/grids';
import { type EnemyRoster, IngredientField } from './IngredientField';

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
  readonly id: number;
  readonly y: number;
}

const create = (grid: GridSpec = columnGrid) => {
  const level = levelFromGrid(grid);
  const events = new EventQueue();
  const stats = new GameStats(events);
  const crushes: Crush[] = [];
  const enemies: EnemyRoster = {
    crushUnder: (ingredient) => crushes.push({ id: ingredient.id, y: ingredient.y })
  };
  return { field: new IngredientField(level, events, stats, enemies), events, stats, crushes };
};

type Context = ReturnType<typeof create>;

const away = chefAt(0, 7.5);

const settle = ({ field }: Context, ticks = 200): void => {
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

const until = (context: Context, done: () => boolean, limit = 400): SimEvent[] => {
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && !done(); i++) {
    context.field.step(away);
    events.push(...context.events.drain());
  }
  return events;
};

describe('IngredientField chain', () => {
  it('starts falling the top ingredient alone when it is completed, without points yet', () => {
    const context = create();
    stompAll(context, 0);
    expect(ofType(context.events.drain(), 'ingredientsTriggered')).toEqual([
      { type: 'ingredientsTriggered', ingredientIds: [0] }
    ]);
    expect(context.field.ingredients.map((ingredient) => ingredient.phase)).toEqual([
      'falling',
      'idle',
      'idle',
      'idle'
    ]);
    expect(context.stats.score).toBe(0);
  });

  it('knocks the next one down in the tick its base reaches the top of it, and bounces', () => {
    const context = create();
    const [top, lettuce] = context.field.ingredients;
    stompAll(context, 0);
    context.events.drain();
    const events = until(context, () => !lettuce.isIdle);
    expect(top.phase).toBe('bouncing');
    expect(top.y).toBeCloseTo(3 - INGREDIENT_THICKNESS.lettuce, 10);
    expect(ofType(events, 'ingredientsTriggered')).toEqual([
      { type: 'ingredientsTriggered', ingredientIds: [1] }
    ]);
    expect(lettuce.phase).toBe('falling');
    expect(lettuce.y).toBe(3);
    context.field.step(away);
    expect(lettuce.y).toBeGreaterThan(3);
  });

  it('drops the column from the top down, one support each, and pays when they rest', () => {
    const context = create();
    stompAll(context, 0);
    context.events.drain();
    const events = until(context, () =>
      context.field.ingredients.every((ingredient) =>
        ['idle', 'stacked'].includes(ingredient.phase)
      )
    );
    expect(ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds)).toEqual([
      [1],
      [2],
      [3]
    ]);
    expect(context.field.ingredients.map((ingredient) => ingredient.row)).toEqual([3, 5, 7, 9]);
    expect(context.field.ingredients[3].phase).toBe('stacked');
    expect(context.field.ingredients[0].stomped).toEqual([false, false, false, false]);
    expect(context.stats.score).toBe(200);
  });

  it('pays 50 points in the tick an ingredient comes to rest, and not before', () => {
    const context = create();
    const bottom = context.field.ingredients[3];
    stompAll(context, 3);
    until(context, () => bottom.phase === 'bouncing');
    expect(context.stats.score).toBe(0);
    until(context, () => bottom.phase === 'stacked');
    expect(context.stats.score).toBe(50);
  });

  it('drops only the lowest ingredient when it is the one completed', () => {
    const context = create();
    stompAll(context, 3);
    settle(context);
    expect(context.field.ingredients.map((ingredient) => ingredient.row)).toEqual([1, 3, 5, 9]);
    expect(context.field.ingredients[3].phase).toBe('stacked');
    expect(context.stats.score).toBe(50);
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
    const events = [
      ...partial.events.drain(),
      ...until(partial, () => !partial.field.ingredients[1].isIdle)
    ];
    expect(ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds)).toEqual([
      [0],
      [1]
    ]);
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
    const events = [
      ...apart.events.drain(),
      ...until(apart, () => apart.field.ingredients[0].isIdle)
    ];
    expect(ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds)).toEqual([
      [0]
    ]);
    expect(apart.field.ingredients[1].phase).toBe('idle');
  });

  it('bounces off an ingredient that is still bouncing without knocking it down again', () => {
    const stairs = create({
      structure: ['........', '========', '========', '========', '........', '.____...'],
      ingredients: ['........', '.TTTT...', '.LLLL...', '.PPPP...', '........', '........'],
      actors: ['........', '........', '........', '......C.', '........', '........']
    });
    const [top, lettuce] = stairs.field.ingredients;
    stompAll(stairs, 0);
    let topBounces = 0;
    let previous = top.phase;
    const events = [...stairs.events.drain()];
    for (let i = 0; i < 200; i++) {
      stairs.field.step(away);
      events.push(...stairs.events.drain());
      if (top.phase === 'bouncing' && previous !== 'bouncing') {
        topBounces += 1;
        if (topBounces === 2) expect(top.y).toBeCloseTo(lettuce.top, 10);
      }
      previous = top.phase;
    }
    expect(topBounces).toBe(2);
    const triggered = ofType(events, 'ingredientsTriggered').map((event) => event.ingredientIds);
    expect(triggered.filter((ids) => ids.includes(1))).toHaveLength(1);
  });

  it('asks to crush under every ingredient in each tick it moves, and never under a resting one', () => {
    const context = create();
    settle(context, 20);
    expect(context.crushes).toEqual([]);
    const top = context.field.ingredients[0];
    for (const x of [1.5, 2.5, 3.5]) context.field.step(chefAt(1, x));
    let moving = 0;
    for (let i = 0; i < 200; i++) {
      const before = top.isMoving;
      context.field.step(i === 0 ? chefAt(1, 4.5) : away);
      if (before || top.isMoving) moving += 1;
    }
    const underTop = context.crushes.filter((crush) => crush.id === 0);
    expect(underTop).toHaveLength(moving);
    expect(underTop.every((crush) => crush.y > 1 && crush.y <= 3)).toBe(true);
    expect(underTop.at(-1)?.y).toBe(3);
    expect(context.crushes.some((crush) => crush.id === 3)).toBe(true);
  });

  it('stays in place and lifts its segments when there is nothing below an ingredient', () => {
    const lost = create({
      structure: ['........', '========', '........'],
      ingredients: ['........', '.TTTT...', '........'],
      actors: ['........', '......C.', '........']
    });
    stompAll(lost, 0);
    settle(lost);
    const [ingredient] = lost.field.ingredients;
    expect([ingredient.row, ingredient.y, ingredient.phase]).toEqual([1, 1, 'idle']);
    expect(ingredient.stomped).toEqual([false, false, false, false]);
    expect(ofType(lost.events.drain(), 'ingredientsTriggered')).toEqual([]);
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

  it('stacks the pieces on the plate in the order they arrive', () => {
    const context = build();
    finish(context);
    const landed = ofType(context.events.drain(), 'ingredientLanded').filter(
      (event) => event.plateId !== null
    );
    expect(landed.map((event) => event.ingredientId)).toEqual([3, 2, 1, 0]);
    expect(landed.map((event) => event.stackSlot)).toEqual([0, 1, 2, 3]);
  });

  it('stacks each piece at the thickness of the ones below it', () => {
    const context = build();
    const [, lettuce, patty, bottom] = context.field.ingredients;
    expect([bottom.y, patty.y]).toEqual([9, 9 - INGREDIENT_THICKNESS.bunBottom]);
    expect(lettuce.y).toBeCloseTo(9 - (7.4 + 8.3) / 32, 10);
  });

  it('completes the burger with points and a pepper when the last piece comes to rest', () => {
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

  it('does not complete the burger until the last piece has bounced and come to rest', () => {
    const context = build();
    for (let i = 0; i < 2; i++) {
      stompAll(context, 0);
      settle(context);
    }
    const top = context.field.ingredients[0];
    stompAll(context, 0);
    context.events.drain();
    const touches = ofType(
      until(context, () => top.phase === 'bouncing'),
      'ingredientLanded'
    );
    expect(touches).toEqual([
      { type: 'ingredientLanded', ingredientId: 0, plateId: 0, stackSlot: 3 }
    ]);
    expect(context.field.plates[0].isComplete).toBe(false);
    until(context, () => top.phase === 'stacked');
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

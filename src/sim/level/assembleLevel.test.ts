import { describe, expect, it } from 'vitest';
import { levelFromGrid, tinyGrid, withGrid } from '../testing/grids';
import { LevelError } from './LevelError';
import { PieceRegistry } from './pieces/PieceRegistry';

const capture = (action: () => unknown): LevelError => {
  try {
    action();
  } catch (error) {
    if (error instanceof LevelError) return error;
    throw error;
  }
  throw new Error('Expected a LevelError');
};

const blank = (rows: number, cols: number): string[] =>
  Array.from({ length: rows }, () => '.'.repeat(cols));

describe('assembleLevel', () => {
  it('builds the ingredients, the plate and the spawns of a small level', () => {
    const level = levelFromGrid(tinyGrid);
    expect(level.ingredients).toEqual([
      { id: 0, kind: 'bunTop', row: 2, col: 1, width: 4 },
      { id: 1, kind: 'bunBottom', row: 5, col: 1, width: 4 }
    ]);
    expect(level.plates).toEqual([{ id: 0, row: 7, col: 1, width: 4, expected: 2 }]);
    expect(level.chefStart).toEqual({ row: 5, x: 6.5 });
    expect(level.enemySpawns).toEqual([]);
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Test', 8, 8, 4]);
  });

  it('splits a run of identical tiles into consecutive units', () => {
    const ingredients = blank(8, 10);
    ingredients[2] = '.TTTTTTTT.';
    const level = levelFromGrid({
      structure: [
        '..........',
        '..........',
        '==========',
        '..........',
        '..........',
        '==========',
        '..........',
        '.________.'
      ],
      ingredients,
      actors: [...blank(5, 10), '.......C..', ...blank(2, 10)]
    });
    expect(level.ingredients.map((ingredient) => ingredient.col)).toEqual([1, 5]);
    expect(level.plates.map((plate) => plate.col)).toEqual([1, 5]);
  });

  it('builds units of three casillas when the level asks for them', () => {
    const level = levelFromGrid({
      segments: 3,
      structure: ['........', '========', '........', '.______.'],
      ingredients: ['........', '.TTTTTT.', '........', '........'],
      actors: ['........', '.......C', '........', '........']
    });
    expect(level.ingredients.map((i) => [i.col, i.width])).toEqual([
      [1, 3],
      [4, 3]
    ]);
    expect(level.plates.map((p) => [p.col, p.width])).toEqual([
      [1, 3],
      [4, 3]
    ]);
  });

  it('builds units of two casillas', () => {
    const level = levelFromGrid({
      segments: 2,
      structure: ['......', '=====.', '......', '.__...'],
      ingredients: ['......', '.TT...', '......', '......'],
      actors: ['......', '....C.', '......', '......']
    });
    expect(level.ingredients.map((i) => i.width)).toEqual([2]);
    expect(level.plates.map((p) => p.width)).toEqual([2]);
  });

  it('assigns ids in row-column order', () => {
    const level = levelFromGrid(
      withGrid({
        ingredients: [
          '........',
          '........',
          '.TTTT...',
          '........',
          '........',
          '.BBBB...',
          '........',
          '........'
        ]
      })
    );
    expect(level.ingredients.map((ingredient) => ingredient.id)).toEqual([0, 1]);
    expect(level.ingredients.map((ingredient) => ingredient.row)).toEqual([2, 5]);
  });

  it('reports an unknown symbol with its layer, row and column', () => {
    const structure = [...tinyGrid.structure];
    structure[0] = '..?.....';
    const error = capture(() => levelFromGrid(withGrid({ structure })));
    expect([error.layer, error.row, error.col]).toEqual(['structure', 0, 2]);
    expect(error.message).toMatch(/Unknown symbol "\?"/);
  });

  it('reports a run that is not a multiple of the piece width', () => {
    const ingredients = [...(tinyGrid.ingredients ?? [])];
    ingredients[2] = '.TTTTTT.';
    const error = capture(() => levelFromGrid(withGrid({ ingredients })));
    expect([error.layer, error.row, error.col]).toEqual(['ingredients', 2, 1]);
    expect(error.message).toMatch(/run of 6/);
  });

  it('reports a level without chef start', () => {
    const error = capture(() => levelFromGrid(withGrid({ actors: blank(8, 8) })));
    expect(error.message).toMatch(/no chef start/);
  });

  it('reports a second chef start with its position', () => {
    const actors = [...(tinyGrid.actors ?? [])];
    actors[5] = 'C.....C.';
    const error = capture(() => levelFromGrid(withGrid({ actors })));
    expect([error.row, error.col]).toEqual([5, 6]);
  });

  it('reports a chef start that is not on a platform', () => {
    const actors = [...(tinyGrid.actors ?? [])];
    actors[5] = '........';
    actors[4] = '......C.';
    const error = capture(() => levelFromGrid(withGrid({ actors })));
    expect(error.message).toMatch(/Chef start is not on a platform/);
  });

  it('reports an ingredient segment without a platform below it', () => {
    const ingredients = [...(tinyGrid.ingredients ?? [])];
    ingredients[3] = '.TTTT...';
    const error = capture(() => levelFromGrid(withGrid({ ingredients })));
    expect([error.layer, error.row, error.col]).toEqual(['ingredients', 3, 1]);
  });

  it('accepts pieces added to the registry', () => {
    const registry = PieceRegistry.createDefault();
    registry.register({
      id: 'extraHotdog',
      symbol: 'X',
      layer: 'actors',
      width: 1,
      contribute: (placement, builder) => builder.addEnemySpawn('hotdog', placement)
    });
    const actors = [...(tinyGrid.actors ?? [])];
    actors[2] = '.X......';
    const level = levelFromGrid(withGrid({ actors }), registry);
    expect(level.enemySpawns).toEqual([{ kind: 'hotdog', row: 2, x: 1.5 }]);
  });

  it('rejects a piece that is not registered', () => {
    const actors = [...(tinyGrid.actors ?? [])];
    actors[2] = '.X......';
    expect(() => levelFromGrid(withGrid({ actors }))).toThrow(/Unknown symbol "X"/);
  });
});

describe('Level landing and destinations', () => {
  const level = levelFromGrid(tinyGrid);

  it('lands on the next platform row', () => {
    expect(level.landingBelow(2, 1, 5)).toEqual({ row: 5, plate: undefined });
  });

  it('lands on the plate, which takes priority', () => {
    expect(level.landingBelow(5, 1, 5)?.plate?.id).toBe(0);
    expect(level.landingBelow(5, 1, 5)?.row).toBe(7);
  });

  it('is supported by any of the columns', () => {
    expect(level.landingBelow(5, 4, 8)?.plate?.id).toBe(0);
    expect(level.landingBelow(2, 6, 8)).toEqual({ row: 5, plate: undefined });
  });

  it('finds nothing below the last support or outside the board', () => {
    expect(level.landingBelow(7, 1, 5)).toBeUndefined();
    expect(level.landingBelow(5, 5, 8)).toBeUndefined();
  });

  it('follows the vertical fall of an ingredient to its plate', () => {
    const [top, bottom] = level.ingredients;
    expect(level.destinationOf(top)?.id).toBe(0);
    expect(level.destinationOf(bottom)?.id).toBe(0);
  });

  it('has no destination when the ingredient falls out of the board', () => {
    const noPlate = levelFromGrid(
      withGrid({ structure: [...tinyGrid.structure.slice(0, 7), '........'] })
    );
    expect(noPlate.plates).toEqual([]);
    expect(noPlate.destinationOf(noPlate.ingredients[0])).toBeUndefined();
  });

  it('counts the ingredients that end on each plate', () => {
    const level = levelFromGrid({
      structure: ['..........', '==========', '..........', '==========', '.________.'],
      ingredients: ['..........', '.TTTT.....', '..........', '.BBBB.....', '..........'],
      actors: ['..........', '..........', '..........', '.......C..', '..........']
    });
    expect(level.plates.map((plate) => plate.expected)).toEqual([2, 0]);
  });
});

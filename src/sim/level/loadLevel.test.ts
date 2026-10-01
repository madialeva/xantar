import { describe, expect, it } from 'vitest';
import { classicLevel } from '../../levels/classic';
import { levelData, tinyLevelData } from '../testing/levels';
import { LevelError, loadLevel } from './loadLevel';
import type { CellData } from './LevelData';

describe('loadLevel', () => {
  it('loads a valid level and derives its burger columns', () => {
    const level = loadLevel(tinyLevelData);
    expect(level.columns).toHaveLength(1);
    const [column] = level.columns;
    expect(column.ingredients.map((ingredient) => ingredient.kind)).toEqual([
      'bunTop',
      'bunBottom'
    ]);
    expect(column.ingredients.map((ingredient) => ingredient.row)).toEqual([2, 5]);
    expect(column.plate.row).toBe(7);
    expect(column.left).toBe(1);
    expect(column.right).toBe(5);
  });

  it('insets the ingredients inside their column', () => {
    const [column] = loadLevel(tinyLevelData).columns;
    expect(column.ingredients[0].left).toBeCloseTo(1 + 2 / 32, 10);
    expect(column.ingredients[0].right).toBeCloseTo(5 - 2 / 32, 10);
  });

  it('merges contiguous platform spans of a row into one run', () => {
    const level = loadLevel(
      levelData({
        platforms: [
          { row: 2, x0: 0, x1: 3 },
          { row: 2, x0: 4, x1: 7 },
          { row: 5, x0: 0, x1: 7 }
        ]
      })
    );
    expect(level.platformRuns.filter((run) => run.row === 2)).toEqual([
      { row: 2, left: 0, right: 8 }
    ]);
  });

  it('keeps separated platform spans as different runs', () => {
    const level = loadLevel(
      levelData({
        platforms: [
          { row: 2, x0: 0, x1: 2 },
          { row: 2, x0: 5, x1: 7 },
          { row: 5, x0: 0, x1: 7 }
        ],
        ladders: [],
        ingredients: [{ kind: 'bunBottom', row: 5, x0: 1, x1: 4 }]
      })
    );
    expect(level.platformRuns.filter((run) => run.row === 2)).toHaveLength(2);
  });

  it('rejects an ingredient outside the board and names it', () => {
    const data = levelData({
      ingredients: [{ kind: 'patty', row: 5, x0: 1, x1: 9 }]
    });
    expect(() => loadLevel(data)).toThrow(LevelError);
    expect(() => loadLevel(data)).toThrow(/Ingredient #0.*outside the board/);
  });

  it('rejects a level without chef start', () => {
    const data = levelData({ chefStart: undefined as unknown as CellData });
    expect(() => loadLevel(data)).toThrow(/Chef start is missing/);
  });

  it('rejects an ingredient column without a plate below it', () => {
    const data = levelData({ plates: [] });
    expect(() => loadLevel(data)).toThrow(/no plate/);
  });

  it('rejects a plate that is not below the ingredients', () => {
    const data = levelData({ plates: [{ row: 5, x0: 1, x1: 4 }] });
    expect(() => loadLevel(data)).toThrow(/no plate/);
  });

  it('rejects an ingredient that does not rest on a platform', () => {
    const data = levelData({
      ingredients: [{ kind: 'patty', row: 4, x0: 1, x1: 4 }]
    });
    expect(() => loadLevel(data)).toThrow(/not supported by a platform/);
  });

  it('rejects a ladder whose ends are not on platforms', () => {
    const data = levelData({ ladders: [{ col: 3, topRow: 2, bottomRow: 6 }] });
    expect(() => loadLevel(data)).toThrow(/Ladder #0/);
  });

  it('rejects a ladder with an inverted row order', () => {
    const data = levelData({ ladders: [{ col: 3, topRow: 5, bottomRow: 2 }] });
    expect(() => loadLevel(data)).toThrow(/top row must be above/);
  });

  it('rejects two ingredients on the same row of a column', () => {
    const data = levelData({
      ingredients: [
        { kind: 'bunTop', row: 5, x0: 1, x1: 4 },
        { kind: 'bunBottom', row: 5, x0: 1, x1: 4 }
      ]
    });
    expect(() => loadLevel(data)).toThrow(/same row/);
  });

  it('rejects overlapping ingredient columns', () => {
    const data = levelData({
      plates: [{ row: 7, x0: 0, x1: 7 }],
      ingredients: [
        { kind: 'bunTop', row: 2, x0: 1, x1: 4 },
        { kind: 'bunBottom', row: 5, x0: 3, x1: 6 }
      ]
    });
    expect(() => loadLevel(data)).toThrow(/overlap/);
  });

  it('rejects enemies without respawn points', () => {
    const data = levelData({
      enemyStarts: [{ kind: 'hotdog', row: 2, col: 0 }],
      respawnPoints: []
    });
    expect(() => loadLevel(data)).toThrow(/no respawn points/);
  });

  it('rejects a start position that is not on a platform', () => {
    const data = levelData({ chefStart: { row: 4, col: 2 } });
    expect(() => loadLevel(data)).toThrow(/Chef start/);
  });
});

describe('classic level', () => {
  const level = loadLevel(classicLevel);

  it('has four columns of four ingredients on their own plates', () => {
    expect(level.columns).toHaveLength(4);
    for (const column of level.columns) {
      expect(column.ingredients.map((ingredient) => ingredient.kind)).toEqual([
        'bunTop',
        'lettuce',
        'patty',
        'bunBottom'
      ]);
      expect(column.ingredients.map((ingredient) => ingredient.row)).toEqual([3, 6, 9, 12]);
      expect(column.plate.row).toBe(14);
    }
  });

  it('keeps the geometry of the proof of concept', () => {
    expect(level.cols).toBe(20);
    expect(level.rows).toBe(15);
    expect(level.platformRuns).toEqual([3, 6, 9, 12].map((row) => ({ row, left: 0, right: 20 })));
    expect(level.ladders).toHaveLength(12);
    expect([...new Set(level.ladders.map((ladder) => ladder.col))]).toEqual([0, 9, 10, 19]);
    expect(level.chefStart).toEqual({ row: 12, x: 10.5 });
    expect(level.enemyStarts.map((enemy) => enemy.kind)).toEqual(['hotdog', 'pickle', 'egg']);
    expect(level.enemyStarts.every((enemy) => enemy.row === 3)).toBe(true);
    expect(level.respawnPoints.map((point) => point.x)).toEqual([0.5, 9.5, 10.5, 19.5]);
  });

  it('survives a JSON round trip unchanged', () => {
    const copy = loadLevel(JSON.parse(JSON.stringify(classicLevel)));
    expect(copy).toEqual(level);
  });
});

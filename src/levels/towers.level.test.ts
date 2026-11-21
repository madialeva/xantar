import { describe, expect, it } from 'vitest';
import { assembleLevel } from '../sim/level/assembleLevel';
import { parseLevelDocument, parseLevelJson, serializeLevel } from '../sim/level/levelJson';
import { validateLevel } from '../sim/level/validation/validateLevel';
import { dropFromBelow } from '../sim/testing/drops';
import {
  entryOrder,
  floorRows,
  lane,
  oddLadders,
  playfieldMargins,
  walkwaySides
} from '../sim/testing/screens';
import towersDocument from './towers.level.json';

const document = parseLevelDocument(towersDocument);
const level = assembleLevel(document);
const DOUBLE = (top: 'lettuce' | 'tomato'): string[] => [
  'bunTop',
  top,
  'patty',
  'cheese',
  'patty',
  'bunBottom'
];
const rowsOf = (col: number): number[] => lane(level, col).map(([, row]) => row);

describe('towers screen', () => {
  it('is a 39×30 board with ingredients of four segments and no issues', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Towers', 39, 30, 4]);
    expect(validateLevel(level)).toEqual([]);
    expect(oddLadders(level)).toEqual([]);
  });

  it('centres the playfield, with four free columns on each side', () => {
    expect(playfieldMargins(level)).toEqual([4, 4]);
    expect(floorRows(level)).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]);
  });

  it('builds double burgers of six ingredients on staggered towers', () => {
    for (const col of [7, 21]) {
      expect(lane(level, col).map(([kind]) => kind)).toEqual(DOUBLE('lettuce'));
    }
    for (const col of [14, 28]) {
      expect(lane(level, col).map(([kind]) => kind)).toEqual(DOUBLE('tomato'));
    }
    expect(rowsOf(7)).toEqual([3, 7, 11, 15, 19, 23]);
    expect(rowsOf(14)).toEqual([5, 9, 13, 17, 21, 23]);
    expect(rowsOf(21)).toEqual(rowsOf(7));
    expect(rowsOf(28)).toEqual(rowsOf(14));
  });

  it('puts a plate for six under each burger on the last row, below the bottom floor', () => {
    expect(level.plates.map((plate) => [plate.row, plate.col, plate.expected])).toEqual(
      [7, 14, 21, 28].map((col) => [29, col, 6])
    );
  });

  it('joins its top and bottom halves only through the ladders of columns 12 and 26', () => {
    const across = level.graph.ladders
      .filter((ladder) => ladder.topRow < 14 && ladder.bottomRow > 14)
      .map((ladder) => ladder.col);
    expect(across).toEqual([12, 26]);
  });

  it('bridges the two middle towers on row 13', () => {
    const bridge = level.graph.platforms.find((platform) => platform.row === 13);
    expect([bridge?.left, bridge?.right]).toEqual([11, 35]);
  });

  it('puts the chef in the middle of the bottom floor', () => {
    expect(level.chefStart).toEqual({ row: 23, x: 19.5 });
  });

  it('brings in four chorizos and two onions, the onions halfway up the towers', () => {
    expect(entryOrder(level)).toEqual([
      ['chorizo', 23, 'right'],
      ['chorizo', 23, 'left'],
      ['onion', 11, 'left'],
      ['onion', 13, 'right'],
      ['chorizo', 3, 'left'],
      ['chorizo', 5, 'right']
    ]);
    expect(walkwaySides(level)).toEqual([
      [3, 'left'],
      [5, 'right'],
      [11, 'left'],
      [13, 'right'],
      [23, 'left', 'right']
    ]);
  });

  it('can be finished by dropping its ingredients floor by floor, secured by the last drop', () => {
    const { complete, securedAtDrop } = dropFromBelow(level);
    expect(complete).toBe(true);
    expect(securedAtDrop.at(-1)).toBe(true);
    expect(securedAtDrop.slice(0, -1).every((secured) => !secured)).toBe(true);
  });

  it('survives a round trip through text with the same result', () => {
    expect(assembleLevel(parseLevelJson(serializeLevel(document)))).toEqual(level);
  });
});

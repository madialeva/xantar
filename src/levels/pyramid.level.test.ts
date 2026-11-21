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
import pyramidDocument from './pyramid.level.json';

const document = parseLevelDocument(pyramidDocument);
const level = assembleLevel(document);
const BURGER = ['bunTop', 'lettuce', 'patty', 'bunBottom'];
const CHEESEBURGER = ['bunTop', 'cheese', 'patty', 'bunBottom'];

describe('pyramid screen', () => {
  it('is a 39×30 board with ingredients of four segments and no issues', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Pyramid', 39, 30, 4]);
    expect(validateLevel(level)).toEqual([]);
    expect(oddLadders(level)).toEqual([]);
  });

  it('centres the playfield, with four free columns on each side', () => {
    expect(playfieldMargins(level)).toEqual([4, 4]);
  });

  it('only covers the two middle burgers with its two top floors', () => {
    expect(floorRows(level)).toEqual([5, 9, 13, 15, 17, 19, 23]);
    for (const row of [5, 9]) {
      const floors = level.graph.platforms.filter((platform) => platform.row === row);
      expect(floors.map((platform) => [platform.left, platform.right])).toEqual([[11, 28]]);
    }
  });

  it('spreads four burgers of four ingredients over its floors, cheese in the middle two', () => {
    expect(lane(level, 7)).toEqual([
      ['bunTop', 13],
      ['lettuce', 15],
      ['patty', 17],
      ['bunBottom', 23]
    ]);
    expect(lane(level, 14)).toEqual([
      ['bunTop', 5],
      ['cheese', 9],
      ['patty', 17],
      ['bunBottom', 23]
    ]);
    expect(lane(level, 21)).toEqual([
      ['bunTop', 5],
      ['cheese', 13],
      ['patty', 19],
      ['bunBottom', 23]
    ]);
    expect(lane(level, 28)).toEqual([
      ['bunTop', 13],
      ['lettuce', 15],
      ['patty', 19],
      ['bunBottom', 23]
    ]);
    for (const col of [7, 28]) {
      expect(lane(level, col).map(([kind]) => kind)).toEqual(BURGER);
    }
    for (const col of [14, 21]) {
      expect(lane(level, col).map(([kind]) => kind)).toEqual(CHEESEBURGER);
    }
  });

  it('puts a plate of four under each burger on row 28', () => {
    expect(level.plates.map((plate) => [plate.row, plate.col, plate.expected])).toEqual(
      [7, 14, 21, 28].map((col) => [28, col, 4])
    );
  });

  it('puts the chef in the middle of the bottom floor', () => {
    expect(level.chefStart).toEqual({ row: 23, x: 19.5 });
  });

  it('brings in three chorizos and an corn from the shoulders and the bottom floor', () => {
    expect(entryOrder(level)).toEqual([
      ['corn', 23, 'right'],
      ['chorizo', 13, 'left'],
      ['chorizo', 13, 'right'],
      ['chorizo', 23, 'left']
    ]);
    expect(walkwaySides(level)).toEqual([
      [13, 'left', 'right'],
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

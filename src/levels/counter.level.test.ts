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
import counterDocument from './counter.level.json';

const document = parseLevelDocument(counterDocument);
const level = assembleLevel(document);
const MIDDLE_LANES = [14, 21];

describe('counter screen', () => {
  it('is a 39×30 board of 16-unit cells with ingredients of four segments and no issues', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Counter', 39, 30, 4]);
    expect(validateLevel(level)).toEqual([]);
    expect(oddLadders(level)).toEqual([]);
  });

  it('centres the playfield, with four free columns on each side', () => {
    expect(playfieldMargins(level)).toEqual([4, 4]);
    expect(floorRows(level)).toEqual([5, 7, 9, 11, 13, 17, 19, 23]);
  });

  it('ends the two middle burgers on plates halfway down and the outer ones at the bottom', () => {
    expect(level.plates.map((plate) => [plate.row, plate.col, plate.expected])).toEqual([
      [17, 14, 4],
      [17, 21, 4],
      [28, 7, 4],
      [28, 28, 4]
    ]);
    for (const ingredient of level.ingredients) {
      const plate = level.destinationOf(ingredient);
      expect([plate?.col, plate?.row]).toEqual([
        ingredient.col,
        MIDDLE_LANES.includes(ingredient.col) ? 17 : 28
      ]);
    }
  });

  it('leaves four rows between the counter plates and the floor above them', () => {
    for (const col of MIDDLE_LANES) {
      for (const row of [14, 15, 16]) {
        for (let tile = col; tile < col + 4; tile++) {
          expect(level.terrain.hasPlatform(row, tile), `row ${row}, col ${tile}`).toBe(false);
        }
      }
      expect(lane(level, col).at(-1)).toEqual(['bunBottom', 13]);
    }
  });

  it('has a floor running under the counter plates', () => {
    const under = level.graph.platforms.find(
      (platform) => platform.row === 19 && platform.left <= 14 && platform.right >= 25
    );
    expect(under).toBeDefined();
  });

  it('spreads four burgers of four ingredients over its floors', () => {
    expect(lane(level, 7)).toEqual([
      ['bunTop', 9],
      ['lettuce', 13],
      ['patty', 19],
      ['bunBottom', 23]
    ]);
    expect(lane(level, 14)).toEqual([
      ['bunTop', 5],
      ['lettuce', 7],
      ['patty', 9],
      ['bunBottom', 13]
    ]);
    expect(lane(level, 21)).toEqual([
      ['bunTop', 5],
      ['lettuce', 9],
      ['patty', 11],
      ['bunBottom', 13]
    ]);
    expect(lane(level, 28)).toEqual([
      ['bunTop', 5],
      ['lettuce', 9],
      ['patty', 17],
      ['bunBottom', 23]
    ]);
  });

  it('puts the chef in the middle of the bottom floor', () => {
    expect(level.chefStart).toEqual({ row: 23, x: 19.5 });
  });

  it('brings in two hot dogs, two onions and an egg, the onions by the sides of the counter', () => {
    expect(entryOrder(level)).toEqual([
      ['onion', 17, 'right'],
      ['hotdog', 23, 'left'],
      ['onion', 17, 'left'],
      ['hotdog', 5, 'right'],
      ['egg', 5, 'left']
    ]);
    expect(walkwaySides(level)).toEqual([
      [5, 'left', 'right'],
      [17, 'left', 'right'],
      [23, 'left']
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

import { describe, expect, it } from 'vitest';
import { assembleLevel } from '../sim/level/assembleLevel';
import { parseLevelDocument, parseLevelJson, serializeLevel } from '../sim/level/levelJson';
import classicDocument from './classic.level.json';

const document = parseLevelDocument(classicDocument);
const level = assembleLevel(document);

describe('classic level', () => {
  it('has the dimensions and the unit size of the original screen', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Classic', 20, 15, 4]);
  });

  it('has four lanes of four ingredients, bunBottom lowest, each lane over its own plate', () => {
    expect(level.ingredients).toHaveLength(16);
    const lanes = [1, 5, 11, 15];
    for (const col of lanes) {
      const lane = level.ingredients.filter((ingredient) => ingredient.col === col);
      expect(lane.map((ingredient) => [ingredient.kind, ingredient.row])).toEqual([
        ['bunTop', 3],
        ['lettuce', 6],
        ['patty', 9],
        ['bunBottom', 12]
      ]);
      expect(lane.every((ingredient) => ingredient.width === 4)).toBe(true);
    }
    expect(
      level.plates.map((plate) => [plate.col, plate.width, plate.row, plate.expected])
    ).toEqual(lanes.map((col) => [col, 4, 14, 4]));
  });

  it('sends every ingredient of a lane to the plate below it', () => {
    for (const ingredient of level.ingredients) {
      expect(level.destinationOf(ingredient)?.col).toBe(ingredient.col);
    }
  });

  it('has four platform rows and the ladders of the original columns', () => {
    for (const row of [3, 6, 9, 12]) {
      for (let col = 0; col < 20; col++) expect(level.terrain.hasPlatform(row, col)).toBe(true);
    }
    expect(level.terrain.hasPlatform(4, 3)).toBe(false);
    for (const col of [0, 9, 10, 19]) {
      for (let row = 3; row <= 12; row++) expect(level.terrain.hasLadder(row, col)).toBe(true);
    }
    expect(level.terrain.hasLadder(3, 5)).toBe(false);
  });

  it('puts the chef on the bottom platform and the enemies on the top one', () => {
    expect(level.chefStart).toEqual({ row: 12, x: 10.5 });
    expect(level.enemySpawns).toEqual([
      { kind: 'hotdog', row: 3, x: 1.5 },
      { kind: 'pickle', row: 3, x: 9.5 },
      { kind: 'egg', row: 3, x: 18.5 }
    ]);
  });

  it('survives a round trip through text with the same result', () => {
    const copy = assembleLevel(parseLevelJson(serializeLevel(document)));
    expect(copy).toEqual(level);
  });

  it('answers the path of an enemy decision fast enough to run every time one is needed', () => {
    const from = level.graph.placeAt(3, 1.5);
    const to = level.graph.placeAt(12, 18.5);
    const started = performance.now();
    for (let i = 0; i < 1000; i++) level.graph.shortestPath(from, to);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

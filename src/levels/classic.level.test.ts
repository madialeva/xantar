import { describe, expect, it } from 'vitest';
import { assembleLevel } from '../sim/level/assembleLevel';
import { parseLevelDocument, parseLevelJson, serializeLevel } from '../sim/level/levelJson';
import classicDocument from './classic.level.json';

const document = parseLevelDocument(classicDocument);
const level = assembleLevel(document);

describe('classic level', () => {
  it('has the dimensions and the unit size of the original screen', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Classic', 39, 30, 4]);
  });

  it('has four lanes of four ingredients, bunBottom lowest, each lane over its own plate', () => {
    expect(level.ingredients).toHaveLength(16);
    const lanes = [2, 10, 22, 30];
    for (const col of lanes) {
      const lane = level.ingredients.filter((ingredient) => ingredient.col === col);
      expect(lane.map((ingredient) => [ingredient.kind, ingredient.row])).toEqual([
        ['bunTop', 6],
        ['lettuce', 12],
        ['patty', 18],
        ['bunBottom', 24]
      ]);
      expect(lane.every((ingredient) => ingredient.width === 4)).toBe(true);
    }
    expect(
      level.plates.map((plate) => [plate.col, plate.width, plate.row, plate.expected])
    ).toEqual(lanes.map((col) => [col, 4, 28, 4]));
  });

  it('sends every ingredient of a lane to the plate below it', () => {
    for (const ingredient of level.ingredients) {
      expect(level.destinationOf(ingredient)?.col).toBe(ingredient.col);
    }
  });

  it('has four platform rows and the ladders of the original columns', () => {
    for (const row of [6, 12, 18, 24]) {
      for (let col = 0; col < 39; col++) expect(level.terrain.hasPlatform(row, col)).toBe(true);
    }
    expect(level.terrain.hasPlatform(8, 3)).toBe(false);
    for (const col of [0, 18, 20, 38]) {
      for (let row = 6; row <= 24; row++) expect(level.terrain.hasLadder(row, col)).toBe(true);
    }
    expect(level.terrain.hasLadder(6, 5)).toBe(false);
  });

  it('puts the chef on the bottom platform and the enemies on the top one', () => {
    expect(level.chefStart).toEqual({ row: 24, x: 20.5 });
    expect(level.enemySpawns).toEqual([
      { kind: 'hotdog', row: 6, x: 2.5 },
      { kind: 'pickle', row: 6, x: 18.5 },
      { kind: 'egg', row: 6, x: 36.5 }
    ]);
  });

  it('survives a round trip through text with the same result', () => {
    const copy = assembleLevel(parseLevelJson(serializeLevel(document)));
    expect(copy).toEqual(level);
  });

  it('answers the path of an enemy decision fast enough to run every time one is needed', () => {
    const from = level.graph.placeAt(6, 2.5);
    const to = level.graph.placeAt(24, 36.5);
    const started = performance.now();
    for (let i = 0; i < 1000; i++) level.graph.shortestPath(from, to);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

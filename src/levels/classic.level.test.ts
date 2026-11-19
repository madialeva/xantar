import { describe, expect, it } from 'vitest';
import { type EnemyRoster, IngredientField } from '../sim/entities/IngredientField';
import { EventQueue } from '../sim/events';
import { GameStats } from '../sim/GameStats';
import { assembleLevel } from '../sim/level/assembleLevel';
import { EDGE_MARGIN } from '../sim/rules';
import { chefAt } from '../sim/testing/chef';
import { parseLevelDocument, parseLevelJson, serializeLevel } from '../sim/level/levelJson';
import classicDocument from './classic.level.json';

const document = parseLevelDocument(classicDocument);
const level = assembleLevel(document);

/** Floors of the first screen of the original, in chef heights below the top one. */
const FLOOR_ROWS = [5, 9, 11, 13, 15, 17, 19, 23];
const LANES = [7, 14, 21, 28];
const SIDE_LADDERS = [5, 12, 19, 26, 33];
const UNDER_LADDERS = [8, 15, 22, 29];

const ladderCols = (): number[] =>
  [...new Set(level.graph.ladders.map((ladder) => ladder.col))].sort((a, b) => a - b);

describe('classic level', () => {
  it('is a 39×30 board of 16-unit cells with ingredients of four segments', () => {
    expect([level.name, level.cols, level.rows, level.segments]).toEqual(['Classic', 39, 30, 4]);
  });

  it('has the floors of the first screen of the original: 2, 1, 1, 1, 1, 1 and 2 chefs apart', () => {
    const rows = [...new Set(level.graph.platforms.map((platform) => platform.row))];
    expect(rows).toEqual(FLOOR_ROWS);
    expect(rows.slice(1).map((row, index) => row - rows[index])).toEqual([4, 2, 2, 2, 2, 2, 4]);
  });

  it('centres the playfield, with four free columns on each side', () => {
    const left = Math.min(...level.graph.platforms.map((platform) => platform.left));
    const right = Math.max(...level.graph.platforms.map((platform) => platform.right));
    expect([left, level.cols - right]).toEqual([4, 4]);
  });

  it('has a ladder on each side of every burger and one under each, none touching another', () => {
    expect(ladderCols()).toEqual([...SIDE_LADDERS, ...UNDER_LADDERS].sort((a, b) => a - b));
    LANES.forEach((col, index) => {
      expect(SIDE_LADDERS[index]).toBeLessThan(col);
      expect(SIDE_LADDERS[index + 1]).toBeGreaterThanOrEqual(col + 4);
      expect(UNDER_LADDERS[index]).toBe(col + 1);
    });
  });

  it('has ladders a whole number of chefs tall', () => {
    for (const ladder of level.graph.ladders) {
      expect((ladder.bottomRow - ladder.topRow) % 2, `ladder at col ${ladder.col}`).toBe(0);
    }
  });

  it('spreads the ingredients of each burger over floors as in the original', () => {
    const lane = (col: number) =>
      level.ingredients
        .filter((ingredient) => ingredient.col === col)
        .map((ingredient) => [ingredient.kind, ingredient.row]);
    expect(lane(7)).toEqual([
      ['bunTop', 9],
      ['lettuce', 13],
      ['patty', 19],
      ['bunBottom', 23]
    ]);
    expect(lane(14)).toEqual([
      ['bunTop', 5],
      ['lettuce', 15],
      ['patty', 19],
      ['bunBottom', 23]
    ]);
    expect(lane(21)).toEqual([
      ['bunTop', 5],
      ['lettuce', 9],
      ['patty', 15],
      ['bunBottom', 23]
    ]);
    expect(lane(28)).toEqual([
      ['bunTop', 5],
      ['lettuce', 9],
      ['patty', 13],
      ['bunBottom', 17]
    ]);
    expect(level.ingredients.every((ingredient) => ingredient.width === 4)).toBe(true);
  });

  it('puts a plate of four under each burger on row 28 and sends every ingredient to it', () => {
    expect(
      level.plates.map((plate) => [plate.col, plate.width, plate.row, plate.expected])
    ).toEqual(LANES.map((col) => [col, 4, 28, 4]));
    for (const ingredient of level.ingredients) {
      expect(level.destinationOf(ingredient)?.col).toBe(ingredient.col);
    }
  });

  it('puts the chef in the middle of the bottom floor', () => {
    expect(level.chefStart).toEqual({ row: 23, x: 19.5 });
  });

  it('brings in three hot dogs and an egg from the corners, in the order of the original', () => {
    const left = 4 + EDGE_MARGIN;
    const right = 35 - EDGE_MARGIN;
    expect(level.enemySpawns).toEqual([
      { kind: 'hotdog', row: 5, x: 0.5, delayTicks: 270, joinX: left },
      { kind: 'hotdog', row: 5, x: 38.5, delayTicks: 165, joinX: right },
      { kind: 'hotdog', row: 23, x: 0.5, delayTicks: 60, joinX: left },
      { kind: 'egg', row: 23, x: 38.5, delayTicks: 30, joinX: right }
    ]);
    const order = [...level.enemySpawns].sort((a, b) => a.delayTicks - b.delayTicks);
    expect(order.map((spawn) => [spawn.kind, spawn.row, spawn.x])).toEqual([
      ['egg', 23, 38.5],
      ['hotdog', 23, 0.5],
      ['hotdog', 5, 38.5],
      ['hotdog', 5, 0.5]
    ]);
  });

  it('has entry walkways on both sides of the top and bottom floors only', () => {
    for (let row = 0; row < level.rows; row++) {
      for (const col of [0, 1, 2, 3, 35, 36, 37, 38]) {
        expect(level.terrain.hasWalkway(row, col), `row ${row}, col ${col}`).toBe(
          row === 5 || row === 23
        );
      }
    }
  });

  it('can be finished by dropping its ingredients floor by floor', () => {
    const events = new EventQueue();
    const noEnemies: EnemyRoster = { board: () => 0, crushUnder: () => {}, release: () => {} };
    const field = new IngredientField(level, events, new GameStats(events), noEnemies);
    const away = chefAt(0, 0.5);
    let drops = 0;
    while (!field.isComplete && drops < 100) {
      const next = field.ingredients
        .filter((ingredient) => ingredient.phase === 'idle')
        .sort((a, b) => b.row - a.row)[0];
      for (let segment = 0; segment < next.width; segment++) {
        field.step(chefAt(next.row, next.left + segment + 0.5));
      }
      for (let tick = 0; tick < 600; tick++) field.step(away);
      drops++;
    }
    expect(field.isComplete).toBe(true);
    expect(field.plates.every((plate) => plate.isComplete)).toBe(true);
  });

  it('is secured by the drop that finishes it, before the last ingredient lands', () => {
    const events = new EventQueue();
    const noEnemies: EnemyRoster = { board: () => 0, crushUnder: () => {}, release: () => {} };
    const field = new IngredientField(level, events, new GameStats(events), noEnemies);
    const away = chefAt(0, 0.5);
    const securedAtDrop: boolean[] = [];
    while (!field.isComplete && securedAtDrop.length < 100) {
      const next = field.ingredients
        .filter((ingredient) => ingredient.phase === 'idle')
        .sort((a, b) => b.row - a.row)[0];
      for (let segment = 0; segment < next.width; segment++) {
        field.step(chefAt(next.row, next.left + segment + 0.5));
      }
      securedAtDrop.push(field.isSecured && !field.isComplete);
      for (let tick = 0; tick < 600; tick++) field.step(away);
    }
    expect(securedAtDrop.at(-1)).toBe(true);
    expect(securedAtDrop.slice(0, -1).every((secured) => !secured)).toBe(true);
  });

  it('carries one rider three floors down from the top bun of the third burger', () => {
    const events = new EventQueue();
    const top = level.ingredients.find(
      (ingredient) => ingredient.col === 21 && ingredient.row === 5
    );
    const oneRider: EnemyRoster = {
      board: (ingredient) => (ingredient.id === top?.id ? 1 : 0),
      crushUnder: () => {},
      release: () => {}
    };
    const field = new IngredientField(level, events, new GameStats(events), oneRider);
    const bun = field.ingredients.find((ingredient) => ingredient.id === top?.id);
    if (!bun) throw new Error('The third burger has no top bun on the top floor');
    for (let segment = 0; segment < bun.width; segment++) {
      field.step(chefAt(bun.row, bun.left + segment + 0.5));
    }
    const rows: number[] = [];
    for (let tick = 0; tick < 1200; tick++) {
      field.step(chefAt(0, 0.5));
      if (bun.phase === 'stopped' && rows.at(-1) !== bun.row) rows.push(bun.row);
    }
    expect([...rows, bun.row]).toEqual([9, 15, 19]);
    expect(bun.phase).toBe('idle');
  });

  it('survives a round trip through text with the same result', () => {
    const copy = assembleLevel(parseLevelJson(serializeLevel(document)));
    expect(copy).toEqual(level);
  });

  it('answers the path of an enemy decision fast enough to run every time one is needed', () => {
    const from = level.graph.placeAt(5, 5.5);
    const to = level.graph.placeAt(23, 33.5);
    const started = performance.now();
    for (let i = 0; i < 1000; i++) level.graph.shortestPath(from, to);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

import { describe, expect, it } from 'vitest';
import classicDocument from '../../levels/classic.level.json';
import { assembleLevel } from '../level/assembleLevel';
import { parseLevelDocument } from '../level/levelJson';
import { levelFromGrid, tinyGrid } from '../testing/grids';
import { EDGE_MARGIN } from '../rules';
import { NavPlace } from './NavPlace';

const classic = assembleLevel(parseLevelDocument(classicDocument));
const tiny = levelFromGrid(tinyGrid);

describe('graph derivation', () => {
  it('has four platform edges and twelve ladder edges in the classic level', () => {
    expect(classic.graph.platforms.map((p) => [p.row, p.left, p.right])).toEqual(
      [3, 6, 9, 12].map((row) => [row, 0, 20])
    );
    expect(classic.graph.ladders).toHaveLength(12);
    expect(classic.graph.dangling).toEqual([]);
    const first = classic.graph.ladders[0];
    expect([first.col, first.topRow, first.bottomRow, first.length]).toEqual([0, 3, 6, 3]);
    expect(first.x).toBe(0.5);
  });

  it('splits a platform row with a gap into two edges', () => {
    const level = levelFromGrid({
      structure: ['.........', '===...===', '.........', '.........'],
      actors: ['.........', 'C........', '.........', '.........']
    });
    expect(level.graph.platforms.map((p) => [p.left, p.right])).toEqual([
      [0, 3],
      [6, 9]
    ]);
  });

  it('links the ends of a ladder to the platforms they touch', () => {
    const [ladder] = tiny.graph.ladders;
    expect([ladder.col, ladder.topRow, ladder.bottomRow]).toEqual([3, 2, 5]);
    expect(ladder.top.row).toBe(2);
    expect(ladder.bottom.row).toBe(5);
  });

  it('splits a ladder that crosses an intermediate platform', () => {
    const level = levelFromGrid({
      structure: ['...', '.+.', '.H.', '.+.', '.H.', '.+.'],
      actors: ['...', '.C.', '...', '...', '...', '...']
    });
    expect(level.graph.ladders.map((l) => [l.topRow, l.bottomRow])).toEqual([
      [1, 3],
      [3, 5]
    ]);
  });

  it('creates ladder edges between consecutive crossings one row apart', () => {
    const level = levelFromGrid({
      structure: ['...', '.+.', '.+.'],
      actors: ['...', '.C.', '...']
    });
    expect(level.graph.ladders.map((l) => l.length)).toEqual([1]);
  });

  it('records a dangling ladder and creates no edge for it', () => {
    const level = levelFromGrid({
      structure: ['...', '.+.', '.H.', '.H.', '...'],
      actors: ['...', '.C.', '...', '...', '...']
    });
    expect(level.graph.ladders).toEqual([]);
    expect(level.graph.dangling).toEqual([{ col: 1, row: 3 }]);
  });

  it('records a ladder tile that is not on any platform', () => {
    const level = levelFromGrid({
      structure: ['===', '...', '.H.', '...'],
      actors: ['C..', '...', '...', '...']
    });
    expect(level.graph.dangling).toEqual([{ col: 1, row: 2 }]);
  });
});

describe('platform and ladder lookup', () => {
  const graph = tiny.graph;
  const [upper, lower] = graph.platforms;

  it('finds the platform edge that contains a position', () => {
    expect(graph.platformAt(2, 4.2)).toBe(upper);
    expect(graph.platformAt(5, 0.1)).toBe(lower);
    expect(graph.platformAt(3, 4)).toBeUndefined();
  });

  it('finds the ladder that goes up or down from a platform within reach', () => {
    const [ladder] = graph.ladders;
    expect(graph.ladderNear(lower, 3.8, true)).toBe(ladder);
    expect(graph.ladderNear(upper, 3.2, false)).toBe(ladder);
    expect(graph.ladderNear(lower, 3.8, false)).toBeUndefined();
    expect(graph.ladderNear(lower, 1, true)).toBeUndefined();
  });

  it('honors the grabbing distance', () => {
    expect(graph.ladderNear(lower, 4.1, true)).toBeDefined();
    expect(graph.ladderNear(lower, 4.2, true)).toBeUndefined();
    expect(graph.ladderNear(lower, 4.2, true, 1)).toBeDefined();
  });

  it('prefers the nearest of two ladders within reach', () => {
    const level = levelFromGrid({
      structure: ['......', '=++===', '.HH...', '=++===', '......'],
      actors: ['......', 'C.....', '......', '......', '......']
    });
    const platform = level.graph.platforms[1];
    expect(level.graph.ladderNear(platform, 1.95, true)?.col).toBe(1);
    expect(level.graph.ladderNear(platform, 2.05, true)?.col).toBe(2);
  });

  it('creates a place on a platform from a row and x', () => {
    const place = graph.placeAt(5, 6.5);
    expect(place.point).toEqual({ x: 6.5, y: 5 });
    expect(() => graph.placeAt(4, 1)).toThrow(RangeError);
  });
});

describe('NavPlace', () => {
  const graph = tiny.graph;
  const [upper] = graph.platforms;
  const [ladder] = graph.ladders;

  it('gives the position of a place on a platform', () => {
    expect(NavPlace.onPlatform(upper, 3.5).point).toEqual({ x: 3.5, y: 2 });
  });

  it('gives the position of a place on a ladder', () => {
    expect(NavPlace.onLadder(ladder, 1.25).point).toEqual({ x: 3.5, y: 3.25 });
  });

  it('limits a platform place to 12/32 casillas from each end', () => {
    expect(NavPlace.onPlatform(upper, -5).along).toBe(EDGE_MARGIN);
    expect(NavPlace.onPlatform(upper, 99).along).toBe(8 - EDGE_MARGIN);
    expect(NavPlace.onPlatform(upper, 0).moveAlong(-1).along).toBe(EDGE_MARGIN);
  });

  it('limits a ladder place to the length of the ladder', () => {
    expect(NavPlace.onLadder(ladder, -1).along).toBe(0);
    expect(NavPlace.onLadder(ladder, 9).along).toBe(3);
    expect(NavPlace.onLadder(ladder, 1).moveAlong(5).along).toBe(3);
  });

  it('moves without changing the original place', () => {
    const start = NavPlace.onPlatform(upper, 2);
    const moved = start.moveAlong(1.5);
    expect([start.along, moved.along]).toEqual([2, 3.5]);
    expect(moved.isOnPlatform).toBe(true);
  });
});

describe('reachability', () => {
  it('reaches every platform and ladder of the classic level from the chef start', () => {
    const start = classic.graph.placeAt(classic.chefStart.row, classic.chefStart.x);
    const reachable = classic.graph.reachableFrom(start);
    expect(reachable.platforms.size).toBe(4);
    expect(reachable.ladders.size).toBe(12);
  });

  it('does not reach a platform that no ladder connects', () => {
    const level = levelFromGrid({
      structure: ['=====', '.....', '=====', '.....'],
      actors: ['C....', '.....', '.....', '.....']
    });
    const reachable = level.graph.reachableFrom(level.graph.placeAt(0, 0.5));
    expect(reachable.platforms.size).toBe(1);
  });

  it('starts from a place on a ladder', () => {
    const [ladder] = tiny.graph.ladders;
    const reachable = tiny.graph.reachableFrom(NavPlace.onLadder(ladder, 1));
    expect(reachable.platforms.size).toBe(2);
    expect(reachable.ladders.size).toBe(1);
  });
});

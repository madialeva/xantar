import { describe, expect, it } from 'vitest';
import type { Level } from '../level/Level';
import { levelFromShape as levelOf } from '../testing/shapes';
import { NavPlace } from './NavPlace';

const at = (level: Level, row: number, x: number): NavPlace => level.graph.placeAt(row, x);

describe('shortestPath', () => {
  it('reports the same platform when no ladder is needed', () => {
    const level = levelOf({ cols: 12, rows: 5, platforms: [[1, 0, 11]], ladders: [] });
    expect(level.graph.shortestPath(at(level, 1, 2), at(level, 1, 9))).toEqual({
      kind: 'same-platform'
    });
  });

  it('reports the only ladder towards a platform below', () => {
    const level = levelOf({
      cols: 12,
      rows: 6,
      platforms: [
        [1, 0, 11],
        [4, 0, 11]
      ],
      ladders: [[6, 1, 4]]
    });
    const result = level.graph.shortestPath(at(level, 1, 2), at(level, 4, 9));
    expect(result).toMatchObject({ kind: 'ladder', direction: 'down', junctionX: 6.5 });
  });

  it('reports a ladder going up when the target is above', () => {
    const level = levelOf({
      cols: 12,
      rows: 6,
      platforms: [
        [1, 0, 11],
        [4, 0, 11]
      ],
      ladders: [[6, 1, 4]]
    });
    const result = level.graph.shortestPath(at(level, 4, 2), at(level, 1, 9));
    expect(result).toMatchObject({ kind: 'ladder', direction: 'up' });
  });

  it('uses the ladder of the shortest total route, not the one nearest to the origin', () => {
    const level = levelOf({
      cols: 20,
      rows: 6,
      platforms: [
        [0, 0, 19],
        [2, 4, 8],
        [5, 0, 19]
      ],
      ladders: [
        [6, 0, 2],
        [16, 0, 5]
      ]
    });
    const result = level.graph.shortestPath(at(level, 0, 5.5), at(level, 5, 18.5));
    expect(result).toMatchObject({ kind: 'ladder', direction: 'down', junctionX: 16.5 });
  });

  it('prefers the ladder nearest to the origin when both routes cost the same', () => {
    const level = levelOf({
      cols: 20,
      rows: 6,
      platforms: [
        [0, 0, 19],
        [5, 0, 19]
      ],
      ladders: [
        [4, 0, 5],
        [8, 0, 5]
      ]
    });
    const result = level.graph.shortestPath(at(level, 0, 2.5), at(level, 5, 12.5));
    expect(result).toMatchObject({ kind: 'ladder', junctionX: 4.5 });
  });

  it('chains several ladders and reports the first one', () => {
    const level = levelOf({
      cols: 20,
      rows: 9,
      platforms: [
        [0, 0, 9],
        [4, 0, 19],
        [8, 10, 19]
      ],
      ladders: [
        [3, 0, 4],
        [15, 4, 8]
      ]
    });
    const result = level.graph.shortestPath(at(level, 0, 1.5), at(level, 8, 18.5));
    expect(result).toMatchObject({ kind: 'ladder', direction: 'down', junctionX: 3.5 });
  });

  it('reports no path when the target platform is disconnected', () => {
    const level = levelOf({
      cols: 10,
      rows: 6,
      platforms: [
        [1, 0, 9],
        [4, 0, 9]
      ],
      ladders: []
    });
    expect(level.graph.shortestPath(at(level, 1, 2), at(level, 4, 5))).toEqual({ kind: 'none' });
  });

  it('reaches a target in the middle of a ladder through the cheaper end', () => {
    const level = levelOf({
      cols: 10,
      rows: 6,
      platforms: [
        [0, 0, 9],
        [4, 0, 9]
      ],
      ladders: [[5, 0, 4]]
    });
    const ladder = level.graph.ladders[0];
    const lowerTarget = NavPlace.onLadder(ladder, 3.5);
    expect(level.graph.shortestPath(at(level, 4, 8), lowerTarget)).toMatchObject({
      kind: 'ladder',
      direction: 'up'
    });
    const upperTarget = NavPlace.onLadder(ladder, 0.5);
    expect(level.graph.shortestPath(at(level, 0, 8), upperTarget)).toMatchObject({
      kind: 'ladder',
      direction: 'down'
    });
  });

  it('starts from a place on a ladder towards the nearest useful end', () => {
    const level = levelOf({
      cols: 10,
      rows: 6,
      platforms: [
        [0, 0, 9],
        [4, 0, 9]
      ],
      ladders: [[5, 0, 4]]
    });
    const ladder = level.graph.ladders[0];
    const middle = NavPlace.onLadder(ladder, 1);
    expect(level.graph.shortestPath(middle, at(level, 0, 2))).toMatchObject({
      kind: 'ladder',
      ladder,
      direction: 'up'
    });
    expect(level.graph.shortestPath(middle, at(level, 4, 2))).toMatchObject({
      kind: 'ladder',
      ladder,
      direction: 'down'
    });
  });

  it('moves along the same ladder when origin and target are on it', () => {
    const level = levelOf({
      cols: 10,
      rows: 6,
      platforms: [
        [0, 0, 9],
        [4, 0, 9]
      ],
      ladders: [[5, 0, 4]]
    });
    const ladder = level.graph.ladders[0];
    expect(
      level.graph.shortestPath(NavPlace.onLadder(ladder, 3), NavPlace.onLadder(ladder, 1))
    ).toMatchObject({ kind: 'ladder', direction: 'up' });
  });
});

import { describe, expect, it } from 'vitest';
import { classicLevel } from '../../levels/classic';
import { loadLevel } from './loadLevel';

const level = loadLevel(classicLevel);

describe('Level', () => {
  it('finds the platform run that contains a position', () => {
    expect(level.platformRunAt(3, 5)).toEqual({ row: 3, left: 0, right: 20 });
    expect(level.platformRunAt(4, 5)).toBeUndefined();
    expect(level.platformRunAt(3, 20.5)).toBeUndefined();
  });

  it('lists the ladders that go up or down from a row', () => {
    expect(level.laddersFromRow(12, true).map((ladder) => ladder.topRow)).toEqual([9, 9, 9, 9]);
    expect(level.laddersFromRow(12, false)).toEqual([]);
    expect(level.laddersFromRow(3, false).map((ladder) => ladder.bottomRow)).toEqual([6, 6, 6, 6]);
  });

  it('finds a ladder within grabbing distance', () => {
    expect(level.ladderNear(12, 9.8, true)?.col).toBe(9);
    expect(level.ladderNear(12, 5, true)).toBeUndefined();
    expect(level.ladderNear(12, 9.0, true, 0.4)).toBeUndefined();
  });

  it('chooses the ladder closest to a position towards a target row', () => {
    expect(level.bestLadderTowards(3, 12, 8)?.col).toBe(9);
    expect(level.bestLadderTowards(3, 12, 17)?.col).toBe(19);
    expect(level.bestLadderTowards(12, 3, 0.5)?.col).toBe(0);
  });

  it('returns no ladder when none goes in that direction', () => {
    expect(level.bestLadderTowards(3, 0, 5)).toBeUndefined();
  });

  it('finds the platform an ingredient lands on, or none when it falls to the plate', () => {
    expect(level.landingRowBelow(3, 1, 5)).toBe(6);
    expect(level.landingRowBelow(9, 1, 5)).toBe(12);
    expect(level.landingRowBelow(12, 1, 5)).toBeUndefined();
  });
});

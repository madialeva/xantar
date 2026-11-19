import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, isDifficulty, paceFor } from './difficulty';
import { PACE_STEP_TICKS } from './rules';

describe('difficulty', () => {
  it('offers easy, normal and hard, and recognises only those', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'normal', 'hard']);
    expect(DIFFICULTIES.every(isDifficulty)).toBe(true);
    expect([isDifficulty('imposible'), isDifficulty(1), isDifficulty(undefined)]).toEqual([
      false,
      false,
      false
    ]);
  });

  it('keeps the enemies at three quarters of their speed on easy, all the time', () => {
    const easy = paceFor('easy');
    expect([easy.factor(1, 0), easy.factor(1, 7200), easy.factor(9, 99_999)]).toEqual([
      0.75, 0.75, 0.75
    ]);
  });

  it('keeps the enemies at the fastest pace of the original on hard, all the time', () => {
    const hard = paceFor('hard');
    expect([hard.factor(1, 0), hard.factor(1, 7200), hard.factor(9, 99_999)]).toEqual([
      1.25, 1.25, 1.25
    ]);
  });

  it('speeds the enemies up a step every 21.75 s of play on normal, as in the original', () => {
    const normal = paceFor('normal');
    expect(PACE_STEP_TICKS).toBe(1305);
    expect([0, 1304, 1305, 2609, 2610, 3914, 3915].map((ticks) => normal.factor(1, ticks))).toEqual(
      [1, 1, 1.03, 1.03, 1.07, 1.07, 1.25]
    );
  });

  it('stops at the last step on normal', () => {
    expect(paceFor('normal').factor(1, 10_000)).toBe(1.25);
  });

  it('starts the boards from level 4 two steps ahead on normal', () => {
    const normal = paceFor('normal');
    expect([3, 4, 7].map((level) => normal.factor(level, 0))).toEqual([1, 1.07, 1.07]);
    expect(normal.factor(4, 1305)).toBe(1.25);
  });
});

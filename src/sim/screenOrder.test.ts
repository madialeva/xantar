import { describe, expect, it } from 'vitest';
import { boardsPerScreen } from './difficulty';
import { firstLevelOfScreen, screenIndexFor } from './screenOrder';

const SCREENS = 4;

describe('screen order', () => {
  it('plays each screen twice on easy and once on normal and hard', () => {
    expect([boardsPerScreen('easy'), boardsPerScreen('normal'), boardsPerScreen('hard')]).toEqual([
      2, 1, 1
    ]);
  });

  it('moves on a screen per level on normal and hard, back to the first after the last', () => {
    for (const plays of [boardsPerScreen('normal'), boardsPerScreen('hard')]) {
      expect([1, 2, 3, 4, 5, 8, 9].map((level) => screenIndexFor(level, SCREENS, plays))).toEqual([
        0, 1, 2, 3, 0, 3, 0
      ]);
    }
  });

  it('plays each screen on two levels in a row on easy, back to the first after the last', () => {
    const plays = boardsPerScreen('easy');
    expect([1, 2, 3, 4, 7, 8, 9, 10].map((level) => screenIndexFor(level, SCREENS, plays))).toEqual(
      [0, 0, 1, 1, 3, 3, 0, 0]
    );
  });

  it('stays on the only screen when there is just one', () => {
    expect([1, 2, 7].map((level) => screenIndexFor(level, 1, 2))).toEqual([0, 0, 0]);
  });

  it('starts each screen on its first level for the difficulty', () => {
    expect([1, 2, 3, 4].map((screen) => firstLevelOfScreen(screen, 1))).toEqual([1, 2, 3, 4]);
    expect([1, 2, 3, 4].map((screen) => firstLevelOfScreen(screen, 2))).toEqual([1, 3, 5, 7]);
  });

  it('gives back the screen a level was asked for', () => {
    for (const plays of [1, 2]) {
      for (let screen = 1; screen <= SCREENS; screen++) {
        expect(screenIndexFor(firstLevelOfScreen(screen, plays), SCREENS, plays)).toBe(screen - 1);
      }
    }
  });
});

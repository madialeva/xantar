import { describe, expect, it } from 'vitest';
import { requestedScreen } from './startScreen';

describe('requestedScreen', () => {
  it('reads the screen asked for in the address', () => {
    expect([requestedScreen('?screen=3'), requestedScreen('?lang=en&screen=4')]).toEqual([3, 4]);
  });

  it('falls back to the first screen without a screen number', () => {
    expect(
      ['', '?screen=', '?screen=0', '?screen=-2', '?screen=2.5', '?screen=dos'].map(requestedScreen)
    ).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

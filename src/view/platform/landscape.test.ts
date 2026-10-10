import { describe, expect, it } from 'vitest';
import { landscapeViewport, toTurnedFrame } from './landscape';

describe('landscapeViewport', () => {
  it('swaps the window size while the game is turned', () => {
    expect(landscapeViewport(390, 844, true)).toEqual({ width: 844, height: 390 });
    expect(landscapeViewport(844, 390, false)).toEqual({ width: 844, height: 390 });
  });
});

describe('toTurnedFrame', () => {
  const width = 390;

  it('maps the corners of an upright phone to the turned game', () => {
    expect(toTurnedFrame(width, 0, width)).toEqual({ x: 0, y: 0 });
    expect(toTurnedFrame(0, 0, width)).toEqual({ x: 0, y: width });
    expect(toTurnedFrame(width, 844, width)).toEqual({ x: 844, y: 0 });
    expect(toTurnedFrame(0, 844, width)).toEqual({ x: 844, y: width });
  });

  it('maps the centre to the centre', () => {
    expect(toTurnedFrame(195, 422, width)).toEqual({ x: 422, y: 195 });
  });
});

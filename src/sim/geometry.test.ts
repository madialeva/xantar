import { describe, expect, it } from 'vitest';
import { clamp, columnCenter, isWithin, platformLine, rangesOverlap } from './geometry';

describe('geometry', () => {
  it('clamps a value into a range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('places column centers and platform lines on the tile grid', () => {
    expect(columnCenter(0)).toBe(0.5);
    expect(columnCenter(9)).toBe(9.5);
    expect(platformLine(3)).toBe(3.5);
  });

  it('detects overlapping ranges including shared edges', () => {
    expect(rangesOverlap(0, 4, 4, 8)).toBe(true);
    expect(rangesOverlap(0, 3, 4, 8)).toBe(false);
    expect(rangesOverlap(2, 3, 0, 10)).toBe(true);
  });

  it('checks a value against a range with tolerance', () => {
    expect(isWithin(5, 0, 10)).toBe(true);
    expect(isWithin(10.1, 0, 10)).toBe(false);
    expect(isWithin(10.1, 0, 10, 0.2)).toBe(true);
    expect(isWithin(-0.2, 0, 10, 0.2)).toBe(true);
  });
});

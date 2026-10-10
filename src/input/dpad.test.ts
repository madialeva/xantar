import { describe, expect, it } from 'vitest';
import { dpadDirection } from './dpad';

describe('dpadDirection', () => {
  it('follows the dominant axis', () => {
    expect(dpadDirection(30, 5, 10)).toBe('right');
    expect(dpadDirection(-30, 20, 10)).toBe('left');
    expect(dpadDirection(5, -30, 10)).toBe('up');
    expect(dpadDirection(-20, 30, 10)).toBe('down');
  });

  it('does nothing inside the dead zone', () => {
    expect(dpadDirection(5, 5, 10)).toBeNull();
    expect(dpadDirection(0, 0, 10)).toBeNull();
  });

  it('breaks a diagonal tie horizontally', () => {
    expect(dpadDirection(20, 20, 10)).toBe('right');
  });
});

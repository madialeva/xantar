import { describe, expect, it } from 'vitest';
import { SeededRng } from './rng';

const take = (rng: SeededRng, count: number): number[] =>
  Array.from({ length: count }, () => rng.next());

describe('SeededRng', () => {
  it('produces the same sequence for the same seed', () => {
    expect(take(new SeededRng(42), 50)).toEqual(take(new SeededRng(42), 50));
  });

  it('produces different sequences for different seeds', () => {
    expect(take(new SeededRng(1), 10)).not.toEqual(take(new SeededRng(2), 10));
  });

  it('returns values in [0, 1)', () => {
    for (const value of take(new SeededRng(7), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('returns integers within an inclusive range and reaches both ends', () => {
    const rng = new SeededRng(3);
    const values = Array.from({ length: 2000 }, () => rng.int(30, 66));
    expect(Math.min(...values)).toBe(30);
    expect(Math.max(...values)).toBe(66);
    expect(values.every(Number.isInteger)).toBe(true);
  });

  it('spreads values roughly evenly', () => {
    const rng = new SeededRng(11);
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) buckets[Math.floor(rng.next() * 4)] += 1;
    for (const count of buckets) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });

  it('decides chances with the requested probability', () => {
    const rng = new SeededRng(5);
    const hits = Array.from({ length: 5000 }, () => rng.chance(0.2)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(850);
    expect(hits).toBeLessThan(1150);
  });

  it('picks an item from a list and rejects an empty one', () => {
    const rng = new SeededRng(9);
    expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
    expect(() => rng.pick([])).toThrow(RangeError);
  });
});

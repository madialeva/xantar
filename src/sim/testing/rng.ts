import type { Rng } from '../rng';

/**
 * Test double of Rng that always answers from one fixed value.
 */
export class StubRng implements Rng {
  constructor(private readonly value = 0.99) {}

  next(): number {
    return this.value;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.value * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.value < probability;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.min(Math.floor(this.value * items.length), items.length - 1)];
  }
}

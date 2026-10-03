import { TICKS_PER_SECOND } from './rules';

const EPSILON = 1e-9;
const DEFAULT_MAX_STEPS = 5;

/**
 * Turns real elapsed time into a whole number of fixed 60 Hz ticks. Keeps the remainder
 * for render interpolation and caps the catch-up after a long pause.
 */
export class FixedStepper {
  readonly #maxSteps: number;
  #accumulated = 0;

  constructor(maxSteps = DEFAULT_MAX_STEPS) {
    this.#maxSteps = maxSteps;
  }

  get alpha(): number {
    return Math.min(Math.max(this.#accumulated, 0), 1);
  }

  advance(elapsedMs: number): number {
    this.#accumulated += Math.max(elapsedMs, 0) * (TICKS_PER_SECOND / 1000);
    const available = Math.floor(this.#accumulated + EPSILON);
    if (available > this.#maxSteps) {
      this.#accumulated = 0;
      return this.#maxSteps;
    }
    this.#accumulated = Math.max(this.#accumulated - available, 0);
    return available;
  }

  reset(): void {
    this.#accumulated = 0;
  }
}

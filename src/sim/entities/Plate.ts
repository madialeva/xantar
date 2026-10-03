import type { PlateSpec } from '../level/Level';

export interface PlateSnapshot {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly width: number;
  readonly expected: number;
  readonly landed: number;
  readonly isComplete: boolean;
}

export class Plate implements PlateSnapshot {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly width: number;
  readonly expected: number;
  #assigned = 0;
  #landed = 0;
  #announced = false;

  constructor(spec: PlateSpec) {
    this.id = spec.id;
    this.row = spec.row;
    this.col = spec.col;
    this.width = spec.width;
    this.expected = spec.expected;
  }

  get landed(): number {
    return this.#landed;
  }

  get isComplete(): boolean {
    return this.expected > 0 && this.#landed >= this.expected;
  }

  assignSlot(): number {
    const slot = this.#assigned;
    this.#assigned += 1;
    return slot;
  }

  registerLanding(): boolean {
    this.#landed += 1;
    const justCompleted = this.isComplete && !this.#announced;
    if (justCompleted) this.#announced = true;
    return justCompleted;
  }
}

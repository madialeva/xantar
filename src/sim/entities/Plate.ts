import type { IngredientKind } from '../level/kinds';
import type { PlateSpec } from '../level/Level';
import { INGREDIENT_THICKNESS } from '../rules';

export interface PlateSnapshot {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly width: number;
  readonly expected: number;
  readonly landed: number;
  readonly isComplete: boolean;
}

/**
 * One plate of the level: knows how many ingredients will end on it, hands out stack slots,
 * knows how high its burger is under each slot and tells when the burger is complete.
 */
export class Plate implements PlateSnapshot {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly width: number;
  readonly expected: number;
  readonly #kinds: IngredientKind[] = [];
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

  assignSlot(kind: IngredientKind): number {
    this.#kinds.push(kind);
    return this.#kinds.length - 1;
  }

  /** Height of the ingredients stacked under a slot, in rows. */
  heightBelow(slot: number): number {
    return this.#kinds
      .slice(0, slot)
      .reduce((height, kind) => height + INGREDIENT_THICKNESS[kind], 0);
  }

  /** A plate in the same state, for a forecast that must leave this one untouched. */
  copy(): Plate {
    const twin = new Plate(this);
    twin.#kinds.push(...this.#kinds);
    twin.#landed = this.#landed;
    twin.#announced = this.#announced;
    return twin;
  }

  registerLanding(): boolean {
    this.#landed += 1;
    const justCompleted = this.isComplete && !this.#announced;
    if (justCompleted) this.#announced = true;
    return justCompleted;
  }
}

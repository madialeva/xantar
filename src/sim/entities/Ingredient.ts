import type { IngredientKind } from '../level/kinds';
import type { IngredientSpec } from '../level/Level';
import { FALL_TICKS } from '../rules';

export type IngredientPhase = 'idle' | 'waiting' | 'falling' | 'stacked';

export interface FallPlan {
  readonly fromRow: number;
  readonly toRow: number;
  readonly toPlate: boolean;
  readonly plateId: number | null;
  readonly stackSlot: number | null;
}

export interface IngredientSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly col: number;
  readonly width: number;
  readonly left: number;
  readonly right: number;
  readonly row: number;
  readonly phase: IngredientPhase;
  readonly stomped: readonly boolean[];
  readonly fallFromRow: number;
  readonly fallToRow: number;
  readonly fallProgress: number;
  readonly landsOnPlate: boolean;
  readonly stackSlot: number | null;
}

/**
 * What an ingredient asks of its surroundings when it starts to fall and when it lands.
 */
export interface IngredientHost {
  startFall(ingredient: IngredientSnapshot): FallPlan;
  landed(ingredient: IngredientSnapshot, plan: FallPlan): void;
}

interface StateContext {
  readonly ingredient: IngredientSnapshot;
  readonly host: IngredientHost;
  setRow(row: number): void;
}

interface IngredientState {
  readonly phase: IngredientPhase;
  readonly plan: FallPlan | undefined;
  readonly progress: number;
  readonly stomped: readonly boolean[];
  step(context: StateContext): IngredientState | undefined;
}

const filled = (width: number, value: boolean): readonly boolean[] =>
  Array.from({ length: width }, () => value);

/**
 * Ingredient resting on a platform; remembers which segments the chef has stomped.
 */
class IdleState implements IngredientState {
  readonly phase = 'idle';
  readonly plan = undefined;
  readonly progress = 0;
  readonly #stomped: boolean[];

  constructor(width: number) {
    this.#stomped = [...filled(width, false)];
  }

  get stomped(): readonly boolean[] {
    return this.#stomped;
  }

  stomp(segment: number): boolean {
    if (this.#stomped[segment] === undefined || this.#stomped[segment]) return false;
    this.#stomped[segment] = true;
    return true;
  }

  step(): undefined {
    return undefined;
  }
}

/**
 * Ingredient already activated that waits its turn in a chain before it starts to fall.
 */
class WaitingState implements IngredientState {
  readonly phase = 'waiting';
  readonly plan = undefined;
  readonly progress = 0;
  readonly stomped: readonly boolean[];
  #remaining: number;

  constructor(width: number, delayTicks: number) {
    this.stomped = filled(width, true);
    this.#remaining = delayTicks;
  }

  step(context: StateContext): IngredientState | undefined {
    if (this.#remaining > 0) {
      this.#remaining -= 1;
      return undefined;
    }
    const plan = context.host.startFall(context.ingredient);
    if (!plan.toPlate) context.setRow(plan.toRow);
    return new FallingState(context.ingredient.width, plan);
  }
}

/**
 * Ingredient in the air; progresses for a fixed number of ticks and then lands.
 */
class FallingState implements IngredientState {
  readonly phase = 'falling';
  readonly plan: FallPlan;
  readonly stomped: readonly boolean[];
  #elapsed = 0;

  constructor(width: number, plan: FallPlan) {
    this.plan = plan;
    this.stomped = filled(width, true);
  }

  get progress(): number {
    return this.#elapsed / FALL_TICKS;
  }

  step(context: StateContext): IngredientState | undefined {
    this.#elapsed += 1;
    if (this.#elapsed < FALL_TICKS) return undefined;
    context.host.landed(context.ingredient, this.plan);
    const { width } = context.ingredient;
    return this.plan.toPlate ? new StackedState(width, this.plan) : new IdleState(width);
  }
}

/**
 * Ingredient that has landed on a plate; it no longer reacts.
 */
class StackedState implements IngredientState {
  readonly phase = 'stacked';
  readonly progress = 1;
  readonly plan: FallPlan;
  readonly stomped: readonly boolean[];

  constructor(width: number, plan: FallPlan) {
    this.plan = plan;
    this.stomped = filled(width, false);
  }

  step(): undefined {
    return undefined;
  }
}

/**
 * An ingredient made of stompable segments. Its life cycle (resting, waiting, falling,
 * stacked) is delegated to state objects (State pattern).
 */
export class Ingredient implements IngredientSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly col: number;
  readonly width: number;
  readonly #host: IngredientHost;
  #row: number;
  #state: IngredientState;

  constructor(spec: IngredientSpec, host: IngredientHost) {
    this.id = spec.id;
    this.kind = spec.kind;
    this.col = spec.col;
    this.width = spec.width;
    this.#row = spec.row;
    this.#host = host;
    this.#state = new IdleState(spec.width);
  }

  get left(): number {
    return this.col;
  }

  get right(): number {
    return this.col + this.width;
  }

  get row(): number {
    return this.#row;
  }

  get phase(): IngredientPhase {
    return this.#state.phase;
  }

  get isIdle(): boolean {
    return this.#state instanceof IdleState;
  }

  get stomped(): readonly boolean[] {
    return this.#state.stomped;
  }

  get allStomped(): boolean {
    return this.#state.stomped.every(Boolean);
  }

  get fallFromRow(): number {
    return this.#state.plan?.fromRow ?? this.#row;
  }

  get fallToRow(): number {
    return this.#state.plan?.toRow ?? this.#row;
  }

  get fallProgress(): number {
    return this.#state.progress;
  }

  get landsOnPlate(): boolean {
    return this.#state.plan?.toPlate ?? false;
  }

  get stackSlot(): number | null {
    return this.#state.plan?.stackSlot ?? null;
  }

  segmentAt(x: number): number | undefined {
    const segment = Math.floor(x - this.col);
    return segment >= 0 && segment < this.width ? segment : undefined;
  }

  stomp(segment: number): boolean {
    return this.#state instanceof IdleState && this.#state.stomp(segment);
  }

  activate(delayTicks: number): void {
    if (this.isIdle) this.#state = new WaitingState(this.width, delayTicks);
  }

  step(): void {
    const next = this.#state.step({
      ingredient: this,
      host: this.#host,
      setRow: (row) => {
        this.#row = row;
      }
    });
    if (next !== undefined) this.#state = next;
  }
}

import { isWithin } from '../geometry';
import type { IngredientKind } from '../legacy-level/LevelData';
import type { IngredientSpec } from '../legacy-level/Level';
import { FALL_TICKS, TRAVERSAL_REACH, TRAVERSAL_TOLERANCE } from '../rules';
import type { ChefSnapshot } from './Chef';

export type IngredientPhase = 'idle' | 'waiting' | 'falling' | 'stacked';

export interface FallPlan {
  readonly fromRow: number;
  readonly toRow: number;
  readonly toPlate: boolean;
  readonly stackSlot: number | null;
}

export interface IngredientSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly left: number;
  readonly right: number;
  readonly row: number;
  readonly phase: IngredientPhase;
  readonly fallFromRow: number;
  readonly fallToRow: number;
  readonly fallProgress: number;
  readonly landsOnPlate: boolean;
  readonly stackSlot: number | null;
}

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
  observe(chef: ChefSnapshot, ingredient: IngredientSnapshot): boolean;
  step(context: StateContext): IngredientState | undefined;
}

class IdleState implements IngredientState {
  readonly phase = 'idle';
  readonly plan = undefined;
  readonly progress = 0;
  #armedFrom: 'left' | 'right' | null = null;

  observe(chef: ChefSnapshot, ingredient: IngredientSnapshot): boolean {
    const { left, right } = ingredient;
    if (chef.row !== ingredient.row || !isWithin(chef.x, left, right, TRAVERSAL_TOLERANCE)) {
      this.#armedFrom = null;
      return false;
    }
    this.#armedFrom ??= chef.x < (left + right) / 2 ? 'left' : 'right';
    const reachedFarEnd =
      this.#armedFrom === 'left'
        ? chef.x >= right - TRAVERSAL_REACH
        : chef.x <= left + TRAVERSAL_REACH;
    if (reachedFarEnd) this.#armedFrom = null;
    return reachedFarEnd;
  }

  step(): undefined {
    return undefined;
  }
}

class WaitingState implements IngredientState {
  readonly phase = 'waiting';
  readonly plan = undefined;
  readonly progress = 0;
  #remaining: number;

  constructor(delayTicks: number) {
    this.#remaining = delayTicks;
  }

  observe(): boolean {
    return false;
  }

  step(context: StateContext): IngredientState | undefined {
    if (this.#remaining > 0) {
      this.#remaining -= 1;
      return undefined;
    }
    const plan = context.host.startFall(context.ingredient);
    if (!plan.toPlate) context.setRow(plan.toRow);
    return new FallingState(plan);
  }
}

class FallingState implements IngredientState {
  readonly phase = 'falling';
  readonly plan: FallPlan;
  #elapsed = 0;

  constructor(plan: FallPlan) {
    this.plan = plan;
  }

  get progress(): number {
    return this.#elapsed / FALL_TICKS;
  }

  observe(): boolean {
    return false;
  }

  step(context: StateContext): IngredientState | undefined {
    this.#elapsed += 1;
    if (this.#elapsed < FALL_TICKS) return undefined;
    context.host.landed(context.ingredient, this.plan);
    return this.plan.toPlate ? new StackedState(this.plan) : new IdleState();
  }
}

class StackedState implements IngredientState {
  readonly phase = 'stacked';
  readonly progress = 1;
  readonly plan: FallPlan;

  constructor(plan: FallPlan) {
    this.plan = plan;
  }

  observe(): boolean {
    return false;
  }

  step(): undefined {
    return undefined;
  }
}

export class Ingredient implements IngredientSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly left: number;
  readonly right: number;
  readonly #host: IngredientHost;
  #row: number;
  #state: IngredientState = new IdleState();

  constructor(spec: IngredientSpec, host: IngredientHost) {
    this.id = spec.id;
    this.kind = spec.kind;
    this.left = spec.left;
    this.right = spec.right;
    this.#row = spec.row;
    this.#host = host;
  }

  get row(): number {
    return this.#row;
  }

  get phase(): IngredientPhase {
    return this.#state.phase;
  }

  get isIdle(): boolean {
    return this.#state.phase === 'idle';
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

  observeChef(chef: ChefSnapshot): boolean {
    return this.#state.observe(chef, this);
  }

  activate(delayTicks: number): void {
    if (this.isIdle) this.#state = new WaitingState(delayTicks);
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

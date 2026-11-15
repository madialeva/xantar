import type { IngredientKind } from '../level/kinds';
import type { IngredientSpec } from '../level/Level';
import {
  BOUNCE_HEIGHT,
  BOUNCE_HOLD_TICKS,
  BOUNCE_RISE_TICKS,
  FALL_SPEED,
  INGREDIENT_THICKNESS,
  TICK_SECONDS
} from '../rules';
import { MovingEntity, type PositionSnapshot } from './MovingEntity';

export type IngredientPhase = 'idle' | 'falling' | 'bouncing' | 'stacked';

/**
 * Where a falling ingredient comes to rest: a platform row, or its place in the burger of a
 * plate, with the height its base has there.
 */
export interface Support {
  readonly row: number;
  readonly y: number;
  readonly plateId: number | null;
  readonly stackSlot: number | null;
}

/** An ingredient as the view and the tests see it; `y` is the height of its base, in rows. */
export interface IngredientSnapshot extends PositionSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly col: number;
  readonly width: number;
  readonly left: number;
  readonly right: number;
  readonly row: number;
  readonly phase: IngredientPhase;
  readonly stomped: readonly boolean[];
  readonly stackSlot: number | null;
}

/**
 * What a falling ingredient asks of its surroundings: what it meets on its way down, and
 * telling them when it touches its support and when it comes to rest.
 */
export interface IngredientHost {
  /**
   * The height at which its base, going down to `toY`, meets another ingredient, if any. The
   * resting ingredients it meets are knocked down.
   */
  strike(ingredient: IngredientSnapshot, toY: number): number | undefined;
  touchedDown(ingredient: IngredientSnapshot, support: Support): void;
  cameToRest(ingredient: IngredientSnapshot, support: Support): void;
}

interface StateContext {
  readonly ingredient: IngredientSnapshot;
  readonly host: IngredientHost;
  readonly moveTo: (y: number) => void;
  readonly restOn: (row: number) => void;
}

interface IngredientState {
  readonly phase: IngredientPhase;
  readonly support: Support | undefined;
  readonly stomped: readonly boolean[];
  step(context: StateContext): IngredientState | undefined;
}

const FALL_STEP = FALL_SPEED * TICK_SECONDS;
const RISE_STEP = BOUNCE_HEIGHT / BOUNCE_RISE_TICKS;

const filled = (width: number, value: boolean): readonly boolean[] =>
  Array.from({ length: width }, () => value);

/**
 * Ingredient resting on a platform; remembers which segments the chef has stomped.
 */
class IdleState implements IngredientState {
  readonly phase = 'idle';
  readonly support = undefined;
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
 * Ingredient going down at a constant speed towards its support. Bound for a plate, it goes
 * down twice: onto the burger and, after bouncing on it, back to its place (`settling`).
 */
class FallingState implements IngredientState {
  readonly phase = 'falling';
  readonly support: Support;
  readonly stomped: readonly boolean[];
  readonly #settling: boolean;

  constructor(width: number, support: Support, settling = false) {
    this.support = support;
    this.stomped = filled(width, true);
    this.#settling = settling;
  }

  step({ ingredient, host, moveTo, restOn }: StateContext): IngredientState | undefined {
    const { support } = this;
    const toY = Math.min(ingredient.y + FALL_STEP, support.y);
    const contact = this.#settling ? undefined : host.strike(ingredient, toY);
    if (contact !== undefined) {
      moveTo(contact);
      return new BouncingState(ingredient.width, support, false);
    }
    moveTo(toY);
    if (toY < support.y) return undefined;
    const onPlate = support.plateId !== null;
    if (!this.#settling) host.touchedDown(ingredient, support);
    if (onPlate && !this.#settling) return new BouncingState(ingredient.width, support, true);
    restOn(support.row);
    host.cameToRest(ingredient, support);
    return onPlate ? new StackedState(ingredient.width, support) : new IdleState(ingredient.width);
  }
}

/**
 * Ingredient bouncing after it hits another one or lands on a plate: it rises, waits and goes
 * down again towards the same support.
 */
class BouncingState implements IngredientState {
  readonly phase = 'bouncing';
  readonly support: Support;
  readonly stomped: readonly boolean[];
  readonly #thenSettle: boolean;
  #elapsed = 0;

  constructor(width: number, support: Support, thenSettle: boolean) {
    this.support = support;
    this.stomped = filled(width, true);
    this.#thenSettle = thenSettle;
  }

  step({ ingredient, moveTo }: StateContext): IngredientState | undefined {
    this.#elapsed += 1;
    if (this.#elapsed <= BOUNCE_RISE_TICKS) moveTo(ingredient.y - RISE_STEP);
    if (this.#elapsed < BOUNCE_RISE_TICKS + BOUNCE_HOLD_TICKS) return undefined;
    return new FallingState(ingredient.width, this.support, this.#thenSettle);
  }
}

/**
 * Ingredient that has come to rest in the burger of a plate; it no longer reacts.
 */
class StackedState implements IngredientState {
  readonly phase = 'stacked';
  readonly support: Support;
  readonly stomped: readonly boolean[];

  constructor(width: number, support: Support) {
    this.support = support;
    this.stomped = filled(width, false);
  }

  step(): undefined {
    return undefined;
  }
}

/**
 * An ingredient made of stompable segments that falls down the platforms. Its life cycle
 * (resting, falling, bouncing, stacked) is delegated to state objects (State pattern); its
 * position is the centre of its casillas and the height of its base.
 */
export class Ingredient extends MovingEntity implements IngredientSnapshot {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly col: number;
  readonly width: number;
  readonly #context: StateContext;
  #row: number;
  #state: IngredientState;

  constructor(spec: IngredientSpec, host: IngredientHost) {
    super(spec.col + spec.width / 2, spec.row);
    this.id = spec.id;
    this.kind = spec.kind;
    this.col = spec.col;
    this.width = spec.width;
    this.#row = spec.row;
    this.#state = new IdleState(spec.width);
    this.#context = {
      ingredient: this,
      host,
      moveTo: (y) => this.moveTo(this.x, y),
      restOn: (row) => {
        this.#row = row;
      }
    };
  }

  get left(): number {
    return this.col;
  }

  get right(): number {
    return this.col + this.width;
  }

  /** The row of the platform or plate it rests on, or of the platform it is falling from. */
  get row(): number {
    return this.#row;
  }

  /** Height of its top: where the base of an ingredient falling onto it stops. */
  get top(): number {
    return this.y - INGREDIENT_THICKNESS[this.kind];
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

  get stackSlot(): number | null {
    return this.#state.support?.stackSlot ?? null;
  }

  segmentAt(x: number): number | undefined {
    const segment = Math.floor(x - this.col);
    return segment >= 0 && segment < this.width ? segment : undefined;
  }

  stomp(segment: number): boolean {
    return this.#state instanceof IdleState && this.#state.stomp(segment);
  }

  fall(support: Support): void {
    if (this.isIdle) this.#state = new FallingState(this.width, support);
  }

  /** Lifts its stomped segments again; for an ingredient with nowhere to fall. */
  resetSegments(): void {
    if (this.isIdle) this.#state = new IdleState(this.width);
  }

  step(): void {
    const next = this.#state.step(this.#context);
    if (next !== undefined) this.#state = next;
  }
}

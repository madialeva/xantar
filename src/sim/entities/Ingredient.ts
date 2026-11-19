import type { IngredientKind } from '../level/kinds';
import type { IngredientSpec } from '../level/Level';
import {
  BOUNCE_HEIGHT,
  BOUNCE_HOLD_TICKS,
  BOUNCE_RISE_TICKS,
  FALL_SPEED,
  INGREDIENT_THICKNESS,
  RIDER_STOP_TICKS,
  TICK_SECONDS
} from '../rules';
import { MovingEntity, type PositionSnapshot } from './MovingEntity';

export type IngredientPhase = 'idle' | 'falling' | 'bouncing' | 'stopped' | 'stacked';

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
  /**
   * How many steps each segment has sunk: a newly stomped one sinks one step and every one
   * stomped before it one more, so a half-stomped ingredient slopes. Zero unless it rests.
   */
  readonly sink: readonly number[];
  readonly stackSlot: number | null;
}

/**
 * What a falling ingredient asks of its surroundings: the support below it, what it meets on
 * its way down, and telling them when it touches a support and when it comes to rest.
 */
export interface IngredientHost {
  supportBelow(ingredient: IngredientSnapshot): Support | undefined;
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
  readonly sink: readonly number[];
  step(context: StateContext): IngredientState | undefined;
}

const FALL_STEP = FALL_SPEED * TICK_SECONDS;
const RISE_STEP = BOUNCE_HEIGHT / BOUNCE_RISE_TICKS;

const filled = <T>(width: number, value: T): readonly T[] =>
  Array.from({ length: width }, () => value);

/**
 * Ingredient resting on a platform; remembers how far the chef has stomped each segment down.
 */
class IdleState implements IngredientState {
  readonly phase = 'idle';
  readonly support = undefined;
  #sink: readonly number[];

  constructor(width: number) {
    this.#sink = filled(width, 0);
  }

  get sink(): readonly number[] {
    return this.#sink;
  }

  get stomped(): readonly boolean[] {
    return this.#sink.map((steps) => steps > 0);
  }

  stomp(segment: number): boolean {
    if (this.#sink[segment] !== 0) return false;
    this.#sink = this.#sink.map((steps, index) =>
      index === segment ? 1 : steps > 0 ? steps + 1 : 0
    );
    return true;
  }

  step(): undefined {
    return undefined;
  }
}

/** Where a fall is heading and how many supports it still has to go down, this one included. */
interface Descent {
  readonly support: Support;
  readonly supportsLeft: number;
}

const restAt = ({ ingredient, host, restOn }: StateContext, support: Support): IngredientState => {
  restOn(support.row);
  host.cameToRest(ingredient, support);
  return support.plateId === null
    ? new IdleState(ingredient.width)
    : new StackedState(ingredient.width, support);
};

/**
 * Ingredient going down at a constant speed towards its support. Bound for a plate, it goes
 * down twice: onto the burger and, after bouncing on it, back to its place (`settling`). With
 * supports left (it carries enemies), it stops on each floor before going on.
 */
class FallingState implements IngredientState {
  readonly phase = 'falling';
  readonly support: Support;
  readonly stomped: readonly boolean[];
  readonly sink: readonly number[];
  readonly #descent: Descent;
  readonly #settling: boolean;

  constructor(width: number, descent: Descent, settling = false) {
    this.support = descent.support;
    this.stomped = filled(width, true);
    this.sink = filled(width, 0);
    this.#descent = descent;
    this.#settling = settling;
  }

  step(context: StateContext): IngredientState | undefined {
    const { ingredient, host, moveTo, restOn } = context;
    const { support } = this;
    const toY = Math.min(ingredient.y + FALL_STEP, support.y);
    const contact = this.#settling ? undefined : host.strike(ingredient, toY);
    if (contact !== undefined) {
      moveTo(contact);
      return new BouncingState(ingredient.width, this.#descent, false);
    }
    moveTo(toY);
    if (toY < support.y) return undefined;
    if (this.#settling) return restAt(context, support);
    host.touchedDown(ingredient, support);
    if (support.plateId !== null) return new BouncingState(ingredient.width, this.#descent, true);
    if (this.#descent.supportsLeft <= 1) return restAt(context, support);
    restOn(support.row);
    return new StoppedState(ingredient.width, this.#descent.supportsLeft - 1);
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
  readonly sink: readonly number[];
  readonly #descent: Descent;
  readonly #thenSettle: boolean;
  #elapsed = 0;

  constructor(width: number, descent: Descent, thenSettle: boolean) {
    this.support = descent.support;
    this.stomped = filled(width, true);
    this.sink = filled(width, 0);
    this.#descent = descent;
    this.#thenSettle = thenSettle;
  }

  step({ ingredient, moveTo }: StateContext): IngredientState | undefined {
    this.#elapsed += 1;
    if (this.#elapsed <= BOUNCE_RISE_TICKS) moveTo(ingredient.y - RISE_STEP);
    if (this.#elapsed < BOUNCE_RISE_TICKS + BOUNCE_HOLD_TICKS) return undefined;
    return new FallingState(ingredient.width, this.#descent, this.#thenSettle);
  }
}

/**
 * Ingredient that carries enemies, stopped for a moment on a floor it has reached before
 * going on to the next support.
 */
class StoppedState implements IngredientState {
  readonly phase = 'stopped';
  readonly support = undefined;
  readonly stomped: readonly boolean[];
  readonly sink: readonly number[];
  readonly #supportsLeft: number;
  #elapsed = 0;

  constructor(width: number, supportsLeft: number) {
    this.stomped = filled(width, true);
    this.sink = filled(width, 0);
    this.#supportsLeft = supportsLeft;
  }

  step(context: StateContext): IngredientState | undefined {
    this.#elapsed += 1;
    if (this.#elapsed < RIDER_STOP_TICKS) return undefined;
    const { ingredient, host } = context;
    const support = host.supportBelow(ingredient);
    if (support === undefined) {
      return restAt(context, {
        row: ingredient.row,
        y: ingredient.y,
        plateId: null,
        stackSlot: null
      });
    }
    return new FallingState(ingredient.width, { support, supportsLeft: this.#supportsLeft });
  }
}

/**
 * Ingredient that has come to rest in the burger of a plate; it no longer reacts.
 */
class StackedState implements IngredientState {
  readonly phase = 'stacked';
  readonly support: Support;
  readonly stomped: readonly boolean[];
  readonly sink: readonly number[];

  constructor(width: number, support: Support) {
    this.support = support;
    this.stomped = filled(width, false);
    this.sink = filled(width, 0);
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

  /** Falling or bouncing: moving through the board, where it crushes enemies. */
  get isMoving(): boolean {
    return this.#state instanceof FallingState || this.#state instanceof BouncingState;
  }

  get stomped(): readonly boolean[] {
    return this.#state.stomped;
  }

  get sink(): readonly number[] {
    return this.#state.sink;
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

  /** Starts falling to a support and, if it carries enemies, on down to the next ones. */
  fall(support: Support, supports = 1): void {
    if (this.isIdle)
      this.#state = new FallingState(this.width, { support, supportsLeft: supports });
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

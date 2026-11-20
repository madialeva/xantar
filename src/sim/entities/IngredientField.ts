import type { EventSink } from '../events';
import type { Level } from '../level/Level';
import { EXTRA_SUPPORTS_PER_RIDER, SCORE, TICKS_PER_SECOND } from '../rules';
import type { ChefPosition } from './Chef';
import {
  Ingredient,
  type IngredientHost,
  type IngredientSnapshot,
  type Support
} from './Ingredient';
import { Plate } from './Plate';

/**
 * The enemies, as the ingredient field needs them; keeps the field unaware of the enemy
 * class.
 */
export interface EnemyRoster {
  /** Makes the enemies standing on an ingredient ride it, and tells how many they are. */
  board(ingredient: IngredientSnapshot): number;
  /** Crushes the enemies the base of a moving ingredient is inside of. */
  crushUnder(ingredient: IngredientSnapshot): void;
  /** Drops the enemies riding an ingredient that has come to rest: they leave the board. */
  release(ingredient: IngredientSnapshot): void;
}

/** What the field gives the player for its falls: points and, for a burger, a pepper. */
export interface FieldRewards {
  addScore(points: number): void;
  grantPepper(): void;
}

const SILENT_EVENTS: EventSink = { emit: () => undefined };
const NO_REWARDS: FieldRewards = { addScore: () => undefined, grantPepper: () => undefined };
const NO_ENEMIES: EnemyRoster = {
  board: () => 0,
  crushUnder: () => undefined,
  release: () => undefined
};

/** How long a forecast may run before giving up: far longer than any chain of falls. */
const FORECAST_TICKS = 60 * TICKS_PER_SECOND;

const overlap = (
  a: Pick<IngredientSnapshot, 'left' | 'right'>,
  b: Pick<IngredientSnapshot, 'left' | 'right'>
): boolean => a.left < b.right && b.left < a.right;

/**
 * Coordinates all the ingredients and plates of a level: stomping from the chef's position,
 * the support of each fall, the ingredients a falling one meets and knocks down, the enemies
 * it carries or crushes, landings and burger completion.
 */
export class IngredientField implements IngredientHost {
  readonly ingredients: readonly Ingredient[];
  readonly plates: readonly Plate[];
  readonly #level: Level;
  readonly #events: EventSink;
  readonly #rewards: FieldRewards;
  readonly #enemies: EnemyRoster;
  readonly #struck = new Set<Ingredient>();
  #dropped = false;
  #secured = false;

  /** With `source`, the field starts as a copy of it (Prototype) instead of from the level. */
  constructor(
    level: Level,
    events: EventSink,
    rewards: FieldRewards,
    enemies: EnemyRoster,
    source?: IngredientField
  ) {
    this.#level = level;
    this.#events = events;
    this.#rewards = rewards;
    this.#enemies = enemies;
    this.ingredients =
      source?.ingredients.map((ingredient) => ingredient.copyFor(this)) ??
      level.ingredients.map((spec) => new Ingredient(spec, this));
    this.plates =
      source?.plates.map((plate) => plate.copy()) ?? level.plates.map((spec) => new Plate(spec));
  }

  get isComplete(): boolean {
    const withIngredients = this.plates.filter((plate) => plate.expected > 0);
    return withIngredients.length > 0 && withIngredients.every((plate) => plate.isComplete);
  }

  /**
   * Whether the falls under way, and the ones they cause, will complete every burger with no
   * more stomps. Checked whenever the chef drops an ingredient; once true, it stays true.
   */
  get isSecured(): boolean {
    return this.#secured;
  }

  /** A copy in the same state that tells nobody what happens to it (Prototype). */
  copy(): IngredientField {
    return new IngredientField(this.#level, SILENT_EVENTS, NO_REWARDS, NO_ENEMIES, this);
  }

  beginTick(): void {
    for (const ingredient of this.ingredients) ingredient.beginTick();
  }

  /** Lifts the stomped segments of every resting ingredient, as when the chef loses a life. */
  liftStomps(): void {
    for (const ingredient of this.ingredients) ingredient.resetSegments();
  }

  /**
   * Stomps under the chef and moves the falling ingredients, which crush the enemies under
   * them. The ones knocked down during the tick start falling at its end, so they move from
   * the next tick whatever their order.
   */
  step(chef: ChefPosition): void {
    if (chef.onPlatform) {
      for (const ingredient of this.ingredients) this.#stomp(ingredient, chef);
    }
    this.advanceFalls();
    if (this.#dropped && !this.#secured) this.#secured = this.#forecastsCompletion();
    this.#dropped = false;
  }

  /** Whether any ingredient is still on its way down (falling, bouncing or stopped). */
  get hasFalls(): boolean {
    return this.ingredients.some(
      (ingredient) => !ingredient.isIdle && ingredient.phase !== 'stacked'
    );
  }

  /**
   * Moves the falling ingredients a tick, with no stomping: the knocks, the crushes, the riders
   * and the points go on as usual.
   */
  advanceFalls(): void {
    for (const ingredient of this.ingredients) {
      const wasMoving = ingredient.isMoving;
      ingredient.step();
      if (wasMoving || ingredient.isMoving) this.#enemies.crushUnder(ingredient);
    }
    this.#knockDownStruck();
  }

  /** Plays the falls under way to their end on a copy, and tells whether they finish the board. */
  #forecastsCompletion(): boolean {
    const twin = this.copy();
    for (let tick = 0; tick < FORECAST_TICKS && twin.hasFalls; tick++) twin.advanceFalls();
    return twin.isComplete;
  }

  strike(ingredient: IngredientSnapshot, toY: number): number | undefined {
    const met = this.ingredients.filter(
      (other) =>
        other.id !== ingredient.id &&
        other.phase !== 'stacked' &&
        overlap(other, ingredient) &&
        other.top > ingredient.y &&
        other.top <= toY
    );
    if (met.length === 0) return undefined;
    for (const other of met) if (other.isIdle) this.#struck.add(other);
    return Math.min(...met.map((other) => other.top));
  }

  touchedDown(ingredient: IngredientSnapshot, support: Support): void {
    this.#events.emit({
      type: 'ingredientLanded',
      ingredientId: ingredient.id,
      plateId: support.plateId,
      stackSlot: support.stackSlot
    });
  }

  cameToRest(ingredient: IngredientSnapshot, support: Support): void {
    this.#rewards.addScore(SCORE.ingredient);
    this.#enemies.release(ingredient);
    if (support.plateId === null) return;
    if (this.plates[support.plateId].registerLanding()) {
      this.#rewards.addScore(SCORE.burger);
      this.#rewards.grantPepper();
      this.#events.emit({ type: 'burgerDone', plateId: support.plateId, points: SCORE.burger });
    }
  }

  #stomp(ingredient: Ingredient, chef: ChefPosition): void {
    if (!ingredient.isIdle || ingredient.row !== chef.row) return;
    const segment = ingredient.segmentAt(chef.x);
    if (segment === undefined || !ingredient.stomp(segment)) return;
    this.#events.emit({ type: 'segmentStomped', ingredientId: ingredient.id, segment });
    if (!ingredient.allStomped) return;
    this.#startFalls([ingredient], true);
    this.#dropped = true;
  }

  #knockDownStruck(): void {
    if (this.#struck.size === 0) return;
    const struck = [...this.#struck].sort((a, b) => a.id - b.id);
    this.#struck.clear();
    this.#startFalls(struck);
  }

  /** Only an ingredient dropped by the chef takes the enemies on it for a ride. */
  #startFalls(ingredients: readonly Ingredient[], dropped = false): void {
    const falling: Ingredient[] = [];
    for (const ingredient of ingredients) {
      const support = this.supportBelow(ingredient);
      if (support === undefined) {
        ingredient.resetSegments();
        continue;
      }
      const riders = dropped ? this.#enemies.board(ingredient) : 0;
      ingredient.fall(support, 1 + EXTRA_SUPPORTS_PER_RIDER * riders);
      falling.push(ingredient);
    }
    if (falling.length === 0) return;
    this.#events.emit({
      type: 'ingredientsTriggered',
      ingredientIds: falling.map((ingredient) => ingredient.id)
    });
  }

  supportBelow(ingredient: IngredientSnapshot): Support | undefined {
    const landing = this.#level.landingBelow(ingredient.row, ingredient.left, ingredient.right);
    if (landing === undefined) return undefined;
    if (landing.plate === undefined) {
      return { row: landing.row, y: landing.row, plateId: null, stackSlot: null };
    }
    const plate = this.plates[landing.plate.id];
    const stackSlot = plate.assignSlot(ingredient.kind);
    return {
      row: landing.row,
      y: landing.row - plate.heightBelow(stackSlot),
      plateId: plate.id,
      stackSlot
    };
  }
}

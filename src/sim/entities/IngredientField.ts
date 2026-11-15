import type { EventSink } from '../events';
import type { GameStats } from '../GameStats';
import type { Level } from '../level/Level';
import { SCORE } from '../rules';
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
  /** Crushes the enemies the base of a moving ingredient is inside of. */
  crushUnder(ingredient: IngredientSnapshot): void;
}

const overlap = (
  a: Pick<IngredientSnapshot, 'left' | 'right'>,
  b: Pick<IngredientSnapshot, 'left' | 'right'>
): boolean => a.left < b.right && b.left < a.right;

/**
 * Coordinates all the ingredients and plates of a level: stomping from the chef's position,
 * the support of each fall, the ingredients a falling one meets and knocks down, the enemies
 * it crushes, landings and burger completion.
 */
export class IngredientField implements IngredientHost {
  readonly ingredients: readonly Ingredient[];
  readonly plates: readonly Plate[];
  readonly #level: Level;
  readonly #events: EventSink;
  readonly #stats: GameStats;
  readonly #enemies: EnemyRoster;
  readonly #struck = new Set<Ingredient>();

  constructor(level: Level, events: EventSink, stats: GameStats, enemies: EnemyRoster) {
    this.#level = level;
    this.#events = events;
    this.#stats = stats;
    this.#enemies = enemies;
    this.ingredients = level.ingredients.map((spec) => new Ingredient(spec, this));
    this.plates = level.plates.map((spec) => new Plate(spec));
  }

  get isComplete(): boolean {
    const withIngredients = this.plates.filter((plate) => plate.expected > 0);
    return withIngredients.length > 0 && withIngredients.every((plate) => plate.isComplete);
  }

  beginTick(): void {
    for (const ingredient of this.ingredients) ingredient.beginTick();
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
    for (const ingredient of this.ingredients) {
      const wasMoving = ingredient.isMoving;
      ingredient.step();
      if (wasMoving || ingredient.isMoving) this.#enemies.crushUnder(ingredient);
    }
    this.#knockDownStruck();
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

  cameToRest(_ingredient: IngredientSnapshot, support: Support): void {
    this.#stats.addScore(SCORE.ingredient);
    if (support.plateId === null) return;
    if (this.plates[support.plateId].registerLanding()) {
      this.#stats.addScore(SCORE.burger);
      this.#stats.grantPepper();
      this.#events.emit({ type: 'burgerDone', plateId: support.plateId, points: SCORE.burger });
    }
  }

  #stomp(ingredient: Ingredient, chef: ChefPosition): void {
    if (!ingredient.isIdle || ingredient.row !== chef.row) return;
    const segment = ingredient.segmentAt(chef.x);
    if (segment === undefined || !ingredient.stomp(segment)) return;
    this.#events.emit({ type: 'segmentStomped', ingredientId: ingredient.id, segment });
    if (ingredient.allStomped) this.#startFalls([ingredient]);
  }

  #knockDownStruck(): void {
    if (this.#struck.size === 0) return;
    const struck = [...this.#struck].sort((a, b) => a.id - b.id);
    this.#struck.clear();
    this.#startFalls(struck);
  }

  #startFalls(ingredients: readonly Ingredient[]): void {
    const falling: Ingredient[] = [];
    for (const ingredient of ingredients) {
      const support = this.#supportBelow(ingredient);
      if (support === undefined) {
        ingredient.resetSegments();
        continue;
      }
      ingredient.fall(support);
      falling.push(ingredient);
    }
    if (falling.length === 0) return;
    this.#events.emit({
      type: 'ingredientsTriggered',
      ingredientIds: falling.map((ingredient) => ingredient.id)
    });
  }

  #supportBelow(ingredient: Ingredient): Support | undefined {
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

import type { EventSink } from '../events';
import type { GameStats } from '../GameStats';
import type { Level } from '../level/Level';
import { FALL_STAGGER_TICKS, SCORE } from '../rules';
import type { ChefPosition } from './Chef';
import {
  type FallPlan,
  Ingredient,
  type IngredientHost,
  type IngredientSnapshot
} from './Ingredient';
import { Plate } from './Plate';

/**
 * Whoever can be crushed by a falling ingredient (the enemies); keeps the field unaware
 * of the enemy class.
 */
export interface CrushTarget {
  crush(left: number, right: number, fromRow: number, toRow: number): void;
}

const overlap = (a: IngredientSnapshot, b: IngredientSnapshot): boolean =>
  a.left < b.right && b.left < a.right;

/**
 * Coordinates all the ingredients and plates of a level: stomping from the chef's position,
 * chain falls by impact, crush requests, landings and burger completion.
 */
export class IngredientField implements IngredientHost {
  readonly ingredients: readonly Ingredient[];
  readonly plates: readonly Plate[];
  readonly #level: Level;
  readonly #events: EventSink;
  readonly #stats: GameStats;
  readonly #crush: CrushTarget;

  constructor(level: Level, events: EventSink, stats: GameStats, crush: CrushTarget) {
    this.#level = level;
    this.#events = events;
    this.#stats = stats;
    this.#crush = crush;
    this.ingredients = level.ingredients.map((spec) => new Ingredient(spec, this));
    this.plates = level.plates.map((spec) => new Plate(spec));
  }

  get isComplete(): boolean {
    const withIngredients = this.plates.filter((plate) => plate.expected > 0);
    return withIngredients.length > 0 && withIngredients.every((plate) => plate.isComplete);
  }

  step(chef: ChefPosition): void {
    if (chef.onPlatform) {
      for (const ingredient of this.ingredients) this.#stomp(ingredient, chef);
    }
    for (const ingredient of this.ingredients) ingredient.step();
  }

  startFall(ingredient: IngredientSnapshot): FallPlan {
    const landing = this.#level.landingBelow(ingredient.row, ingredient.left, ingredient.right);
    if (landing === undefined) {
      return {
        fromRow: ingredient.row,
        toRow: ingredient.row,
        toPlate: false,
        plateId: null,
        stackSlot: null
      };
    }
    this.#crush.crush(ingredient.left, ingredient.right, ingredient.row, landing.row);
    if (landing.plate === undefined) {
      return {
        fromRow: ingredient.row,
        toRow: landing.row,
        toPlate: false,
        plateId: null,
        stackSlot: null
      };
    }
    const plate = this.plates[landing.plate.id];
    return {
      fromRow: ingredient.row,
      toRow: landing.row,
      toPlate: true,
      plateId: plate.id,
      stackSlot: plate.assignSlot()
    };
  }

  landed(ingredient: IngredientSnapshot, plan: FallPlan): void {
    this.#events.emit({
      type: 'ingredientLanded',
      ingredientId: ingredient.id,
      plateId: plan.plateId,
      stackSlot: plan.stackSlot
    });
    if (plan.plateId === null) return;
    if (this.plates[plan.plateId].registerLanding()) {
      this.#stats.addScore(SCORE.burger);
      this.#stats.grantPepper();
      this.#events.emit({ type: 'burgerDone', plateId: plan.plateId, points: SCORE.burger });
    }
  }

  #stomp(ingredient: Ingredient, chef: ChefPosition): void {
    if (!ingredient.isIdle || ingredient.row !== chef.row) return;
    const segment = ingredient.segmentAt(chef.x);
    if (segment === undefined || !ingredient.stomp(segment)) return;
    this.#events.emit({ type: 'segmentStomped', ingredientId: ingredient.id, segment });
    if (ingredient.allStomped) this.#activate(ingredient);
  }

  #activate(first: Ingredient): void {
    const affected = new Set<Ingredient>([first]);
    const pending: Ingredient[] = [first];
    for (let current = pending.shift(); current !== undefined; current = pending.shift()) {
      const landing = this.#level.landingBelow(current.row, current.left, current.right);
      if (landing === undefined || landing.plate !== undefined) continue;
      for (const candidate of this.ingredients) {
        if (
          candidate.isIdle &&
          !affected.has(candidate) &&
          candidate.row === landing.row &&
          overlap(candidate, current)
        ) {
          affected.add(candidate);
          pending.push(candidate);
        }
      }
    }
    const falling = [...affected].sort((a, b) => b.row - a.row || a.col - b.col || a.id - b.id);
    falling.forEach((ingredient, index) => {
      ingredient.activate(index * FALL_STAGGER_TICKS);
      this.#stats.addScore(SCORE.ingredient);
    });
    this.#events.emit({
      type: 'ingredientsTriggered',
      ingredientIds: falling.map((ingredient) => ingredient.id)
    });
  }
}

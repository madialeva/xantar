import type { EventSink } from '../events';
import type { GameStats } from '../GameStats';
import type { BurgerColumn, Plate } from '../legacy-level/Level';
import type { Level } from '../legacy-level/Level';
import { FALL_STAGGER_TICKS, SCORE } from '../rules';
import type { ChefSnapshot } from './Chef';
import {
  type FallPlan,
  Ingredient,
  type IngredientHost,
  type IngredientSnapshot
} from './Ingredient';

export interface CrushTarget {
  crush(left: number, right: number, fromRow: number, toRow: number): void;
}

export interface BurgerSnapshot {
  readonly id: number;
  readonly plate: Plate;
  readonly isComplete: boolean;
  readonly ingredients: readonly IngredientSnapshot[];
}

export class Burger implements BurgerSnapshot, IngredientHost {
  readonly id: number;
  readonly plate: Plate;
  readonly ingredients: readonly Ingredient[];
  readonly #column: BurgerColumn;
  readonly #level: Level;
  readonly #events: EventSink;
  readonly #stats: GameStats;
  readonly #crush: CrushTarget;
  #assignedSlots = 0;
  #landedOnPlate = 0;
  #complete = false;

  constructor(
    column: BurgerColumn,
    level: Level,
    events: EventSink,
    stats: GameStats,
    crush: CrushTarget
  ) {
    this.id = column.id;
    this.plate = column.plate;
    this.#column = column;
    this.#level = level;
    this.#events = events;
    this.#stats = stats;
    this.#crush = crush;
    this.ingredients = column.ingredients.map((spec) => new Ingredient(spec, this));
  }

  get isComplete(): boolean {
    return this.#complete;
  }

  step(chef: ChefSnapshot): void {
    for (const ingredient of this.ingredients) {
      if (ingredient.observeChef(chef)) this.#trigger(ingredient);
    }
    for (const ingredient of this.ingredients) ingredient.step();
  }

  startFall(ingredient: IngredientSnapshot): FallPlan {
    const { left, right } = this.#column;
    const nextRow = this.#level.landingRowBelow(ingredient.row, left, right);
    this.#crush.crush(left, right, ingredient.row, nextRow ?? this.plate.row);
    if (nextRow !== undefined) {
      return { fromRow: ingredient.row, toRow: nextRow, toPlate: false, stackSlot: null };
    }
    const stackSlot = this.#assignedSlots;
    this.#assignedSlots += 1;
    return { fromRow: ingredient.row, toRow: this.plate.row, toPlate: true, stackSlot };
  }

  landed(ingredient: IngredientSnapshot, plan: FallPlan): void {
    this.#events.emit({
      type: 'ingredientLanded',
      burgerId: this.id,
      ingredientId: ingredient.id,
      stackSlot: plan.stackSlot
    });
    if (!plan.toPlate) return;
    this.#landedOnPlate += 1;
    if (!this.#complete && this.#landedOnPlate === this.ingredients.length) {
      this.#complete = true;
      this.#stats.addScore(SCORE.burger);
      this.#stats.grantPepper();
      this.#events.emit({ type: 'burgerDone', burgerId: this.id, points: SCORE.burger });
    }
  }

  #trigger(triggered: Ingredient): void {
    const falling = this.ingredients
      .filter((ingredient) => ingredient.isIdle && ingredient.row >= triggered.row)
      .sort((a, b) => b.row - a.row);
    falling.forEach((ingredient, index) => {
      ingredient.activate(index * FALL_STAGGER_TICKS);
      this.#stats.addScore(SCORE.ingredient);
    });
    this.#events.emit({
      type: 'ingredientsTriggered',
      burgerId: this.id,
      ingredientIds: falling.map((ingredient) => ingredient.id)
    });
  }
}

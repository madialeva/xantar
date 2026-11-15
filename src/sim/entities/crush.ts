import { ENEMY_HEIGHT } from '../rules';

/** The part of a falling ingredient that crushes: its casillas and the height of its base. */
export interface CrushingIngredient {
  readonly left: number;
  readonly right: number;
  readonly y: number;
}

/** Where an enemy stands: the height of its feet. */
export interface CrushableEnemy {
  readonly x: number;
  readonly y: number;
}

/**
 * Whether the base of a falling ingredient is inside an enemy, from its feet up to its
 * height, within the ingredient's casillas. An enemy above the base (one the ingredient is
 * leaving behind) is not crushed.
 */
export const isCrushedBy = (ingredient: CrushingIngredient, enemy: CrushableEnemy): boolean =>
  enemy.x >= ingredient.left &&
  enemy.x <= ingredient.right &&
  ingredient.y > enemy.y - ENEMY_HEIGHT &&
  ingredient.y <= enemy.y;

/** The part of an ingredient an enemy can stand on: its platform row and its casillas. */
export interface RideableIngredient {
  readonly row: number;
  readonly left: number;
  readonly right: number;
}

/** What tells whether an enemy is standing on an ingredient. */
export interface BoardingEnemy {
  readonly active: boolean;
  readonly riding: boolean;
  readonly isClimbing: boolean;
  readonly row: number;
  readonly x: number;
}

/**
 * Whether an enemy stands on an ingredient, so it rides it down when the chef drops it:
 * active, stunned or not, on the platform of its row (not on a ladder) and within its casillas.
 */
export const isStandingOn = (ingredient: RideableIngredient, enemy: BoardingEnemy): boolean =>
  enemy.active &&
  !enemy.riding &&
  !enemy.isClimbing &&
  enemy.row === ingredient.row &&
  enemy.x >= ingredient.left &&
  enemy.x <= ingredient.right;

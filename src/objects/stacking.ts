import type { IngredientSnapshot } from '../sim';
import { INGREDIENT_STACK_HEIGHTS } from '../view/art/graphics';

/**
 * How high above its plate each ingredient on its way to a plate, or already on it, sits: the
 * stack heights of the ingredients below it on the same plate. Ingredients not bound for a
 * plate are left out.
 */
export function stackLifts(
  ingredients: readonly IngredientSnapshot[]
): ReadonlyMap<number, number> {
  const onPlates = ingredients.filter((ingredient) => ingredient.stackSlot !== null);
  return new Map(
    onPlates.map((ingredient) => [
      ingredient.id,
      onPlates
        .filter(
          (other) =>
            other.col === ingredient.col &&
            other.fallToRow === ingredient.fallToRow &&
            (other.stackSlot ?? 0) < (ingredient.stackSlot ?? 0)
        )
        .reduce((lift, other) => lift + INGREDIENT_STACK_HEIGHTS[other.kind], 0)
    ])
  );
}

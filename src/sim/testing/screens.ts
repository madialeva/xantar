import type { IngredientKind } from '../level/kinds';
import type { Level } from '../level/Level';

/** The rows of the floors of a level, from the top. */
export const floorRows = (level: Level): number[] =>
  [...new Set(level.graph.platforms.map((platform) => platform.row))].sort((a, b) => a - b);

/** Free columns to the left and to the right of the floors of a level. */
export const playfieldMargins = (level: Level): [number, number] => [
  Math.min(...level.graph.platforms.map((platform) => platform.left)),
  level.cols - Math.max(...level.graph.platforms.map((platform) => platform.right))
];

/** The ingredients of the burger whose lane starts at `col`, from the top, with their rows. */
export const lane = (level: Level, col: number): [IngredientKind, number][] =>
  level.ingredients
    .filter((ingredient) => ingredient.col === col)
    .map((ingredient) => [ingredient.kind, ingredient.row]);

/** The enemies of a level in the order they come in, with their row and side of the board. */
export const entryOrder = (level: Level): [string, number, 'left' | 'right'][] =>
  [...level.enemySpawns]
    .sort((a, b) => a.delayTicks - b.delayTicks)
    .map((spawn) => [spawn.kind, spawn.row, spawn.x < level.cols / 2 ? 'left' : 'right']);

/** The sides of each row that have an entry walkway at the edge of the board. */
export const walkwaySides = (level: Level): [number, ...('left' | 'right')[]][] =>
  Array.from({ length: level.rows }, (_, row): [number, ...('left' | 'right')[]] => [
    row,
    ...(level.terrain.hasWalkway(row, 0) ? (['left'] as const) : []),
    ...(level.terrain.hasWalkway(row, level.cols - 1) ? (['right'] as const) : [])
  ]).filter((sides) => sides.length > 1);

/** The ladder runs of a level that are an odd number of rows long. */
export const oddLadders = (level: Level): number[] =>
  level.graph.ladders
    .filter((ladder) => (ladder.bottomRow - ladder.topRow) % 2 !== 0)
    .map((ladder) => ladder.col);

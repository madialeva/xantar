import type { IngredientKind } from './level/kinds';

export const TICKS_PER_SECOND = 60;
export const TICK_SECONDS = 1 / TICKS_PER_SECOND;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

/**
 * How wide a cell is on the original screen at ×2, in logical units: one character, 16 wide.
 * Distances and speeds measured on the original count cells and rows in these.
 */
export const ORIGINAL_CELL_UNITS = 16;
/**
 * Width of a cell in logical units: one character of the original screen at ×2 and two units
 * more, so the board fills more of a landscape screen. Only the drawing gets wider: the game
 * still counts in cells.
 */
export const CELL_UNITS = ORIGINAL_CELL_UNITS + 2;
/**
 * Height of a row in logical units: taller than a cell is wide, so that two floors one ladder run
 * apart (two rows) leave the chef standing between their platforms with a little room to spare.
 */
export const ROW_UNITS = 21;
/**
 * A distance or a speed measured on the original screen at ×2, in cells or rows: 16 to a cell
 * and 16 to a row, so crossing a cell or climbing a ladder run takes as long as in the original.
 */
const fromPx = (pixels: number): number => pixels / ORIGINAL_CELL_UNITS;
/** A height of something drawn on the board, in logical units, in rows. */
const rowsOf = (units: number): number => units / ROW_UNITS;
const fromMs = (milliseconds: number): number =>
  Math.round((milliseconds * TICKS_PER_SECOND) / 1000);

export const CHEF_SPEED = fromPx(86);
export const CLIMB_SPEED = fromPx(43);
export const ENEMY_WALK_SPEED = fromPx(54);
export const ENEMY_CLIMB_SPEED = fromPx(27);

export const ARRIVAL_THRESHOLD = fromPx(3);
export const EDGE_MARGIN = fromPx(12);
export const LADDER_GRAB_DISTANCE = fromPx(19.2);
export const STEP_OFF_DISTANCE = rowsOf(12.8);

export const FALL_SPEED = fromPx(113);
export const BOUNCE_HEIGHT = rowsOf(13);
export const BOUNCE_RISE_TICKS = fromMs(80);
export const BOUNCE_HOLD_TICKS = fromMs(220);
export const RIDER_STOP_TICKS = fromMs(270);
export const EXTRA_SUPPORTS_PER_RIDER = 2;

/** How thick each ingredient is: where the next one rests on it, on a floor or in a burger. */
export const INGREDIENT_THICKNESS: Readonly<Record<IngredientKind, number>> = {
  bunTop: rowsOf(13),
  lettuce: rowsOf(8),
  patty: rowsOf(12),
  bunBottom: rowsOf(11)
};

export const READY_TICKS = fromMs(1500);
export const DYING_TICKS = fromMs(2000);
export const LEVEL_CLEAR_TICKS = fromMs(3000);

/**
 * Pace of the enemies on Normal, as in the original: the factor of each step over their speeds,
 * one step more every `PACE_STEP_TICKS` of play on a board; from `LATE_PACE_LEVEL` a board
 * starts on `LATE_PACE_FIRST_STEP`. Easy and Hard keep a steady factor.
 */
export const PACE_STEPS: readonly number[] = [1, 1.03, 1.07, 1.25];
export const PACE_STEP_TICKS = fromMs(21_750);
export const LATE_PACE_LEVEL = 4;
export const LATE_PACE_FIRST_STEP = 2;
export const EASY_PACE = 0.85;
export const HARD_PACE = 1.25;

/** How many boards in a row each screen is played on Easy, so beginners can practise it. */
export const EASY_BOARDS_PER_SCREEN = 2;

export const STUN_TICKS = fromMs(5000);
export const RESPAWN_TICKS = fromMs(2500);
export const DECISION_MIN_TICKS = fromMs(500);
export const DECISION_MAX_TICKS = fromMs(1100);
export const ENEMY_REVERSE_CHANCE = 0.2;

/** A distance measured both ways: in cells across the board and in rows up and down it. */
export interface CellsAndRows {
  readonly cells: number;
  readonly rows: number;
}

/**
 * Where the pepper cloud appears and what it reaches, along the throw and across it: across the
 * board in cells, as measured on the original, and up and down it in rows, as the same distance
 * drawn.
 */
const reach = (units: number): CellsAndRows => ({ cells: fromPx(units), rows: rowsOf(units) });
export const PEPPER_CLOUD_OFFSET = reach(24);
export const PEPPER_CLOUD_LIFT = rowsOf(2);
export const PEPPER_REACH_ALONG = reach(44);
export const PEPPER_REACH_ACROSS = reach(26);

/** How tall an enemy is for a falling ingredient to crush it, in rows: as tall as it is drawn. */
export const ENEMY_HEIGHT = rowsOf(32);

export const CONTACT_X = fromPx(16);
export const CONTACT_Y = rowsOf(18);

export const START_LIVES = 3;
export const START_PEPPERS = 5;

export const SCORE = {
  ingredient: 50,
  burger: 400,
  squashBase: 100,
  riders: 500
} as const;

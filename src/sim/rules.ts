import type { IngredientKind } from './level/kinds';

export const TICKS_PER_SECOND = 60;
export const TICK_SECONDS = 1 / TICKS_PER_SECOND;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

/** Size of a cell in logical units: one character of the original screen at ×2, half a chef. */
export const CELL_UNITS = 16;
const fromPx = (pixels: number): number => pixels / CELL_UNITS;
const fromMs = (milliseconds: number): number =>
  Math.round((milliseconds * TICKS_PER_SECOND) / 1000);

export const CHEF_SPEED = fromPx(115);
export const CLIMB_SPEED = fromPx(80);
export const ENEMY_SPEED = fromPx(68);

export const ARRIVAL_THRESHOLD = fromPx(3);
export const EDGE_MARGIN = fromPx(12);
export const LADDER_GRAB_DISTANCE = fromPx(19.2);
export const STEP_OFF_DISTANCE = fromPx(12.8);

export const FALL_SPEED = fromPx(113);
export const BOUNCE_HEIGHT = fromPx(13);
export const BOUNCE_RISE_TICKS = fromMs(80);
export const BOUNCE_HOLD_TICKS = fromMs(220);
export const RIDER_STOP_TICKS = fromMs(270);
export const EXTRA_SUPPORTS_PER_RIDER = 2;

/** How thick each ingredient is: where the next one rests on it, on a floor or in a burger. */
export const INGREDIENT_THICKNESS: Readonly<Record<IngredientKind, number>> = {
  bunTop: fromPx(13),
  lettuce: fromPx(8),
  patty: fromPx(12),
  bunBottom: fromPx(11)
};

export const READY_TICKS = fromMs(1500);
export const DYING_TICKS = fromMs(2000);
export const LEVEL_CLEAR_TICKS = fromMs(3000);

export const STUN_TICKS = fromMs(5000);
export const RESPAWN_TICKS = fromMs(2500);
export const DECISION_MIN_TICKS = fromMs(500);
export const DECISION_MAX_TICKS = fromMs(1100);
export const ENEMY_REVERSE_CHANCE = 0.2;

export const PEPPER_CLOUD_OFFSET = fromPx(24);
export const PEPPER_CLOUD_LIFT = fromPx(2);
export const PEPPER_REACH_ALONG = fromPx(44);
export const PEPPER_REACH_ACROSS = fromPx(26);

/** How tall an enemy is for a falling ingredient to crush it. */
export const ENEMY_HEIGHT = fromPx(32);

export const CONTACT_X = fromPx(16);
export const CONTACT_Y = fromPx(18);

export const START_LIVES = 3;
export const START_PEPPERS = 5;

export const SCORE = {
  ingredient: 50,
  burger: 400,
  squashBase: 100,
  riders: 500
} as const;

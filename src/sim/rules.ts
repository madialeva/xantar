export const TICKS_PER_SECOND = 60;
export const TICK_SECONDS = 1 / TICKS_PER_SECOND;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

const POC_TILE_PX = 32;
const fromPx = (pixels: number): number => pixels / POC_TILE_PX;
const fromMs = (milliseconds: number): number =>
  Math.round((milliseconds * TICKS_PER_SECOND) / 1000);

export const CHEF_SPEED = fromPx(115);
export const CLIMB_SPEED = fromPx(80);
export const ENEMY_SPEED = fromPx(68);

export const ARRIVAL_THRESHOLD = fromPx(3);
export const EDGE_MARGIN = fromPx(12);
export const LADDER_GRAB_DISTANCE = 0.6;
export const STEP_OFF_DISTANCE = 0.4;

export const FALL_TICKS = fromMs(200);
export const FALL_STAGGER_TICKS = 7;

export const STUN_TICKS = fromMs(5000);
export const RESPAWN_TICKS = fromMs(2500);
export const DECISION_MIN_TICKS = fromMs(500);
export const DECISION_MAX_TICKS = fromMs(1100);
export const ENEMY_REVERSE_CHANCE = 0.2;

export const PEPPER_CLOUD_OFFSET = fromPx(24);
export const PEPPER_CLOUD_LIFT = fromPx(2);
export const PEPPER_REACH_X = fromPx(44);
export const PEPPER_REACH_Y = fromPx(26);

export const CONTACT_X = fromPx(16);
export const CONTACT_Y = fromPx(18);

export const START_LIVES = 3;
export const START_PEPPERS = 5;

export const SCORE = {
  ingredient: 50,
  burger: 400,
  squashBase: 100
} as const;

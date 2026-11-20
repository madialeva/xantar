import {
  EASY_PACE,
  HARD_PACE,
  LATE_PACE_FIRST_STEP,
  LATE_PACE_LEVEL,
  PACE_STEP_TICKS,
  PACE_STEPS
} from './rules';

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;

/** How hard a game is: it sets how fast the enemies go. */
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);

/** How fast the enemies go as a board is played (Strategy chosen by the difficulty). */
export interface EnemyPace {
  /** Factor over the enemies' speeds on `level` after `playTicks` ticks of play on its board. */
  factor(level: number, playTicks: number): number;
}

/** The same factor all the time, whatever the level and the time played. */
const steadyPace = (factor: number): EnemyPace => ({ factor: () => factor });

/**
 * The pace of the original: a step faster every `PACE_STEP_TICKS` of play, up to the last
 * step; boards of late levels start a few steps ahead.
 */
const risingPace: EnemyPace = {
  factor(level, playTicks) {
    const first = level >= LATE_PACE_LEVEL ? LATE_PACE_FIRST_STEP : 0;
    const step = first + Math.floor(Math.max(0, playTicks) / PACE_STEP_TICKS);
    return PACE_STEPS[Math.min(step, PACE_STEPS.length - 1)];
  }
};

const paces: Readonly<Record<Difficulty, EnemyPace>> = {
  easy: steadyPace(EASY_PACE),
  normal: risingPace,
  hard: steadyPace(HARD_PACE)
};

/** The enemies' pace on a difficulty (Factory). */
export const paceFor = (difficulty: Difficulty): EnemyPace => paces[difficulty];

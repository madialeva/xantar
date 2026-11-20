import type { EventSink } from './events';
import { START_LIVES, START_PEPPERS } from './rules';

export interface StatsSnapshot {
  readonly score: number;
  readonly lives: number;
  readonly peppers: number;
  readonly level: number;
  readonly combo: number;
}

/**
 * Score, lives, peppers, level and crush combo of the current game; announces score
 * changes as events.
 */
export class GameStats implements StatsSnapshot {
  readonly #events: EventSink;
  readonly #startLevel: number;
  #score = 0;
  #lives = START_LIVES;
  #peppers = START_PEPPERS;
  #level: number;
  #combo = 0;

  /** `startLevel` is the level a game starts on, the first one unless told otherwise. */
  constructor(events: EventSink, startLevel = 1) {
    this.#events = events;
    this.#startLevel = Math.max(1, Math.floor(startLevel));
    this.#level = this.#startLevel;
  }

  get score(): number {
    return this.#score;
  }

  get lives(): number {
    return this.#lives;
  }

  get peppers(): number {
    return this.#peppers;
  }

  get level(): number {
    return this.#level;
  }

  get combo(): number {
    return this.#combo;
  }

  addScore(points: number): void {
    this.#score += points;
    this.#events.emit({ type: 'scoreChanged', score: this.#score, delta: points });
  }

  registerCrush(basePoints: number): number {
    this.#combo += 1;
    const points = basePoints * this.#combo;
    this.addScore(points);
    return points;
  }

  /** Bonus for the enemies dropped riding an ingredient: doubles with each one; no combo. */
  registerRiders(basePoints: number, riders: number): number {
    const points = basePoints * 2 ** (riders - 1);
    this.addScore(points);
    return points;
  }

  consumePepper(): boolean {
    if (this.#peppers <= 0) return false;
    this.#peppers -= 1;
    return true;
  }

  grantPepper(): void {
    this.#peppers += 1;
  }

  loseLife(): void {
    this.#lives -= 1;
    this.#combo = 0;
  }

  advanceLevel(): void {
    this.#level += 1;
  }

  newGame(): void {
    this.#score = 0;
    this.#lives = START_LIVES;
    this.#peppers = START_PEPPERS;
    this.#level = this.#startLevel;
    this.#combo = 0;
  }
}

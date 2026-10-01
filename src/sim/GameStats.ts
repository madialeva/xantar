import type { EventSink } from './events';
import { START_LIVES, START_PEPPERS } from './rules';

export interface StatsSnapshot {
  readonly score: number;
  readonly lives: number;
  readonly peppers: number;
  readonly level: number;
  readonly combo: number;
}

export class GameStats implements StatsSnapshot {
  readonly #events: EventSink;
  #score = 0;
  #lives = START_LIVES;
  #peppers = START_PEPPERS;
  #level = 1;
  #combo = 0;

  constructor(events: EventSink) {
    this.#events = events;
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
    this.#level = 1;
    this.#combo = 0;
  }
}

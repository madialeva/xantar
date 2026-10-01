import { Chef, type ChefSnapshot } from './entities/Chef';
import { EventQueue, type SimEvent } from './events';
import { GameStats, type StatsSnapshot } from './GameStats';
import type { Level } from './level/Level';
import type { Rng } from './rng';
import type { SimInput } from './SimInput';

export type GameStatus = 'playing' | 'levelClear' | 'gameOver';

export interface SimulationOptions {
  readonly level: Level;
  readonly rng: Rng;
}

export class Simulation {
  readonly #level: Level;
  readonly #rng: Rng;
  readonly #events = new EventQueue();
  readonly #stats = new GameStats(this.#events);
  readonly #chef: Chef;
  #status: GameStatus = 'playing';

  constructor(options: SimulationOptions) {
    this.#level = options.level;
    this.#rng = options.rng;
    this.#chef = new Chef(options.level.chefStart.row, options.level.chefStart.x);
    this.startBoard();
  }

  get level(): Level {
    return this.#level;
  }

  get rng(): Rng {
    return this.#rng;
  }

  get status(): GameStatus {
    return this.#status;
  }

  get chef(): ChefSnapshot {
    return this.#chef;
  }

  get stats(): StatsSnapshot {
    return this.#stats;
  }

  step(input: SimInput): readonly SimEvent[] {
    if (this.#status !== 'playing') return this.#events.drain();
    this.#chef.beginTick();
    this.#chef.step(input, this.#level);
    return this.#events.drain();
  }

  startBoard(): void {
    const start = this.#level.chefStart;
    this.#chef.reset(start.row, start.x);
    this.#status = 'playing';
    this.#events.emit({ type: 'boardStarted' });
  }

  nextLevel(): void {
    if (this.#status !== 'levelClear') return;
    this.startBoard();
  }

  newGame(): void {
    this.#stats.newGame();
    this.startBoard();
  }
}

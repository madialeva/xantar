import type { GamePhaseName, StatsSnapshot } from '../../sim';

export interface SessionStats {
  readonly score: number;
  readonly lives: number;
  readonly peppers: number;
  readonly level: number;
}

/** What the HUD shows about the game in progress. */
export interface SessionState {
  readonly stats: SessionStats;
  readonly phase: GamePhaseName;
  readonly paused: boolean;
  readonly bestScore: number;
  readonly newRecord: boolean;
}

export type SessionRequest = 'pause' | 'resume' | 'quit';

type StateListener = (state: SessionState) => void;
type RequestListener = (request: SessionRequest) => void;

const INITIAL_STATS: SessionStats = { score: 0, lives: 0, peppers: 0, level: 1 };

const sameStats = (a: SessionStats, b: SessionStats): boolean =>
  a.score === b.score && a.lives === b.lives && a.peppers === b.peppers && a.level === b.level;

/**
 * Mediator between the board scene and the HUD scene (Observer): the board publishes the
 * state of the game, the HUD listens to it and sends back pause, resume and quit requests.
 */
export class GameSession {
  readonly #stateListeners = new Set<StateListener>();
  readonly #requestListeners = new Set<RequestListener>();
  #savedBest = 0;
  #state: SessionState = {
    stats: INITIAL_STATS,
    phase: 'ready',
    paused: false,
    bestScore: 0,
    newRecord: false
  };

  get state(): SessionState {
    return this.#state;
  }

  start(savedBest: number): void {
    this.#savedBest = savedBest;
    this.#set({
      stats: INITIAL_STATS,
      phase: 'ready',
      paused: false,
      bestScore: savedBest,
      newRecord: false
    });
  }

  update(stats: StatsSnapshot, phase: GamePhaseName): void {
    const next: SessionStats = {
      score: stats.score,
      lives: Math.max(0, stats.lives),
      peppers: stats.peppers,
      level: stats.level
    };
    if (sameStats(next, this.#state.stats) && phase === this.#state.phase) return;
    this.#set({
      ...this.#state,
      stats: next,
      phase,
      bestScore: Math.max(this.#savedBest, next.score)
    });
  }

  setPaused(paused: boolean): void {
    if (paused !== this.#state.paused) this.#set({ ...this.#state, paused });
  }

  markNewRecord(): void {
    if (!this.#state.newRecord) this.#set({ ...this.#state, newRecord: true });
  }

  request(request: SessionRequest): void {
    for (const listener of [...this.#requestListeners]) listener(request);
  }

  onState(listener: StateListener): () => void {
    this.#stateListeners.add(listener);
    return () => this.#stateListeners.delete(listener);
  }

  onRequest(listener: RequestListener): () => void {
    this.#requestListeners.add(listener);
    return () => this.#requestListeners.delete(listener);
  }

  #set(state: SessionState): void {
    this.#state = state;
    for (const listener of [...this.#stateListeners]) listener(state);
  }
}

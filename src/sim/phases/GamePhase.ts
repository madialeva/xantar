import type { SimInput } from '../SimInput';

export type GamePhaseName = 'ready' | 'playing' | 'dying' | 'levelClear' | 'gameOver';

export type PlayOutcome = 'continue' | 'chefHit' | 'levelCleared';

/**
 * What the phases need from the simulation, so they drive the game without knowing its
 * entities.
 */
export interface PhaseHost {
  readonly livesLeft: number;
  playTick(input: SimInput): PlayOutcome;
  respawn(): void;
  rebuildBoard(): void;
  endGame(): void;
}

/** One phase of a game (State pattern): advances a tick and returns the phase that follows. */
export interface GamePhase {
  readonly name: GamePhaseName;
  step(input: SimInput, host: PhaseHost): GamePhase;
}

import type { SimInput } from '../SimInput';

export type GamePhaseName = 'ready' | 'playing' | 'dying' | 'levelClear' | 'gameOver';

export type PlayOutcome = 'continue' | 'chefHit' | 'chefReprieved' | 'levelCleared';

/** How a tick goes while the chef lies caught on a board the falls under way will win. */
export type ReprieveOutcome = 'falling' | 'levelCleared' | 'stalled';

/**
 * What the phases need from the simulation, so they drive the game without knowing its
 * entities.
 */
export interface PhaseHost {
  readonly livesLeft: number;
  playTick(input: SimInput): PlayOutcome;
  /** Moves only the falls (and the enemies riding them) while the caught chef waits. */
  reprieveTick(): ReprieveOutcome;
  /** Takes the life the chef was spared, when the falls stop short of winning the board. */
  forfeitLife(): void;
  respawn(): void;
  rebuildBoard(): void;
  endGame(): void;
}

/** One phase of a game (State pattern): advances a tick and returns the phase that follows. */
export interface GamePhase {
  readonly name: GamePhaseName;
  step(input: SimInput, host: PhaseHost): GamePhase;
}

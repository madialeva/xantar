import { DYING_TICKS, LEVEL_CLEAR_TICKS, READY_TICKS } from '../rules';
import type { SimInput } from '../SimInput';
import type { GamePhase, PhaseHost } from './GamePhase';

/** Countdown before play starts on a new board or after losing a life; nothing moves. */
export class ReadyPhase implements GamePhase {
  readonly name = 'ready';
  #ticksLeft = READY_TICKS;

  step(): GamePhase {
    this.#ticksLeft -= 1;
    return this.#ticksLeft > 0 ? this : new PlayingPhase();
  }
}

/** Normal play: the world advances until the chef is hit or the level is cleared. */
export class PlayingPhase implements GamePhase {
  readonly name = 'playing';

  step(input: SimInput, host: PhaseHost): GamePhase {
    switch (host.playTick(input)) {
      case 'chefHit':
        return new DyingPhase();
      case 'chefReprieved':
        return new ReprievePhase();
      case 'levelCleared':
        return new LevelClearPhase();
      case 'continue':
        return this;
    }
  }
}

/** The chef has been hit: everything stops, then play resumes or the game ends. */
export class DyingPhase implements GamePhase {
  readonly name = 'dying';
  #ticksLeft = DYING_TICKS;

  step(_input: SimInput, host: PhaseHost): GamePhase {
    this.#ticksLeft -= 1;
    if (this.#ticksLeft > 0) return this;
    if (host.livesLeft > 0) {
      host.respawn();
      return new ReadyPhase();
    }
    host.endGame();
    return new GameOverPhase();
  }
}

/**
 * The chef was caught on a board the falls under way will win, as in the original: he lies
 * down (it looks like `dying`) while only the falls go on, and gets up for the level clear in
 * the tick the last burger is done, keeping his life.
 */
export class ReprievePhase implements GamePhase {
  readonly name = 'dying';

  step(_input: SimInput, host: PhaseHost): GamePhase {
    switch (host.reprieveTick()) {
      case 'levelCleared':
        return new LevelClearPhase();
      case 'stalled':
        host.forfeitLife();
        return new DyingPhase();
      case 'falling':
        return this;
    }
  }
}

/** Every burger is done: a short pause, skippable with confirm, before the next board. */
export class LevelClearPhase implements GamePhase {
  readonly name = 'levelClear';
  #ticksLeft = LEVEL_CLEAR_TICKS;

  step(input: SimInput, host: PhaseHost): GamePhase {
    this.#ticksLeft -= 1;
    if (this.#ticksLeft > 0 && !input.confirm) return this;
    host.rebuildBoard();
    return new ReadyPhase();
  }
}

/** The last life is lost; nothing happens until a new game is requested. */
export class GameOverPhase implements GamePhase {
  readonly name = 'gameOver';

  step(): GamePhase {
    return this;
  }
}

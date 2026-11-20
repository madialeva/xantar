import { describe, expect, it } from 'vitest';
import { DYING_TICKS, LEVEL_CLEAR_TICKS, READY_TICKS } from '../rules';
import { NO_INPUT, type SimInput } from '../SimInput';
import type { GamePhase, PhaseHost, PlayOutcome, ReprieveOutcome } from './GamePhase';
import {
  DyingPhase,
  GameOverPhase,
  LevelClearPhase,
  PlayingPhase,
  ReadyPhase,
  ReprievePhase
} from './phases';

class FakeHost implements PhaseHost {
  livesLeft = 2;
  outcome: PlayOutcome = 'continue';
  reprieve: ReprieveOutcome = 'falling';
  readonly calls: string[] = [];

  playTick(): PlayOutcome {
    this.calls.push('play');
    return this.outcome;
  }

  reprieveTick(): ReprieveOutcome {
    this.calls.push('falls');
    return this.reprieve;
  }

  forfeitLife(): void {
    this.calls.push('forfeit');
  }

  respawn(): void {
    this.calls.push('respawn');
  }

  rebuildBoard(): void {
    this.calls.push('rebuild');
  }

  endGame(): void {
    this.calls.push('end');
  }
}

const advance = (phase: GamePhase, host: PhaseHost, ticks: number, input: SimInput = NO_INPUT) => {
  let current = phase;
  for (let i = 0; i < ticks; i++) current = current.step(input, host);
  return current;
};

describe('game phases', () => {
  it('gets ready for the ready ticks without playing, then plays', () => {
    const host = new FakeHost();
    const phase = advance(new ReadyPhase(), host, READY_TICKS - 1);
    expect(phase.name).toBe('ready');
    expect(advance(phase, host, 1).name).toBe('playing');
    expect(host.calls).toEqual([]);
  });

  it('plays a tick and moves on according to its outcome', () => {
    const host = new FakeHost();
    const playing = new PlayingPhase();
    expect(playing.step(NO_INPUT, host)).toBe(playing);
    host.outcome = 'chefHit';
    expect(playing.step(NO_INPUT, host).name).toBe('dying');
    host.outcome = 'chefReprieved';
    const reprieve = playing.step(NO_INPUT, host);
    expect([reprieve.name, reprieve instanceof ReprievePhase]).toEqual(['dying', true]);
    host.outcome = 'levelCleared';
    expect(playing.step(NO_INPUT, host).name).toBe('levelClear');
    expect(host.calls).toEqual(['play', 'play', 'play', 'play']);
  });

  it('lets the falls finish a won board while the caught chef lies down, however long', () => {
    const host = new FakeHost();
    const phase = advance(new ReprievePhase(), host, DYING_TICKS * 3);
    expect([phase.name, phase instanceof ReprievePhase]).toEqual(['dying', true]);
    host.reprieve = 'levelCleared';
    expect(advance(phase, host, 1).name).toBe('levelClear');
    expect(host.calls).toHaveLength(DYING_TICKS * 3 + 1);
    expect(host.calls.every((call) => call === 'falls')).toBe(true);
  });

  it('takes the spared life and dies as usual if the falls stop short of the board', () => {
    const host = new FakeHost();
    host.reprieve = 'stalled';
    const phase = advance(new ReprievePhase(), host, 1);
    expect([phase.name, phase instanceof DyingPhase, host.calls]).toEqual([
      'dying',
      true,
      ['falls', 'forfeit']
    ]);
    expect(advance(phase, host, DYING_TICKS).name).toBe('ready');
  });

  it('respawns and gets ready after dying with lives left', () => {
    const host = new FakeHost();
    const phase = advance(new DyingPhase(), host, DYING_TICKS - 1);
    expect([phase.name, host.calls]).toEqual(['dying', []]);
    expect(advance(phase, host, 1).name).toBe('ready');
    expect(host.calls).toEqual(['respawn']);
  });

  it('ends the game after dying without lives', () => {
    const host = new FakeHost();
    host.livesLeft = 0;
    expect(advance(new DyingPhase(), host, DYING_TICKS).name).toBe('gameOver');
    expect(host.calls).toEqual(['end']);
  });

  it('rebuilds the board after the level clear pause, or at once on confirm', () => {
    const host = new FakeHost();
    const waiting = advance(new LevelClearPhase(), host, LEVEL_CLEAR_TICKS - 1);
    expect(waiting.name).toBe('levelClear');
    expect(advance(waiting, host, 1).name).toBe('ready');
    const skipped = new LevelClearPhase().step({ ...NO_INPUT, confirm: true }, host);
    expect(skipped.name).toBe('ready');
    expect(host.calls).toEqual(['rebuild', 'rebuild']);
  });

  it('stays over until a new game is requested', () => {
    const host = new FakeHost();
    const over = new GameOverPhase();
    expect(advance(over, host, 100, { ...NO_INPUT, confirm: true })).toBe(over);
    expect(host.calls).toEqual([]);
  });
});

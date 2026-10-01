import { describe, expect, it } from 'vitest';
import { EventQueue } from './events';
import { GameStats } from './GameStats';
import { START_LIVES, START_PEPPERS } from './rules';

const create = (): { stats: GameStats; events: EventQueue } => {
  const events = new EventQueue();
  return { stats: new GameStats(events), events };
};

describe('GameStats', () => {
  it('starts with the initial lives and peppers', () => {
    const { stats } = create();
    expect([stats.score, stats.lives, stats.peppers, stats.level, stats.combo]).toEqual([
      0,
      START_LIVES,
      START_PEPPERS,
      1,
      0
    ]);
  });

  it('adds score and reports the change', () => {
    const { stats, events } = create();
    stats.addScore(50);
    stats.addScore(50);
    expect(stats.score).toBe(100);
    expect(events.drain()).toEqual([
      { type: 'scoreChanged', score: 50, delta: 50 },
      { type: 'scoreChanged', score: 100, delta: 50 }
    ]);
  });

  it('multiplies consecutive crushes by the combo', () => {
    const { stats } = create();
    expect(stats.registerCrush(100)).toBe(100);
    expect(stats.registerCrush(100)).toBe(200);
    expect(stats.combo).toBe(2);
    expect(stats.score).toBe(300);
  });

  it('consumes peppers until none is left', () => {
    const { stats } = create();
    for (let i = 0; i < START_PEPPERS; i++) expect(stats.consumePepper()).toBe(true);
    expect(stats.consumePepper()).toBe(false);
    expect(stats.peppers).toBe(0);
  });

  it('grants an extra pepper', () => {
    const { stats } = create();
    stats.grantPepper();
    expect(stats.peppers).toBe(START_PEPPERS + 1);
  });

  it('loses a life and resets the combo', () => {
    const { stats } = create();
    stats.registerCrush(100);
    stats.loseLife();
    expect(stats.lives).toBe(START_LIVES - 1);
    expect(stats.combo).toBe(0);
  });

  it('advances the level without touching the rest', () => {
    const { stats } = create();
    stats.addScore(10);
    stats.advanceLevel();
    expect([stats.level, stats.score]).toEqual([2, 10]);
  });

  it('restarts everything for a new game', () => {
    const { stats } = create();
    stats.addScore(500);
    stats.loseLife();
    stats.consumePepper();
    stats.advanceLevel();
    stats.newGame();
    expect([stats.score, stats.lives, stats.peppers, stats.level, stats.combo]).toEqual([
      0,
      START_LIVES,
      START_PEPPERS,
      1,
      0
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { GameSession, type SessionRequest, type SessionState } from './GameSession';

const stats = (score: number, lives = 3) => ({ score, lives, peppers: 5, level: 1, combo: 0 });

describe('GameSession', () => {
  it('starts each game with the saved best score and tells its listeners', () => {
    const session = new GameSession();
    const states: SessionState[] = [];
    session.onState((state) => states.push(state));
    session.start(8000);
    expect(states.at(-1)).toMatchObject({ phase: 'ready', paused: false, bestScore: 8000 });
  });

  it('only notifies when the stats or the phase change', () => {
    const session = new GameSession();
    session.start(0);
    let count = 0;
    session.onState(() => count++);
    session.update(stats(0), 'ready');
    session.update(stats(0), 'ready');
    session.update(stats(0), 'ready');
    session.update(stats(50), 'playing');
    expect(count).toBe(2);
  });

  it('shows the score as the best one live once it beats the saved best', () => {
    const session = new GameSession();
    session.start(100);
    session.update(stats(80), 'playing');
    expect(session.state.bestScore).toBe(100);
    session.update(stats(150), 'playing');
    expect(session.state.bestScore).toBe(150);
  });

  it('never shows negative lives', () => {
    const session = new GameSession();
    session.start(0);
    session.update(stats(0, -1), 'gameOver');
    expect(session.state.stats.lives).toBe(0);
  });

  it('passes pause, resume and quit requests to their listeners until they unsubscribe', () => {
    const session = new GameSession();
    const heard: SessionRequest[] = [];
    const unsubscribe = session.onRequest((request) => heard.push(request));
    session.request('pause');
    session.request('resume');
    unsubscribe();
    session.request('quit');
    expect(heard).toEqual(['pause', 'resume']);
  });

  it('keeps the paused flag and the new record mark in its state', () => {
    const session = new GameSession();
    session.start(0);
    session.setPaused(true);
    session.markNewRecord();
    expect(session.state).toMatchObject({ paused: true, newRecord: true });
    session.start(0);
    expect(session.state).toMatchObject({ paused: false, newRecord: false });
  });
});

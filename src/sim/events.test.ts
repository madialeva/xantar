import { describe, expect, it } from 'vitest';
import { EventQueue, type SimEvent } from './events';

describe('EventQueue', () => {
  it('accumulates emitted events in order', () => {
    const queue = new EventQueue();
    const first: SimEvent = { type: 'boardStarted' };
    const second: SimEvent = { type: 'scoreChanged', score: 50, delta: 50 };
    queue.emit(first);
    queue.emit(second);
    expect(queue.drain()).toEqual([first, second]);
  });

  it('is empty after draining', () => {
    const queue = new EventQueue();
    queue.emit({ type: 'gameOver' });
    queue.drain();
    expect(queue.drain()).toEqual([]);
  });

  it('returns an empty list when nothing happened', () => {
    expect(new EventQueue().drain()).toEqual([]);
  });

  it('does not alter a list that was already drained', () => {
    const queue = new EventQueue();
    queue.emit({ type: 'boardStarted' });
    const drained = queue.drain();
    queue.emit({ type: 'gameOver' });
    expect(drained).toEqual([{ type: 'boardStarted' }]);
  });
});

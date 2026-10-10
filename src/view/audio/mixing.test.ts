import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../../sim';
import { CueThrottle, busGain, eventCue } from './mixing';

describe('busGain', () => {
  it('goes from silence to full on a curve', () => {
    expect(busGain(0)).toBe(0);
    expect(busGain(10)).toBe(1);
    expect(busGain(5)).toBeCloseTo(0.25);
    expect(busGain(-3)).toBe(0);
    expect(busGain(12)).toBe(1);
  });
});

describe('eventCue', () => {
  it('gives each game event its sound', () => {
    const cases: [SimEvent, string | null][] = [
      [{ type: 'pepperThrown', x: 1, y: 1, direction: 1 }, 'pepper'],
      [{ type: 'segmentStomped', ingredientId: 1, segment: 0 }, 'step'],
      [{ type: 'ingredientsTriggered', ingredientIds: [1] }, 'fall'],
      [{ type: 'ingredientLanded', ingredientId: 1, plateId: null, stackSlot: null }, 'land'],
      [{ type: 'enemySquashed', enemyId: 1, x: 0, y: 0, points: 100, combo: 1 }, 'squash'],
      [{ type: 'enemyStunned', enemyId: 1 }, 'stun'],
      [{ type: 'burgerDone', plateId: 1, points: 400 }, 'burger'],
      [{ type: 'chefHit', livesLeft: 2 }, 'hit'],
      [{ type: 'levelCleared', level: 1 }, 'levelClear'],
      [{ type: 'gameOver' }, 'gameOver'],
      [{ type: 'phaseChanged', from: 'dying', to: 'ready' }, 'ready'],
      [{ type: 'phaseChanged', from: 'ready', to: 'playing' }, null],
      [{ type: 'boardStarted' }, null],
      [{ type: 'enemyRespawned', enemyId: 1, x: 0, y: 0 }, null],
      [{ type: 'scoreChanged', score: 50, delta: 50 }, null]
    ];
    for (const [event, cue] of cases) expect(eventCue(event)).toBe(cue);
  });
});

describe('CueThrottle', () => {
  it('drops a cue repeated within its interval', () => {
    let now = 0;
    const throttle = new CueThrottle({ land: 60 }, () => now);
    expect([throttle.allow('land'), throttle.allow('land'), throttle.allow('land')]).toEqual([
      true,
      false,
      false
    ]);
    expect(throttle.allow('burger')).toBe(true);
    now = 59;
    expect(throttle.allow('land')).toBe(false);
    now = 60;
    expect(throttle.allow('land')).toBe(true);
  });

  it('never throttles cues without an interval', () => {
    const throttle = new CueThrottle({}, () => 0);
    expect([throttle.allow('hit'), throttle.allow('hit')]).toEqual([true, true]);
  });
});

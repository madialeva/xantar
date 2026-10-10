import type { SimEvent, SimEventType } from '../../sim';
import { MAX_VOLUME } from '../../settings/PlayerSettings';
import type { SoundCue } from './synth/soundCues';

/** The gain of a volume level from 0 to 10, on a curve that sounds even to the ear. */
export const busGain = (level: number): number => {
  const share = Math.max(0, Math.min(MAX_VOLUME, level)) / MAX_VOLUME;
  return share * share;
};

type CueOf<T extends SimEventType> = (event: Extract<SimEvent, { type: T }>) => SoundCue | null;

/** The sound of each simulation event, or none. */
const EVENT_CUES: { readonly [T in SimEventType]: CueOf<T> } = {
  pepperThrown: () => 'pepper',
  segmentStomped: () => 'step',
  ingredientsTriggered: () => 'fall',
  ingredientLanded: () => 'land',
  enemySquashed: () => 'squash',
  enemyStunned: () => 'stun',
  burgerDone: () => 'burger',
  chefHit: () => 'hit',
  levelCleared: () => 'levelClear',
  gameOver: () => 'gameOver',
  phaseChanged: (event) => (event.to === 'ready' ? 'ready' : null),
  boardStarted: () => null,
  enemyRespawned: () => null,
  scoreChanged: () => null
};

/** The sound effect a simulation event makes, if any. */
export function eventCue(event: SimEvent): SoundCue | null {
  return (EVENT_CUES[event.type] as CueOf<typeof event.type>)(event);
}

/** Shortest time between two plays of the same cue, for the ones that come in bursts. */
export const CUE_INTERVALS_MS: Partial<Record<SoundCue, number>> = {
  step: 60,
  land: 60,
  fall: 80,
  squash: 60,
  menuMove: 40
};

/**
 * Lets a cue play only if the same cue has not played too recently, so a burst of events
 * (several ingredients landing at once) does not pile copies of the same sound.
 */
export class CueThrottle {
  readonly #intervals: Partial<Record<SoundCue, number>>;
  readonly #now: () => number;
  readonly #last = new Map<SoundCue, number>();

  constructor(intervals: Partial<Record<SoundCue, number>>, now: () => number) {
    this.#intervals = intervals;
    this.#now = now;
  }

  allow(cue: SoundCue): boolean {
    const interval = this.#intervals[cue] ?? 0;
    const now = this.#now();
    const last = this.#last.get(cue);
    if (last !== undefined && now - last < interval) return false;
    this.#last.set(cue, now);
    return true;
  }
}

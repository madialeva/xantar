import type { SimEvent } from '../../sim';
import { eventCue } from './mixing';
import type { SoundCue } from './synth/soundCues';

/** Something that plays sound effects, such as GameAudio. */
export interface CuePlayer {
  cue(cue: SoundCue): void;
}

/** Turns the events of a frame into sound effects, as EventEffects turns them into visuals. */
export class EventSounds {
  readonly #player: CuePlayer;

  constructor(player: CuePlayer) {
    this.#player = player;
  }

  play(events: readonly SimEvent[]): void {
    for (const event of events) {
      const cue = eventCue(event);
      if (cue) this.#player.cue(cue);
    }
  }
}

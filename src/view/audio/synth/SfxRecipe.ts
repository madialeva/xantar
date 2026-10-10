/** The shape of a tone's wave; `noise` is random values held at the tone's frequency. */
export type Waveform = 'square' | 'triangle' | 'saw' | 'sine' | 'noise';

/**
 * One tone of a sound effect: a wave whose frequency slides from `from` to `to` (Hz) with an
 * attack, sustain and decay envelope (seconds). Several tones, each with its own `start`,
 * make a chord or a jingle.
 */
export interface Tone {
  readonly wave: Waveform;
  /** Seconds from the start of the effect. */
  readonly start?: number;
  readonly attack: number;
  readonly sustain: number;
  readonly decay: number;
  readonly from: number;
  readonly to?: number;
  /** Share of the period the square wave is high, from 0 to 1. */
  readonly duty?: number;
  /** A wobble of the frequency: `depth` as a share of it, `rate` in Hz. */
  readonly vibrato?: { readonly depth: number; readonly rate: number };
  readonly volume?: number;
}

/** A sound effect described as data, rendered by `renderRecipe`. */
export interface SfxRecipe {
  readonly tones: readonly Tone[];
  readonly volume?: number;
  /** Seed of the noise, so the same recipe always sounds the same. */
  readonly seed?: number;
}

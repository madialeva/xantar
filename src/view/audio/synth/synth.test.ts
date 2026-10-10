import { describe, expect, it } from 'vitest';
import { MAX_SFX_SECONDS, recipeDuration, renderRecipe } from './renderRecipe';
import { CUE_RECIPES, SOUND_CUES } from './soundCues';

const RATE = 44100;

const peak = (samples: Float32Array): number =>
  samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);

describe('renderRecipe', () => {
  it('renders the same samples every time', () => {
    for (const cue of SOUND_CUES) {
      expect(renderRecipe(CUE_RECIPES[cue], RATE)).toEqual(renderRecipe(CUE_RECIPES[cue], RATE));
    }
  });

  it.each(SOUND_CUES)('renders %s audible, within range, short and ending in silence', (cue) => {
    const samples = renderRecipe(CUE_RECIPES[cue], RATE);
    expect(samples.length).toBe(Math.ceil(recipeDuration(CUE_RECIPES[cue]) * RATE));
    expect(samples.length / RATE).toBeLessThanOrEqual(MAX_SFX_SECONDS);
    expect(peak(samples)).toBeGreaterThan(0.05);
    expect(peak(samples)).toBeLessThanOrEqual(1);
    expect(peak(samples.subarray(samples.length - 100))).toBeLessThan(0.001);
  });

  it('keeps loud mixes within [-1, 1]', () => {
    const loud = {
      volume: 4,
      tones: [{ wave: 'square', attack: 0.001, sustain: 0.1, decay: 0.01, from: 440 } as const]
    };
    const samples = renderRecipe(loud, RATE);
    expect(peak(samples)).toBe(1);
  });

  it('refuses effects longer than the limit', () => {
    const long = {
      tones: [{ wave: 'sine', attack: 0, sustain: 3.5, decay: 0, from: 440 } as const]
    };
    expect(() => renderRecipe(long, RATE)).toThrow(/over 3 s/);
  });

  it('places each tone at its start', () => {
    const late = {
      tones: [
        { wave: 'sine', start: 0.5, attack: 0.01, sustain: 0.1, decay: 0.01, from: 440 } as const
      ]
    };
    const samples = renderRecipe(late, RATE);
    expect(peak(samples.subarray(0, Math.floor(0.49 * RATE)))).toBe(0);
    expect(peak(samples.subarray(Math.floor(0.52 * RATE)))).toBeGreaterThan(0.5);
  });
});

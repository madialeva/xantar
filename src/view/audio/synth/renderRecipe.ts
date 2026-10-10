import type { SfxRecipe, Tone, Waveform } from './SfxRecipe';

export const MAX_SFX_SECONDS = 3;

/** Silence kept after the last tone, so the effect never ends on a click. */
const TAIL_SECONDS = 0.02;

const toneEnd = (tone: Tone): number => (tone.start ?? 0) + tone.attack + tone.sustain + tone.decay;

/** How long a recipe sounds, in seconds, including its silent tail. */
export const recipeDuration = (recipe: SfxRecipe): number =>
  Math.max(0, ...recipe.tones.map(toneEnd)) + TAIL_SECONDS;

/** A small linear congruential generator: noise that is the same on every render. */
function noiseSource(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

const oscillate = (wave: Exclude<Waveform, 'noise'>, phase: number, duty: number): number => {
  switch (wave) {
    case 'square':
      return phase < duty ? 1 : -1;
    case 'triangle':
      return 1 - 4 * Math.abs(phase - 0.5);
    case 'saw':
      return 2 * phase - 1;
    case 'sine':
      return Math.sin(2 * Math.PI * phase);
  }
};

const envelope = (tone: Tone, t: number): number => {
  if (t < 0) return 0;
  if (t < tone.attack) return t / tone.attack;
  const afterAttack = t - tone.attack;
  if (afterAttack < tone.sustain) return 1;
  const intoDecay = afterAttack - tone.sustain;
  if (intoDecay >= tone.decay) return 0;
  const left = 1 - intoDecay / tone.decay;
  return left * left;
};

function addTone(samples: Float32Array, tone: Tone, sampleRate: number, seed: number): void {
  const first = Math.floor((tone.start ?? 0) * sampleRate);
  const length = Math.ceil((tone.attack + tone.sustain + tone.decay) * sampleRate);
  const to = tone.to ?? tone.from;
  const duty = tone.duty ?? 0.5;
  const volume = tone.volume ?? 1;
  const duration = length / sampleRate;
  const noise = noiseSource(seed);
  let phase = 0;
  let held = noise();
  for (let i = 0; i < length && first + i < samples.length; i++) {
    const t = i / sampleRate;
    let frequency = tone.from * (to / tone.from) ** (duration > 0 ? t / duration : 0);
    if (tone.vibrato) {
      frequency *= 1 + tone.vibrato.depth * Math.sin(2 * Math.PI * tone.vibrato.rate * t);
    }
    phase += frequency / sampleRate;
    if (phase >= 1) {
      phase -= Math.floor(phase);
      held = noise();
    }
    const value = tone.wave === 'noise' ? held : oscillate(tone.wave, phase, duty);
    samples[first + i] += value * envelope(tone, t) * volume;
  }
}

/**
 * Renders a recipe to mono samples in [-1, 1] at `sampleRate`. Pure and deterministic: the
 * same recipe and rate always give the same samples.
 */
export function renderRecipe(recipe: SfxRecipe, sampleRate: number): Float32Array<ArrayBuffer> {
  const seconds = recipeDuration(recipe);
  if (seconds > MAX_SFX_SECONDS) {
    throw new Error(`A sound effect lasts ${seconds.toFixed(2)} s, over ${MAX_SFX_SECONDS} s`);
  }
  const samples = new Float32Array(Math.ceil(seconds * sampleRate));
  const seed = recipe.seed ?? 1;
  recipe.tones.forEach((tone, index) => addTone(samples, tone, sampleRate, seed + index));
  const volume = recipe.volume ?? 1;
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.max(-1, Math.min(1, samples[i] * volume));
  }
  return samples;
}

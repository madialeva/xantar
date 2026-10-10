import type { SfxRecipe, Tone } from './SfxRecipe';

/** Every sound effect of the game, by what it signals. */
export const SOUND_CUES = [
  'pepper',
  'step',
  'fall',
  'land',
  'squash',
  'stun',
  'burger',
  'hit',
  'ready',
  'levelClear',
  'gameOver',
  'menuMove',
  'menuSelect',
  'menuBack'
] as const;

export type SoundCue = (typeof SOUND_CUES)[number];

/** A short square-wave note of a jingle. */
const note = (from: number, start: number, length = 0.08, volume = 1): Tone => ({
  wave: 'square',
  duty: 0.25,
  start,
  attack: 0.005,
  sustain: length,
  decay: 0.06,
  from,
  volume
});

/** A soft triangle note under a jingle. */
const bass = (from: number, start: number, length: number): Tone => ({
  wave: 'triangle',
  start,
  attack: 0.01,
  sustain: length,
  decay: 0.1,
  from,
  volume: 0.8
});

/** The sound of each cue, as arcade-style synthesis recipes (tune them by ear here). */
export const CUE_RECIPES: Readonly<Record<SoundCue, SfxRecipe>> = {
  pepper: {
    volume: 0.45,
    tones: [
      { wave: 'noise', attack: 0.005, sustain: 0.05, decay: 0.2, from: 6000, to: 1500 },
      {
        wave: 'square',
        duty: 0.5,
        attack: 0.002,
        sustain: 0.02,
        decay: 0.05,
        from: 900,
        to: 600,
        volume: 0.4
      }
    ]
  },
  step: {
    volume: 0.22,
    tones: [
      { wave: 'square', duty: 0.25, attack: 0.002, sustain: 0.01, decay: 0.04, from: 240, to: 170 }
    ]
  },
  fall: {
    volume: 0.35,
    tones: [{ wave: 'triangle', attack: 0.01, sustain: 0.05, decay: 0.32, from: 900, to: 220 }]
  },
  land: {
    volume: 0.7,
    tones: [
      { wave: 'sine', attack: 0.002, sustain: 0.03, decay: 0.16, from: 150, to: 55 },
      { wave: 'noise', attack: 0.002, sustain: 0.01, decay: 0.08, from: 900, to: 300, volume: 0.35 }
    ]
  },
  squash: {
    volume: 0.5,
    tones: [
      { wave: 'square', duty: 0.5, attack: 0.002, sustain: 0.04, decay: 0.22, from: 320, to: 70 },
      { wave: 'noise', attack: 0.002, sustain: 0.03, decay: 0.12, from: 2000, to: 400, volume: 0.5 }
    ]
  },
  stun: {
    volume: 0.3,
    tones: [
      {
        wave: 'triangle',
        attack: 0.01,
        sustain: 0.25,
        decay: 0.2,
        from: 720,
        vibrato: { depth: 0.08, rate: 18 }
      }
    ]
  },
  burger: {
    volume: 0.32,
    tones: [note(523, 0), note(659, 0.08), note(784, 0.16), note(1047, 0.24, 0.16)]
  },
  hit: {
    volume: 0.4,
    tones: [
      {
        wave: 'saw',
        attack: 0.005,
        sustain: 0.1,
        decay: 0.5,
        from: 620,
        to: 90,
        vibrato: { depth: 0.05, rate: 12 }
      }
    ]
  },
  ready: {
    volume: 0.3,
    tones: [note(392, 0, 0.1), note(523, 0.14, 0.18)]
  },
  levelClear: {
    volume: 0.3,
    tones: [
      note(392, 0),
      note(523, 0.1),
      note(659, 0.2),
      note(784, 0.3),
      note(1047, 0.4, 0.1),
      note(1319, 0.55, 0.35),
      bass(131, 0, 0.35),
      bass(196, 0.4, 0.45)
    ]
  },
  gameOver: {
    volume: 0.32,
    tones: [
      note(392, 0, 0.18),
      note(349, 0.25, 0.18),
      note(311, 0.5, 0.18),
      note(262, 0.75, 0.55),
      bass(98, 0, 0.6),
      bass(65, 0.75, 0.55)
    ]
  },
  menuMove: {
    volume: 0.18,
    tones: [{ wave: 'square', duty: 0.25, attack: 0.002, sustain: 0.02, decay: 0.04, from: 660 }]
  },
  menuSelect: {
    volume: 0.22,
    tones: [note(660, 0, 0.04), note(990, 0.05, 0.06)]
  },
  menuBack: {
    volume: 0.2,
    tones: [
      { wave: 'square', duty: 0.25, attack: 0.002, sustain: 0.03, decay: 0.06, from: 520, to: 360 }
    ]
  }
};

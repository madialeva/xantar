import type { AudioBus } from '../../settings/PlayerSettings';
import type { UiSounds } from '../ui/UiSounds';
import { CUE_INTERVALS_MS, CueThrottle, busGain } from './mixing';
import type { SoundCue } from './synth/soundCues';

/** The key of the title and menu music in Phaser's audio cache. */
export const TITLE_MUSIC = 'music.title';

/** The part of a Phaser sound the audio uses. */
export interface SoundHandle {
  play(): boolean;
  stop(): boolean;
  setVolume(value: number): unknown;
  once(event: 'complete', callback: () => void): unknown;
  destroy(): void;
}

/** The part of Phaser's sound manager the audio uses. */
export interface SoundSystem {
  readonly locked: boolean;
  add(key: string, config: { loop?: boolean; volume?: number }): SoundHandle;
  setMute(muted: boolean): unknown;
}

/** The sound levels the player chose. */
export interface AudioLevels {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly muted: boolean;
}

interface Playing {
  readonly key: string;
  readonly sound: SoundHandle;
}

/**
 * The game's audio on top of Phaser's sound manager: a music bus and an effects bus with their
 * own volume (Phaser only has a master volume, so the buses scale each sound), global mute,
 * and the synthesized effects. Works before Phaser is ready: music asked for early starts
 * when the sound manager is attached.
 */
export class GameAudio {
  readonly ui: UiSounds = {
    move: () => this.cue('menuMove'),
    select: () => this.cue('menuSelect'),
    back: () => this.cue('menuBack')
  };

  readonly #throttle: CueThrottle;
  readonly #effects = new Set<SoundHandle>();
  #system: SoundSystem | null = null;
  #cues: ReadonlySet<SoundCue> = new Set();
  #levels: AudioLevels;
  #music: Playing | null = null;
  #wantedMusic: string | null = null;

  constructor(levels: AudioLevels, now: () => number) {
    this.#levels = levels;
    this.#throttle = new CueThrottle(CUE_INTERVALS_MS, now);
  }

  /** Connects the sound manager, with the effects registered in its cache. */
  attach(system: SoundSystem, cues: Iterable<SoundCue>): void {
    this.#system = system;
    this.#cues = new Set(cues);
    system.setMute(this.#levels.muted);
    if (this.#wantedMusic) this.playMusic(this.#wantedMusic);
  }

  /** Applies new levels, also to the sounds already playing. */
  apply(levels: AudioLevels): void {
    this.#levels = levels;
    this.#system?.setMute(levels.muted);
    this.#music?.sound.setVolume(this.#gain('music'));
    for (const sound of this.#effects) sound.setVolume(this.#gain('sfx'));
  }

  playMusic(key: string): void {
    this.#wantedMusic = key;
    const system = this.#system;
    if (!system || this.#music?.key === key) return;
    this.stopMusic();
    this.#wantedMusic = key;
    const sound = system.add(key, { loop: true, volume: this.#gain('music') });
    this.#music = { key, sound };
    sound.play();
  }

  stopMusic(): void {
    this.#wantedMusic = null;
    if (!this.#music) return;
    this.#music.sound.stop();
    this.#music.sound.destroy();
    this.#music = null;
  }

  /** Plays an effect, unless audio is still locked or the same effect just played. */
  cue(cue: SoundCue): void {
    const system = this.#system;
    if (!system || system.locked || !this.#cues.has(cue) || !this.#throttle.allow(cue)) return;
    const sound = system.add(cue, { volume: this.#gain('sfx') });
    this.#effects.add(sound);
    sound.once('complete', () => {
      this.#effects.delete(sound);
      sound.destroy();
    });
    sound.play();
  }

  #gain(bus: AudioBus): number {
    return busGain(bus === 'music' ? this.#levels.musicVolume : this.#levels.sfxVolume);
  }
}

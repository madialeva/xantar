import type { Language } from '../i18n/language';
import type { KeyBindings } from '../input/bindings';
import {
  type AudioBus,
  MAX_VOLUME,
  type PlayerSettings,
  parseSettings,
  serializeSettings
} from './PlayerSettings';
import type { SettingsStore } from './SettingsStore';

type Listener = (settings: PlayerSettings) => void;

/**
 * The player's current settings and best score; saves them on every change and tells its
 * listeners (Observer), such as the audio and the keyboard.
 */
export class Settings {
  readonly #store: SettingsStore;
  readonly #listeners = new Set<Listener>();
  #values: PlayerSettings;

  constructor(store: SettingsStore, defaults: PlayerSettings) {
    this.#store = store;
    this.#values = parseSettings(store.load(), defaults);
  }

  get values(): PlayerSettings {
    return this.#values;
  }

  get language(): Language {
    return this.#values.language;
  }

  get bestScore(): number {
    return this.#values.bestScore;
  }

  get muted(): boolean {
    return this.#values.muted;
  }

  get keyBindings(): KeyBindings {
    return this.#values.keyBindings;
  }

  volume(bus: AudioBus): number {
    return bus === 'music' ? this.#values.musicVolume : this.#values.sfxVolume;
  }

  setLanguage(language: Language): void {
    this.#update({ language });
  }

  /** Sets a volume, kept within 0 and `MAX_VOLUME`. */
  setVolume(bus: AudioBus, level: number): void {
    const volume = Math.max(0, Math.min(MAX_VOLUME, Math.round(level)));
    this.#update(bus === 'music' ? { musicVolume: volume } : { sfxVolume: volume });
  }

  setMuted(muted: boolean): void {
    this.#update({ muted });
  }

  setKeyBindings(keyBindings: KeyBindings): void {
    this.#update({ keyBindings });
  }

  /** Keeps the score if it beats the best one; tells whether it did. */
  submitScore(score: number): boolean {
    if (score <= this.#values.bestScore) return false;
    this.#update({ bestScore: score });
    return true;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #update(changes: Partial<PlayerSettings>): void {
    this.#values = { ...this.#values, ...changes };
    this.#store.save(serializeSettings(this.#values));
    for (const listener of [...this.#listeners]) listener(this.#values);
  }
}

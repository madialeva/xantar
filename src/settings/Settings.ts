import type { Language } from '../i18n/language';
import {
  type PlayerSettings,
  type ThemePreference,
  parseSettings,
  serializeSettings
} from './PlayerSettings';
import type { SettingsStore } from './SettingsStore';

/** The player's current settings and best score; saves them on every change. */
export class Settings {
  readonly #store: SettingsStore;
  #values: PlayerSettings;

  constructor(store: SettingsStore, defaults: PlayerSettings) {
    this.#store = store;
    this.#values = parseSettings(store.load(), defaults);
  }

  get language(): Language {
    return this.#values.language;
  }

  get theme(): ThemePreference {
    return this.#values.theme;
  }

  get bestScore(): number {
    return this.#values.bestScore;
  }

  setLanguage(language: Language): void {
    this.#update({ language });
  }

  setTheme(theme: ThemePreference): void {
    this.#update({ theme });
  }

  /** Keeps the score if it beats the best one; tells whether it did. */
  submitScore(score: number): boolean {
    if (score <= this.#values.bestScore) return false;
    this.#update({ bestScore: score });
    return true;
  }

  #update(changes: Partial<PlayerSettings>): void {
    this.#values = { ...this.#values, ...changes };
    this.#store.save(serializeSettings(this.#values));
  }
}

import { type Language, isLanguage } from '../i18n/language';
import { DEFAULT_BINDINGS, type KeyBindings, validateBindings } from '../input/bindings';
import { THEME_ID_PATTERN } from '../sim';

export const SETTINGS_VERSION = 1;

export const AUTO_THEME = 'auto';

export const MAX_VOLUME = 10;
export const DEFAULT_MUSIC_VOLUME = 7;
export const DEFAULT_SFX_VOLUME = 8;

/** The two sound channels, each with its own volume. */
export type AudioBus = 'music' | 'sfx';

/** The theme the player chose: `auto` follows each level, any other value is a theme id. */
export type ThemePreference = string;

export interface PlayerSettings {
  readonly language: Language;
  readonly theme: ThemePreference;
  readonly bestScore: number;
  /** Volume of the music, from 0 to `MAX_VOLUME`. */
  readonly musicVolume: number;
  /** Volume of the sound effects, from 0 to `MAX_VOLUME`. */
  readonly sfxVolume: number;
  readonly muted: boolean;
  readonly keyBindings: KeyBindings;
}

/** The settings the player starts with, before choosing anything. */
export const defaultSettings = (language: Language): PlayerSettings => ({
  language,
  theme: AUTO_THEME,
  bestScore: 0,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  sfxVolume: DEFAULT_SFX_VOLUME,
  muted: false,
  keyBindings: DEFAULT_BINDINGS
});

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && (value === AUTO_THEME || THEME_ID_PATTERN.test(value));

const isScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export const isVolume = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_VOLUME;

/**
 * Reads a stored settings record field by field: anything missing or invalid takes its
 * default, and a record of another version is ignored as a whole. The key bindings are
 * checked as a set. Fields added after a record was written simply take their default.
 */
export function parseSettings(raw: unknown, defaults: PlayerSettings): PlayerSettings {
  if (!isRecord(raw) || raw.version !== SETTINGS_VERSION) return defaults;
  return {
    language: isLanguage(raw.language) ? raw.language : defaults.language,
    theme: isThemePreference(raw.theme) ? raw.theme : defaults.theme,
    bestScore: isScore(raw.bestScore) ? raw.bestScore : defaults.bestScore,
    musicVolume: isVolume(raw.musicVolume) ? raw.musicVolume : defaults.musicVolume,
    sfxVolume: isVolume(raw.sfxVolume) ? raw.sfxVolume : defaults.sfxVolume,
    muted: typeof raw.muted === 'boolean' ? raw.muted : defaults.muted,
    keyBindings: validateBindings(raw.keyBindings) ?? defaults.keyBindings
  };
}

export const serializeSettings = (settings: PlayerSettings): UnknownRecord => ({
  version: SETTINGS_VERSION,
  ...settings
});

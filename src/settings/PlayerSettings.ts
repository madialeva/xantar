import { type Language, isLanguage } from '../i18n/language';
import { THEME_ID_PATTERN } from '../sim';

export const SETTINGS_VERSION = 1;

export const AUTO_THEME = 'auto';

/** The theme the player chose: `auto` follows each level, any other value is a theme id. */
export type ThemePreference = string;

export interface PlayerSettings {
  readonly language: Language;
  readonly theme: ThemePreference;
  readonly bestScore: number;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && (value === AUTO_THEME || THEME_ID_PATTERN.test(value));

const isScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/**
 * Reads a stored settings record field by field: anything missing or invalid takes its
 * default, and a record of another version is ignored as a whole.
 */
export function parseSettings(raw: unknown, defaults: PlayerSettings): PlayerSettings {
  if (!isRecord(raw) || raw.version !== SETTINGS_VERSION) return defaults;
  return {
    language: isLanguage(raw.language) ? raw.language : defaults.language,
    theme: isThemePreference(raw.theme) ? raw.theme : defaults.theme,
    bestScore: isScore(raw.bestScore) ? raw.bestScore : defaults.bestScore
  };
}

export const serializeSettings = (settings: PlayerSettings): UnknownRecord => ({
  version: SETTINGS_VERSION,
  ...settings
});

export const LANGUAGES = ['es', 'en'] as const;

export type Language = (typeof LANGUAGES)[number];

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

/** Spanish when the first preference of the browser is any Spanish, English otherwise. */
export function detectLanguage(preferences: readonly string[]): Language {
  return preferences[0]?.toLowerCase().startsWith('es') === true ? 'es' : 'en';
}

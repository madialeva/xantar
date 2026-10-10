import { AUTO_THEME } from '../../settings/PlayerSettings';

export interface ThemeRequest {
  readonly urlTheme?: string | null;
  readonly optionTheme?: string;
  readonly levelTheme?: string;
}

export interface ThemeChoice {
  readonly id: string;
  readonly warnings: readonly string[];
}

interface KnownThemes {
  readonly defaultId: string;
  has(id: string): boolean;
}

/**
 * Picks the theme a board is drawn with: the URL first, then the player's choice unless it is
 * automatic, then the level, then the default. Unknown ids are skipped with a warning that
 * names where they came from.
 */
export function chooseTheme(request: ThemeRequest, themes: KnownThemes): ThemeChoice {
  const candidates = [
    { id: request.urlTheme ?? undefined, origin: 'the URL' },
    {
      id: request.optionTheme === AUTO_THEME ? undefined : request.optionTheme,
      origin: 'the settings'
    },
    { id: request.levelTheme, origin: 'the level' }
  ];
  const warnings: string[] = [];
  for (const { id, origin } of candidates) {
    if (id === undefined || id === '') continue;
    if (themes.has(id)) return { id, warnings };
    warnings.push(`Unknown theme "${id}" requested by ${origin}; ignoring it`);
  }
  return { id: themes.defaultId, warnings };
}

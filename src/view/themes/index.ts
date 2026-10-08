import { artSources } from '../art/sources';
import { ThemeRegistry } from '../theme/ThemeRegistry';
import { classicPalette } from './classic';
import { midnightPalette } from './midnight';

export const DEFAULT_THEME_ID = 'classic';

export function createThemeRegistry(): ThemeRegistry {
  const art = artSources();
  return new ThemeRegistry({
    id: DEFAULT_THEME_ID,
    name: 'Classic',
    palette: classicPalette,
    art: art.get(DEFAULT_THEME_ID) ?? {}
  }).register({
    id: 'midnight',
    name: 'Midnight',
    palette: midnightPalette,
    art: art.get('midnight') ?? {}
  });
}

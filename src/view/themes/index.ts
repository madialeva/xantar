import { artSources } from '../art/sources';
import { ThemeRegistry } from '../theme/ThemeRegistry';
import { classicPalette } from './classic';

export const DEFAULT_THEME_ID = 'classic';

export function createThemeRegistry(): ThemeRegistry {
  const art = artSources();
  return new ThemeRegistry({
    id: DEFAULT_THEME_ID,
    name: 'Classic',
    palette: classicPalette,
    art: art.get(DEFAULT_THEME_ID) ?? {}
  });
}

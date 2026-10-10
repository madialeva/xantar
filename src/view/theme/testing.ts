import { GRAPHIC_IDS } from './graphics';
import { PALETTE_TOKENS } from './palette';
import type { Theme } from './Theme';

export const completeTheme = (id = 'base'): Theme => ({
  id,
  name: 'Base',
  palette: Object.fromEntries(PALETTE_TOKENS.map((token) => [token, '#112233'])),
  art: Object.fromEntries(GRAPHIC_IDS.map((graphic) => [graphic, `<svg id="${graphic}"/>`]))
});

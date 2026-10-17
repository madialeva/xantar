export const PALETTE_TOKENS = [
  'background',
  'backdrop',
  'backdropAccent',
  'platform',
  'platformEdge',
  'ladder',
  'ladderShade',
  'plate',
  'plateEdge',
  'chef',
  'chefShade',
  'sausage',
  'pupil',
  'scarf',
  'outline',
  'shadow',
  'highlight',
  'pepper',
  'sparkle',
  'hudText',
  'hudAccent',
  'hudPanel',
  'danger'
] as const;

export type PaletteToken = (typeof PALETTE_TOKENS)[number];

export type Palette = Readonly<Record<PaletteToken, string>>;

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const isPaletteToken = (value: string): value is PaletteToken =>
  (PALETTE_TOKENS as readonly string[]).includes(value);

export const isColor = (value: string): boolean => COLOR_PATTERN.test(value);

/** The colours of the game, one per token, that the SVG art and the HUD are painted with. */
export const PALETTE: Palette = {
  background: '#14181f',
  backdrop: '#1b2130',
  backdropAccent: '#232b3d',
  platform: '#3d7ea6',
  platformEdge: '#2c5d7c',
  ladder: '#c98b4a',
  ladderShade: '#9a6633',
  plate: '#e8edf2',
  plateEdge: '#a9b4c0',
  chef: '#ffffff',
  chefShade: '#d7dde5',
  scarf: '#e2504c',
  sausage: '#c8442f',
  pupil: '#1d1f24',
  outline: '#1d222b',
  shadow: '#000000',
  highlight: '#ffffff',
  pepper: '#f4f1ea',
  sparkle: '#ffe27a',
  hudText: '#f2f4f8',
  hudAccent: '#ffc857',
  hudPanel: '#1e2533',
  danger: '#ff5a5a'
};

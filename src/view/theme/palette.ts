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
  'bun',
  'bunShade',
  'seed',
  'patty',
  'pattyShade',
  'lettuce',
  'lettuceShade',
  'chef',
  'chefShade',
  'skin',
  'hotdog',
  'sausage',
  'pickle',
  'pickleShade',
  'egg',
  'yolk',
  'eye',
  'pupil',
  'cheek',
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

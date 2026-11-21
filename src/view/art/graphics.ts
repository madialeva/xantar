import { GAME_HEIGHT, GAME_WIDTH, ROW, TILE } from '../../config';
import type { IngredientKind } from '../../sim';

export interface GraphicSize {
  readonly width: number;
  readonly height: number;
}

const size = (width: number, height: number): GraphicSize => ({ width, height });

export const INGREDIENT_HEIGHTS: Readonly<Record<IngredientKind, number>> = {
  bunTop: 18,
  lettuce: 14,
  patty: 17,
  bunBottom: 16,
  cheese: 11,
  tomato: 9
};

/**
 * How much lower than its base an ingredient's image is drawn, in logical units: the art of the
 * melting cheese reaches below its base, so its tongues hang over what is under it instead of
 * lifting the slice.
 */
export const INGREDIENT_HANGS: Readonly<Record<IngredientKind, number>> = {
  bunTop: 0,
  lettuce: 0,
  patty: 0,
  bunBottom: 0,
  cheese: 5,
  tomato: 0
};

const ingredient = <K extends IngredientKind>(kind: K) => {
  const box = size(TILE, INGREDIENT_HEIGHTS[kind]);
  return { [`${kind}.left`]: box, [`${kind}.mid`]: box, [`${kind}.right`]: box } as Record<
    `${K}.${SegmentPart}`,
    GraphicSize
  >;
};

export const GRAPHICS = {
  'board.backdrop': size(GAME_WIDTH, GAME_HEIGHT),
  'platform.left': size(TILE, 8),
  'platform.mid': size(TILE, 8),
  'platform.right': size(TILE, 8),
  crossing: size(TILE, 8),
  walkway: size(TILE, 8),
  ladder: size(TILE, ROW),
  'ladder.rails': size(TILE, 8),
  'plate.left': size(TILE, 10),
  'plate.mid': size(TILE, 10),
  'plate.right': size(TILE, 10),
  ...ingredient('bunTop'),
  ...ingredient('lettuce'),
  ...ingredient('patty'),
  ...ingredient('bunBottom'),
  ...ingredient('cheese'),
  ...ingredient('tomato'),
  'chef.body': size(18, 14),
  'chef.head': size(16, 14),
  'chef.hat': size(20, 13),
  'chef.eyes': size(8, 5),
  'chef.ponytail': size(8, 11),
  'chef.armLeft': size(6, 11),
  'chef.armRight': size(6, 11),
  'chef.legLeft': size(8, 9),
  'chef.legRight': size(8, 9),
  'chorizo.body': size(20, 30),
  'chorizo.bendBack2': size(20, 30),
  'chorizo.bendBack1': size(20, 30),
  'chorizo.bendFront1': size(20, 30),
  'chorizo.bendFront2': size(20, 30),
  'chorizo.knot': size(14, 10),
  'chorizo.eyes': size(12, 7),
  'chorizo.leg': size(6, 8),
  'onion.body': size(30, 30),
  'onion.turn1': size(30, 30),
  'onion.turn2': size(30, 30),
  'onion.turn3': size(30, 30),
  'onion.turn4': size(30, 30),
  'onion.turn5': size(30, 30),
  'onion.eyes': size(12, 7),
  'onion.leg': size(6, 8),
  'corn.body': size(14, 24),
  'corn.huskBack': size(28, 10),
  'corn.huskFront': size(28, 10),
  'corn.silk': size(14, 8),
  'corn.eyes': size(12, 7),
  'corn.leg': size(6, 8),
  'fx.pepper': size(32, 32),
  'fx.squash': size(32, 16),
  'fx.sparkle': size(24, 24),
  'hud.life': size(20, 20),
  'hud.pepper': size(20, 20),
  'hud.pause': size(32, 32),
  'hud.dpad': size(128, 128),
  'hud.pepperButton': size(128, 128)
} as const satisfies Record<string, GraphicSize>;

export type GraphicId = keyof typeof GRAPHICS;

export const GRAPHIC_IDS = Object.keys(GRAPHICS) as readonly GraphicId[];

export const isGraphicId = (value: string): value is GraphicId => Object.hasOwn(GRAPHICS, value);

export type SegmentPart = 'left' | 'mid' | 'right';

/**
 * Which end or middle graphic draws each tile of a run `width` tiles long. A one-tile run has
 * no room for caps and uses the middle graphic.
 */
export function segmentParts(width: number): readonly SegmentPart[] {
  if (width <= 1) return ['mid'];
  return Array.from({ length: width }, (_, index): SegmentPart =>
    index === 0 ? 'left' : index === width - 1 ? 'right' : 'mid'
  );
}

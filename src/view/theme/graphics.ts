import type { IngredientKind } from '../../sim';

export interface GraphicSize {
  readonly width: number;
  readonly height: number;
}

const size = (width: number, height: number): GraphicSize => ({ width, height });

export const INGREDIENT_HEIGHTS: Readonly<Record<IngredientKind, number>> = {
  bunTop: 18,
  lettuce: 12,
  patty: 14,
  bunBottom: 14
};

/**
 * How far above an ingredient's bottom the next ingredient of a burger sits, which is how
 * thick it looks in the rendered art (seen slightly from above, the next one covers its top).
 */
export const INGREDIENT_STACK_HEIGHTS: Readonly<Record<IngredientKind, number>> = {
  bunTop: 13,
  lettuce: 4.8,
  patty: 8.3,
  bunBottom: 7.4
};

const ingredient = <K extends IngredientKind>(kind: K) => {
  const box = size(32, INGREDIENT_HEIGHTS[kind]);
  return { [`${kind}.left`]: box, [`${kind}.mid`]: box, [`${kind}.right`]: box } as Record<
    `${K}.${SegmentPart}`,
    GraphicSize
  >;
};

export const GRAPHICS = {
  'board.backdrop': size(640, 480),
  'platform.left': size(32, 12),
  'platform.mid': size(32, 12),
  'platform.right': size(32, 12),
  crossing: size(32, 12),
  ladder: size(32, 32),
  'plate.left': size(32, 10),
  'plate.mid': size(32, 10),
  'plate.right': size(32, 10),
  ...ingredient('bunTop'),
  ...ingredient('lettuce'),
  ...ingredient('patty'),
  ...ingredient('bunBottom'),
  'chef.body': size(18, 14),
  'chef.head': size(16, 14),
  'chef.hat': size(20, 13),
  'chef.eyes': size(8, 5),
  'chef.ponytail': size(8, 11),
  'chef.armLeft': size(6, 11),
  'chef.armRight': size(6, 11),
  'chef.legLeft': size(8, 9),
  'chef.legRight': size(8, 9),
  'hotdog.body': size(18, 34),
  'hotdog.bendBack2': size(18, 34),
  'hotdog.bendBack1': size(18, 34),
  'hotdog.bendFront1': size(18, 34),
  'hotdog.bendFront2': size(18, 34),
  'hotdog.eyes': size(12, 7),
  'hotdog.leg': size(6, 8),
  'pickle.body': size(18, 34),
  'pickle.wiggleBack2': size(18, 34),
  'pickle.wiggleBack1': size(18, 34),
  'pickle.wiggleFront1': size(18, 34),
  'pickle.wiggleFront2': size(18, 34),
  'pickle.eyes': size(12, 7),
  'pickle.leg': size(6, 8),
  'egg.body': size(30, 30),
  'egg.rippleBack2': size(30, 30),
  'egg.rippleBack1': size(30, 30),
  'egg.rippleFront1': size(30, 30),
  'egg.rippleFront2': size(30, 30),
  'egg.eyes': size(12, 7),
  'egg.leg': size(6, 8),
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

export const textureKey = (themeId: string, graphic: GraphicId): string => `${themeId}/${graphic}`;

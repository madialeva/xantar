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
  'chef.head': size(14, 12),
  'chef.hat': size(18, 12),
  'chef.eyes': size(10, 4),
  'chef.armLeft': size(6, 10),
  'chef.armRight': size(6, 10),
  'chef.legLeft': size(7, 8),
  'chef.legRight': size(7, 8),
  'hotdog.body': size(30, 14),
  'hotdog.eyes': size(12, 6),
  'hotdog.feet': size(18, 6),
  'pickle.body': size(16, 26),
  'pickle.eyes': size(12, 6),
  'pickle.feet': size(14, 6),
  'egg.body': size(24, 18),
  'egg.eyes': size(12, 6),
  'egg.feet': size(16, 6),
  'fx.pepper': size(32, 32),
  'fx.squash': size(32, 16),
  'fx.sparkle': size(24, 24),
  'hud.life': size(20, 20),
  'hud.pepper': size(20, 20),
  'hud.exit': size(32, 32)
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

import type { GraphicId } from '../theme/graphics';

export interface RigPart {
  readonly name: string;
  readonly graphic: GraphicId;
  readonly x: number;
  readonly y: number;
  readonly originX?: number;
  readonly originY?: number;
}

/**
 * How a character is put together: its parts in drawing order, each at its place relative
 * to the centre of the character's tile and turning around its origin. Drawn facing right.
 */
export interface RigDefinition {
  readonly parts: readonly RigPart[];
}

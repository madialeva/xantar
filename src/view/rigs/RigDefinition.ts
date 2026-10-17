import type { GraphicId } from '../theme/graphics';

export interface RigPart {
  readonly name: string;
  readonly graphic: GraphicId;
  readonly x: number;
  readonly y: number;
  readonly originX?: number;
  readonly originY?: number;
  /**
   * Graphics, all the size of `graphic`, that the part can switch between for changes of
   * shape a tween cannot make, such as a body bending one way and the other.
   */
  readonly frames?: readonly GraphicId[];
}

/**
 * How a character is put together: its parts in drawing order, each at its place relative
 * to the centre of the character's tile and turning around its origin. Drawn facing right.
 */
export interface RigDefinition {
  readonly parts: readonly RigPart[];
}

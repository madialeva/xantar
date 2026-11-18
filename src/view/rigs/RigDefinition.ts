import type { GraphicId } from '../art/graphics';

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
 * to the character's anchor (`characterY`) and turning around its origin. Drawn facing right,
 * with the soles of the base pose at `FEET_Y` and scaled by `scale` about them.
 */
export interface RigDefinition {
  readonly parts: readonly RigPart[];
  /** How much the whole character is scaled about its feet; 1 when absent. */
  readonly scale?: number;
}

/** Where the soles of every rig are in its base pose, below the character's anchor. */
export const FEET_Y = 10;

/** Scale and offset that draw a rig at its scale with its feet where they were. */
export const rigPlacement = (definition: RigDefinition): { scale: number; y: number } => {
  const scale = definition.scale ?? 1;
  return { scale, y: FEET_Y * (1 - scale) };
};

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
 * with the soles of the base pose at `FEET_Y`, scaled by `scale` about them and stretched
 * sideways by `widen`.
 */
export interface RigDefinition {
  readonly parts: readonly RigPart[];
  /** How much the whole character is scaled about its feet; 1 when absent. */
  readonly scale?: number;
  /** How much wider than its scaled art the character is drawn; 1 when absent. */
  readonly widen?: number;
}

/** Where the soles of every rig are in its base pose, below the character's anchor. */
export const FEET_Y = 10;

/** Where and how a rig is drawn: its scale across and up, and how far down its anchor moves. */
export interface RigPlacement {
  readonly scaleX: number;
  readonly scale: number;
  readonly y: number;
}

/** Scales and offset that draw a rig at its scale and width with its feet where they were. */
export const rigPlacement = (definition: RigDefinition): RigPlacement => {
  const scale = definition.scale ?? 1;
  return { scaleX: scale * (definition.widen ?? 1), scale, y: FEET_Y * (1 - scale) };
};

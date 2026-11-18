import { TILE } from '../config';
import type { PositionSnapshot } from '../sim';

const lerp = (from: number, to: number, alpha: number): number => from + (to - from) * alpha;

export const interpolatedX = (entity: PositionSnapshot, alpha: number): number =>
  lerp(entity.prevX, entity.x, alpha) * TILE;

/** The height of the entity in rows, interpolated between ticks. */
export const interpolatedRow = (entity: PositionSnapshot, alpha: number): number =>
  lerp(entity.prevY, entity.y, alpha);

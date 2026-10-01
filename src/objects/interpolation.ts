import { TILE } from '../config';
import type { PositionSnapshot } from '../sim';

const lerp = (from: number, to: number, alpha: number): number => from + (to - from) * alpha;

export const interpolatedX = (entity: PositionSnapshot, alpha: number): number =>
  lerp(entity.prevX, entity.x, alpha) * TILE;

export const interpolatedY = (entity: PositionSnapshot, alpha: number): number =>
  lerp(entity.prevY, entity.y, alpha) * TILE;

import { TILE } from '../config';
import type { IngredientSnapshot } from '../sim';

/** How far down a segment is drawn for each step it has sunk: one pixel of the original at ×2. */
export const STOMP_STEP = 2;
/** How far down the end segments are drawn while the ingredient arches. */
export const ARCH_DEPTH = 2;

/** How much a tilted segment overlaps each neighbour, so that no seam opens at the joints. */
const TILT_OVERLAP = 0.5;

/**
 * Where a segment is drawn: how far below its resting place its centre is, its tilt and how
 * much wider than a cell it is drawn.
 */
export interface SegmentPose {
  readonly offset: number;
  readonly angle: number;
  readonly widthScale: number;
}

/**
 * How each segment of an ingredient is drawn: the slope of its stomped segments and, when
 * `arched`, its two end segments a little lower. Each segment is tilted so that its edges meet
 * its neighbours' half-way between their depths, which turns the steps into a smooth incline.
 */
export function segmentPoses(
  ingredient: Pick<IngredientSnapshot, 'sink' | 'width'>,
  arched: boolean
): readonly SegmentPose[] {
  const archable = arched && ingredient.width >= 3;
  const last = ingredient.width - 1;
  const depths = ingredient.sink.map(
    (steps, index) =>
      steps * STOMP_STEP + (archable && (index === 0 || index === last) ? ARCH_DEPTH : 0)
  );
  const edges = [
    depths[0] ?? 0,
    ...depths.slice(1).map((depth, index) => (depth + (depths[index] ?? 0)) / 2),
    depths[last] ?? 0
  ];
  return depths.map((_, index) => {
    const left = edges[index] ?? 0;
    const right = edges[index + 1] ?? 0;
    const angle = Math.atan2(right - left, TILE);
    const widthScale = angle === 0 ? 1 : 1 + (2 * TILT_OVERLAP) / TILE;
    return { offset: (left + right) / 2, angle, widthScale };
  });
}

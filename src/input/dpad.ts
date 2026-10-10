import type { Direction } from './actions';

/**
 * The direction of a four-way pad for a touch at (dx, dy) from its centre: the dominant axis
 * wins, and nothing inside the dead zone. Screen coordinates: y grows downwards.
 */
export function dpadDirection(dx: number, dy: number, deadZone: number): Direction | null {
  if (Math.hypot(dx, dy) < deadZone) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

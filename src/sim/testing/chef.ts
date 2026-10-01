import type { ChefSnapshot } from '../entities/Chef';

export const chefAt = (row: number, x: number): ChefSnapshot => ({
  x,
  y: row,
  prevX: x,
  prevY: row,
  row,
  facing: 1,
  isMoving: false,
  isClimbing: false
});

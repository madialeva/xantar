import type { ChefPosition } from '../entities/Chef';

export const chefAt = (row: number, x: number, onPlatform = true): ChefPosition => ({
  x,
  row,
  onPlatform
});

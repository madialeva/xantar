import {
  CELL_UNITS,
  PEPPER_CLOUD_LIFT,
  PEPPER_CLOUD_OFFSET,
  PEPPER_REACH_ACROSS,
  PEPPER_REACH_ALONG,
  ROW_UNITS
} from '../rules';
import type { EnemySnapshot } from './Enemy';

export type ThrowDirection = 'left' | 'right' | 'up' | 'down';

export interface ThrowVector {
  readonly dx: -1 | 0 | 1;
  readonly dy: -1 | 0 | 1;
}

export const THROW_VECTORS: Readonly<Record<ThrowDirection, ThrowVector>> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 }
};

export interface PepperSource {
  readonly x: number;
  readonly y: number;
  readonly throwDirection: ThrowDirection;
}

export interface PepperCloud {
  readonly x: number;
  readonly y: number;
  readonly direction: ThrowDirection;
}

/** Where the cloud of a pepper thrown by the chef appears, in cells and rows. */
export const pepperCloudFor = (chef: PepperSource): PepperCloud => {
  const { dx, dy } = THROW_VECTORS[chef.throwDirection];
  return {
    x: chef.x + (dx * PEPPER_CLOUD_OFFSET) / CELL_UNITS,
    y: chef.y + (dy * PEPPER_CLOUD_OFFSET - PEPPER_CLOUD_LIFT) / ROW_UNITS,
    direction: chef.throwDirection
  };
};

/** Whether the pepper the chef throws reaches an enemy; distances are measured in units. */
export const isHitByPepper = (chef: PepperSource, enemy: EnemySnapshot): boolean => {
  const { dx, dy } = THROW_VECTORS[chef.throwDirection];
  const offsetX = (enemy.x - chef.x) * CELL_UNITS;
  const offsetY = (enemy.y - chef.y) * ROW_UNITS;
  const ahead = offsetX * dx + offsetY * dy;
  const aside = Math.abs(offsetX * dy) + Math.abs(offsetY * dx);
  return (
    enemy.active &&
    ahead > 0 &&
    Math.abs(ahead - PEPPER_CLOUD_OFFSET) < PEPPER_REACH_ALONG &&
    aside < PEPPER_REACH_ACROSS
  );
};

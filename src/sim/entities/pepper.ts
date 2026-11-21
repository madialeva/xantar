import {
  PEPPER_CLOUD_LIFT,
  PEPPER_CLOUD_OFFSET,
  PEPPER_REACH_ACROSS,
  PEPPER_REACH_ALONG
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
    x: chef.x + dx * PEPPER_CLOUD_OFFSET.cells,
    y: chef.y + dy * PEPPER_CLOUD_OFFSET.rows - PEPPER_CLOUD_LIFT,
    direction: chef.throwDirection
  };
};

/**
 * Whether the pepper the chef throws reaches an enemy: along a throw to the side in cells and
 * across it in rows, along a throw up or down in rows and across it in cells.
 */
export const isHitByPepper = (chef: PepperSource, enemy: EnemySnapshot): boolean => {
  const { dx, dy } = THROW_VECTORS[chef.throwDirection];
  const sideways = dx !== 0;
  const ahead = sideways ? (enemy.x - chef.x) * dx : (enemy.y - chef.y) * dy;
  const aside = sideways ? Math.abs(enemy.y - chef.y) : Math.abs(enemy.x - chef.x);
  const along = sideways ? 'cells' : 'rows';
  const across = sideways ? 'rows' : 'cells';
  return (
    enemy.active &&
    ahead > 0 &&
    Math.abs(ahead - PEPPER_CLOUD_OFFSET[along]) < PEPPER_REACH_ALONG[along] &&
    aside < PEPPER_REACH_ACROSS[across]
  );
};

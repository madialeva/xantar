import { PEPPER_CLOUD_LIFT, PEPPER_CLOUD_OFFSET, PEPPER_REACH_X, PEPPER_REACH_Y } from '../rules';
import type { ChefSnapshot } from './Chef';
import type { EnemySnapshot } from './Enemy';

export interface PepperCloud {
  readonly x: number;
  readonly y: number;
  readonly direction: 1 | -1;
}

export const pepperCloudFor = (chef: ChefSnapshot): PepperCloud => ({
  x: chef.x + chef.facing * PEPPER_CLOUD_OFFSET,
  y: chef.y - PEPPER_CLOUD_LIFT,
  direction: chef.facing
});

export const isHitByPepper = (
  cloud: PepperCloud,
  chef: ChefSnapshot,
  enemy: EnemySnapshot
): boolean =>
  enemy.active &&
  Math.sign(enemy.x - chef.x) === cloud.direction &&
  Math.abs(enemy.x - cloud.x) < PEPPER_REACH_X &&
  Math.abs(enemy.y - chef.y) < PEPPER_REACH_Y;

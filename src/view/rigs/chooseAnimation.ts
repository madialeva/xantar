import type { ChefSnapshot, EnemySnapshot } from '../../sim';

export type ChefAnimation = 'idle' | 'walk' | 'climbIdle' | 'climb' | 'hit';

export type EnemyAnimation = 'walk' | 'climb' | 'stunned' | 'ride' | 'inactive';

export function chefAnimation(
  chef: Pick<ChefSnapshot, 'isMoving' | 'isClimbing'>,
  hit: boolean
): ChefAnimation {
  if (hit) return 'hit';
  if (chef.isClimbing) return chef.isMoving ? 'climb' : 'climbIdle';
  return chef.isMoving ? 'walk' : 'idle';
}

export function enemyAnimation(
  enemy: Pick<EnemySnapshot, 'active' | 'stunned' | 'isClimbing' | 'riding'>
): EnemyAnimation {
  if (!enemy.active) return 'inactive';
  if (enemy.riding) return 'ride';
  if (enemy.stunned) return 'stunned';
  return enemy.isClimbing ? 'climb' : 'walk';
}

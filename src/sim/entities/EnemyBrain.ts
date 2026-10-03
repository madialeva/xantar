import { columnCenter } from '../geometry';
import type { Ladder, Level } from '../legacy-level/Level';
import type { Rng } from '../rng';
import { DECISION_MAX_TICKS, DECISION_MIN_TICKS, ENEMY_REVERSE_CHANCE } from '../rules';
import type { ChefSnapshot } from './Chef';
import type { EnemySnapshot } from './Enemy';

export interface EnemyIntent {
  readonly direction: 1 | -1;
  readonly ladder: Ladder | undefined;
}

export interface EnemyBrain {
  decide(enemy: EnemySnapshot, chef: ChefSnapshot, level: Level, rng: Rng): EnemyIntent;
  nextDecisionDelay(rng: Rng): number;
}

const directionOf = (delta: number): 1 | -1 | 0 => (delta > 0 ? 1 : delta < 0 ? -1 : 0);

export class ChaseBrain implements EnemyBrain {
  decide(enemy: EnemySnapshot, chef: ChefSnapshot, level: Level, rng: Rng): EnemyIntent {
    if (enemy.row !== chef.row) {
      const ladder = level.bestLadderTowards(enemy.row, chef.row, enemy.x);
      if (ladder !== undefined) {
        const direction = directionOf(columnCenter(ladder.col) - enemy.x) || 1;
        return { direction, ladder };
      }
    }
    const towardsChef = directionOf(chef.x - enemy.x) || (rng.chance(0.5) ? -1 : 1);
    const direction = rng.chance(ENEMY_REVERSE_CHANCE) ? -towardsChef : towardsChef;
    return { direction: direction === 1 ? 1 : -1, ladder: undefined };
  }

  nextDecisionDelay(rng: Rng): number {
    return rng.int(DECISION_MIN_TICKS, DECISION_MAX_TICKS);
  }
}

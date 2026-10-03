import type { LadderEdge } from '../nav/edges';
import type { NavigationGraph } from '../nav/NavigationGraph';
import type { Rng } from '../rng';
import { DECISION_MAX_TICKS, DECISION_MIN_TICKS, ENEMY_REVERSE_CHANCE } from '../rules';
import type { ChefSnapshot } from './Chef';
import type { EnemySnapshot } from './Enemy';

export interface LadderIntent {
  readonly edge: LadderEdge;
  readonly direction: 'up' | 'down';
}

export interface EnemyIntent {
  readonly direction: 1 | -1;
  readonly ladder: LadderIntent | undefined;
}

/**
 * Strategy that decides where an enemy goes (direction and ladder to take) each time it
 * re-evaluates; every enemy kind gets its own brain.
 */
export interface EnemyBrain {
  decide(enemy: EnemySnapshot, chef: ChefSnapshot, graph: NavigationGraph, rng: Rng): EnemyIntent;
  nextDecisionDelay(rng: Rng): number;
}

const directionOf = (delta: number): 1 | -1 | 0 => (delta > 0 ? 1 : delta < 0 ? -1 : 0);

/**
 * Enemy strategy that chases the chef along the shortest path of the navigation graph,
 * with a chance of reversing when both are on the same platform.
 */
export class ChaseBrain implements EnemyBrain {
  decide(enemy: EnemySnapshot, chef: ChefSnapshot, graph: NavigationGraph, rng: Rng): EnemyIntent {
    const path = graph.shortestPath(enemy.place, chef.place);
    if (path.kind === 'ladder') {
      const direction = directionOf(path.junctionX - enemy.x) || 1;
      return { direction, ladder: { edge: path.ladder, direction: path.direction } };
    }
    const towardsChef = directionOf(chef.x - enemy.x) || (rng.chance(0.5) ? -1 : 1);
    const direction = rng.chance(ENEMY_REVERSE_CHANCE) ? -towardsChef : towardsChef;
    return { direction: direction === 1 ? 1 : -1, ladder: undefined };
  }

  nextDecisionDelay(rng: Rng): number {
    return rng.int(DECISION_MIN_TICKS, DECISION_MAX_TICKS);
  }
}

import type { EventSink } from '../events';
import type { EnemyKind } from '../level/kinds';
import type { NavPlace } from '../nav/NavPlace';
import type { NavigationGraph } from '../nav/NavigationGraph';
import { ChaseBrain, type EnemyBrain } from './EnemyBrain';
import { Enemy } from './Enemy';

const brains: Record<EnemyKind, EnemyBrain> = {
  hotdog: new ChaseBrain(),
  pickle: new ChaseBrain(),
  egg: new ChaseBrain()
};

export const createEnemy = (
  id: number,
  kind: EnemyKind,
  events: EventSink,
  graph: NavigationGraph,
  spawns: readonly NavPlace[]
): Enemy => new Enemy(id, kind, brains[kind], events, graph, spawns);

import type { EventSink } from '../events';
import type { EnemyKind } from '../level/kinds';
import type { NavigationGraph } from '../nav/NavigationGraph';
import { ChaseBrain, type EnemyBrain } from './EnemyBrain';
import { Enemy, type EnemyEntry } from './Enemy';

const brains: Record<EnemyKind, EnemyBrain> = {
  chorizo: new ChaseBrain(),
  onion: new ChaseBrain(),
  corn: new ChaseBrain()
};

export const createEnemy = (
  id: number,
  kind: EnemyKind,
  events: EventSink,
  graph: NavigationGraph,
  entries: readonly EnemyEntry[]
): Enemy => new Enemy(id, kind, brains[kind], events, graph, entries);

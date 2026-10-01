import type { EventSink } from '../events';
import type { EnemyKind } from '../level/LevelData';
import { ChaseBrain, type EnemyBrain } from './EnemyBrain';
import { Enemy } from './Enemy';

const brains: Record<EnemyKind, EnemyBrain> = {
  hotdog: new ChaseBrain(),
  pickle: new ChaseBrain(),
  egg: new ChaseBrain()
};

export const createEnemy = (id: number, kind: EnemyKind, events: EventSink): Enemy =>
  new Enemy(id, kind, brains[kind], events);

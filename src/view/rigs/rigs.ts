import type { EnemyKind } from '../../sim';
import type { RigDefinition } from './RigDefinition';

export const chefRig: RigDefinition = {
  parts: [
    { name: 'armLeft', graphic: 'chef.armLeft', x: -7, y: -8, originY: 0.1 },
    { name: 'legLeft', graphic: 'chef.legLeft', x: -3, y: 2, originY: 0 },
    { name: 'legRight', graphic: 'chef.legRight', x: 3, y: 2, originY: 0 },
    { name: 'body', graphic: 'chef.body', x: 0, y: 4, originY: 1 },
    { name: 'head', graphic: 'chef.head', x: 0.5, y: -14 },
    { name: 'eyes', graphic: 'chef.eyes', x: 1, y: -14.5 },
    { name: 'hat', graphic: 'chef.hat', x: 0, y: -17, originY: 1 },
    { name: 'armRight', graphic: 'chef.armRight', x: 7, y: -8, originY: 0.1 }
  ]
};

export const enemyRigs: Readonly<Record<EnemyKind, RigDefinition>> = {
  hotdog: {
    parts: [
      { name: 'feet', graphic: 'hotdog.feet', x: 0, y: 7.5 },
      { name: 'body', graphic: 'hotdog.body', x: 0, y: 7, originY: 1 },
      { name: 'eyes', graphic: 'hotdog.eyes', x: 6, y: -3 }
    ]
  },
  pickle: {
    parts: [
      { name: 'feet', graphic: 'pickle.feet', x: 0, y: 8 },
      { name: 'body', graphic: 'pickle.body', x: 0, y: 9, originY: 1 },
      { name: 'eyes', graphic: 'pickle.eyes', x: 2, y: -9 }
    ]
  },
  egg: {
    parts: [
      { name: 'feet', graphic: 'egg.feet', x: 0, y: 8 },
      { name: 'body', graphic: 'egg.body', x: 0, y: 9, originY: 1 },
      { name: 'eyes', graphic: 'egg.eyes', x: 1.5, y: -1.5 }
    ]
  }
};

import type { EnemyKind } from '../../sim';
import type { RigDefinition } from './RigDefinition';

export const chefRig: RigDefinition = {
  parts: [
    { name: 'armLeft', graphic: 'chef.armLeft', x: -4, y: -7.2, originY: 0.18 },
    { name: 'legLeft', graphic: 'chef.legLeft', x: -2, y: 1, originY: 0 },
    { name: 'legRight', graphic: 'chef.legRight', x: 2, y: 1, originY: 0 },
    { name: 'body', graphic: 'chef.body', x: 0, y: 4, originY: 1 },
    { name: 'ponytail', graphic: 'chef.ponytail', x: -4.4, y: -15.8, originX: 0.85, originY: 0.08 },
    { name: 'head', graphic: 'chef.head', x: 0.5, y: -13.5 },
    { name: 'eyes', graphic: 'chef.eyes', x: 1.2, y: -15 },
    { name: 'hat', graphic: 'chef.hat', x: 0, y: -16.4, originY: 1 },
    { name: 'armRight', graphic: 'chef.armRight', x: 4, y: -7.2, originY: 0.18 }
  ]
};

export const enemyRigs: Readonly<Record<EnemyKind, RigDefinition>> = {
  hotdog: {
    parts: [
      { name: 'legLeft', graphic: 'hotdog.leg', x: -2.2, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'hotdog.leg', x: 2.6, y: 2, originY: 0 },
      {
        name: 'body',
        graphic: 'hotdog.body',
        x: 0,
        y: 4,
        originY: 1,
        frames: [
          'hotdog.bendBack2',
          'hotdog.bendBack1',
          'hotdog.body',
          'hotdog.bendFront1',
          'hotdog.bendFront2'
        ]
      },
      { name: 'eyes', graphic: 'hotdog.eyes', x: 2.6, y: -20 }
    ]
  },
  pickle: {
    parts: [
      { name: 'legLeft', graphic: 'pickle.leg', x: -2.2, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'pickle.leg', x: 2.6, y: 2, originY: 0 },
      {
        name: 'body',
        graphic: 'pickle.body',
        x: 0,
        y: 4,
        originY: 1,
        frames: [
          'pickle.wiggleBack2',
          'pickle.wiggleBack1',
          'pickle.body',
          'pickle.wiggleFront1',
          'pickle.wiggleFront2'
        ]
      },
      { name: 'eyes', graphic: 'pickle.eyes', x: 1.6, y: -21 }
    ]
  },
  egg: {
    parts: [
      { name: 'legLeft', graphic: 'egg.leg', x: -2.2, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'egg.leg', x: 2.6, y: 2, originY: 0 },
      {
        name: 'body',
        graphic: 'egg.body',
        x: 0,
        y: 4,
        originY: 1,
        frames: [
          'egg.rippleBack2',
          'egg.rippleBack1',
          'egg.body',
          'egg.rippleFront1',
          'egg.rippleFront2'
        ]
      },
      { name: 'eyes', graphic: 'egg.eyes', x: 1.2, y: -13 }
    ]
  }
};

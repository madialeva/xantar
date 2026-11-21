import type { EnemyKind } from '../../sim';
import type { RigDefinition } from './RigDefinition';

/**
 * How much wider than their art the characters are drawn: two units more over the 32 of the
 * chef, to go with columns two units wider than a character of the original.
 */
export const CHARACTER_WIDEN = 34 / 32;

export const chefRig: RigDefinition = {
  scale: 0.82,
  widen: CHARACTER_WIDEN,
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
  chorizo: {
    scale: 0.85,
    widen: CHARACTER_WIDEN,
    parts: [
      { name: 'legLeft', graphic: 'chorizo.leg', x: -2.4, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'chorizo.leg', x: 2.6, y: 2, originY: 0 },
      {
        name: 'body',
        graphic: 'chorizo.body',
        x: 0,
        y: 5,
        originY: 1,
        frames: [
          'chorizo.bendBack2',
          'chorizo.bendBack1',
          'chorizo.body',
          'chorizo.bendFront1',
          'chorizo.bendFront2'
        ]
      },
      { name: 'knot', graphic: 'chorizo.knot', x: -0.5, y: -24.6, originY: 0.6 },
      { name: 'eyes', graphic: 'chorizo.eyes', x: 2.6, y: -15.8 }
    ]
  },
  onion: {
    scale: 0.91,
    widen: CHARACTER_WIDEN,
    parts: [
      { name: 'legLeft', graphic: 'onion.leg', x: -2.2, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'onion.leg', x: 2.6, y: 2, originY: 0 },
      {
        name: 'body',
        graphic: 'onion.body',
        x: 0,
        y: 4,
        originY: 1,
        frames: [
          'onion.body',
          'onion.turn1',
          'onion.turn2',
          'onion.turn3',
          'onion.turn4',
          'onion.turn5'
        ]
      },
      { name: 'eyes', graphic: 'onion.eyes', x: 1.2, y: -22.5 }
    ]
  },
  corn: {
    scale: 0.9,
    widen: CHARACTER_WIDEN,
    parts: [
      { name: 'huskBack', graphic: 'corn.huskBack', x: 0, y: -2.2, originY: 0 },
      { name: 'legLeft', graphic: 'corn.leg', x: -2.4, y: 2, originY: 0 },
      { name: 'legRight', graphic: 'corn.leg', x: 2.6, y: 2, originY: 0 },
      { name: 'body', graphic: 'corn.body', x: 0, y: 3, originY: 1 },
      { name: 'huskFront', graphic: 'corn.huskFront', x: 0, y: -2.2, originY: 0 },
      { name: 'silk', graphic: 'corn.silk', x: 0, y: -19, originY: 1 },
      { name: 'eyes', graphic: 'corn.eyes', x: 2.0, y: -13 }
    ]
  }
};

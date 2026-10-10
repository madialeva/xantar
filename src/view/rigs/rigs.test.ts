import { describe, expect, it } from 'vitest';
import { isGraphicId } from '../theme/graphics';
import { chefRig, enemyRigs } from './rigs';

const rigs = { chef: chefRig, ...enemyRigs };

describe('rigs', () => {
  for (const [name, rig] of Object.entries(rigs)) {
    it(`${name} uses only catalogue graphics and unique part names`, () => {
      expect(rig.parts.filter((part) => !isGraphicId(part.graphic))).toEqual([]);
      const names = rig.parts.map((part) => part.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it(`${name} has a body and eyes`, () => {
      const names = rig.parts.map((part) => part.name);
      expect(names).toEqual(expect.arrayContaining(['body', 'eyes']));
    });
  }

  it('gives the chef a head, a hat, arms and legs', () => {
    expect(chefRig.parts.map((part) => part.name)).toEqual(
      expect.arrayContaining(['head', 'hat', 'armLeft', 'armRight', 'legLeft', 'legRight'])
    );
  });
});

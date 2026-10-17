import { describe, expect, it } from 'vitest';
import { GRAPHICS, isGraphicId } from '../theme/graphics';
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

  it('gives every frame of a part the size of its graphic', () => {
    for (const rig of Object.values(rigs)) {
      for (const part of rig.parts) {
        for (const frame of part.frames ?? []) {
          expect(isGraphicId(frame), `unknown frame "${frame}"`).toBe(true);
          expect(GRAPHICS[frame]).toEqual(GRAPHICS[part.graphic]);
        }
      }
    }
  });

  it('gives every enemy a dancing body', () => {
    for (const rig of Object.values(enemyRigs)) {
      expect(rig.parts.find((part) => part.name === 'body')?.frames?.length).toBe(5);
    }
  });

  it('gives the chef a head, a hat, arms and legs', () => {
    expect(chefRig.parts.map((part) => part.name)).toEqual(
      expect.arrayContaining(['head', 'hat', 'armLeft', 'armRight', 'legLeft', 'legRight'])
    );
  });
});

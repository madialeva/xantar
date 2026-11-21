import { describe, expect, it } from 'vitest';
import { GRAPHICS, isGraphicId } from '../art/graphics';
import { CHARACTER_WIDEN, chefRig, enemyRigs } from './rigs';

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

  it('draws every character two units wider than its art over the 32 of the chef', () => {
    for (const rig of [chefRig, ...Object.values(enemyRigs)]) {
      expect(rig.widen).toBe(CHARACTER_WIDEN);
    }
    expect(32 * CHARACTER_WIDEN).toBe(34);
  });

  it('gives every enemy two legs', () => {
    for (const rig of Object.values(enemyRigs)) {
      expect(rig.parts.map((part) => part.name)).toEqual(
        expect.arrayContaining(['legLeft', 'legRight'])
      );
    }
  });

  it('gives the chorizo five frames to bend, the onion six for half a turn and the corn none', () => {
    const frames = (kind: keyof typeof enemyRigs): readonly string[] =>
      enemyRigs[kind].parts.find((part) => part.name === 'body')?.frames ?? [];
    expect([frames('chorizo').length, frames('onion').length, frames('corn').length]).toEqual([
      5, 6, 0
    ]);
  });

  it('bends the chorizo from one side to the other through its straight body', () => {
    const body = enemyRigs.chorizo.parts.find((part) => part.name === 'body');
    expect(body?.frames?.[2]).toBe(body?.graphic);
    expect([body?.frames?.[0], body?.frames?.[4]]).toEqual([
      'chorizo.bendBack2',
      'chorizo.bendFront2'
    ]);
  });

  it('puts the tied tip on top of the chorizo, and the husk round the corn with its silk on top', () => {
    const names = (kind: keyof typeof enemyRigs): readonly string[] =>
      enemyRigs[kind].parts.map((part) => part.name);
    expect(names('chorizo')).toEqual(['legLeft', 'legRight', 'body', 'knot', 'eyes']);
    expect(names('corn')).toEqual([
      'huskBack',
      'legLeft',
      'legRight',
      'body',
      'huskFront',
      'silk',
      'eyes'
    ]);
  });

  it('turns the onion from face-on, its base pose, to edge-on on the fourth frame', () => {
    const body = enemyRigs.onion.parts.find((part) => part.name === 'body');
    expect(body?.frames?.[0]).toBe(body?.graphic);
    expect(body?.frames?.[3]).toBe('onion.turn3');
  });

  it('gives the chef a head, a hat, arms and legs', () => {
    expect(chefRig.parts.map((part) => part.name)).toEqual(
      expect.arrayContaining(['head', 'hat', 'armLeft', 'armRight', 'legLeft', 'legRight'])
    );
  });
});

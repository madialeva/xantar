import { describe, expect, it } from 'vitest';
import { FEET_Y, rigPlacement } from './RigDefinition';

/** Where a point of the rig, given in its own coordinates, ends up below the anchor. */
const placed = (scale: number, y: number): number => {
  const placement = rigPlacement({ parts: [], scale });
  return placement.y + y * placement.scale;
};

describe('rigPlacement', () => {
  it('leaves a rig without a scale as it is', () => {
    expect(rigPlacement({ parts: [] })).toEqual({ scaleX: 1, scale: 1, y: 0 });
  });

  it('stretches a rig sideways on top of its scale', () => {
    expect(rigPlacement({ parts: [], scale: 0.5, widen: 1.25 })).toEqual({
      scaleX: 0.625,
      scale: 0.5,
      y: FEET_Y / 2
    });
  });

  it('scales a rig about its feet', () => {
    expect(placed(0.5, FEET_Y)).toBe(FEET_Y);
    expect(placed(0.5, -30)).toBe((-30 + FEET_Y) / 2);
  });
});

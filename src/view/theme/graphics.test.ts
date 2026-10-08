import { describe, expect, it } from 'vitest';
import { GRAPHICS, GRAPHIC_IDS, isGraphicId, segmentParts } from './graphics';

describe('graphics catalogue', () => {
  it('has the three segment graphics of each ingredient, one tile wide', () => {
    for (const kind of ['bunTop', 'lettuce', 'patty', 'bunBottom']) {
      for (const part of ['left', 'mid', 'right']) {
        const id = `${kind}.${part}`;
        expect(isGraphicId(id)).toBe(true);
        if (isGraphicId(id)) expect(GRAPHICS[id].width).toBe(32);
      }
    }
  });

  it('recognises only catalogue ids', () => {
    expect(GRAPHIC_IDS).toContain('platform.left');
    expect(isGraphicId('platform.top')).toBe(false);
    expect(isGraphicId('toString')).toBe(false);
  });
});

describe('segmentParts', () => {
  it('uses both ends and no middle for two tiles', () => {
    expect(segmentParts(2)).toEqual(['left', 'right']);
  });

  it('puts one middle between the ends for three tiles', () => {
    expect(segmentParts(3)).toEqual(['left', 'mid', 'right']);
  });

  it('repeats the middle for four tiles and longer runs', () => {
    expect(segmentParts(4)).toEqual(['left', 'mid', 'mid', 'right']);
    expect(segmentParts(20)).toHaveLength(20);
  });

  it('uses only the middle for a one-tile run', () => {
    expect(segmentParts(1)).toEqual(['mid']);
  });
});

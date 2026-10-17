import { describe, expect, it } from 'vitest';
import { GRAPHICS, GRAPHIC_IDS, isGraphicId } from '../theme/graphics';
import { renderedArt, svgSources } from './sources';
import { svgProblems } from './svgProblems';

describe('art', () => {
  it('has a source for every graphic of the catalogue', () => {
    expect(GRAPHIC_IDS.filter((id) => !svgSources().has(id) && !renderedArt().has(id))).toEqual([]);
  });

  for (const [graphic, source] of svgSources()) {
    it(`${graphic}.svg follows the style guide`, () => {
      expect(isGraphicId(graphic), `unknown graphic id "${graphic}"`).toBe(true);
      if (isGraphicId(graphic)) expect(svgProblems(source, GRAPHICS[graphic])).toEqual([]);
    });
  }
});

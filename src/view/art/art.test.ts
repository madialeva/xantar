import { describe, expect, it } from 'vitest';
import { createThemeRegistry } from '../themes';
import { GRAPHICS, GRAPHIC_IDS, isGraphicId } from '../theme/graphics';
import { artSources } from './sources';
import { svgProblems } from './svgProblems';

const sources = artSources();

describe('SVG art', () => {
  it('has a complete classic theme', () => {
    const classic = sources.get('classic') ?? {};
    expect(GRAPHIC_IDS.filter((id) => classic[id] === undefined)).toEqual([]);
  });

  it('only has folders of registered themes', () => {
    const registry = createThemeRegistry();
    expect([...sources.keys()].filter((theme) => !registry.has(theme))).toEqual([]);
  });

  for (const [theme, art] of sources) {
    for (const [graphic, source] of Object.entries(art)) {
      it(`${theme}/${graphic}.svg follows the style guide`, () => {
        expect(isGraphicId(graphic), `unknown graphic id "${graphic}"`).toBe(true);
        if (isGraphicId(graphic)) expect(svgProblems(source, GRAPHICS[graphic])).toEqual([]);
      });
    }
  }
});

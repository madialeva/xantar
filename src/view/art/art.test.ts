import { describe, expect, it } from 'vitest';
import { GRAPHICS, GRAPHIC_IDS, isGraphicId } from './graphics';
import { renderedArt, svgSources } from './sources';
import { svgProblems } from './svgProblems';

/** How many times its logical size a rendered image is drawn at. */
const RENDER_SCALE = 4;

const pngData = import.meta.glob<string>('./sources/*.png', {
  query: '?inline',
  import: 'default',
  eager: true
});

/** Width and height from the IHDR chunk of a PNG given as a base64 data URL. */
function pngSize(dataUrl: string): { width: number; height: number } {
  const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (char) =>
    char.charCodeAt(0)
  );
  const view = new DataView(bytes.buffer);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe('art', () => {
  it('has exactly one source, SVG or rendered, for every graphic', () => {
    const sources = GRAPHIC_IDS.map((id) => [
      id,
      Number(svgSources().has(id)) + Number(renderedArt().has(id))
    ]);
    expect(sources.filter(([, count]) => count !== 1)).toEqual([]);
  });

  it('has no source for a graphic that is not in the catalogue', () => {
    const files = [...svgSources().keys(), ...renderedArt().keys()];
    expect(files.filter((graphic) => !isGraphicId(graphic))).toEqual([]);
  });

  for (const [path, data] of Object.entries(pngData)) {
    const graphic = path.slice(path.lastIndexOf('/') + 1, -'.png'.length);
    it(`${graphic}.png is rendered at ${RENDER_SCALE}x its logical size`, () => {
      if (!isGraphicId(graphic)) throw new Error(`unknown graphic id "${graphic}"`);
      const { width, height } = GRAPHICS[graphic];
      expect(pngSize(data)).toEqual({ width: width * RENDER_SCALE, height: height * RENDER_SCALE });
    });
  }

  for (const [graphic, source] of svgSources()) {
    it(`${graphic}.svg follows the style guide`, () => {
      expect(isGraphicId(graphic), `unknown graphic id "${graphic}"`).toBe(true);
      if (isGraphicId(graphic)) expect(svgProblems(source, GRAPHICS[graphic])).toEqual([]);
    });
  }
});

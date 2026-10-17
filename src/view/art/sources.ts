const svgFiles = import.meta.glob<string>('./classic/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
});

const pngFiles = import.meta.glob<string>('./classic/*.png', {
  query: '?url',
  import: 'default',
  eager: true
});

const byGraphic = (files: Record<string, string>): ReadonlyMap<string, string> =>
  new Map(
    Object.entries(files).map(([path, value]) => [
      path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.')),
      value
    ])
  );

const svgs = byGraphic(svgFiles);
const pngs = byGraphic(pngFiles);

/** SVG sources of the art, keyed by file name (the graphic id). */
export const svgSources = (): ReadonlyMap<string, string> => svgs;

/** URLs of the rendered (PNG) art, keyed by file name (the graphic id). */
export const renderedArt = (): ReadonlyMap<string, string> => pngs;

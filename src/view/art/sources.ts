const files = import.meta.glob<string>('./*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
});

const renderedFiles = import.meta.glob<string>('./*/*.png', {
  query: '?url',
  import: 'default',
  eager: true
});

const FILE_PATTERN = /^\.\/([^/]+)\/([^/]+)\.svg$/;

/** URL of a rendered (PNG) graphic that stands in for the SVG source, if the theme folder has one. */
export function renderedArtUrl(theme: string, graphic: string): string | undefined {
  return renderedFiles[`./${theme}/${graphic}.png`];
}

/** SVG sources grouped by theme folder and keyed by file name (the graphic id). */
export function artSources(): ReadonlyMap<string, Readonly<Record<string, string>>> {
  const byTheme = new Map<string, Record<string, string>>();
  for (const [path, source] of Object.entries(files)) {
    const match = FILE_PATTERN.exec(path);
    if (!match) continue;
    const [, theme, graphic] = match;
    const art = byTheme.get(theme) ?? {};
    art[graphic] = source;
    byTheme.set(theme, art);
  }
  return byTheme;
}

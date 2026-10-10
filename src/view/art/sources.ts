const files = import.meta.glob<string>('./*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
});

const FILE_PATTERN = /^\.\/([^/]+)\/([^/]+)\.svg$/;

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

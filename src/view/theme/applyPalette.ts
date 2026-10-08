import { PALETTE_TOKENS, type Palette, isColor } from './palette';

const OPENING_SVG_TAG = /<svg\b[^>]*>/;

/** Style rules that give each palette token its fill (`f-`), stroke (`s-`) and stop (`c-`) color. */
export function paletteStyle(palette: Palette): string {
  const rules = PALETTE_TOKENS.map((token) => {
    const color = palette[token];
    if (!isColor(color)) throw new Error(`Invalid color for palette token "${token}": ${color}`);
    return `.f-${token}{fill:${color}}.s-${token}{stroke:${color}}.c-${token}{stop-color:${color}}`;
  });
  return `<style>${rules.join('')}</style>`;
}

/** Returns the SVG source with the palette style inserted right after its opening tag. */
export function applyPalette(svg: string, palette: Palette): string {
  const match = OPENING_SVG_TAG.exec(svg);
  if (!match) throw new Error('The source has no <svg> element');
  const end = match.index + match[0].length;
  return `${svg.slice(0, end)}${paletteStyle(palette)}${svg.slice(end)}`;
}

/** Returns the SVG source with its root width and height set, keeping the view box. */
export function withSize(svg: string, width: number, height: number): string {
  return svg.replace(OPENING_SVG_TAG, (tag) =>
    tag
      .replace(/\swidth="[^"]*"/, ` width="${width}"`)
      .replace(/\sheight="[^"]*"/, ` height="${height}"`)
  );
}

import { describe, expect, it } from 'vitest';
import { applyPalette, paletteStyle } from './applyPalette';
import { PALETTE_TOKENS, type Palette } from './palette';

const palette = (color = '#e0a96d'): Palette =>
  Object.fromEntries(PALETTE_TOKENS.map((token) => [token, color])) as Palette;

describe('applyPalette', () => {
  it('inserts the palette style right after the opening svg tag', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect class="f-bun"/></svg>';
    const result = applyPalette(svg, palette());
    expect(
      result.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>')
    ).toBe(true);
    expect(result.endsWith('</style><rect class="f-bun"/></svg>')).toBe(true);
  });

  it('keeps an XML prologue and comments before the svg element', () => {
    const svg = '<?xml version="1.0"?>\n<!-- art -->\n<svg viewBox="0 0 1 1"></svg>';
    const result = applyPalette(svg, palette());
    expect(
      result.startsWith('<?xml version="1.0"?>\n<!-- art -->\n<svg viewBox="0 0 1 1"><style>')
    ).toBe(true);
  });

  it('defines fill, stroke and stop rules for every token', () => {
    const style = paletteStyle({ ...palette('#000000'), bun: '#e0a96d', outline: '#2b2f36' });
    expect(style).toContain('.f-bun{fill:#e0a96d}');
    expect(style).toContain('.s-outline{stroke:#2b2f36}');
    expect(style).toContain('.c-bun{stop-color:#e0a96d}');
    for (const token of PALETTE_TOKENS) expect(style).toContain(`.f-${token}{`);
  });

  it('rejects colors that are not six-digit hex values', () => {
    expect(() => paletteStyle({ ...palette(), bun: 'red;}</style><script>' })).toThrow(/"bun"/);
  });

  it('rejects a source without an svg element', () => {
    expect(() => applyPalette('<g/>', palette())).toThrow(/no <svg>/);
  });
});

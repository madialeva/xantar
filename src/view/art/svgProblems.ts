import type { GraphicSize } from '../theme/graphics';
import { isPaletteToken } from '../theme/palette';

const OPENING_SVG_TAG = /<svg\b([^>]*)>/;
const ATTRIBUTE = /([\w:-]+)\s*=\s*"([^"]*)"/g;
const FORBIDDEN_ELEMENTS = ['style', 'script', 'image', 'foreignObject'];
const COLOR_ATTRIBUTES = ['fill', 'stroke', 'stop-color', 'color', 'flood-color', 'lighting-color'];
const TOKEN_CLASS = /^[fsc]-(.+)$/;
const LOCAL_REFERENCE = /^url\(#[\w-]+\)$/;

const attributesOf = (text: string): [string, string][] =>
  [...text.matchAll(ATTRIBUTE)].map((match) => [match[1], match[2]]);

/** Breaks of the authoring convention of the style guide, as readable messages. */
export function svgProblems(svg: string, expected: GraphicSize): string[] {
  const problems: string[] = [];
  const opening = OPENING_SVG_TAG.exec(svg);
  if (!opening) return ['no <svg> element'];
  const root = new Map(attributesOf(opening[1]));
  const { width, height } = expected;
  if (root.get('xmlns') !== 'http://www.w3.org/2000/svg') problems.push('missing svg xmlns');
  if (root.get('viewBox') !== `0 0 ${width} ${height}`) {
    problems.push(
      `viewBox is "${root.get('viewBox')}" but the catalogue says "0 0 ${width} ${height}"`
    );
  }
  if (root.get('width') !== String(width) || root.get('height') !== String(height)) {
    problems.push(`width and height must be ${width} and ${height}`);
  }
  for (const element of FORBIDDEN_ELEMENTS) {
    if (new RegExp(`<${element}\\b`).test(svg)) problems.push(`forbidden element <${element}>`);
  }
  const literal = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.exec(svg);
  if (literal) problems.push(`literal color "${literal[0]}"`);
  for (const [name, value] of attributesOf(svg)) {
    if (name === 'style') problems.push(`style attribute "${value}"`);
    if (COLOR_ATTRIBUTES.includes(name) && value !== 'none' && !LOCAL_REFERENCE.test(value)) {
      problems.push(`${name}="${value}" (use a palette class)`);
    }
    if (name === 'class') {
      for (const className of value.split(/\s+/).filter(Boolean)) {
        const token = TOKEN_CLASS.exec(className)?.[1];
        if (token === undefined) problems.push(`class "${className}" is not a palette class`);
        else if (!isPaletteToken(token)) problems.push(`unknown palette token in "${className}"`);
      }
    }
  }
  return problems;
}

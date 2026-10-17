import { describe, expect, it } from 'vitest';
import { svgProblems } from './svgProblems';

const box = { width: 32, height: 14 };
const svg = (body: string, root = 'viewBox="0 0 32 14" width="32" height="14"'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root}>${body}</svg>`;

describe('svgProblems', () => {
  it('accepts a source that follows the convention', () => {
    const source = svg(
      '<rect class="f-platform s-outline" x="1" y="1" width="30" height="11" rx="3" stroke-width="1.5" fill-opacity="0.9"/><path d="M0 0" fill="none" class="s-outline"/><rect fill="url(#dots)"/>'
    );
    expect(svgProblems(source, box)).toEqual([]);
  });

  it('reports literal colors in any form', () => {
    expect(svgProblems(svg('<rect fill="#7b3f1d"/>'), box).join()).toMatch(
      /literal color "#7b3f1d"/
    );
    expect(svgProblems(svg('<rect fill="rgb(1,2,3)"/>'), box).join()).toMatch(/literal color/);
    expect(svgProblems(svg('<rect stroke="red"/>'), box).join()).toMatch(/stroke="red"/);
    expect(svgProblems(svg('<rect fill="url(http://x/y.svg#a)"/>'), box).join()).toMatch(/fill=/);
    expect(svgProblems(svg('<rect style="fill:#000"/>'), box).join()).toMatch(/style attribute/);
  });

  it('reports classes that are not palette tokens', () => {
    expect(svgProblems(svg('<rect class="f-gold"/>'), box)).toEqual([
      'unknown palette token in "f-gold"'
    ]);
    expect(svgProblems(svg('<rect class="big"/>'), box)).toEqual([
      'class "big" is not a palette class'
    ]);
  });

  it('reports a size that does not match the catalogue', () => {
    const problems = svgProblems(svg('', 'viewBox="0 0 32 16" width="32" height="16"'), box);
    expect(problems.join()).toMatch(/viewBox is "0 0 32 16"/);
    expect(problems.join()).toMatch(/width and height must be 32 and 14/);
  });

  it('reports forbidden elements and a missing namespace', () => {
    expect(svgProblems(svg('<style>.a{}</style>'), box)).toContain('forbidden element <style>');
    expect(svgProblems(svg('<image href="x.png"/>'), box)).toContain('forbidden element <image>');
    expect(svgProblems('<svg viewBox="0 0 32 14" width="32" height="14"/>', box)).toContain(
      'missing svg xmlns'
    );
    expect(svgProblems('<g/>', box)).toEqual(['no <svg> element']);
  });
});

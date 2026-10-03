import type { Level } from '../level/Level';
import { levelFromGrid } from './grids';

export interface Shape {
  readonly cols: number;
  readonly rows: number;
  readonly platforms: readonly (readonly [row: number, from: number, to: number])[];
  readonly ladders: readonly (readonly [col: number, top: number, bottom: number])[];
}

export const levelFromShape = ({ cols, rows, platforms, ladders }: Shape): Level => {
  const structure = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '.'));
  for (const [row, from, to] of platforms) {
    for (let col = from; col <= to; col++) structure[row][col] = '=';
  }
  for (const [col, top, bottom] of ladders) {
    for (let row = top; row <= bottom; row++) structure[row][col] = 'H';
    structure[top][col] = '+';
    structure[bottom][col] = '+';
  }
  const [row, from] = platforms[0];
  const actors = Array.from({ length: rows }, () => '.'.repeat(cols).split(''));
  actors[row][from] = 'C';
  return levelFromGrid({
    structure: structure.map((cells) => cells.join('')),
    actors: actors.map((cells) => cells.join(''))
  });
};

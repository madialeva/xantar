import { assembleLevel } from '../level/assembleLevel';
import { LEVEL_FORMAT, LEVEL_VERSION, type LevelDocument } from '../level/LevelDocument';
import type { Level } from '../level/Level';
import type { PieceRegistry } from '../level/pieces/PieceRegistry';

export interface GridSpec {
  readonly structure: readonly string[];
  readonly ingredients?: readonly string[];
  readonly actors?: readonly string[];
  readonly segments?: number;
  readonly name?: string;
}

export const documentFromGrid = (spec: GridSpec): LevelDocument => {
  const rows = spec.structure.length;
  const cols = spec.structure[0].length;
  const blank = Array.from({ length: rows }, () => '.'.repeat(cols));
  return {
    format: LEVEL_FORMAT,
    version: LEVEL_VERSION,
    name: spec.name ?? 'Test',
    cols,
    rows,
    segments: spec.segments ?? 4,
    layers: {
      structure: spec.structure,
      ingredients: spec.ingredients ?? blank,
      actors: spec.actors ?? blank
    }
  };
};

export const levelFromGrid = (spec: GridSpec, registry?: PieceRegistry): Level =>
  assembleLevel(documentFromGrid(spec), registry);

export const tinyGrid: GridSpec = {
  structure: [
    '........',
    '........',
    '===+====',
    '...H....',
    '...H....',
    '===+====',
    '........',
    '.____...'
  ],
  ingredients: [
    '........',
    '........',
    '.TTTT...',
    '........',
    '........',
    '.BBBB...',
    '........',
    '........'
  ],
  actors: [
    '........',
    '........',
    '........',
    '........',
    '........',
    '......C.',
    '........',
    '........'
  ]
};

export const withGrid = (overrides: Partial<GridSpec>): GridSpec => ({ ...tinyGrid, ...overrides });

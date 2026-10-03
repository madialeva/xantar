import { describe, expect, it } from 'vitest';
import classicDocument from '../../../levels/classic.level.json';
import { levelFromGrid, tinyGrid, withGrid } from '../../testing/grids';
import { assembleLevel } from '../assembleLevel';
import { parseLevelDocument } from '../levelJson';
import { validateLevel } from './validateLevel';

const codes = (grid: Parameters<typeof levelFromGrid>[0]): string[] =>
  validateLevel(levelFromGrid(grid)).map((issue) => issue.code);

describe('validateLevel', () => {
  it('finds nothing wrong in the classic level', () => {
    expect(validateLevel(assembleLevel(parseLevelDocument(classicDocument)))).toEqual([]);
  });

  it('finds nothing wrong in a small playable level', () => {
    expect(validateLevel(levelFromGrid(tinyGrid))).toEqual([]);
  });

  it('reports an ingredient on a platform the chef cannot reach', () => {
    const structure = ['=====...', ...tinyGrid.structure.slice(1)];
    const ingredients = ['.TTTT...', ...(tinyGrid.ingredients ?? []).slice(1)];
    const issues = validateLevel(levelFromGrid(withGrid({ structure, ingredients })));
    expect(issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        code: 'ingredient-unreachable',
        row: 0,
        col: 1
      })
    );
  });

  it('reports an ingredient whose fall does not end on a plate', () => {
    const structure = [...tinyGrid.structure.slice(0, 7), '........'];
    const issues = validateLevel(levelFromGrid(withGrid({ structure })));
    const noPlate = issues.filter((issue) => issue.code === 'ingredient-no-plate');
    expect(noPlate.map((issue) => [issue.severity, issue.row, issue.col])).toEqual([
      ['error', 2, 1],
      ['error', 5, 1]
    ]);
  });

  it('reports a dangling ladder at the loose end', () => {
    const structure = [...tinyGrid.structure];
    structure[6] = '...H....';
    const issues = validateLevel(levelFromGrid(withGrid({ structure })));
    expect(issues).toContainEqual(
      expect.objectContaining({ severity: 'error', code: 'ladder-dangling', row: 6, col: 3 })
    );
  });

  it('reports a level without ingredients', () => {
    expect(codes(withGrid({ ingredients: tinyGrid.structure.map(() => '........') }))).toContain(
      'no-ingredients'
    );
  });

  it('warns about an empty plate with its position', () => {
    const grid = {
      structure: ['..........', '==========', '..........', '.____.____', '..........'],
      ingredients: ['..........', '.TTTT.....', '..........', '..........', '..........'],
      actors: ['..........', '.......C..', '..........', '..........', '..........']
    };
    const issues = validateLevel(levelFromGrid(grid));
    expect(issues).toEqual([
      {
        severity: 'warning',
        code: 'plate-empty',
        message: 'No ingredient falls onto this plate',
        row: 3,
        col: 6
      }
    ]);
  });

  it('warns about a platform the chef cannot reach', () => {
    const structure = [...tinyGrid.structure];
    structure[0] = '=====...';
    const issues = validateLevel(levelFromGrid(withGrid({ structure })));
    expect(issues).toContainEqual(
      expect.objectContaining({ severity: 'warning', code: 'platform-unreachable', row: 0, col: 0 })
    );
  });

  it('warns about an enemy spawn the chef cannot reach', () => {
    const structure = [...tinyGrid.structure];
    structure[0] = '=====...';
    const actors = [...(tinyGrid.actors ?? [])];
    actors[0] = '..h.....';
    const issues = validateLevel(levelFromGrid(withGrid({ structure, actors })));
    expect(issues).toContainEqual(
      expect.objectContaining({ severity: 'warning', code: 'spawn-unreachable', row: 0, col: 2 })
    );
  });

  it('reports every issue at once, not only the first', () => {
    const structure = [...tinyGrid.structure.slice(0, 5), ...['...H....', '........']];
    structure[5] = '===+====';
    structure[6] = '...H....';
    structure[7] = '........';
    const found = codes(withGrid({ structure }));
    expect(found).toContain('ladder-dangling');
    expect(found).toContain('ingredient-no-plate');
  });
});

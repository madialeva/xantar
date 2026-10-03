import { describe, expect, it } from 'vitest';
import classicDocument from '../../levels/classic.level.json';
import { documentFromGrid, tinyGrid, withGrid } from '../testing/grids';
import { loadLevel, loadLevelJson, UnplayableLevelError } from './loadLevel';
import { parseLevelDocument, serializeLevel } from './levelJson';

const noPlate = documentFromGrid(
  withGrid({ structure: [...tinyGrid.structure.slice(0, 7), '........'] })
);

const warningsOnly = documentFromGrid({
  structure: ['..........', '==========', '..........', '.____.____', '..........'],
  ingredients: ['..........', '.TTTT.....', '..........', '..........', '..........'],
  actors: ['..........', '.......C..', '..........', '..........', '..........']
});

describe('loadLevel', () => {
  it('loads the classic level', () => {
    expect(loadLevel(parseLevelDocument(classicDocument)).name).toBe('Classic');
  });

  it('rejects by default a level with a playability error and lists it', () => {
    expect(() => loadLevel(noPlate)).toThrow(UnplayableLevelError);
    expect(() => loadLevel(noPlate)).toThrow(/ingredient-no-plate.*row 2, column 1/s);
  });

  it('exposes the issues of the rejection', () => {
    try {
      loadLevel(noPlate);
    } catch (error) {
      expect(error).toBeInstanceOf(UnplayableLevelError);
      expect((error as UnplayableLevelError).issues.map((issue) => issue.code)).toEqual([
        'ingredient-no-plate',
        'ingredient-no-plate'
      ]);
      return;
    }
    throw new Error('Expected the load to fail');
  });

  it('loads the same level when errors are accepted', () => {
    const level = loadLevel(noPlate, { requirePlayable: false });
    expect(level.ingredients).toHaveLength(2);
  });

  it('never rejects a level because of warnings', () => {
    expect(() => loadLevel(warningsOnly)).not.toThrow();
  });
});

describe('loadLevelJson', () => {
  it('loads a level from text', () => {
    const text = serializeLevel(parseLevelDocument(classicDocument));
    expect(loadLevelJson(text).plates).toHaveLength(4);
  });

  it('applies the same policy to text', () => {
    const text = serializeLevel(noPlate);
    expect(() => loadLevelJson(text)).toThrow(UnplayableLevelError);
    expect(() => loadLevelJson(text, { requirePlayable: false })).not.toThrow();
  });
});

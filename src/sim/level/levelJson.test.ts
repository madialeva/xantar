import { describe, expect, it } from 'vitest';
import { LEVEL_FORMAT, type LevelDocument } from './LevelDocument';
import { LevelError } from './LevelError';
import { parseLevelDocument, parseLevelJson, serializeLevel } from './levelJson';

const base = (): Record<string, unknown> => ({
  format: LEVEL_FORMAT,
  version: 1,
  name: 'Tiny',
  cols: 4,
  rows: 2,
  layers: {
    structure: ['....', '===='],
    ingredients: ['....', '....'],
    actors: ['....', 'C...']
  }
});

const capture = (action: () => unknown): LevelError => {
  try {
    action();
  } catch (error) {
    if (error instanceof LevelError) return error;
    throw error;
  }
  throw new Error('Expected a LevelError');
};

describe('parseLevelDocument', () => {
  it('reads a valid document and applies the default segments', () => {
    const document = parseLevelDocument(base());
    expect(document).toMatchObject({ name: 'Tiny', cols: 4, rows: 2, segments: 4, version: 1 });
    expect(document.layers.actors[1]).toBe('C...');
  });

  it('accepts the allowed segment counts', () => {
    for (const segments of [2, 3, 4]) {
      expect(parseLevelDocument({ ...base(), segments }).segments).toBe(segments);
    }
  });

  it('rejects a segment count that is not allowed', () => {
    const error = capture(() => parseLevelDocument({ ...base(), segments: 5 }));
    expect(error.message).toMatch(/segments.*2, 3, 4.*5/);
  });

  it('rejects an unknown format', () => {
    expect(() => parseLevelDocument({ ...base(), format: 'other' })).toThrow(/format/);
  });

  it('rejects a version newer than the supported one, naming both', () => {
    const error = capture(() => parseLevelDocument({ ...base(), version: 2 }));
    expect(error.message).toMatch(/version 2.*up to version 1/);
  });

  it('rejects an invalid version', () => {
    expect(() => parseLevelDocument({ ...base(), version: 0 })).toThrow(/version/);
    expect(() => parseLevelDocument({ ...base(), version: 1.5 })).toThrow(/version/);
  });

  it('rejects a document that is not an object', () => {
    expect(() => parseLevelDocument(null)).toThrow(LevelError);
    expect(() => parseLevelDocument([])).toThrow(LevelError);
  });

  it('rejects invalid dimensions and a missing name', () => {
    expect(() => parseLevelDocument({ ...base(), cols: 0 })).toThrow(/cols/);
    expect(() => parseLevelDocument({ ...base(), rows: 'x' })).toThrow(/rows/);
    expect(() => parseLevelDocument({ ...base(), name: undefined })).toThrow(/name/);
  });

  it('rejects a layer with the wrong number of rows and names the layer', () => {
    const layers = { ...(base().layers as object), actors: ['....'] };
    const error = capture(() => parseLevelDocument({ ...base(), layers }));
    expect(error.layer).toBe('actors');
  });

  it('rejects a row with the wrong length and gives layer and row', () => {
    const layers = { ...(base().layers as object), ingredients: ['....', '...'] };
    const error = capture(() => parseLevelDocument({ ...base(), layers }));
    expect([error.layer, error.row]).toEqual(['ingredients', 1]);
  });

  it('rejects a missing layer', () => {
    const layers = { structure: ['....', '===='], actors: ['....', 'C...'] };
    expect(() => parseLevelDocument({ ...base(), layers })).toThrow(/ingredients/);
  });

  it('rejects a row that is not a string', () => {
    const layers = { ...(base().layers as object), structure: ['....', 7] };
    expect(() => parseLevelDocument({ ...base(), layers })).toThrow(/string/);
  });
});

describe('parseLevelJson', () => {
  it('reads a document from text', () => {
    expect(parseLevelJson(JSON.stringify(base())).name).toBe('Tiny');
  });

  it('rejects text that is not JSON', () => {
    expect(() => parseLevelJson('{ not json')).toThrow(/not valid JSON/);
  });
});

describe('serializeLevel', () => {
  const document: LevelDocument = parseLevelDocument(base());

  it('writes one string per row of each layer', () => {
    const lines = serializeLevel(document).split('\n');
    expect(lines).toContain('      "C..."');
    expect(lines).toContain('    "structure": [');
    expect(lines.at(-1)).toBe('');
  });

  it('reads back to the same document', () => {
    expect(parseLevelJson(serializeLevel(document))).toEqual(document);
  });

  it('is stable: serializing twice gives the same text', () => {
    const text = serializeLevel(document);
    expect(serializeLevel(parseLevelJson(text))).toBe(text);
  });

  it('always writes the segments', () => {
    expect(serializeLevel(document)).toContain('"segments": 4');
  });
});

import {
  ALLOWED_SEGMENTS,
  DEFAULT_SEGMENTS,
  LEVEL_FORMAT,
  LEVEL_VERSION,
  type LevelDocument
} from './LevelDocument';
import { LAYER_IDS, LevelError } from './LevelError';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requirePositiveInteger = (record: UnknownRecord, key: 'cols' | 'rows'): number => {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new LevelError(`The level "${key}" must be a positive integer`);
  }
  return value;
};

function readSegments(record: UnknownRecord): number {
  const value = record.segments;
  if (value === undefined) return DEFAULT_SEGMENTS;
  if (typeof value !== 'number' || !ALLOWED_SEGMENTS.includes(value)) {
    throw new LevelError(
      `The level "segments" must be one of ${ALLOWED_SEGMENTS.join(', ')} (found ${JSON.stringify(value)})`
    );
  }
  return value;
}

function readLayers(record: UnknownRecord, cols: number, rows: number): LevelDocument['layers'] {
  const layers = record.layers;
  if (!isRecord(layers)) throw new LevelError('The level "layers" must be an object');
  const result = {} as Record<(typeof LAYER_IDS)[number], readonly string[]>;
  for (const layer of LAYER_IDS) {
    const grid = layers[layer];
    if (!Array.isArray(grid)) throw new LevelError('The layer must be a list of rows', { layer });
    if (grid.length !== rows) {
      throw new LevelError(`The layer has ${grid.length} rows but the level has ${rows}`, {
        layer
      });
    }
    grid.forEach((line: unknown, row) => {
      if (typeof line !== 'string')
        throw new LevelError('The row must be a string', { layer, row });
      if (line.length !== cols) {
        throw new LevelError(`The row has ${line.length} columns but the level has ${cols}`, {
          layer,
          row
        });
      }
    });
    result[layer] = grid as string[];
  }
  return result;
}

export function parseLevelDocument(value: unknown): LevelDocument {
  if (!isRecord(value)) throw new LevelError('The level must be a JSON object');
  if (value.format !== LEVEL_FORMAT) {
    throw new LevelError(`Unsupported level format (expected "${LEVEL_FORMAT}")`);
  }
  const version = value.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new LevelError('The level "version" must be a positive integer');
  }
  if (version > LEVEL_VERSION) {
    throw new LevelError(
      `Unsupported level version ${version} (this game supports up to version ${LEVEL_VERSION})`
    );
  }
  if (typeof value.name !== 'string') throw new LevelError('The level "name" must be a string');
  const cols = requirePositiveInteger(value, 'cols');
  const rows = requirePositiveInteger(value, 'rows');
  return {
    format: LEVEL_FORMAT,
    version,
    name: value.name,
    cols,
    rows,
    segments: readSegments(value),
    layers: readLayers(value, cols, rows)
  };
}

export function parseLevelJson(text: string): LevelDocument {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new LevelError(`The level is not valid JSON: ${reason}`);
  }
  return parseLevelDocument(value);
}

export function serializeLevel(document: LevelDocument): string {
  const indent = (depth: number): string => '  '.repeat(depth);
  const layers = LAYER_IDS.map((layer) => {
    const rows = document.layers[layer].map((row) => `${indent(3)}${JSON.stringify(row)}`);
    return `${indent(2)}${JSON.stringify(layer)}: [\n${rows.join(',\n')}\n${indent(2)}]`;
  });
  return [
    '{',
    `${indent(1)}"format": ${JSON.stringify(document.format)},`,
    `${indent(1)}"version": ${document.version},`,
    `${indent(1)}"name": ${JSON.stringify(document.name)},`,
    `${indent(1)}"cols": ${document.cols},`,
    `${indent(1)}"rows": ${document.rows},`,
    `${indent(1)}"segments": ${document.segments},`,
    `${indent(1)}"layers": {`,
    layers.join(',\n'),
    `${indent(1)}}`,
    '}',
    ''
  ].join('\n');
}

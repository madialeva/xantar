export type LayerId = 'structure' | 'ingredients' | 'actors';

export const LAYER_IDS: readonly LayerId[] = ['structure', 'ingredients', 'actors'];

export interface LevelErrorPosition {
  readonly layer?: LayerId;
  readonly row?: number;
  readonly col?: number;
}

const describePosition = ({ layer, row, col }: LevelErrorPosition): string => {
  const parts: string[] = [];
  if (layer !== undefined) parts.push(`layer ${layer}`);
  if (row !== undefined) parts.push(`row ${row}`);
  if (col !== undefined) parts.push(`column ${col}`);
  return parts.join(', ');
};

/**
 * Error for an invalid level document; says the layer, row and column when it can.
 */
export class LevelError extends Error {
  readonly layer: LayerId | undefined;
  readonly row: number | undefined;
  readonly col: number | undefined;

  constructor(message: string, position: LevelErrorPosition = {}) {
    const where = describePosition(position);
    super(where === '' ? message : `${message} (${where})`);
    this.name = 'LevelError';
    this.layer = position.layer;
    this.row = position.row;
    this.col = position.col;
  }
}

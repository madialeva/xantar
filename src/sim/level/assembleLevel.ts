import type { LevelDocument } from './LevelDocument';
import { LAYER_IDS, LevelError } from './LevelError';
import type { Level } from './Level';
import { LevelAssembly } from './LevelAssembly';
import { PieceRegistry } from './pieces/PieceRegistry';

export function assembleLevel(
  document: LevelDocument,
  registry: PieceRegistry = PieceRegistry.createDefault()
): Level {
  const assembly = new LevelAssembly(
    document.name,
    document.cols,
    document.rows,
    document.segments
  );
  for (const layer of LAYER_IDS) {
    document.layers[layer].forEach((line, row) => {
      let col = 0;
      while (col < line.length) {
        const symbol = line[col];
        const piece = registry.resolve(layer, symbol);
        if (piece === undefined) {
          throw new LevelError(`Unknown symbol "${symbol}"`, { layer, row, col });
        }
        let end = col + 1;
        while (end < line.length && line[end] === symbol) end += 1;
        const width = piece.width === 'unit' ? document.segments : piece.width;
        const length = end - col;
        if (length % width !== 0) {
          throw new LevelError(
            `A run of ${length} "${symbol}" tiles is not a multiple of the piece width ${width}`,
            { layer, row, col }
          );
        }
        for (let start = col; start < end; start += width) {
          piece.contribute({ row, col: start, width }, assembly);
        }
        col = end;
      }
    });
  }
  return assembly.build();
}

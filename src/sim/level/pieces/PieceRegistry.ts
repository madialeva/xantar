import type { LayerId } from '../LevelError';
import { LAYER_IDS } from '../LevelError';
import { defaultPieces } from './defaultPieces';
import type { PieceDefinition } from './PieceDefinition';

export class PieceRegistry {
  readonly #byLayer = new Map<LayerId, Map<string, PieceDefinition>>(
    LAYER_IDS.map((layer) => [layer, new Map()])
  );

  static createDefault(): PieceRegistry {
    const registry = new PieceRegistry();
    for (const piece of defaultPieces) registry.register(piece);
    return registry;
  }

  register(piece: PieceDefinition): void {
    if (piece.symbol.length !== 1) {
      throw new Error(`The symbol of piece "${piece.id}" must be a single character`);
    }
    if (piece.width !== 'unit' && (!Number.isInteger(piece.width) || piece.width < 1)) {
      throw new Error(`The width of piece "${piece.id}" must be a positive integer or "unit"`);
    }
    const symbols = this.#symbolsOf(piece.layer);
    const existing = symbols.get(piece.symbol);
    if (existing !== undefined) {
      throw new Error(
        `Symbol "${piece.symbol}" of layer ${piece.layer} is already used by piece "${existing.id}"`
      );
    }
    symbols.set(piece.symbol, piece);
  }

  resolve(layer: LayerId, symbol: string): PieceDefinition | undefined {
    return this.#symbolsOf(layer).get(symbol);
  }

  pieces(layer: LayerId): readonly PieceDefinition[] {
    return [...this.#symbolsOf(layer).values()];
  }

  #symbolsOf(layer: LayerId): Map<string, PieceDefinition> {
    const symbols = this.#byLayer.get(layer);
    if (symbols === undefined) throw new Error(`Unknown layer "${layer}"`);
    return symbols;
  }
}

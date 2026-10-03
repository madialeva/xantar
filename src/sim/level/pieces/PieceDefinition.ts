import type { EnemyKind, IngredientKind } from '../kinds';
import type { LayerId } from '../LevelError';

export interface Placement {
  readonly row: number;
  readonly col: number;
  readonly width: number;
}

/**
 * What a piece can add to a level while it is being assembled.
 */
export interface LevelBuilder {
  addPlatform(row: number, col: number): void;
  addLadder(row: number, col: number): void;
  addPlate(placement: Placement): void;
  addIngredient(kind: IngredientKind, placement: Placement): void;
  setChefStart(placement: Placement): void;
  addEnemySpawn(kind: EnemyKind, placement: Placement): void;
}

/**
 * A piece of the level palette: its symbol, layer and width, and what it contributes to
 * the level. Contains nothing graphical.
 */
export interface PieceDefinition {
  readonly id: string;
  readonly symbol: string;
  readonly layer: LayerId;
  readonly width: number | 'unit';
  contribute(placement: Placement, builder: LevelBuilder): void;
}

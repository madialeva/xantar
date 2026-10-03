import type { EnemyKind, IngredientKind } from '../kinds';
import type { LayerId } from '../LevelError';

export interface Placement {
  readonly row: number;
  readonly col: number;
  readonly width: number;
}

export interface LevelBuilder {
  addPlatform(row: number, col: number): void;
  addLadder(row: number, col: number): void;
  addPlate(placement: Placement): void;
  addIngredient(kind: IngredientKind, placement: Placement): void;
  setChefStart(placement: Placement): void;
  addEnemySpawn(kind: EnemyKind, placement: Placement): void;
}

export interface PieceDefinition {
  readonly id: string;
  readonly symbol: string;
  readonly layer: LayerId;
  readonly width: number | 'unit';
  contribute(placement: Placement, builder: LevelBuilder): void;
}

export type IngredientKind = 'bunBottom' | 'patty' | 'lettuce' | 'bunTop';

export type EnemyKind = 'hotdog' | 'pickle' | 'egg';

export interface PlatformData {
  readonly row: number;
  readonly x0: number;
  readonly x1: number;
}

export interface LadderData {
  readonly col: number;
  readonly topRow: number;
  readonly bottomRow: number;
}

export interface PlateData {
  readonly row: number;
  readonly x0: number;
  readonly x1: number;
}

export interface IngredientData {
  readonly kind: IngredientKind;
  readonly row: number;
  readonly x0: number;
  readonly x1: number;
}

export interface CellData {
  readonly row: number;
  readonly col: number;
}

export interface EnemyStartData extends CellData {
  readonly kind: EnemyKind;
}

export interface LevelData {
  readonly cols: number;
  readonly rows: number;
  readonly platforms: readonly PlatformData[];
  readonly ladders: readonly LadderData[];
  readonly plates: readonly PlateData[];
  readonly ingredients: readonly IngredientData[];
  readonly chefStart: CellData;
  readonly enemyStarts: readonly EnemyStartData[];
  readonly respawnPoints: readonly CellData[];
}

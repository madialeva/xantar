import type { EnemyKind, IngredientKind } from '../kinds';
import type { LayerId } from '../LevelError';
import type { LevelBuilder, PieceDefinition, Placement } from './PieceDefinition';

type Contribute = (placement: Placement, builder: LevelBuilder) => void;

const piece = (
  layer: LayerId,
  id: string,
  symbol: string,
  width: number | 'unit',
  contribute: Contribute
): PieceDefinition => ({ id, symbol, layer, width, contribute });

const nothing: Contribute = () => undefined;

const ingredient = (id: IngredientKind, symbol: string): PieceDefinition =>
  piece('ingredients', id, symbol, 'unit', (placement, builder) =>
    builder.addIngredient(id, placement)
  );

const enemy = (id: EnemyKind, symbol: string): PieceDefinition =>
  piece('actors', id, symbol, 1, (placement, builder) => builder.addEnemySpawn(id, placement));

export const defaultPieces: readonly PieceDefinition[] = [
  piece('structure', 'empty', '.', 1, nothing),
  piece('structure', 'platform', '=', 1, ({ row, col }, builder) => builder.addPlatform(row, col)),
  piece('structure', 'ladder', 'H', 1, ({ row, col }, builder) => builder.addLadder(row, col)),
  piece('structure', 'crossing', '+', 1, ({ row, col }, builder) => {
    builder.addPlatform(row, col);
    builder.addLadder(row, col);
  }),
  piece('structure', 'plate', '_', 'unit', (placement, builder) => builder.addPlate(placement)),
  piece('ingredients', 'empty', '.', 1, nothing),
  ingredient('bunTop', 'T'),
  ingredient('lettuce', 'L'),
  ingredient('patty', 'P'),
  ingredient('bunBottom', 'B'),
  piece('actors', 'empty', '.', 1, nothing),
  piece('actors', 'chef', 'C', 1, (placement, builder) => builder.setChefStart(placement)),
  enemy('hotdog', 'h'),
  enemy('pickle', 'p'),
  enemy('egg', 'e')
];

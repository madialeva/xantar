import type { IngredientKind } from './sim';

export const TILE = 32;
export const COLS = 20;
export const ROWS = 15;
export const GAME_WIDTH = COLS * TILE;
export const GAME_HEIGHT = ROWS * TILE;

export const INGREDIENT_COLORS: Record<IngredientKind, number> = {
  bunBottom: 0xe0a96d,
  patty: 0x7a3e12,
  lettuce: 0x5fbf4a,
  bunTop: 0xe0a96d
};

export const INGREDIENT_HEIGHTS: Record<IngredientKind, number> = {
  bunBottom: 12,
  patty: 14,
  lettuce: 10,
  bunTop: 16
};

export const COLORS = {
  background: '#101418',
  platform: 0x3a4551,
  ladder: 0x9a6b3f,
  plate: 0xb8c0c8,
  chef: 0xffffff,
  hud: '#ffffff',
  danger: '#ff5252'
};

export const LANE_STACK_HEIGHT = 11;

export const platformY = (row: number): number => (row + 0.5) * TILE;

export const TILE = 32;
export const COLS = 20;
export const ROWS = 15;
export const GAME_WIDTH = COLS * TILE;
export const GAME_HEIGHT = ROWS * TILE;

export const PLATFORM_ROWS = [3, 6, 9, 12];
export const PLATE_ROW = 14;
export const LADDER_COLS = [0, 9, 10, 19];

export interface Lane {
  id: number;
  x0: number;
  x1: number;
}

export const LANES: Lane[] = [
  { id: 0, x0: 1, x1: 4 },
  { id: 1, x0: 5, x1: 8 },
  { id: 2, x0: 11, x1: 14 },
  { id: 3, x0: 15, x1: 18 }
];

export type IngredientKind = 'bunBottom' | 'patty' | 'lettuce' | 'bunTop';

export const BURGER_STACK: IngredientKind[] = ['bunBottom', 'patty', 'lettuce', 'bunTop'];

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

export const CHEF_SPEED = 115;
export const ENEMY_SPEED = 68;
export const CLIMB_SPEED = 80;
export const START_PEPPERS = 5;
export const START_LIVES = 3;
export const STUN_MS = 5000;
export const SQUASH_RESPAWN_MS = 2500;
export const LANE_STACK_HEIGHT = 11;

export const SCORE = {
  ingredient: 50,
  burger: 400,
  squashBase: 100
};

export const platformY = (row: number): number => row * TILE + TILE / 2;
export const entityY = (row: number): number => platformY(row) - 16;
export const colX = (col: number): number => col * TILE + TILE / 2;

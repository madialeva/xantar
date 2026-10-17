export const TILE = 32;
export const COLS = 20;
export const ROWS = 15;
export const GAME_WIDTH = COLS * TILE;
export const GAME_HEIGHT = ROWS * TILE;

export const platformY = (row: number): number => (row + 0.5) * TILE;

export type RenderTier = 1 | 2 | 4;

export const RENDER_TIER: RenderTier = 4;

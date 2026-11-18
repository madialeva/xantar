import { CELL_UNITS } from './sim/rules';

export const TILE = CELL_UNITS;
export const COLS = 39;
export const ROWS = 30;
export const GAME_WIDTH = COLS * TILE;
export const GAME_HEIGHT = ROWS * TILE;

export const platformY = (row: number): number => (row + 0.5) * TILE;

/** How far the surface of a platform, where ingredients and feet rest, is above its line. */
export const PLATFORM_TOP = 6;

/**
 * The point characters and their effects are drawn around: 16 units above the line of their
 * platform, so the feet of a rig, 10 below it, rest on the platform surface.
 */
export const characterY = (row: number): number => platformY(row) - 16;

export type RenderTier = 1 | 2 | 4;

export const RENDER_TIER: RenderTier = 4;

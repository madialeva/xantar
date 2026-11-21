import { CELL_UNITS, ROW_UNITS } from './sim/rules';

/** Width of a column of the board in logical units: wider than a character of the original. */
export const TILE = CELL_UNITS;
/** Height of a row of the board in logical units: taller than a column is wide. */
export const ROW = ROW_UNITS;
export const COLS = 39;
export const ROWS = 30;
export const GAME_WIDTH = COLS * TILE;
export const GAME_HEIGHT = ROWS * ROW;

export const platformY = (row: number): number => (row + 0.5) * ROW;

/**
 * How far down the title, the menus and the controls page start: they are laid out for an area
 * 480 units tall and stay centred on the taller board.
 */
export const MENU_TOP = (GAME_HEIGHT - 480) / 2;

/** How thick a platform is drawn: it stands this tall around its line. */
export const PLATFORM_THICKNESS = 8;

/** How far the surface of a platform, where ingredients and feet rest, is above its line. */
export const PLATFORM_TOP = PLATFORM_THICKNESS / 2;

/**
 * The point characters and their effects are drawn around: above the line of their platform by
 * its top and the 10 units the feet of a rig hang below it, so the feet rest on the surface.
 */
export const characterY = (row: number): number => platformY(row) - PLATFORM_TOP - 10;

export type RenderTier = 1 | 2 | 4;

export const RENDER_TIER: RenderTier = 4;

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';

export const MIN_PANEL_WIDTH = 96;
export const MIN_LAYOUT_WIDTH = GAME_WIDTH + 2 * MIN_PANEL_WIDTH;
export const MAX_LAYOUT_WIDTH = 1152;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The play area in logical units, in world coordinates where the board starts at (0, 0):
 * the side panels sit left of 0 and right of the board.
 */
export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly board: Rect;
  readonly leftPanel: Rect;
  readonly rightPanel: Rect;
}

export function layoutForWidth(width: number): Layout {
  const panel = (width - GAME_WIDTH) / 2;
  return {
    width,
    height: GAME_HEIGHT,
    board: { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
    leftPanel: { x: -panel, y: 0, width: panel, height: GAME_HEIGHT },
    rightPanel: { x: GAME_WIDTH, y: 0, width: panel, height: GAME_HEIGHT }
  };
}

export function computeLayout(viewportWidth: number, viewportHeight: number): Layout {
  const aspect = viewportWidth > 0 && viewportHeight > 0 ? viewportWidth / viewportHeight : 0;
  const width = Math.round(GAME_HEIGHT * aspect);
  return layoutForWidth(Math.min(MAX_LAYOUT_WIDTH, Math.max(MIN_LAYOUT_WIDTH, width)));
}

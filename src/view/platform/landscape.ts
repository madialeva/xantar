/** A size in CSS pixels. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** The size the game sees: the window's, swapped while the game is turned a quarter. */
export const landscapeViewport = (width: number, height: number, turned: boolean): Viewport =>
  turned ? { width: height, height: width } : { width, height };

/**
 * Where a point of the page falls in the game's frame when the game is turned a quarter
 * clockwise and moved to fill the window (`translateX(width) rotate(90deg)`).
 */
export const toTurnedFrame = (
  pageX: number,
  pageY: number,
  windowWidth: number
): { readonly x: number; readonly y: number } => ({ x: pageY, y: windowWidth - pageX });

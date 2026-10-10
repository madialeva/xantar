import type Phaser from 'phaser';
import { type Viewport, landscapeViewport, toTurnedFrame } from './landscape';

/** When the game is turned: a touch screen held upright. */
export const PORTRAIT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)';

/**
 * Keeps the game in landscape on a touch screen held upright: turns the game's element a
 * quarter clockwise, so it plays the same with the screen rotation locked, and adapts Phaser's
 * sizing and pointer mapping to the turned frame (Adapter over its scale and input managers).
 */
export class ForcedLandscape {
  readonly #element: HTMLElement;
  readonly #query: MediaQueryList;
  readonly #window: Window;
  #turned = false;

  constructor(element: HTMLElement, query: MediaQueryList, window: Window) {
    this.#element = element;
    this.#query = query;
    this.#window = window;
    this.apply();
  }

  get turned(): boolean {
    return this.#turned;
  }

  /** The size the game lays itself out in: always landscape on a touch screen. */
  viewport(): Viewport {
    return landscapeViewport(this.#window.innerWidth, this.#window.innerHeight, this.#turned);
  }

  /** Turns the element or puts it back for the current orientation and window size. */
  apply(): void {
    this.#turned = this.#query.matches;
    const { style, classList } = this.#element;
    classList.toggle('turned', this.#turned);
    if (this.#turned) {
      const { innerWidth, innerHeight } = this.#window;
      style.width = `${innerHeight}px`;
      style.height = `${innerWidth}px`;
      style.transform = `translateX(${innerWidth}px) rotate(90deg)`;
    } else {
      style.width = '';
      style.height = '';
      style.transform = '';
    }
  }

  /**
   * Makes Phaser measure and centre its canvas in the turned frame and turn page coordinates
   * of the pointer into it. Phaser measures with `getBoundingClientRect`, which sees the turned
   * box from outside, so these four steps are replaced while the game is turned.
   */
  attach(game: Phaser.Game): void {
    const { scale, input } = game;
    const parentBounds = scale.getParentBounds.bind(scale);
    const updateBounds = scale.updateBounds.bind(scale);
    const updateCenter = scale.updateCenter.bind(scale);
    const transformPointer = input.transformPointer.bind(input);
    scale.getParentBounds = (): boolean => {
      if (!this.#turned) return parentBounds();
      const { width, height } = this.viewport();
      if (scale.parentSize.width === width && scale.parentSize.height === height) return false;
      scale.parentSize.setSize(width, height);
      return true;
    };
    scale.updateBounds = (): void => {
      if (!this.#turned) {
        updateBounds();
        return;
      }
      const { canvas, canvasBounds } = scale;
      canvasBounds.setTo(
        canvas.offsetLeft,
        canvas.offsetTop,
        canvas.offsetWidth,
        canvas.offsetHeight
      );
    };
    scale.updateCenter = (): void => {
      if (!this.#turned) {
        updateCenter();
        return;
      }
      const { canvas, parentSize } = scale;
      canvas.style.marginLeft = `${Math.floor((parentSize.width - canvas.offsetWidth) / 2)}px`;
      canvas.style.marginTop = `${Math.floor((parentSize.height - canvas.offsetHeight) / 2)}px`;
    };
    input.transformPointer = (pointer, pageX, pageY, wasMove): void => {
      if (!this.#turned) {
        transformPointer(pointer, pageX, pageY, wasMove);
        return;
      }
      const { x, y } = toTurnedFrame(pageX, pageY, this.#window.innerWidth);
      transformPointer(pointer, x, y, wasMove);
    };
    // Phaser may already have booted and measured the parent from outside.
    if (scale.canvas) scale.refresh();
  }
}

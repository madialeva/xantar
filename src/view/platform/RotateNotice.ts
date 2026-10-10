import type { Localization } from '../../i18n/Localization';
import { HUD_FONT } from '../hud/textStyle';

/** When the notice shows: a touch screen held upright. */
export const PORTRAIT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)';

type Listener = () => void;

/**
 * The "turn your device" notice over the game on a touch screen held upright. It is a page
 * element, not part of the canvas, which is tiny in portrait. Tells its listeners when it
 * appears (Observer), so the game can pause.
 */
export class RotateNotice {
  readonly #element: HTMLElement;
  readonly #listeners = new Set<Listener>();

  constructor(document: Document, query: MediaQueryList, localization: Localization) {
    const element = document.createElement('div');
    element.className = 'rotate-notice';
    element.setAttribute('role', 'alert');
    element.style.fontFamily = HUD_FONT;
    document.body.append(element);
    this.#element = element;
    const write = (): void => {
      element.textContent = localization.t('rotate.notice');
    };
    write();
    localization.subscribe(write);
    const show = (): void => {
      element.hidden = !query.matches;
      if (query.matches) for (const listener of [...this.#listeners]) listener();
    };
    element.hidden = !query.matches;
    query.addEventListener('change', show);
  }

  get visible(): boolean {
    return !this.#element.hidden;
  }

  onShow(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

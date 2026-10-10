import type { Action, InputSnapshot, InputSource } from '../../input/actions';
import { type KeyBindings, type KeyCode, actionsForKey } from '../../input/bindings';

/** The document as the keyboard source needs it: whether the page is hidden. */
interface Visibility extends EventTarget {
  readonly hidden: boolean;
}

type KeyListener = (code: KeyCode) => void;

/** Keys the browser keeps for itself even when they mean nothing to the game. */
const BROWSER_KEYS: readonly KeyCode[] = ['F11'];

/**
 * The keyboard as an input source: tracks the physical keys held (on `window`, so no scene
 * can miss a key up) and turns them into actions with the current bindings. Lets everything
 * go when the page loses the focus. Can capture the next key for the Controls page.
 */
export class KeyboardSource implements InputSource {
  readonly #pressed = new Set<KeyCode>();
  readonly #downs = new Set<KeyCode>();
  #bindings: KeyBindings;
  #capture: KeyListener | null = null;

  constructor(host: EventTarget, document: Visibility, bindings: KeyBindings) {
    this.#bindings = bindings;
    host.addEventListener('keydown', (event) => this.#onKeyDown(event as KeyboardEvent));
    host.addEventListener('keyup', (event) => this.#pressed.delete((event as KeyboardEvent).code));
    host.addEventListener('blur', () => this.release());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.release();
    });
  }

  get bindings(): KeyBindings {
    return this.#bindings;
  }

  setBindings(bindings: KeyBindings): void {
    this.#bindings = bindings;
  }

  poll(): InputSnapshot {
    const snapshot = {
      held: this.#actions([...this.#pressed, ...this.#downs]),
      pressed: this.#actions(this.#downs)
    };
    this.#downs.clear();
    return snapshot;
  }

  release(): void {
    this.#pressed.clear();
    this.#downs.clear();
  }

  #actions(codes: Iterable<KeyCode>): ReadonlySet<Action> {
    const actions = new Set<Action>();
    for (const code of codes) {
      for (const action of actionsForKey(this.#bindings, code)) actions.add(action);
    }
    return actions;
  }

  /** Sends the next key pressed to `listener` instead of the game; returns a way to cancel. */
  capture(listener: KeyListener): () => void {
    this.release();
    this.#capture = listener;
    return () => {
      if (this.#capture === listener) this.#capture = null;
    };
  }

  #onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { code } = event;
    const capture = this.#capture;
    if (capture) {
      if (!BROWSER_KEYS.includes(code)) event.preventDefault();
      if (event.repeat) return;
      this.#capture = null;
      capture(code);
      return;
    }
    if (actionsForKey(this.#bindings, code).length === 0) return;
    event.preventDefault();
    this.#pressed.add(code);
    if (!event.repeat) this.#downs.add(code);
  }
}

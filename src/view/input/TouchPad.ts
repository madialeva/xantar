import type { Action, InputSnapshot, InputSource } from '../../input/actions';

/**
 * The on-screen touch controls as an input source: each finger (by pointer id) holds its own
 * actions, so several fingers can move and throw pepper at once.
 */
export class TouchPad implements InputSource {
  readonly #fingers = new Map<number, readonly Action[]>();
  readonly #downs = new Set<Action>();

  /** Sets what a finger holds now, replacing what it held before. */
  press(finger: number, actions: readonly Action[]): void {
    const before = this.#fingers.get(finger) ?? [];
    for (const action of actions) if (!before.includes(action)) this.#downs.add(action);
    this.#fingers.set(finger, actions);
  }

  lift(finger: number): void {
    this.#fingers.delete(finger);
  }

  holds(finger: number): boolean {
    return (this.#fingers.get(finger)?.length ?? 0) > 0;
  }

  poll(): InputSnapshot {
    const held = new Set<Action>(this.#downs);
    for (const actions of this.#fingers.values()) for (const action of actions) held.add(action);
    const pressed = new Set(this.#downs);
    this.#downs.clear();
    return { held, pressed };
  }

  release(): void {
    this.#fingers.clear();
    this.#downs.clear();
  }
}

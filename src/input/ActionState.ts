import type { Action, ActionReader, InputSnapshot } from './actions';

export const REPEAT_DELAY_MS = 400;
export const REPEAT_INTERVAL_MS = 120;

/**
 * The state of every action in the current frame, from what the devices report: down, just
 * pressed (a new press, even one that started and ended between two frames) and repeated
 * while held after a delay, for menus.
 */
export class ActionState implements ActionReader {
  #down = new Set<Action>();
  #pressed = new Set<Action>();
  #repeated = new Set<Action>();
  readonly #nextRepeat = new Map<Action, number>();

  update({ held: down, pressed: presses }: InputSnapshot, nowMs: number): void {
    const pressed = new Set<Action>();
    const repeated = new Set<Action>();
    for (const action of down) {
      if (!this.#down.has(action) || presses.has(action)) {
        pressed.add(action);
        repeated.add(action);
        this.#nextRepeat.set(action, nowMs + REPEAT_DELAY_MS);
        continue;
      }
      const next = this.#nextRepeat.get(action) ?? nowMs;
      if (nowMs >= next) {
        repeated.add(action);
        this.#nextRepeat.set(action, Math.max(next + REPEAT_INTERVAL_MS, nowMs));
      }
    }
    for (const action of this.#down) if (!down.has(action)) this.#nextRepeat.delete(action);
    this.#down = new Set(down);
    this.#pressed = pressed;
    this.#repeated = repeated;
  }

  isDown(action: Action): boolean {
    return this.#down.has(action);
  }

  justPressed(action: Action): boolean {
    return this.#pressed.has(action);
  }

  repeated(action: Action): boolean {
    return this.#repeated.has(action);
  }
}

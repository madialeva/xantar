import { type Action, type InputSnapshot, type InputSource, NO_ACTIONS } from '../../input/actions';

/** The part of a Gamepad API pad the source reads, so tests can pass plain objects. */
export interface PadState {
  readonly index: number;
  readonly connected: boolean;
  readonly mapping: string;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean }[];
}

/** Reads the pads connected now, like `navigator.getGamepads()`. */
export type PadReader = () => readonly (PadState | null)[];

/** How far the stick must be pushed to count, so a resting stick with drift does nothing. */
export const STICK_DEAD_ZONE = 0.5;

/** Fixed layout of a standard pad: A pepper and confirm, X pepper, B back, Start pause, D-pad. */
const BUTTONS: ReadonlyMap<number, readonly Action[]> = new Map([
  [0, ['pepper', 'confirm']],
  [1, ['back']],
  [2, ['pepper']],
  [9, ['pause']],
  [12, ['up']],
  [13, ['down']],
  [14, ['left']],
  [15, ['right']]
]);

type Listener = () => void;

/**
 * Gamepads with the standard mapping as an input source, read on every poll. Tells its
 * listeners when a pad that was in use is disconnected (Observer), so the game can pause.
 */
export class GamepadSource implements InputSource {
  readonly #read: PadReader;
  readonly #listeners = new Set<Listener>();
  #connected = new Set<number>();

  constructor(read: PadReader) {
    this.#read = read;
  }

  poll(): InputSnapshot {
    const pads = this.#pads();
    const connected = new Set(pads.map((pad) => pad.index));
    const lost = [...this.#connected].some((index) => !connected.has(index));
    this.#connected = connected;
    if (lost) for (const listener of [...this.#listeners]) listener();
    const held = new Set<Action>();
    for (const pad of pads) for (const action of padActions(pad)) held.add(action);
    return { held, pressed: NO_ACTIONS };
  }

  release(): void {
    // Pads are read afresh on every poll: nothing is kept between frames.
  }

  onDisconnect(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #pads(): PadState[] {
    try {
      return this.#read().filter(
        (pad): pad is PadState => pad !== null && pad.connected && pad.mapping === 'standard'
      );
    } catch {
      return [];
    }
  }
}

/** The actions a pad holds: its buttons and its left stick beyond the dead zone. */
function padActions(pad: PadState): Action[] {
  const actions: Action[] = [];
  pad.buttons.forEach((button, index) => {
    if (button.pressed) actions.push(...(BUTTONS.get(index) ?? []));
  });
  const [x = 0, y = 0] = pad.axes;
  if (x <= -STICK_DEAD_ZONE) actions.push('left');
  if (x >= STICK_DEAD_ZONE) actions.push('right');
  if (y <= -STICK_DEAD_ZONE) actions.push('up');
  if (y >= STICK_DEAD_ZONE) actions.push('down');
  return actions;
}

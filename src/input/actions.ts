/** Everything the player can ask for, whatever the device. */
export const ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'pepper',
  'confirm',
  'back',
  'pause',
  'mute'
] as const;

export type Action = (typeof ACTIONS)[number];

/** The actions whose keyboard keys the player can change, in the order the Controls page shows. */
export const REMAPPABLE_ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'pepper',
  'pause',
  'mute'
] as const;

export type RemappableAction = (typeof REMAPPABLE_ACTIONS)[number];

export type Direction = 'up' | 'down' | 'left' | 'right';

/** What a device reports when it is read once per frame. */
export interface InputSnapshot {
  /** The actions held down now, plus any pressed and let go since the last read. */
  readonly held: ReadonlySet<Action>;
  /** The actions pressed since the last read, even if they were already held before. */
  readonly pressed: ReadonlySet<Action>;
}

export const NO_ACTIONS: ReadonlySet<Action> = new Set();

/**
 * A device that holds actions down: the keyboard, a gamepad, the touch controls (Strategy).
 */
export interface InputSource {
  /** Reads the device; called once per frame. */
  poll(): InputSnapshot;
  /** Forgets every action held, as if everything had been let go. */
  release(): void;
}

/** What the scenes read of the input in a frame. */
export interface ActionReader {
  isDown(action: Action): boolean;
  justPressed(action: Action): boolean;
  /** True on the press and then every so often while held, to move through menus. */
  repeated(action: Action): boolean;
}

/** Reads every source: an action is held or pressed if any device holds or presses it. */
export function pollAll(sources: readonly InputSource[]): InputSnapshot {
  const snapshots = sources.map((source) => source.poll());
  return {
    held: new Set(snapshots.flatMap((snapshot) => [...snapshot.held])),
    pressed: new Set(snapshots.flatMap((snapshot) => [...snapshot.pressed]))
  };
}

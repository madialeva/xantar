import type { SimInput } from '../sim';
import type { ActionReader } from './actions';

/** One-shot presses seen since the last simulation tick, so a frame without ticks loses none. */
export interface PendingPresses {
  readonly pepper: boolean;
  readonly confirm: boolean;
}

/** The input of a simulation tick: directions held now and the presses still pending. */
export function toSimInput(actions: ActionReader, pending: PendingPresses): SimInput {
  return {
    left: actions.isDown('left'),
    right: actions.isDown('right'),
    up: actions.isDown('up'),
    down: actions.isDown('down'),
    pepper: pending.pepper,
    confirm: pending.confirm
  };
}

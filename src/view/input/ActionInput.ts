import { ActionState } from '../../input/ActionState';
import { type Action, type ActionReader, type InputSource, pollAll } from '../../input/actions';

/**
 * The single view of the player's input for every scene: combines the sources (keyboard,
 * gamepad, touch) into the state of each action once per frame, before the scenes update.
 */
export class ActionInput implements ActionReader {
  readonly #sources: readonly InputSource[];
  readonly #state = new ActionState();

  constructor(sources: readonly InputSource[]) {
    this.#sources = sources;
  }

  update(nowMs: number): void {
    this.#state.update(pollAll(this.#sources), nowMs);
  }

  isDown(action: Action): boolean {
    return this.#state.isDown(action);
  }

  justPressed(action: Action): boolean {
    return this.#state.justPressed(action);
  }

  repeated(action: Action): boolean {
    return this.#state.repeated(action);
  }
}

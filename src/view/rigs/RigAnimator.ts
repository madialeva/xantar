import type { AnimationState } from './AnimationState';
import type { RigMotion } from './RigMotion';

/**
 * Plays the animation state a character is in. Switching state stops every tween of the
 * rig and puts it back in its base pose before entering the new one.
 */
export class RigAnimator<K extends string> {
  readonly #motion: RigMotion;
  readonly #states: Readonly<Record<K, AnimationState>>;
  #current: K | null = null;

  constructor(motion: RigMotion, states: Readonly<Record<K, AnimationState>>) {
    this.#motion = motion;
    this.#states = states;
  }

  get current(): K | null {
    return this.#current;
  }

  show(state: K): void {
    if (state === this.#current) return;
    this.#motion.stop();
    this.#current = state;
    this.#states[state].enter(this.#motion);
  }

  stop(): void {
    this.#motion.stop();
    this.#current = null;
  }
}

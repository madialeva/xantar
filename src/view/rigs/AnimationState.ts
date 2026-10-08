import type { RigMotion } from './RigMotion';

/** One animation of a character (State pattern): starts its tweens when entered. */
export interface AnimationState {
  enter(motion: RigMotion): void;
}

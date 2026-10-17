import type Phaser from 'phaser';
import type { CharacterRig, PoseOffset } from './CharacterRig';

/** Tween helpers that move the parts of one rig relative to their base pose. */
export class RigMotion {
  readonly #rig: CharacterRig;
  readonly #tweens: Phaser.Tweens.TweenManager;
  readonly #counters: { frame: number }[] = [];

  constructor(rig: CharacterRig, tweens: Phaser.Tweens.TweenManager) {
    this.#rig = rig;
    this.#tweens = tweens;
  }

  /** Puts a part in a pose without animating. Missing parts are ignored. */
  hold(part: string, offset: PoseOffset): void {
    if (this.#rig.has(part)) this.#rig.pose(part, offset);
  }

  /** Moves a part back and forth between two poses until the state changes. */
  swing(part: string, from: PoseOffset, to: PoseOffset, ms: number, delay = 0): void {
    if (!this.#rig.has(part)) return;
    this.#rig.pose(part, from);
    const { target, props } = this.#rig.target(part, to);
    this.#tweens.add({
      targets: target,
      ...props,
      duration: ms,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /** Moves a part from one pose to another once. */
  once(part: string, from: PoseOffset, to: PoseOffset, ms: number, ease = 'Back.easeOut'): void {
    if (!this.#rig.has(part)) return;
    this.#rig.pose(part, from);
    const { target, props } = this.#rig.target(part, to);
    this.#tweens.add({ targets: target, ...props, duration: ms, ease });
  }

  /** Steps a part back and forth through its frames until the state changes. */
  cycle(part: string, ms: number): void {
    const count = this.#rig.frameCount(part);
    if (count < 2) return;
    const counter = { frame: 0 };
    this.#counters.push(counter);
    this.#rig.showFrame(part, 0);
    this.#tweens.add({
      targets: counter,
      frame: count - 1,
      duration: ms,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.#rig.showFrame(part, Math.round(counter.frame))
    });
  }

  stop(): void {
    this.#tweens.killTweensOf(this.#rig.partImages);
    this.#tweens.killTweensOf(this.#counters);
    this.#counters.length = 0;
    this.#rig.resetPose();
  }
}

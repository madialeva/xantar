import Phaser from 'phaser';
import type { ChefSnapshot } from '../sim';
import type { ArtFactory } from '../view/raster/ArtFactory';
import { CharacterRig } from '../view/rigs/CharacterRig';
import { type ChefAnimation, chefAnimation } from '../view/rigs/chooseAnimation';
import { RigAnimator } from '../view/rigs/RigAnimator';
import { RigMotion } from '../view/rigs/RigMotion';
import { chefRig } from '../view/rigs/rigs';
import { chefStates } from '../view/rigs/states';
import { interpolatedX, interpolatedY } from './interpolation';

/**
 * Phaser view of the chef: a rig of parts that follows the simulation snapshot,
 * interpolated between ticks, and plays the animation of its current state.
 */
export default class ChefView extends Phaser.GameObjects.Container {
  readonly #animator: RigAnimator<ChefAnimation>;

  constructor(scene: Phaser.Scene, art: ArtFactory) {
    super(scene, 0, 0);
    const rig = new CharacterRig(scene, art, chefRig);
    this.add(rig);
    this.#animator = new RigAnimator(new RigMotion(rig, scene.tweens), chefStates);
    scene.add.existing(this);
  }

  sync(chef: ChefSnapshot, alpha: number, dying: boolean): void {
    this.setPosition(interpolatedX(chef, alpha), interpolatedY(chef, alpha));
    this.setScale(chef.isClimbing ? 1 : chef.facing, 1);
    this.#animator.show(chefAnimation(chef, dying));
  }

  override destroy(fromScene?: boolean): void {
    this.#animator.stop();
    super.destroy(fromScene);
  }
}

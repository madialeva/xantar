import Phaser from 'phaser';
import type { EnemyKind, EnemySnapshot } from '../sim';
import type { ArtFactory } from '../view/raster/ArtFactory';
import { CharacterRig } from '../view/rigs/CharacterRig';
import { type EnemyAnimation, enemyAnimation } from '../view/rigs/chooseAnimation';
import { RigAnimator } from '../view/rigs/RigAnimator';
import { RigMotion } from '../view/rigs/RigMotion';
import { enemyRigs } from '../view/rigs/rigs';
import { enemyStates } from '../view/rigs/states';
import { interpolatedX, interpolatedY } from './interpolation';

const STUNNED_ALPHA = 0.6;

/**
 * Phaser view of an enemy: a rig of parts for its kind that follows the simulation
 * snapshot, interpolated between ticks, and plays the animation of its current state.
 */
export default class EnemyView extends Phaser.GameObjects.Container {
  readonly #animator: RigAnimator<EnemyAnimation>;

  constructor(scene: Phaser.Scene, art: ArtFactory, kind: EnemyKind) {
    super(scene, 0, 0);
    const rig = new CharacterRig(scene, art, enemyRigs[kind]);
    this.add(rig);
    this.#animator = new RigAnimator(new RigMotion(rig, scene.tweens), enemyStates);
    scene.add.existing(this);
  }

  sync(enemy: EnemySnapshot, alpha: number): void {
    this.setVisible(enemy.active);
    this.setPosition(interpolatedX(enemy, alpha), interpolatedY(enemy, alpha));
    this.setScale(enemy.isClimbing ? 1 : enemy.facing, 1);
    this.setAlpha(enemy.stunned ? STUNNED_ALPHA : 1);
    this.#animator.show(enemyAnimation(enemy));
  }

  override destroy(fromScene?: boolean): void {
    this.#animator.stop();
    super.destroy(fromScene);
  }
}

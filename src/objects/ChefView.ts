import Phaser from 'phaser';
import type { ChefSnapshot } from '../sim';
import { interpolatedX, interpolatedY } from './interpolation';

/**
 * Phaser view of the chef: draws the character and syncs position and facing from the
 * simulation snapshot, interpolated between ticks.
 */
export default class ChefView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.#buildVisual();
    scene.add.existing(this);
  }

  sync(chef: ChefSnapshot, alpha: number): void {
    this.setPosition(interpolatedX(chef, alpha), interpolatedY(chef, alpha));
    this.setScale(chef.isClimbing ? 1 : chef.facing, 1);
  }

  #buildVisual(): void {
    const skin = 0xf1c27d;
    this.add(this.scene.add.rectangle(-5, 16, 7, 10, 0xe8e8e8));
    this.add(this.scene.add.rectangle(5, 16, 7, 10, 0xe8e8e8));
    const body = this.scene.add.rectangle(0, 2, 18, 18, 0xffffff);
    body.setStrokeStyle(2, 0x30343a, 1);
    this.add(body);
    this.add(this.scene.add.rectangle(-11, 3, 6, 4, skin));
    this.add(this.scene.add.rectangle(11, 3, 6, 4, skin));
    this.add(this.scene.add.circle(0, -8, 6.5, skin));
    this.add(this.scene.add.rectangle(0, -15, 17, 8, 0xffffff));
    this.add(this.scene.add.rectangle(0, -11, 17, 2, 0xd0d0d0));
    this.add(this.scene.add.circle(-2.5, -8, 1.2, 0x222222));
    this.add(this.scene.add.circle(2.5, -8, 1.2, 0x222222));
  }
}

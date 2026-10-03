import Phaser from 'phaser';
import { type EnemyKind, type EnemySnapshot, TICK_MS } from '../sim';
import { interpolatedX, interpolatedY } from './interpolation';

const WOBBLE_PERIOD_MS = 90;
const WOBBLE_DEGREES = 12;

/**
 * Phaser view of an enemy: draws its kind and syncs position, facing, stun wobble and
 * visibility from the simulation snapshot, interpolated between ticks.
 */
export default class EnemyView extends Phaser.GameObjects.Container {
  readonly #kind: EnemyKind;

  constructor(scene: Phaser.Scene, kind: EnemyKind) {
    super(scene, 0, 0);
    this.#kind = kind;
    this.#buildVisual();
    scene.add.existing(this);
  }

  sync(enemy: EnemySnapshot, alpha: number): void {
    this.setVisible(enemy.active);
    this.setPosition(interpolatedX(enemy, alpha), interpolatedY(enemy, alpha));
    this.setScale(enemy.isClimbing ? 1 : enemy.facing, 1);
    this.setAlpha(enemy.stunned ? 0.5 : 1);
    this.setAngle(
      enemy.stunned
        ? Math.sin((enemy.stunTicksLeft * TICK_MS) / WOBBLE_PERIOD_MS) * WOBBLE_DEGREES
        : 0
    );
  }

  #buildVisual(): void {
    if (this.#kind === 'hotdog') {
      this.add(this.scene.add.rectangle(0, 0, 24, 8, 0xe08a3c));
      this.add(this.scene.add.rectangle(0, 0, 24, 4, 0xb53b2a));
      this.add(this.scene.add.circle(-10, 0, 5, 0xe08a3c));
      this.add(this.scene.add.circle(10, 0, 5, 0xe08a3c));
    } else if (this.#kind === 'pickle') {
      this.add(this.scene.add.ellipse(0, 0, 14, 22, 0x4e8f3a));
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.circle(i * 3, -3, 1.1, 0x2f5f22));
      }
    } else {
      this.add(this.scene.add.ellipse(0, 0, 20, 15, 0xffffff));
      this.add(this.scene.add.circle(0, -1, 4.5, 0xf6c945));
    }
    this.add(this.scene.add.circle(-4, -2, 1.4, 0x101010));
    this.add(this.scene.add.circle(4, -2, 1.4, 0x101010));
  }
}

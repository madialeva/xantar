import Phaser from 'phaser';
import { TILE, platformY } from '../../config';
import type { PlateSpec } from '../../sim';
import type { ArtFactory } from '../raster/ArtFactory';

const PEPPER_MS = 400;
const PEPPER_REACH = 10;
const DUST_MS = 260;
const SQUASH_MS = 450;
const SPARKLE_MS = 700;
const SPARKLES_PER_PLATE = 6;

type Effect = Phaser.GameObjects.Image;

/**
 * Short decorative effects for simulation events. They live only in the view: each one
 * destroys itself when its tween ends, and `clear` removes any still playing.
 */
export class EventEffects {
  readonly #scene: Phaser.Scene;
  readonly #art: ArtFactory;
  readonly #depth: number;
  readonly #active = new Set<Effect>();

  constructor(scene: Phaser.Scene, art: ArtFactory, depth: number) {
    this.#scene = scene;
    this.#art = art;
    this.#depth = depth;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clear());
  }

  pepper(x: number, y: number, direction: 1 | -1): void {
    const cloud = this.#spawn('fx.pepper', x, y);
    this.#play(cloud, {
      x: x + direction * PEPPER_REACH,
      alpha: 0,
      scale: cloud.scale * 2,
      duration: PEPPER_MS
    });
  }

  dust(x: number, y: number): void {
    const puff = this.#spawn('fx.sparkle', x, y).setScale(this.#art.scale * 0.35);
    this.#play(puff, { y: y - 6, alpha: 0, duration: DUST_MS, ease: 'Quad.easeOut' });
  }

  squash(x: number, y: number): void {
    const burst = this.#spawn('fx.squash', x, y + 8);
    burst.setScale(this.#art.scale * 0.6, this.#art.scale * 0.3);
    this.#play(burst, {
      scaleX: this.#art.scale * 1.3,
      scaleY: this.#art.scale,
      alpha: 0,
      duration: SQUASH_MS,
      ease: 'Back.easeOut'
    });
  }

  burgerDone(plate: PlateSpec): void {
    const centre = (plate.col + plate.width / 2) * TILE;
    const top = platformY(plate.row) - 3 * TILE;
    for (let index = 0; index < SPARKLES_PER_PLATE; index++) {
      const angle = (index / SPARKLES_PER_PLATE) * Math.PI * 2;
      const sparkle = this.#spawn('fx.sparkle', centre, top).setScale(this.#art.scale * 0.2);
      this.#play(sparkle, {
        x: centre + Math.cos(angle) * plate.width * 10,
        y: top + Math.sin(angle) * 24,
        scale: this.#art.scale,
        angle: 180,
        alpha: 0,
        duration: SPARKLE_MS,
        delay: index * 40,
        ease: 'Cubic.easeOut'
      });
    }
  }

  clear(): void {
    for (const effect of this.#active) {
      this.#scene.tweens.killTweensOf(effect);
      effect.destroy();
    }
    this.#active.clear();
  }

  #spawn(graphic: 'fx.pepper' | 'fx.sparkle' | 'fx.squash', x: number, y: number): Effect {
    const effect = this.#art.image(graphic, x, y).setDepth(this.#depth);
    this.#active.add(effect);
    return effect;
  }

  #play(effect: Effect, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): void {
    this.#scene.tweens.add({
      ...config,
      targets: effect,
      onComplete: () => {
        this.#active.delete(effect);
        effect.destroy();
      }
    });
  }
}

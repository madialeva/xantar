import Phaser from 'phaser';
import { TILE, platformY } from '../config';
import { FALL_TICKS, type IngredientSnapshot } from '../sim';
import type { ArtFactory } from '../view/raster/ArtFactory';
import { INGREDIENT_HEIGHTS, segmentParts } from '../view/theme/graphics';

const PLATFORM_TOP = 6;
const PLATE_TOP = 5;
const STOMP_DEPTH = 3;
const LANDING_SQUASH = { scaleX: 1.06, scaleY: 0.7, ms: 220 };

/**
 * Phaser view of an ingredient: draws its segments with the theme graphics (lowered when
 * stomped) and places it on its platform, in the air while it falls or on the plate once
 * stacked. Its origin is the bottom centre, so landing squashes it against the floor.
 */
export default class IngredientView extends Phaser.GameObjects.Container {
  readonly #height: number;
  readonly #body: Phaser.GameObjects.Container;
  readonly #segments: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, art: ArtFactory, ingredient: IngredientSnapshot) {
    super(scene, ((ingredient.left + ingredient.right) / 2) * TILE, 0);
    this.#height = INGREDIENT_HEIGHTS[ingredient.kind];
    this.#body = scene.add.container(0, 0);
    segmentParts(ingredient.width).forEach((part, index) => {
      const offset = (index + 0.5 - ingredient.width / 2) * TILE;
      const segment = art
        .image(`${ingredient.kind}.${part}`, offset, -this.#height / 2)
        .setOrigin(0.5, 0.5);
      this.#segments.push(segment);
      this.#body.add(segment);
    });
    this.add(this.#body);
    scene.add.existing(this);
    this.setY(this.#restBottom(ingredient.row));
  }

  /** `lift` is how high above its plate the ingredient sits once stacked (see `stackLifts`). */
  sync(ingredient: IngredientSnapshot, alpha: number, lift = 0): void {
    this.setY(this.#bottomFor(ingredient, alpha, lift));
    this.#segments.forEach((segment, index) => {
      segment.setY(-this.#height / 2 + (ingredient.stomped[index] ? STOMP_DEPTH : 0));
    });
  }

  segmentTop(index: number): { readonly x: number; readonly y: number } {
    const segment = this.#segments[index];
    return { x: this.x + (segment?.x ?? 0), y: this.y - this.#height };
  }

  land(): void {
    this.scene.tweens.killTweensOf(this.#body);
    this.#body.setScale(LANDING_SQUASH.scaleX, LANDING_SQUASH.scaleY);
    this.scene.tweens.add({
      targets: this.#body,
      scaleX: 1,
      scaleY: 1,
      duration: LANDING_SQUASH.ms,
      ease: 'Back.easeOut'
    });
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this.#body);
    super.destroy(fromScene);
  }

  #bottomFor(ingredient: IngredientSnapshot, alpha: number, lift: number): number {
    switch (ingredient.phase) {
      case 'idle':
      case 'waiting':
        return this.#restBottom(ingredient.row);
      case 'stacked':
        return this.#stackBottom(ingredient.fallToRow, lift);
      case 'falling': {
        const progress = Math.min(1, ingredient.fallProgress + alpha / FALL_TICKS);
        const eased = Phaser.Math.Easing.Quadratic.In(progress);
        const from = this.#restBottom(ingredient.fallFromRow);
        const to = ingredient.landsOnPlate
          ? this.#stackBottom(ingredient.fallToRow, lift)
          : this.#restBottom(ingredient.fallToRow);
        return Phaser.Math.Linear(from, to, eased);
      }
    }
  }

  #restBottom(row: number): number {
    return platformY(row) - PLATFORM_TOP;
  }

  #stackBottom(plateRow: number, lift: number): number {
    return platformY(plateRow) - PLATE_TOP - lift;
  }
}

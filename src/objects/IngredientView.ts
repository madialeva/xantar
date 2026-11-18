import Phaser from 'phaser';
import { PLATFORM_TOP, TILE, platformY } from '../config';
import type { IngredientSnapshot } from '../sim';
import type { ArtFactory } from '../view/raster/ArtFactory';
import { INGREDIENT_HEIGHTS, segmentParts } from '../view/art/graphics';
import { interpolatedRow } from './interpolation';

const PLATE_TOP = 5;
const STOMP_DEPTH = 3;
const TOUCH_DOWN = { depth: 12, ms: 60 };

/**
 * Phaser view of an ingredient: draws its segments with the game graphics (lowered when
 * stomped) at the height of its base given by the simulation, interpolated between ticks.
 * Its origin is the bottom centre; touching a floor sinks it for a moment.
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
    this.sync(ingredient, 1);
  }

  sync(ingredient: IngredientSnapshot, alpha: number): void {
    const surface = ingredient.stackSlot === null ? PLATFORM_TOP : PLATE_TOP;
    this.setY(platformY(interpolatedRow(ingredient, alpha)) - surface);
    this.#segments.forEach((segment, index) => {
      segment.setY(-this.#height / 2 + (ingredient.stomped[index] ? STOMP_DEPTH : 0));
    });
  }

  segmentTop(index: number): { readonly x: number; readonly y: number } {
    const segment = this.#segments[index];
    return { x: this.x + (segment?.x ?? 0), y: this.y - this.#height };
  }

  /** The ingredient has touched a floor: it sinks for a moment and comes back up. */
  touchDown(): void {
    this.scene.tweens.killTweensOf(this.#body);
    this.#body.setY(TOUCH_DOWN.depth);
    this.scene.tweens.add({
      targets: this.#body,
      y: 0,
      duration: TOUCH_DOWN.ms,
      ease: 'Quad.easeOut'
    });
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this.#body);
    super.destroy(fromScene);
  }
}

import Phaser from 'phaser';
import {
  INGREDIENT_COLORS,
  INGREDIENT_HEIGHTS,
  LANE_STACK_HEIGHT,
  TILE,
  platformY
} from '../config';
import { FALL_TICKS, type IngredientSnapshot } from '../sim';

const PLATFORM_CLEARANCE = 6;

export default class IngredientView extends Phaser.GameObjects.Container {
  readonly #height: number;

  constructor(scene: Phaser.Scene, ingredient: IngredientSnapshot) {
    super(scene, ((ingredient.left + ingredient.right) / 2) * TILE, 0);
    this.#height = INGREDIENT_HEIGHTS[ingredient.kind];
    this.#buildVisual(ingredient);
    scene.add.existing(this);
    this.setY(this.#restY(ingredient.row));
  }

  sync(ingredient: IngredientSnapshot, alpha: number): void {
    this.setY(this.#yFor(ingredient, alpha));
  }

  #yFor(ingredient: IngredientSnapshot, alpha: number): number {
    switch (ingredient.phase) {
      case 'idle':
      case 'waiting':
        return this.#restY(ingredient.row);
      case 'stacked':
        return this.#stackY(ingredient.fallToRow, ingredient.stackSlot ?? 0);
      case 'falling': {
        const progress = Math.min(1, ingredient.fallProgress + alpha / FALL_TICKS);
        const eased = Phaser.Math.Easing.Quadratic.In(progress);
        const from = this.#restY(ingredient.fallFromRow);
        const to = ingredient.landsOnPlate
          ? this.#stackY(ingredient.fallToRow, ingredient.stackSlot ?? 0)
          : this.#restY(ingredient.fallToRow);
        return Phaser.Math.Linear(from, to, eased);
      }
    }
  }

  #restY(row: number): number {
    return platformY(row) - this.#height / 2 - PLATFORM_CLEARANCE;
  }

  #stackY(plateRow: number, slot: number): number {
    return platformY(plateRow) - PLATFORM_CLEARANCE - slot * LANE_STACK_HEIGHT;
  }

  #buildVisual(ingredient: IngredientSnapshot): void {
    const width = (ingredient.right - ingredient.left) * TILE;
    const body = this.scene.add.rectangle(
      0,
      0,
      width,
      this.#height,
      INGREDIENT_COLORS[ingredient.kind]
    );
    body.setStrokeStyle(2, 0x000000, 0.25);
    this.add(body);

    if (ingredient.kind === 'bunTop' || ingredient.kind === 'bunBottom') {
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.circle(i * (width * 0.25), -1, 1.6, 0xfff3d0));
      }
    } else if (ingredient.kind === 'lettuce') {
      for (let i = -2; i <= 2; i++) {
        this.add(this.scene.add.circle(i * (width * 0.18), -3, 2.5, 0x8fe07a));
      }
    } else {
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.rectangle(i * (width * 0.22), 0, 8, 2, 0x4a2408));
      }
    }
  }
}

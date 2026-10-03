import Phaser from 'phaser';
import {
  INGREDIENT_COLORS,
  INGREDIENT_HEIGHTS,
  LANE_STACK_HEIGHT,
  TILE,
  platformY
} from '../config';
import { FALL_TICKS, type IngredientKind, type IngredientSnapshot } from '../sim';

const PLATFORM_CLEARANCE = 6;
const SEGMENT_GAP = 2;
const STOMP_DEPTH = 3;

export default class IngredientView extends Phaser.GameObjects.Container {
  readonly #height: number;
  readonly #segments: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, ingredient: IngredientSnapshot) {
    super(scene, ((ingredient.left + ingredient.right) / 2) * TILE, 0);
    this.#height = INGREDIENT_HEIGHTS[ingredient.kind];
    this.#buildSegments(ingredient);
    scene.add.existing(this);
    this.setY(this.#restY(ingredient.row));
  }

  sync(ingredient: IngredientSnapshot, alpha: number): void {
    this.setY(this.#yFor(ingredient, alpha));
    this.#segments.forEach((segment, index) => {
      segment.setY(ingredient.stomped[index] ? STOMP_DEPTH : 0);
    });
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

  #buildSegments(ingredient: IngredientSnapshot): void {
    const segmentWidth = TILE - SEGMENT_GAP;
    for (let index = 0; index < ingredient.width; index++) {
      const offset = (index + 0.5 - ingredient.width / 2) * TILE;
      const body = this.scene.add.rectangle(
        0,
        0,
        segmentWidth,
        this.#height,
        INGREDIENT_COLORS[ingredient.kind]
      );
      body.setStrokeStyle(2, 0x000000, 0.25);
      const segment = this.scene.add.container(offset, 0, [
        body,
        ...this.#decoration(ingredient.kind, segmentWidth)
      ]);
      this.#segments.push(segment);
      this.add(segment);
    }
  }

  #decoration(kind: IngredientKind, width: number): Phaser.GameObjects.GameObject[] {
    if (kind === 'bunTop' || kind === 'bunBottom') {
      return [-0.25, 0.25].map((place) => this.scene.add.circle(place * width, -1, 1.6, 0xfff3d0));
    }
    if (kind === 'lettuce') {
      return [-0.3, 0, 0.3].map((place) => this.scene.add.circle(place * width, -3, 2.5, 0x8fe07a));
    }
    return [this.scene.add.rectangle(0, 0, 8, 2, 0x4a2408)];
  }
}

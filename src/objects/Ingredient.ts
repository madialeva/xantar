import Phaser from 'phaser';
import { INGREDIENT_COLORS, INGREDIENT_HEIGHTS, type IngredientKind } from '../config';

export type IngredientState = 'idle' | 'falling' | 'stacked';

export default class Ingredient extends Phaser.GameObjects.Container {
  readonly kind: IngredientKind;
  readonly laneId: number;
  readonly left: number;
  readonly right: number;
  row: number;
  override state: IngredientState = 'idle';

  constructor(
    scene: Phaser.Scene,
    laneId: number,
    left: number,
    right: number,
    row: number,
    kind: IngredientKind
  ) {
    super(scene, (left + right) / 2, 0);
    this.laneId = laneId;
    this.left = left;
    this.right = right;
    this.row = row;
    this.kind = kind;
    this.buildVisual(right - left);
    scene.add.existing(this);
  }

  get isIdle(): boolean {
    return this.state === 'idle';
  }

  private buildVisual(width: number): void {
    const height = INGREDIENT_HEIGHTS[this.kind];
    const color = INGREDIENT_COLORS[this.kind];
    const body = this.scene.add.rectangle(0, 0, width, height, color);
    body.setStrokeStyle(2, 0x000000, 0.25);
    this.add(body);

    if (this.kind === 'bunTop' || this.kind === 'bunBottom') {
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.circle(i * (width * 0.25), -1, 1.6, 0xfff3d0));
      }
    } else if (this.kind === 'lettuce') {
      for (let i = -2; i <= 2; i++) {
        this.add(this.scene.add.circle(i * (width * 0.18), -3, 2.5, 0x8fe07a));
      }
    } else if (this.kind === 'patty') {
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.rectangle(i * (width * 0.22), 0, 8, 2, 0x4a2408));
      }
    }
  }
}

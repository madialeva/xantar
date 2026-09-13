import Phaser from 'phaser';
import { CHEF_SPEED, CLIMB_SPEED, GAME_WIDTH, TILE, colX, entityY } from '../config';
import { type Ladder, laddersFromRow } from '../level';

export interface ChefControls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface ClimbState {
  toRow: number;
  targetY: number;
}

export default class Chef extends Phaser.GameObjects.Container {
  row: number;
  facing = 1;
  isMoving = false;
  private climb: ClimbState | null = null;

  constructor(scene: Phaser.Scene, row: number, x: number) {
    super(scene, x, entityY(row));
    this.row = row;
    this.buildVisual();
    scene.add.existing(this);
  }

  get isClimbing(): boolean {
    return this.climb !== null;
  }

  override update(dt: number, controls: ChefControls): void {
    if (this.climb) {
      this.stepClimb(dt);
      return;
    }

    const direction = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    this.isMoving = direction !== 0;
    if (direction !== 0) {
      this.facing = direction;
      this.x = Phaser.Math.Clamp(this.x + direction * CHEF_SPEED * dt, 12, GAME_WIDTH - 12);
      this.setScale(this.facing, 1);
    }

    if (controls.up || controls.down) {
      const goingUp = controls.up;
      const ladder = this.findLadder(goingUp);
      if (ladder) this.startClimb(ladder, goingUp);
    }
  }

  private findLadder(goingUp: boolean): Ladder | null {
    const options = laddersFromRow(this.row, goingUp);
    return options.find((ladder) => Math.abs(colX(ladder.col) - this.x) <= TILE * 0.6) ?? null;
  }

  private startClimb(ladder: Ladder, goingUp: boolean): void {
    const toRow = goingUp ? ladder.top : ladder.bottom;
    this.x = colX(ladder.col);
    this.setScale(1, 1);
    this.climb = { toRow, targetY: entityY(toRow) };
  }

  private stepClimb(dt: number): void {
    if (!this.climb) return;
    const direction = Math.sign(this.climb.targetY - this.y);
    this.y += direction * CLIMB_SPEED * dt;
    if (Math.abs(this.y - this.climb.targetY) < 3) {
      this.y = this.climb.targetY;
      this.row = this.climb.toRow;
      this.climb = null;
    }
  }

  private buildVisual(): void {
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

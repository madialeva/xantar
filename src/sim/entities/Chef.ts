import { clamp, columnCenter } from '../geometry';
import type { Level } from '../level/Level';
import { ARRIVAL_THRESHOLD, CHEF_SPEED, CLIMB_SPEED, EDGE_MARGIN, TICK_SECONDS } from '../rules';
import type { SimInput } from '../SimInput';
import { MovingEntity, type PositionSnapshot } from './MovingEntity';

export interface ChefSnapshot extends PositionSnapshot {
  readonly row: number;
  readonly facing: 1 | -1;
  readonly isMoving: boolean;
  readonly isClimbing: boolean;
}

export class Chef extends MovingEntity implements ChefSnapshot {
  #row: number;
  #facing: 1 | -1 = 1;
  #isMoving = false;
  #climbTargetRow: number | null = null;

  constructor(row: number, x: number) {
    super(x, row);
    this.#row = row;
  }

  get row(): number {
    return this.#row;
  }

  get facing(): 1 | -1 {
    return this.#facing;
  }

  get isMoving(): boolean {
    return this.#isMoving;
  }

  get isClimbing(): boolean {
    return this.#climbTargetRow !== null;
  }

  reset(row: number, x: number): void {
    this.#row = row;
    this.#facing = 1;
    this.#isMoving = false;
    this.#climbTargetRow = null;
    this.teleportTo(x, row);
  }

  step(input: SimInput, level: Level): void {
    if (this.#climbTargetRow !== null) {
      this.#stepClimb(this.#climbTargetRow);
      return;
    }

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.#isMoving = direction !== 0;
    if (direction !== 0) {
      this.#facing = direction > 0 ? 1 : -1;
      this.moveTo(this.#walkTo(direction, level), this.y);
    }

    if (input.up || input.down) {
      const goingUp = input.up;
      const ladder = level.ladderNear(this.#row, this.x, goingUp);
      if (ladder !== undefined) {
        this.moveTo(columnCenter(ladder.col), this.y);
        this.#climbTargetRow = goingUp ? ladder.topRow : ladder.bottomRow;
      }
    }
  }

  #walkTo(direction: number, level: Level): number {
    const next = this.x + direction * CHEF_SPEED * TICK_SECONDS;
    const run = level.platformRunAt(this.#row, this.x);
    if (run === undefined) return next;
    return clamp(next, run.left + EDGE_MARGIN, run.right - EDGE_MARGIN);
  }

  #stepClimb(targetRow: number): void {
    const direction = Math.sign(targetRow - this.y);
    const y = this.y + direction * CLIMB_SPEED * TICK_SECONDS;
    if (Math.abs(y - targetRow) < ARRIVAL_THRESHOLD) {
      this.moveTo(this.x, targetRow);
      this.#row = targetRow;
      this.#climbTargetRow = null;
    } else {
      this.moveTo(this.x, y);
    }
  }
}

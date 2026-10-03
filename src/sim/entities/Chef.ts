import type { LadderEdge, PlatformEdge } from '../nav/edges';
import { NavPlace } from '../nav/NavPlace';
import type { NavigationGraph } from '../nav/NavigationGraph';
import {
  ARRIVAL_THRESHOLD,
  CHEF_SPEED,
  CLIMB_SPEED,
  STEP_OFF_DISTANCE,
  TICK_SECONDS
} from '../rules';
import type { SimInput } from '../SimInput';
import { MovingEntity, type PositionSnapshot } from './MovingEntity';

export interface ChefPosition {
  readonly x: number;
  readonly row: number;
  readonly onPlatform: boolean;
}

export interface ChefSnapshot extends PositionSnapshot, ChefPosition {
  readonly facing: 1 | -1;
  readonly isMoving: boolean;
  readonly isClimbing: boolean;
  readonly place: NavPlace;
}

const axis = (positive: boolean, negative: boolean): -1 | 0 | 1 =>
  positive === negative ? 0 : positive ? 1 : -1;

export class Chef extends MovingEntity implements ChefSnapshot {
  #place: NavPlace;
  #row: number;
  #facing: 1 | -1 = 1;
  #isMoving = false;

  constructor(place: NavPlace) {
    super(place.point.x, place.point.y);
    this.#place = place;
    this.#row = place.platform?.row ?? 0;
  }

  get place(): NavPlace {
    return this.#place;
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

  get onPlatform(): boolean {
    return this.#place.isOnPlatform;
  }

  get isClimbing(): boolean {
    return !this.#place.isOnPlatform;
  }

  reset(place: NavPlace): void {
    this.#place = place;
    this.#row = place.platform?.row ?? this.#row;
    this.#facing = 1;
    this.#isMoving = false;
    this.teleportTo(place.point.x, place.point.y);
  }

  step(input: SimInput, graph: NavigationGraph): void {
    if (this.#place.ladder !== undefined) this.#stepLadder(this.#place.ladder, input);
    else this.#stepPlatform(input, graph);
    this.moveTo(this.#place.point.x, this.#place.point.y);
  }

  #stepPlatform(input: SimInput, graph: NavigationGraph): void {
    const direction = axis(input.right, input.left);
    this.#isMoving = direction !== 0;
    if (direction !== 0) {
      this.#walk(direction);
      return;
    }

    const vertical = axis(input.down, input.up);
    const platform = this.#place.platform;
    if (vertical === 0 || platform === undefined) return;
    const goingUp = vertical < 0;
    const ladder = graph.ladderNear(platform, this.#place.along, goingUp);
    if (ladder !== undefined) this.#place = NavPlace.onLadder(ladder, goingUp ? ladder.length : 0);
  }

  #stepLadder(ladder: LadderEdge, input: SimInput): void {
    const direction = axis(input.right, input.left);
    if (direction !== 0 && this.#stepOff(ladder, direction)) return;

    const vertical = axis(input.down, input.up);
    this.#isMoving = vertical !== 0;
    if (vertical === 0) return;
    const along = this.#place.along + vertical * CLIMB_SPEED * TICK_SECONDS;
    if (vertical < 0 && along <= ARRIVAL_THRESHOLD) {
      this.#arriveAt(ladder.top, ladder.topRow, ladder.x);
    } else if (vertical > 0 && along >= ladder.length - ARRIVAL_THRESHOLD) {
      this.#arriveAt(ladder.bottom, ladder.bottomRow, ladder.x);
    } else {
      this.#place = NavPlace.onLadder(ladder, along);
    }
  }

  #stepOff(ladder: LadderEdge, direction: -1 | 1): boolean {
    const along = this.#place.along;
    if (along <= STEP_OFF_DISTANCE) {
      this.#arriveAt(ladder.top, ladder.topRow, ladder.x);
    } else if (along >= ladder.length - STEP_OFF_DISTANCE) {
      this.#arriveAt(ladder.bottom, ladder.bottomRow, ladder.x);
    } else {
      return false;
    }
    this.#isMoving = true;
    this.#walk(direction);
    return true;
  }

  #walk(direction: -1 | 1): void {
    this.#facing = direction > 0 ? 1 : -1;
    this.#place = this.#place.moveAlong(direction * CHEF_SPEED * TICK_SECONDS);
  }

  #arriveAt(platform: PlatformEdge, row: number, x: number): void {
    this.#place = NavPlace.onPlatform(platform, x);
    this.#row = row;
  }
}

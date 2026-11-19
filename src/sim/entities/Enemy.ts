import type { EventSink } from '../events';
import type { EnemyKind } from '../level/kinds';
import type { LadderEdge } from '../nav/edges';
import { NavPlace } from '../nav/NavPlace';
import type { NavigationGraph } from '../nav/NavigationGraph';
import type { Rng } from '../rng';
import {
  ARRIVAL_THRESHOLD,
  ENEMY_CLIMB_SPEED,
  ENEMY_WALK_SPEED,
  RESPAWN_TICKS,
  STUN_TICKS,
  TICK_SECONDS
} from '../rules';
import type { ChefSnapshot } from './Chef';
import type { EnemyBrain, LadderIntent } from './EnemyBrain';
import { MovingEntity, type PositionSnapshot } from './MovingEntity';

export interface EnemySnapshot extends PositionSnapshot {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly row: number;
  readonly active: boolean;
  readonly stunned: boolean;
  readonly stunTicksLeft: number;
  readonly facing: 1 | -1;
  readonly isClimbing: boolean;
  readonly riding: boolean;
  readonly entering: boolean;
  readonly place: NavPlace;
}

interface Climb {
  readonly ladder: LadderEdge;
  readonly step: 1 | -1;
}

/**
 * Where an enemy comes into play and how long after play starts: straight onto `place`, or,
 * from an entry walkway, appearing at `fromX` and walking in to `place`.
 */
export interface EnemyEntry {
  readonly place: NavPlace;
  readonly fromX?: number;
  readonly delayTicks: number;
}

/** How fast an enemy moves at the moment, in cells per second: along platforms and on ladders. */
export interface EnemyGait {
  readonly walk: number;
  readonly climb: number;
}

/** The enemies' gait at a pace factor: the original's speeds times the factor. */
export const enemyGait = (factor = 1): EnemyGait => ({
  walk: ENEMY_WALK_SPEED * factor,
  climb: ENEMY_CLIMB_SPEED * factor
});

/** An entry that puts the enemy straight onto a place, with no delay. */
export const entryAt = (place: NavPlace): EnemyEntry => ({ place, delayTicks: 0 });

/** Off the board: how many ticks are left and how it comes back. */
interface Away {
  ticks: number;
  readonly back: EnemyEntry | 'anyEntry';
  readonly announce: boolean;
}

/**
 * A chasing enemy. Comes in from its entry, walks the navigation graph, climbs ladders, can be
 * stunned, crushed or carried down by an ingredient, and comes back; where it goes is decided
 * by its EnemyBrain.
 */
export class Enemy extends MovingEntity implements EnemySnapshot {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly #brain: EnemyBrain;
  readonly #events: EventSink;
  readonly #graph: NavigationGraph;
  readonly #entries: readonly EnemyEntry[];
  #place: NavPlace;
  #row: number;
  #direction: 1 | -1 = 1;
  #active = true;
  #stunTicks = 0;
  #away: Away | undefined;
  #entrance: NavPlace | undefined;
  #decisionTicks = 0;
  #pending: LadderIntent | undefined;
  #climb: Climb | undefined;
  #carrier: PositionSnapshot | undefined;

  constructor(
    id: number,
    kind: EnemyKind,
    brain: EnemyBrain,
    events: EventSink,
    graph: NavigationGraph,
    entries: readonly EnemyEntry[]
  ) {
    const { place } = entries[0];
    super(place.point.x, place.point.y);
    this.id = id;
    this.kind = kind;
    this.#brain = brain;
    this.#events = events;
    this.#graph = graph;
    this.#entries = entries;
    this.#place = place;
    this.#row = place.platform?.row ?? 0;
  }

  get place(): NavPlace {
    return this.#place;
  }

  get row(): number {
    return this.#row;
  }

  get active(): boolean {
    return this.#active;
  }

  get stunned(): boolean {
    return this.#stunTicks > 0;
  }

  get stunTicksLeft(): number {
    return this.#stunTicks;
  }

  get facing(): 1 | -1 {
    return this.#direction;
  }

  get isClimbing(): boolean {
    return this.#climb !== undefined;
  }

  get riding(): boolean {
    return this.#carrier !== undefined;
  }

  /** Whether it is riding that ingredient. */
  rides(carrier: PositionSnapshot): boolean {
    return this.#carrier === carrier;
  }

  /** Rides an ingredient down: until it is dropped, it only follows the ingredient's height. */
  ride(carrier: PositionSnapshot): void {
    this.#carrier = carrier;
  }

  /** Whether it is walking in along an entry walkway. */
  get entering(): boolean {
    return this.#entrance !== undefined;
  }

  /** Waits off the board for its entry: it comes in when the entry's delay has passed. */
  await(entry: EnemyEntry, rng: Rng): void {
    this.#leave(entry.delayTicks, entry, false);
    if (entry.delayTicks <= 0) this.#comeIn(entry, rng);
  }

  /** Leaves the board after its ride and comes back on `place` after the respawn delay. */
  dropAt(place: NavPlace): void {
    this.#leave(RESPAWN_TICKS, entryAt(place), true);
  }

  reset(place: NavPlace, rng: Rng): void {
    this.#place = place;
    this.#row = place.platform?.row ?? this.#row;
    this.teleportTo(place.point.x, place.point.y);
    this.#direction = rng.chance(0.5) ? -1 : 1;
    this.#climb = undefined;
    this.#pending = undefined;
    this.#decisionTicks = 0;
    this.#stunTicks = 0;
    this.#away = undefined;
    this.#entrance = undefined;
    this.#carrier = undefined;
    this.#active = true;
  }

  stun(): void {
    this.#stunTicks = STUN_TICKS;
    this.#events.emit({ type: 'enemyStunned', enemyId: this.id });
  }

  squash(): void {
    this.#leave(RESPAWN_TICKS, 'anyEntry', true);
  }

  /** Advances one tick moving at `gait`, the pace the simulation gives the enemies. */
  step(chef: ChefSnapshot, rng: Rng, gait: EnemyGait): void {
    if (!this.#active) {
      this.#stepAway(rng);
      return;
    }
    if (this.#carrier !== undefined) {
      this.moveTo(this.x, this.#carrier.y);
      return;
    }
    if (this.#stunTicks > 0) {
      this.#stunTicks -= 1;
      return;
    }
    if (this.#entrance !== undefined) {
      this.#stepEntrance(this.#entrance, gait.walk);
      return;
    }
    if (this.#climb !== undefined) {
      this.#stepClimb(this.#climb, gait.climb);
      this.moveTo(this.#place.point.x, this.#place.point.y);
      return;
    }

    this.#decisionTicks -= 1;
    if (this.#decisionTicks <= 0) {
      const intent = this.#brain.decide(this, chef, this.#graph, rng);
      this.#direction = intent.direction;
      this.#pending = intent.ladder;
      this.#decisionTicks = this.#brain.nextDecisionDelay(rng);
    }

    if (
      this.#pending !== undefined &&
      Math.abs(this.#pending.edge.x - this.x) < ARRIVAL_THRESHOLD
    ) {
      this.#beginClimb(this.#pending);
    } else {
      this.#place = this.#place.moveAlong(this.#direction * gait.walk * TICK_SECONDS);
    }
    this.moveTo(this.#place.point.x, this.#place.point.y);
  }

  #leave(ticks: number, back: EnemyEntry | 'anyEntry', announce: boolean): void {
    this.#active = false;
    this.#carrier = undefined;
    this.#entrance = undefined;
    this.#climb = undefined;
    this.#stunTicks = 0;
    this.#away = { ticks, back, announce };
  }

  #stepAway(rng: Rng): void {
    const away = this.#away;
    if (away === undefined) return;
    away.ticks -= 1;
    if (away.ticks > 0) return;
    this.#comeIn(away.back === 'anyEntry' ? rng.pick(this.#entries) : away.back, rng);
    if (away.announce) {
      this.#events.emit({ type: 'enemyRespawned', enemyId: this.id, x: this.x, y: this.y });
    }
  }

  #comeIn(entry: EnemyEntry, rng: Rng): void {
    this.reset(entry.place, rng);
    if (entry.fromX === undefined) return;
    this.#entrance = entry.place;
    this.#direction = entry.place.point.x >= entry.fromX ? 1 : -1;
    this.teleportTo(entry.fromX, entry.place.point.y);
  }

  /** Walks in along the entry walkway until it reaches the platform it leads to. */
  #stepEntrance(target: NavPlace, speed: number): void {
    const step = this.#direction * speed * TICK_SECONDS;
    const x = this.x + step;
    if ((target.point.x - x) * this.#direction <= 0) {
      this.#entrance = undefined;
      this.#decisionTicks = 0;
      this.moveTo(target.point.x, target.point.y);
      return;
    }
    this.moveTo(x, target.point.y);
  }

  #beginClimb({ edge, direction }: LadderIntent): void {
    this.#pending = undefined;
    this.#climb = { ladder: edge, step: direction === 'down' ? 1 : -1 };
    this.#place = NavPlace.onLadder(edge, direction === 'down' ? 0 : edge.length);
  }

  #stepClimb({ ladder, step }: Climb, speed: number): void {
    const along = this.#place.along + step * speed * TICK_SECONDS;
    if (step < 0 && along <= ARRIVAL_THRESHOLD) {
      this.#arrive(NavPlace.onPlatform(ladder.top, ladder.x), ladder.topRow);
    } else if (step > 0 && along >= ladder.length - ARRIVAL_THRESHOLD) {
      this.#arrive(NavPlace.onPlatform(ladder.bottom, ladder.x), ladder.bottomRow);
    } else {
      this.#place = NavPlace.onLadder(ladder, along);
    }
  }

  #arrive(place: NavPlace, row: number): void {
    this.#place = place;
    this.#row = row;
    this.#climb = undefined;
    this.#decisionTicks = 0;
  }
}

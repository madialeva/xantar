import type { EventSink } from '../events';
import type { EnemyKind } from '../level/kinds';
import type { LadderEdge } from '../nav/edges';
import { NavPlace } from '../nav/NavPlace';
import type { NavigationGraph } from '../nav/NavigationGraph';
import type { Rng } from '../rng';
import { ARRIVAL_THRESHOLD, ENEMY_SPEED, RESPAWN_TICKS, STUN_TICKS, TICK_SECONDS } from '../rules';
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
  readonly place: NavPlace;
}

interface Climb {
  readonly ladder: LadderEdge;
  readonly step: 1 | -1;
}

export class Enemy extends MovingEntity implements EnemySnapshot {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly #brain: EnemyBrain;
  readonly #events: EventSink;
  readonly #graph: NavigationGraph;
  readonly #spawns: readonly NavPlace[];
  #place: NavPlace;
  #row: number;
  #direction: 1 | -1 = 1;
  #active = true;
  #stunTicks = 0;
  #respawnTicks = 0;
  #decisionTicks = 0;
  #pending: LadderIntent | undefined;
  #climb: Climb | undefined;

  constructor(
    id: number,
    kind: EnemyKind,
    brain: EnemyBrain,
    events: EventSink,
    graph: NavigationGraph,
    spawns: readonly NavPlace[]
  ) {
    super(spawns[0].point.x, spawns[0].point.y);
    this.id = id;
    this.kind = kind;
    this.#brain = brain;
    this.#events = events;
    this.#graph = graph;
    this.#spawns = spawns;
    this.#place = spawns[0];
    this.#row = spawns[0].platform?.row ?? 0;
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

  reset(place: NavPlace, rng: Rng): void {
    this.#place = place;
    this.#row = place.platform?.row ?? this.#row;
    this.teleportTo(place.point.x, place.point.y);
    this.#direction = rng.chance(0.5) ? -1 : 1;
    this.#climb = undefined;
    this.#pending = undefined;
    this.#decisionTicks = 0;
    this.#stunTicks = 0;
    this.#respawnTicks = 0;
    this.#active = true;
  }

  stun(): void {
    this.#stunTicks = STUN_TICKS;
    this.#events.emit({ type: 'enemyStunned', enemyId: this.id });
  }

  squash(): void {
    this.#active = false;
    this.#respawnTicks = RESPAWN_TICKS;
  }

  step(chef: ChefSnapshot, rng: Rng): void {
    if (!this.#active) {
      this.#stepRespawn(rng);
      return;
    }
    if (this.#stunTicks > 0) {
      this.#stunTicks -= 1;
      return;
    }
    if (this.#climb !== undefined) {
      this.#stepClimb(this.#climb);
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
      this.#place = this.#place.moveAlong(this.#direction * ENEMY_SPEED * TICK_SECONDS);
    }
    this.moveTo(this.#place.point.x, this.#place.point.y);
  }

  #stepRespawn(rng: Rng): void {
    if (this.#respawnTicks <= 0) return;
    this.#respawnTicks -= 1;
    if (this.#respawnTicks > 0) return;
    this.reset(rng.pick(this.#spawns), rng);
    this.#events.emit({ type: 'enemyRespawned', enemyId: this.id, x: this.x, y: this.y });
  }

  #beginClimb({ edge, direction }: LadderIntent): void {
    this.#pending = undefined;
    this.#climb = { ladder: edge, step: direction === 'down' ? 1 : -1 };
    this.#place = NavPlace.onLadder(edge, direction === 'down' ? 0 : edge.length);
  }

  #stepClimb({ ladder, step }: Climb): void {
    const along = this.#place.along + step * ENEMY_SPEED * TICK_SECONDS;
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
  }
}

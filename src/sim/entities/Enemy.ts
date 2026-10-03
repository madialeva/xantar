import type { EventSink } from '../events';
import { clamp, columnCenter } from '../geometry';
import type { Ladder, Level, Spawn } from '../legacy-level/Level';
import type { EnemyKind } from '../legacy-level/LevelData';
import type { Rng } from '../rng';
import {
  ARRIVAL_THRESHOLD,
  EDGE_MARGIN,
  ENEMY_SPEED,
  RESPAWN_TICKS,
  STUN_TICKS,
  TICK_SECONDS
} from '../rules';
import type { ChefSnapshot } from './Chef';
import type { EnemyBrain } from './EnemyBrain';
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
}

export class Enemy extends MovingEntity implements EnemySnapshot {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly #brain: EnemyBrain;
  readonly #events: EventSink;
  #row = 0;
  #direction: 1 | -1 = 1;
  #active = true;
  #stunTicks = 0;
  #respawnTicks = 0;
  #decisionTicks = 0;
  #pendingLadder: Ladder | undefined;
  #climbTargetRow: number | null = null;

  constructor(id: number, kind: EnemyKind, brain: EnemyBrain, events: EventSink) {
    super(0, 0);
    this.id = id;
    this.kind = kind;
    this.#brain = brain;
    this.#events = events;
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
    return this.#climbTargetRow !== null;
  }

  reset(spawn: Spawn, rng: Rng): void {
    this.#row = spawn.row;
    this.teleportTo(spawn.x, spawn.row);
    this.#direction = rng.chance(0.5) ? -1 : 1;
    this.#climbTargetRow = null;
    this.#pendingLadder = undefined;
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

  step(chef: ChefSnapshot, level: Level, rng: Rng): void {
    if (!this.#active) {
      this.#stepRespawn(level, rng);
      return;
    }
    if (this.#stunTicks > 0) {
      this.#stunTicks -= 1;
      return;
    }
    if (this.#climbTargetRow !== null) {
      this.#stepClimb(this.#climbTargetRow);
      return;
    }

    this.#decisionTicks -= 1;
    if (this.#decisionTicks <= 0) {
      const intent = this.#brain.decide(this, chef, level, rng);
      this.#direction = intent.direction;
      this.#pendingLadder = intent.ladder;
      this.#decisionTicks = this.#brain.nextDecisionDelay(rng);
    }

    if (
      this.#pendingLadder !== undefined &&
      Math.abs(columnCenter(this.#pendingLadder.col) - this.x) < ARRIVAL_THRESHOLD
    ) {
      this.#beginClimb(this.#pendingLadder, chef);
      return;
    }

    this.moveTo(this.#walkTo(level), this.y);
  }

  #stepRespawn(level: Level, rng: Rng): void {
    if (this.#respawnTicks <= 0) return;
    this.#respawnTicks -= 1;
    if (this.#respawnTicks > 0) return;
    const point = rng.pick(level.respawnPoints);
    this.reset(point, rng);
    this.#events.emit({ type: 'enemyRespawned', enemyId: this.id, x: this.x, y: this.y });
  }

  #walkTo(level: Level): number {
    const next = this.x + this.#direction * ENEMY_SPEED * TICK_SECONDS;
    const run = level.platformRunAt(this.#row, this.x);
    if (run === undefined) return next;
    return clamp(next, run.left + EDGE_MARGIN, run.right - EDGE_MARGIN);
  }

  #beginClimb(ladder: Ladder, chef: ChefSnapshot): void {
    const goingUp = chef.row < this.#row;
    this.moveTo(columnCenter(ladder.col), this.y);
    this.#climbTargetRow = goingUp ? ladder.topRow : ladder.bottomRow;
    this.#pendingLadder = undefined;
  }

  #stepClimb(targetRow: number): void {
    const direction = Math.sign(targetRow - this.y);
    const y = this.y + direction * ENEMY_SPEED * TICK_SECONDS;
    if (Math.abs(y - targetRow) < ARRIVAL_THRESHOLD) {
      this.moveTo(this.x, targetRow);
      this.#row = targetRow;
      this.#climbTargetRow = null;
    } else {
      this.moveTo(this.x, y);
    }
  }
}

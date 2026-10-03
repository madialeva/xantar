import { Burger, type BurgerSnapshot, type CrushTarget } from './entities/Burger';
import { Chef, type ChefSnapshot } from './entities/Chef';
import { createEnemy } from './entities/createEnemy';
import type { Enemy, EnemySnapshot } from './entities/Enemy';
import { isHitByPepper, pepperCloudFor } from './entities/pepper';
import { EventQueue, type SimEvent } from './events';
import { GameStats, type StatsSnapshot } from './GameStats';
import type { Level } from './legacy-level/Level';
import type { Rng } from './rng';
import { CONTACT_X, CONTACT_Y, SCORE } from './rules';
import type { SimInput } from './SimInput';

export type GameStatus = 'playing' | 'levelClear' | 'gameOver';

export interface SimulationOptions {
  readonly level: Level;
  readonly rng: Rng;
}

export class Simulation {
  readonly #level: Level;
  readonly #rng: Rng;
  readonly #events = new EventQueue();
  readonly #stats = new GameStats(this.#events);
  readonly #chef: Chef;
  readonly #enemies: readonly Enemy[];
  readonly #crushTarget: CrushTarget = {
    crush: (left, right, fromRow, toRow) => this.#crushEnemies(left, right, fromRow, toRow)
  };
  #burgers: readonly Burger[] = [];
  #status: GameStatus = 'playing';

  constructor(options: SimulationOptions) {
    this.#level = options.level;
    this.#rng = options.rng;
    this.#chef = new Chef(options.level.chefStart.row, options.level.chefStart.x);
    this.#enemies = options.level.enemyStarts.map((spawn, id) =>
      createEnemy(id, spawn.kind, this.#events)
    );
    this.startBoard();
  }

  get level(): Level {
    return this.#level;
  }

  get status(): GameStatus {
    return this.#status;
  }

  get chef(): ChefSnapshot {
    return this.#chef;
  }

  get enemies(): readonly EnemySnapshot[] {
    return this.#enemies;
  }

  get burgers(): readonly BurgerSnapshot[] {
    return this.#burgers;
  }

  get stats(): StatsSnapshot {
    return this.#stats;
  }

  step(input: SimInput): readonly SimEvent[] {
    if (this.#status !== 'playing') return this.#events.drain();

    this.#chef.beginTick();
    for (const enemy of this.#enemies) enemy.beginTick();

    this.#chef.step(input, this.#level);
    for (const burger of this.#burgers) burger.step(this.#chef);
    if (this.#checkLevelClear()) return this.#events.drain();

    for (const enemy of this.#enemies) enemy.step(this.#chef, this.#level, this.#rng);
    if (input.pepper) this.#throwPepper();
    this.#checkContact();
    return this.#events.drain();
  }

  startBoard(): void {
    this.#burgers = this.#level.columns.map(
      (column) => new Burger(column, this.#level, this.#events, this.#stats, this.#crushTarget)
    );
    this.#resetPositions();
    this.#status = 'playing';
    this.#events.emit({ type: 'boardStarted' });
  }

  nextLevel(): void {
    if (this.#status !== 'levelClear') return;
    this.startBoard();
  }

  newGame(): void {
    this.#stats.newGame();
    this.startBoard();
  }

  #resetPositions(): void {
    const start = this.#level.chefStart;
    this.#chef.reset(start.row, start.x);
    this.#enemies.forEach((enemy, index) => enemy.reset(this.#level.enemyStarts[index], this.#rng));
  }

  #crushEnemies(left: number, right: number, fromRow: number, toRow: number): void {
    for (const enemy of this.#enemies) {
      const inLane = enemy.x >= left && enemy.x <= right;
      const inRange = enemy.row >= fromRow && enemy.row <= toRow;
      if (!enemy.active || !inLane || !inRange) continue;
      enemy.squash();
      const points = this.#stats.registerCrush(SCORE.squashBase);
      this.#events.emit({
        type: 'enemySquashed',
        enemyId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        points,
        combo: this.#stats.combo
      });
    }
  }

  #throwPepper(): void {
    if (!this.#stats.consumePepper()) return;
    const cloud = pepperCloudFor(this.#chef);
    this.#events.emit({
      type: 'pepperThrown',
      x: cloud.x,
      y: cloud.y,
      direction: cloud.direction
    });
    this.#enemies
      .filter((enemy) => isHitByPepper(cloud, this.#chef, enemy))
      .forEach((enemy) => enemy.stun());
  }

  #checkContact(): void {
    const touching = this.#enemies.some(
      (enemy) =>
        enemy.active &&
        !enemy.stunned &&
        Math.abs(enemy.x - this.#chef.x) < CONTACT_X &&
        Math.abs(enemy.y - this.#chef.y) < CONTACT_Y
    );
    if (touching) this.#loseLife();
  }

  #loseLife(): void {
    this.#stats.loseLife();
    this.#events.emit({ type: 'chefHit', livesLeft: Math.max(0, this.#stats.lives) });
    if (this.#stats.lives <= 0) {
      this.#status = 'gameOver';
      this.#events.emit({ type: 'gameOver' });
      return;
    }
    this.#resetPositions();
  }

  #checkLevelClear(): boolean {
    if (this.#burgers.length === 0 || !this.#burgers.every((burger) => burger.isComplete)) {
      return false;
    }
    this.#stats.advanceLevel();
    this.#status = 'levelClear';
    this.#events.emit({ type: 'levelCleared', level: this.#stats.level });
    return true;
  }
}

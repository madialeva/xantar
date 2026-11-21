import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  type EnemyPace,
  boardsPerScreen,
  paceFor
} from './difficulty';
import { Chef, type ChefSnapshot } from './entities/Chef';
import { createEnemy } from './entities/createEnemy';
import { type Enemy, type EnemyEntry, type EnemySnapshot, enemyGait } from './entities/Enemy';
import { isCrushedBy } from './entities/crush';
import { isStandingOn } from './entities/riders';
import { type EnemyRoster, IngredientField } from './entities/IngredientField';
import type { IngredientSnapshot } from './entities/Ingredient';
import { isHitByPepper, pepperCloudFor } from './entities/pepper';
import type { PlateSnapshot } from './entities/Plate';
import { EventQueue, type SimEvent } from './events';
import { GameStats, type StatsSnapshot } from './GameStats';
import type { Level } from './level/Level';
import type { NavPlace } from './nav/NavPlace';
import type {
  GamePhase,
  GamePhaseName,
  PhaseHost,
  PlayOutcome,
  ReprieveOutcome
} from './phases/GamePhase';
import { ReadyPhase } from './phases/phases';
import type { Rng } from './rng';
import { CONTACT_X, CONTACT_Y, SCORE } from './rules';
import { screenIndexFor } from './screenOrder';
import type { SimInput } from './SimInput';

export interface SimulationOptions {
  /** The screens of the game, in the order they are played; at least one. */
  readonly screens: readonly Level[];
  readonly rng: Rng;
  /** Sets how fast the enemies go and how many boards each screen lasts; Normal when left out. */
  readonly difficulty?: Difficulty;
  /** The level a game starts on, and goes back to on a new game; the first when left out. */
  readonly startLevel?: number;
}

/**
 * Root of the game rules. Owns the screens, the chef, the enemies of the screen being played,
 * the ingredient field and the stats, advances one fixed tick at a time from an input and
 * returns the events it caused. What a tick does depends on the current game phase (State
 * pattern); each board is played on the screen its level number gives.
 */
export class Simulation {
  readonly #screens: readonly Level[];
  readonly #rng: Rng;
  readonly #difficulty: Difficulty;
  readonly #pace: EnemyPace;
  readonly #boardsPerScreen: number;
  readonly #events = new EventQueue();
  readonly #stats: GameStats;
  readonly #chef: Chef;
  readonly #roster: EnemyRoster = {
    board: (ingredient) => this.#board(ingredient),
    crushUnder: (ingredient) => this.#crushUnder(ingredient),
    release: (ingredient) => this.#release(ingredient)
  };
  readonly #phaseHost: PhaseHost;
  #level: Level;
  #chefPlace: NavPlace;
  #enemies: readonly Enemy[] = [];
  #enemyEntries: readonly EnemyEntry[] = [];
  #field: IngredientField;
  #phase: GamePhase = new ReadyPhase();
  /** Ticks of play on the board since it started or since the chef last came back. */
  #playTicks = 0;

  constructor(options: SimulationOptions) {
    const { screens, rng, difficulty = DEFAULT_DIFFICULTY, startLevel = 1 } = options;
    if (screens.length === 0) throw new Error('A game needs at least one screen');
    this.#screens = screens;
    this.#rng = rng;
    this.#difficulty = difficulty;
    this.#pace = paceFor(difficulty);
    this.#boardsPerScreen = boardsPerScreen(difficulty);
    this.#stats = new GameStats(this.#events, startLevel);
    this.#phaseHost = this.#createPhaseHost();
    this.#level = this.#screenFor(this.#stats.level);
    this.#chefPlace = this.#chefStartOn(this.#level);
    this.#chef = new Chef(this.#chefPlace);
    this.#mountEnemies();
    this.#field = this.#newField();
    this.startBoard();
  }

  /** The screen being played. */
  get level(): Level {
    return this.#level;
  }

  get phase(): GamePhaseName {
    return this.#phase.name;
  }

  get chef(): ChefSnapshot {
    return this.#chef;
  }

  get enemies(): readonly EnemySnapshot[] {
    return this.#enemies;
  }

  get ingredients(): readonly IngredientSnapshot[] {
    return this.#field.ingredients;
  }

  get plates(): readonly PlateSnapshot[] {
    return this.#field.plates;
  }

  get stats(): StatsSnapshot {
    return this.#stats;
  }

  get difficulty(): Difficulty {
    return this.#difficulty;
  }

  /**
   * Whether the falls under way will complete the board: from then on enemies no longer take
   * lives.
   */
  get boardSecured(): boolean {
    return this.#field.isSecured;
  }

  /** Factor over the enemies' speeds now, from the difficulty, the level and the time played. */
  get pace(): number {
    return this.#pace.factor(this.#stats.level, this.#playTicks);
  }

  step(input: SimInput): readonly SimEvent[] {
    this.#chef.beginTick();
    for (const enemy of this.#enemies) enemy.beginTick();
    this.#field.beginTick();
    this.#enterPhase(this.#phase.step(input, this.#phaseHost));
    return this.#events.drain();
  }

  /** Sets up a board on the screen of the current level, with its ingredients whole again. */
  startBoard(): void {
    this.#showScreen(this.#screenFor(this.#stats.level));
    this.#field = this.#newField();
    this.#playTicks = 0;
    this.#resetPositions();
    this.#events.emit({ type: 'boardStarted' });
    this.#enterPhase(new ReadyPhase());
  }

  newGame(): void {
    this.#stats.newGame();
    this.startBoard();
  }

  #enterPhase(next: GamePhase): void {
    const from = this.#phase.name;
    this.#phase = next;
    if (next.name !== from) this.#events.emit({ type: 'phaseChanged', from, to: next.name });
  }

  #createPhaseHost(): PhaseHost {
    const stats = this.#stats;
    return {
      get livesLeft(): number {
        return stats.lives;
      },
      playTick: (input) => this.#playTick(input),
      reprieveTick: () => this.#reprieveTick(),
      forfeitLife: () => this.#stats.loseLife(),
      respawn: () => this.#respawn(),
      rebuildBoard: () => this.startBoard(),
      endGame: () => this.#events.emit({ type: 'gameOver' })
    };
  }

  #playTick(input: SimInput): PlayOutcome {
    this.#chef.step(input, this.#level.graph);
    this.#field.step(this.#chef);
    if (this.#checkLevelClear()) return 'levelCleared';
    const gait = enemyGait(this.pace);
    for (const enemy of this.#enemies) enemy.step(this.#chef, this.#rng, gait);
    this.#playTicks += 1;
    if (input.pepper) this.#throwPepper();
    return this.#checkContact();
  }

  /**
   * A tick with the chef caught on a secured board: only the falls go on, and the enemies
   * riding them; the board is cleared as soon as the last burger is done.
   */
  #reprieveTick(): ReprieveOutcome {
    this.#field.advanceFalls();
    const gait = enemyGait(this.pace);
    for (const enemy of this.#enemies) {
      if (enemy.riding) enemy.step(this.#chef, this.#rng, gait);
    }
    if (this.#checkLevelClear()) return 'levelCleared';
    return this.#field.hasFalls ? 'falling' : 'stalled';
  }

  /**
   * Play resumes after a lost life: everyone back to the start, the pace back to its first step
   * and the half-stomped ingredients whole again, as in the original.
   */
  #respawn(): void {
    this.#playTicks = 0;
    this.#resetPositions();
    this.#field.liftStomps();
  }

  #screenFor(level: number): Level {
    return this.#screens[screenIndexFor(level, this.#screens.length, this.#boardsPerScreen)];
  }

  /** Moves the game to another screen: its chef start, its entries and its own enemies. */
  #showScreen(level: Level): void {
    if (level === this.#level) return;
    this.#level = level;
    this.#chefPlace = this.#chefStartOn(level);
    this.#mountEnemies();
  }

  #chefStartOn(level: Level): NavPlace {
    return level.graph.placeAt(level.chefStart.row, level.chefStart.x);
  }

  #mountEnemies(): void {
    const level = this.#level;
    const graph = level.graph;
    this.#enemyEntries = level.enemySpawns.map((spawn): EnemyEntry => ({
      place: graph.placeAt(spawn.row, spawn.joinX ?? spawn.x),
      delayTicks: spawn.delayTicks,
      ...(spawn.joinX === undefined ? {} : { fromX: spawn.x })
    }));
    this.#enemies = level.enemySpawns.map((spawn, id) =>
      createEnemy(id, spawn.kind, this.#events, graph, this.#enemyEntries)
    );
  }

  #newField(): IngredientField {
    return new IngredientField(this.#level, this.#events, this.#stats, this.#roster);
  }

  #resetPositions(): void {
    this.#chef.reset(this.#chefPlace);
    this.#enemies.forEach((enemy, index) => enemy.await(this.#enemyEntries[index], this.#rng));
  }

  #board(ingredient: IngredientSnapshot): number {
    const riders = this.#enemies.filter((enemy) => isStandingOn(ingredient, enemy));
    for (const enemy of riders) enemy.ride(ingredient);
    return riders.length;
  }

  #release(ingredient: IngredientSnapshot): void {
    const riders = this.#enemies.filter((enemy) => enemy.rides(ingredient));
    if (riders.length === 0) return;
    for (const enemy of riders) {
      const place = this.#dropPlace(ingredient, enemy.x);
      if (place === undefined) enemy.squash();
      else enemy.dropAt(place);
    }
    const points = this.#stats.registerRiders(SCORE.riders, riders.length);
    this.#events.emit({
      type: 'ridersDropped',
      ingredientId: ingredient.id,
      riders: riders.map((enemy) => ({ enemyId: enemy.id, x: enemy.x, y: ingredient.y })),
      points
    });
  }

  /**
   * Where a rider comes back: on the floor where its ingredient stopped or, when it ended on
   * its plate, on the lowest platform above the plate, at the rider's horizontal position.
   */
  #dropPlace(ingredient: IngredientSnapshot, x: number): NavPlace | undefined {
    const graph = this.#level.graph;
    const onPlate = ingredient.stackSlot !== null;
    const floor = graph.platforms
      .filter((platform) =>
        onPlate ? platform.row < ingredient.row : platform.row === ingredient.row
      )
      .filter((platform) => platform.left <= x && x <= platform.right)
      .reduce<(typeof graph.platforms)[number] | undefined>(
        (lowest, platform) =>
          lowest === undefined || platform.row > lowest.row ? platform : lowest,
        undefined
      );
    return floor === undefined ? undefined : graph.placeAt(floor.row, x);
  }

  #crushUnder(ingredient: IngredientSnapshot): void {
    for (const enemy of this.#enemies) {
      if (!enemy.active || enemy.riding || !isCrushedBy(ingredient, enemy)) continue;
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
      .filter((enemy) => isHitByPepper(this.#chef, enemy))
      .forEach((enemy) => enemy.stun());
  }

  /** A free enemy touching the chef takes a life, or only knocks him down on a secured board. */
  #checkContact(): PlayOutcome {
    const touching = this.#enemies.some(
      (enemy) =>
        enemy.active &&
        !enemy.stunned &&
        !enemy.riding &&
        Math.abs(enemy.x - this.#chef.x) < CONTACT_X &&
        Math.abs(enemy.y - this.#chef.y) < CONTACT_Y
    );
    if (!touching) return 'continue';
    const secured = this.#field.isSecured;
    if (!secured) this.#stats.loseLife();
    this.#events.emit({ type: 'chefHit', livesLeft: Math.max(0, this.#stats.lives) });
    return secured ? 'chefReprieved' : 'chefHit';
  }

  #checkLevelClear(): boolean {
    if (!this.#field.isComplete) return false;
    this.#stats.advanceLevel();
    this.#events.emit({ type: 'levelCleared', level: this.#stats.level });
    return true;
  }
}

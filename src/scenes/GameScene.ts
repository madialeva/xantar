import Phaser from 'phaser';
import { type RenderTier, TILE } from '../config';
import classicDocument from '../levels/classic.level.json';
import ChefView from '../objects/ChefView';
import EnemyView from '../objects/EnemyView';
import IngredientView from '../objects/IngredientView';
import { stackLifts } from '../objects/stacking';
import type { ActionReader } from '../input/actions';
import { toSimInput } from '../input/toSimInput';
import {
  FixedStepper,
  SeededRng,
  type SimEvent,
  Simulation,
  loadLevel,
  parseLevelDocument
} from '../sim';
import { type CuePlayer, EventSounds } from '../view/audio/EventSounds';
import { MazeView } from '../view/board/MazeView';
import { EventEffects } from '../view/fx/EventEffects';
import type { Settings } from '../settings/Settings';
import { followBoardCamera } from '../view/layout/boardCamera';
import { ArtFactory } from '../view/raster/ArtFactory';
import type { GameSession, SessionRequest } from '../view/session/GameSession';
import { PALETTE } from '../view/theme/palette';

const CAMERA_FLASH_MS = 180;
const DEPTH = { maze: 0, ingredients: 5, enemies: 6, chef: 7, effects: 8 };
const STACK_DEPTH_STEP = 0.01;

export interface GameSceneDependencies {
  readonly tier: RenderTier;
  readonly session: GameSession;
  readonly settings: Settings;
  readonly input: ActionReader;
  readonly sounds: CuePlayer;
  /** Events that pause the game (a gamepad lost); each returns a way to stop listening. */
  readonly interruptions: readonly ((listener: () => void) => () => void)[];
}

/**
 * Phaser scene of the board: runs the simulation at a fixed step, draws it with
 * interpolation, turns its events into effects and publishes the game state to the session
 * for the HUD scene. It contains no game rules.
 */
export default class GameScene extends Phaser.Scene {
  readonly #deps: GameSceneDependencies;
  #art!: ArtFactory;
  #sim!: Simulation;
  readonly #stepper = new FixedStepper();
  #pepperPending = false;
  #confirmPending = false;
  #paused = false;
  #leaving = false;

  #chefView!: ChefView;
  #enemyViews: EnemyView[] = [];
  #ingredientViews = new Map<number, IngredientView>();
  #effects!: EventEffects;
  #sounds!: EventSounds;

  constructor(deps: GameSceneDependencies) {
    super({ key: 'GameScene' });
    this.#deps = deps;
  }

  create(): void {
    const { session, settings, tier } = this.#deps;
    this.#art = new ArtFactory(this, tier);
    this.cameras.main.setBackgroundColor(PALETTE.background);
    this.#sim = new Simulation({
      level: loadLevel(parseLevelDocument(classicDocument)),
      rng: new SeededRng(Date.now())
    });
    this.#stepper.reset();
    this.#pepperPending = false;
    this.#confirmPending = false;
    this.#paused = false;
    this.#leaving = false;
    new MazeView(this, this.#art, this.#sim.level).setDepth(DEPTH.maze);
    this.#createViews();
    this.#effects = new EventEffects(this, this.#art, DEPTH.effects);
    this.#sounds = new EventSounds(this.#deps.sounds);
    followBoardCamera(this, tier);
    this.#rebuildIngredients();
    this.#syncViews(0);
    session.start(settings.bestScore);
    session.update(this.#sim.stats, this.#sim.phase);
    this.#listen();
    this.scene.launch('HudScene');
  }

  override update(_time: number, delta: number): void {
    const { input } = this.#deps;
    if (input.justPressed('pepper')) this.#pepperPending = true;
    if (input.justPressed('confirm')) this.#confirmPending = true;

    const events: SimEvent[] = [];
    const steps = this.#stepper.advance(delta);
    for (let i = 0; i < steps; i++) {
      events.push(
        ...this.#sim.step(
          toSimInput(input, { pepper: this.#pepperPending, confirm: this.#confirmPending })
        )
      );
      this.#pepperPending = false;
      this.#confirmPending = false;
    }

    this.#syncViews(this.#stepper.alpha);
    if (events.length > 0) this.#handleEvents(events);
    this.#deps.session.update(this.#sim.stats, this.#sim.phase);
  }

  #listen(): void {
    const onRequest = (request: SessionRequest): void => {
      switch (request) {
        case 'pause':
          this.#pause();
          break;
        case 'resume':
          this.#resume();
          break;
        case 'quit':
          this.#quit();
          break;
      }
    };
    const onLeave = (): void => this.#pause();
    const onVisibility = (): void => {
      if (document.hidden) this.#pause();
    };
    const onFullscreenChange = (): void => {
      if (!document.fullscreenElement) this.#pause();
    };
    const unsubscribe = this.#deps.session.onRequest(onRequest);
    const stopInterruptions = this.#deps.interruptions.map((subscribe) => subscribe(onLeave));
    this.game.events.on(Phaser.Core.Events.BLUR, onLeave);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      for (const stop of stopInterruptions) stop();
      this.game.events.off(Phaser.Core.Events.BLUR, onLeave);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    });
  }

  #pause(): void {
    if (this.#paused || this.#leaving || this.#sim.phase === 'gameOver') return;
    this.#paused = true;
    this.#deps.session.setPaused(true);
    this.scene.pause();
  }

  #resume(): void {
    if (!this.#paused) return;
    this.#paused = false;
    this.#stepper.reset();
    this.scene.resume();
    this.#deps.session.setPaused(false);
  }

  #quit(): void {
    if (this.#leaving) return;
    this.#leaving = true;
    this.#deps.settings.submitScore(this.#sim.stats.score);
    this.scene.stop('HudScene');
    this.scene.start('MenuScene');
  }

  #createViews(): void {
    this.#chefView = new ChefView(this, this.#art).setDepth(DEPTH.chef);
    this.#enemyViews = this.#sim.enemies.map((enemy) =>
      new EnemyView(this, this.#art, enemy.kind).setDepth(DEPTH.enemies)
    );
  }

  #rebuildIngredients(): void {
    for (const view of this.#ingredientViews.values()) view.destroy();
    this.#ingredientViews.clear();
    for (const ingredient of this.#sim.ingredients) {
      const view = new IngredientView(this, this.#art, ingredient).setDepth(DEPTH.ingredients);
      this.#ingredientViews.set(ingredient.id, view);
    }
  }

  #syncViews(alpha: number): void {
    this.#chefView.sync(this.#sim.chef, alpha, this.#sim.phase === 'dying');
    this.#sim.enemies.forEach((enemy, index) => this.#enemyViews[index].sync(enemy, alpha));
    const lifts = stackLifts(this.#sim.ingredients);
    for (const ingredient of this.#sim.ingredients) {
      this.#ingredientViews
        .get(ingredient.id)
        ?.setDepth(DEPTH.ingredients + (ingredient.stackSlot ?? 0) * STACK_DEPTH_STEP)
        .sync(ingredient, alpha, lifts.get(ingredient.id));
    }
  }

  #handleEvents(events: readonly SimEvent[]): void {
    this.#sounds.play(events);
    for (const event of events) {
      switch (event.type) {
        case 'boardStarted':
          this.#effects.clear();
          this.#rebuildIngredients();
          break;
        case 'pepperThrown':
          this.#effects.pepper(event.x * TILE, event.y * TILE, event.direction);
          break;
        case 'chefHit':
          this.cameras.main.flash(CAMERA_FLASH_MS, 255, 60, 60);
          break;
        case 'gameOver':
          if (this.#deps.settings.submitScore(this.#sim.stats.score)) {
            this.#deps.session.markNewRecord();
          }
          break;
        case 'ingredientLanded':
          this.#ingredientViews.get(event.ingredientId)?.land();
          break;
        case 'segmentStomped': {
          const top = this.#ingredientViews.get(event.ingredientId)?.segmentTop(event.segment);
          if (top) this.#effects.dust(top.x, top.y);
          break;
        }
        case 'enemySquashed':
          this.#effects.squash(event.x * TILE, event.y * TILE);
          break;
        case 'burgerDone': {
          const plate = this.#sim.level.plates.find((candidate) => candidate.id === event.plateId);
          if (plate) this.#effects.burgerDone(plate);
          break;
        }
        case 'levelCleared':
        case 'phaseChanged':
        case 'ingredientsTriggered':
        case 'enemyRespawned':
        case 'enemyStunned':
        case 'scoreChanged':
          break;
      }
    }
  }
}

import Phaser from 'phaser';
import { type RenderTier, TILE } from '../config';
import classicDocument from '../levels/classic.level.json';
import ChefView from '../objects/ChefView';
import EnemyView from '../objects/EnemyView';
import IngredientView from '../objects/IngredientView';
import {
  FixedStepper,
  NO_INPUT,
  SeededRng,
  type SimEvent,
  type SimInput,
  Simulation,
  loadLevel,
  parseLevelDocument
} from '../sim';
import { MazeView } from '../view/board/MazeView';
import { HudPanels } from '../view/hud/HudPanels';
import { OverlayView } from '../view/hud/OverlayView';
import { followBoardCamera } from '../view/layout/boardCamera';
import { layoutForWidth } from '../view/layout/computeLayout';
import { ArtFactory } from '../view/raster/ArtFactory';
import { chooseTheme } from '../view/theme/chooseTheme';
import type { ResolvedTheme } from '../view/theme/Theme';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';

const PEPPER_CLOUD_MS = 400;
const CAMERA_FLASH_MS = 180;
const DEPTH = { maze: 0, ingredients: 5, enemies: 6, chef: 7, effects: 8, hud: 10, overlay: 20 };

export interface GameSceneDependencies {
  readonly themes: ThemeRegistry;
  readonly urlTheme: string | null;
  readonly tier: RenderTier;
}

/**
 * Phaser scene that runs the simulation at a fixed step, draws it with interpolation and
 * turns its events into effects. It contains no game rules.
 */
export default class GameScene extends Phaser.Scene {
  readonly #themes: ThemeRegistry;
  readonly #urlTheme: string | null;
  readonly #tier: RenderTier;
  #theme!: ResolvedTheme;
  #art!: ArtFactory;
  #sim!: Simulation;
  readonly #stepper = new FixedStepper();
  #pepperPending = false;

  #chefView!: ChefView;
  #enemyViews: EnemyView[] = [];
  #ingredientViews = new Map<number, IngredientView>();

  #cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  #wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  #pepperKey!: Phaser.Input.Keyboard.Key;
  #enterKey!: Phaser.Input.Keyboard.Key;

  #hud!: HudPanels;
  #overlay!: OverlayView;

  constructor({ themes, urlTheme, tier }: GameSceneDependencies) {
    super({ key: 'GameScene' });
    this.#themes = themes;
    this.#urlTheme = urlTheme;
    this.#tier = tier;
  }

  create(): void {
    const levelDocument = parseLevelDocument(classicDocument);
    this.#theme = this.#chooseTheme(levelDocument.theme);
    this.#art = new ArtFactory(this, this.#theme.id, this.#tier);
    this.cameras.main.setBackgroundColor(this.#theme.palette.background);
    this.#sim = new Simulation({
      level: loadLevel(levelDocument),
      rng: new SeededRng(Date.now())
    });
    this.#stepper.reset();
    this.#pepperPending = false;
    new MazeView(this, this.#art, this.#sim.level).setDepth(DEPTH.maze);
    this.#createViews();
    this.#hud = new HudPanels(this, this.#art, this.#theme.palette, this.#tier, () =>
      this.#exitGame()
    ).setDepth(DEPTH.hud);
    this.#hud.update(this.#sim.stats);
    this.#overlay = new OverlayView(this, this.#theme.palette, this.#tier);
    followBoardCamera(this, this.#tier, (width) => this.#hud.layout(layoutForWidth(width)));
    this.#createInput();
    this.#rebuildIngredients();
    this.#syncViews(0);
  }

  override update(_time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.#pepperKey)) this.#pepperPending = true;

    if (this.#sim.status !== 'playing') {
      this.#pepperPending = false;
      if (Phaser.Input.Keyboard.JustDown(this.#enterKey)) this.#confirm();
    }

    const events: SimEvent[] = [];
    const steps = this.#stepper.advance(delta);
    for (let i = 0; i < steps; i++) {
      events.push(...this.#sim.step(this.#readInput()));
      this.#pepperPending = false;
    }

    this.#syncViews(this.#stepper.alpha);
    if (events.length > 0) this.#handleEvents(events);
  }

  #chooseTheme(levelTheme: string | undefined): ResolvedTheme {
    const choice = chooseTheme({ urlTheme: this.#urlTheme, levelTheme }, this.#themes);
    for (const warning of choice.warnings) console.warn(warning);
    return this.#themes.resolve(choice.id);
  }

  #readInput(): SimInput {
    return {
      ...NO_INPUT,
      left: this.#cursors.left.isDown || this.#wasd.A.isDown,
      right: this.#cursors.right.isDown || this.#wasd.D.isDown,
      up: this.#cursors.up.isDown || this.#wasd.W.isDown,
      down: this.#cursors.down.isDown || this.#wasd.S.isDown,
      pepper: this.#pepperPending
    };
  }

  #createViews(): void {
    this.#chefView = new ChefView(this).setDepth(DEPTH.chef);
    this.#enemyViews = this.#sim.enemies.map((enemy) =>
      new EnemyView(this, enemy.kind).setDepth(DEPTH.enemies)
    );
  }

  #rebuildIngredients(): void {
    for (const view of this.#ingredientViews.values()) view.destroy();
    this.#ingredientViews.clear();
    for (const ingredient of this.#sim.ingredients) {
      this.#ingredientViews.set(
        ingredient.id,
        new IngredientView(this, this.#art, ingredient).setDepth(DEPTH.ingredients)
      );
    }
  }

  #syncViews(alpha: number): void {
    this.#chefView.sync(this.#sim.chef, alpha);
    this.#sim.enemies.forEach((enemy, index) => this.#enemyViews[index].sync(enemy, alpha));
    for (const ingredient of this.#sim.ingredients) {
      this.#ingredientViews.get(ingredient.id)?.sync(ingredient, alpha);
    }
  }

  #handleEvents(events: readonly SimEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'boardStarted':
          this.#overlay.hide();
          this.#rebuildIngredients();
          break;
        case 'pepperThrown':
          this.#showPepperCloud(event.x * TILE, event.y * TILE);
          break;
        case 'chefHit':
          this.cameras.main.flash(CAMERA_FLASH_MS, 255, 60, 60);
          break;
        case 'levelCleared':
          this.#overlay.show(
            'NIVEL COMPLETADO',
            'Pulsa ENTER para el siguiente nivel',
            DEPTH.overlay
          );
          break;
        case 'gameOver':
          this.#overlay.show('GAME OVER', 'Pulsa ENTER para reiniciar', DEPTH.overlay);
          break;
        case 'ingredientLanded':
          this.#ingredientViews.get(event.ingredientId)?.land();
          break;
        case 'segmentStomped':
        case 'ingredientsTriggered':
        case 'enemySquashed':
        case 'enemyRespawned':
        case 'enemyStunned':
        case 'burgerDone':
        case 'scoreChanged':
          break;
      }
    }
    this.#hud.update(this.#sim.stats);
  }

  #showPepperCloud(x: number, y: number): void {
    const cloud = this.#art.image('fx.pepper', x, y).setDepth(DEPTH.effects);
    this.tweens.add({
      targets: cloud,
      alpha: 0,
      scale: cloud.scale * 2,
      duration: PEPPER_CLOUD_MS,
      onComplete: () => cloud.destroy()
    });
  }

  #createInput(): void {
    const keyboard = this.input.keyboard!;
    this.#cursors = keyboard.createCursorKeys();
    this.#wasd = keyboard.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
    this.#pepperKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.#enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.#exitGame());
  }

  #confirm(): void {
    this.#overlay.hide();
    if (this.#sim.status === 'gameOver') this.#sim.newGame();
    else this.#sim.nextLevel();
    this.#stepper.reset();
  }

  #exitGame(): void {
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
    const exit: Promise<void> = doc.exitFullscreen
      ? doc.exitFullscreen()
      : doc.webkitExitFullscreen
        ? Promise.resolve(doc.webkitExitFullscreen())
        : Promise.resolve();
    void exit.finally(() => {
      window.location.href = 'index.html';
    });
  }
}

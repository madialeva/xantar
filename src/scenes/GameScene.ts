import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TILE, platformY } from '../config';
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

const PEPPER_CLOUD_RADIUS = 13;
const PEPPER_CLOUD_MS = 400;
const CAMERA_FLASH_MS = 180;

export default class GameScene extends Phaser.Scene {
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

  #scoreText!: Phaser.GameObjects.Text;
  #pepperText!: Phaser.GameObjects.Text;
  #livesText!: Phaser.GameObjects.Text;
  #overlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.#sim = new Simulation({
      level: loadLevel(parseLevelDocument(classicDocument)),
      rng: new SeededRng(Date.now())
    });
    this.#stepper.reset();
    this.#pepperPending = false;
    this.#drawMaze();
    this.#createViews();
    this.#createHud();
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

  #drawMaze(): void {
    const level = this.#sim.level;
    const ladders = this.add.graphics().setDepth(1);
    ladders.fillStyle(COLORS.ladder, 1);
    for (const ladder of level.graph.ladders) {
      const x = (ladder.col + 0.5) * TILE;
      const top = platformY(ladder.topRow);
      const bottom = platformY(ladder.bottomRow);
      ladders.fillRect(x - 8, top, 3, bottom - top);
      ladders.fillRect(x + 5, top, 3, bottom - top);
      for (let y = top + 10; y < bottom; y += 12) {
        ladders.fillRect(x - 8, y, 16, 3);
      }
    }

    for (const run of level.graph.platforms) {
      this.add
        .rectangle(
          ((run.left + run.right) / 2) * TILE,
          platformY(run.row),
          (run.right - run.left) * TILE,
          10,
          COLORS.platform
        )
        .setDepth(2);
    }

    for (const plate of level.plates) {
      this.add
        .rectangle(
          (plate.col + plate.width / 2) * TILE,
          platformY(plate.row),
          plate.width * TILE * 0.92,
          8,
          COLORS.plate
        )
        .setDepth(2);
    }
  }

  #createViews(): void {
    this.#chefView = new ChefView(this).setDepth(7);
    this.#enemyViews = this.#sim.enemies.map((enemy) =>
      new EnemyView(this, enemy.kind).setDepth(6)
    );
  }

  #rebuildIngredients(): void {
    for (const view of this.#ingredientViews.values()) view.destroy();
    this.#ingredientViews.clear();
    for (const ingredient of this.#sim.ingredients) {
      this.#ingredientViews.set(ingredient.id, new IngredientView(this, ingredient).setDepth(5));
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
          this.#hideOverlay();
          this.#rebuildIngredients();
          break;
        case 'pepperThrown':
          this.#showPepperCloud(event.x * TILE, event.y * TILE);
          break;
        case 'chefHit':
          this.cameras.main.flash(CAMERA_FLASH_MS, 255, 60, 60);
          break;
        case 'levelCleared':
          this.#showOverlay('NIVEL COMPLETADO', 'Pulsa ENTER para el siguiente nivel');
          break;
        case 'gameOver':
          this.#showOverlay('GAME OVER', 'Pulsa ENTER para reiniciar');
          break;
        case 'segmentStomped':
        case 'ingredientsTriggered':
        case 'ingredientLanded':
        case 'enemySquashed':
        case 'enemyRespawned':
        case 'enemyStunned':
        case 'burgerDone':
        case 'scoreChanged':
          break;
      }
    }
    this.#updateHud();
  }

  #showPepperCloud(x: number, y: number): void {
    const cloud = this.add.circle(x, y, PEPPER_CLOUD_RADIUS, 0xffffff, 0.85).setDepth(8);
    this.tweens.add({
      targets: cloud,
      alpha: 0,
      scale: 2,
      duration: PEPPER_CLOUD_MS,
      onComplete: () => cloud.destroy()
    });
  }

  #createHud(): void {
    this.#scoreText = this.add
      .text(16, 12, '', { fontSize: '18px', color: COLORS.hud, fontFamily: 'monospace' })
      .setDepth(10);
    this.#pepperText = this.add
      .text(16, 38, '', { fontSize: '16px', color: '#ffd166', fontFamily: 'monospace' })
      .setDepth(10);
    this.#livesText = this.add
      .text(GAME_WIDTH / 2, 20, '', {
        fontSize: '18px',
        color: COLORS.hud,
        fontFamily: 'monospace'
      })
      .setOrigin(0.5)
      .setDepth(10);

    const btnX = GAME_WIDTH - 26;
    const btnY = 26;
    const bg = this.add.circle(btnX, btnY, 17, 0x222222, 0.85).setDepth(10);
    const label = this.add
      .text(btnX, btnY, '✕', {
        fontSize: '17px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    label.on('pointerover', () => bg.setFillStyle(0x555555, 0.9));
    label.on('pointerout', () => bg.setFillStyle(0x222222, 0.85));
    label.on('pointerup', () => this.#exitGame());

    this.#updateHud();
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

  #updateHud(): void {
    const { score, peppers, lives, level } = this.#sim.stats;
    this.#scoreText.setText(`PUNTOS ${score.toString().padStart(6, '0')}`);
    this.#pepperText.setText(`PIMIENTA ${peppers}`);
    this.#livesText.setText(`VIDAS ${Math.max(0, lives)}   NIVEL ${level}`);
  }

  #confirm(): void {
    this.#hideOverlay();
    if (this.#sim.status === 'gameOver') this.#sim.newGame();
    else this.#sim.nextLevel();
    this.#stepper.reset();
  }

  #showOverlay(title: string, subtitle: string): void {
    this.#hideOverlay();
    const shade = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.72
    );
    const titleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, title, {
        fontSize: '34px',
        color: '#ffffff',
        fontFamily: 'monospace'
      })
      .setOrigin(0.5);
    const subtitleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, subtitle, {
        fontSize: '16px',
        color: '#ffd166',
        fontFamily: 'monospace'
      })
      .setOrigin(0.5);
    this.#overlay = this.add.container(0, 0, [shade, titleText, subtitleText]).setDepth(20);
  }

  #hideOverlay(): void {
    this.#overlay?.destroy();
    this.#overlay = null;
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

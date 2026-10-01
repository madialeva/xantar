import Phaser from 'phaser';
import {
  BURGER_STACK,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  INGREDIENT_HEIGHTS,
  LADDER_COLS,
  LANES,
  LANE_STACK_HEIGHT,
  PLATFORM_ROWS,
  PLATE_ROW,
  SCORE,
  START_LIVES,
  START_PEPPERS,
  TILE,
  colX,
  entityY,
  platformY
} from '../config';
import { LADDERS } from '../level';
import Chef, { type ChefControls } from '../objects/Chef';
import Enemy, { type EnemyKind } from '../objects/Enemy';
import Ingredient from '../objects/Ingredient';

export default class GameScene extends Phaser.Scene {
  private chef!: Chef;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private pepperKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  private enemies: Enemy[] = [];
  private ingredients: Ingredient[] = [];
  private laneActive: Ingredient[][] = [];
  private laneStacks: Ingredient[][] = [];
  private laneDone: boolean[] = [];
  private armed = new Map<Ingredient, 'left' | 'right'>();

  private score = 0;
  private lives = START_LIVES;
  private peppers = START_PEPPERS;
  private level = 1;
  private running = true;
  private squashCombo = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private pepperText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private overlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawMaze();
    this.chef = new Chef(this, PLATFORM_ROWS[PLATFORM_ROWS.length - 1], colX(10));
    this.chef.setDepth(7);
    this.createEnemies();
    this.createHud();
    this.createInput();
    this.startBoard();
    this.running = true;
  }

  override update(_time: number, delta: number): void {
    if (!this.running) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) this.onConfirm();
      return;
    }

    const dt = delta / 1000;
    const controls: ChefControls = {
      left: this.cursors.left.isDown || this.wasd.A.isDown,
      right: this.cursors.right.isDown || this.wasd.D.isDown,
      up: this.cursors.up.isDown || this.wasd.W.isDown,
      down: this.cursors.down.isDown || this.wasd.S.isDown
    };

    this.chef.update(dt, controls);
    this.checkTraversal();

    for (const enemy of this.enemies) {
      enemy.update(dt, this.chef.row, this.chef.x);
    }

    if (Phaser.Input.Keyboard.JustDown(this.pepperKey)) this.usePepper();
    this.checkChefHit();
  }

  private drawMaze(): void {
    const ladders = this.add.graphics().setDepth(1);
    ladders.fillStyle(COLORS.ladder, 1);
    for (const ladder of LADDERS) {
      const x = colX(ladder.col);
      const top = platformY(ladder.top);
      const bottom = platformY(ladder.bottom);
      ladders.fillRect(x - 8, top, 3, bottom - top);
      ladders.fillRect(x + 5, top, 3, bottom - top);
      for (let y = top + 10; y < bottom; y += 12) {
        ladders.fillRect(x - 8, y, 16, 3);
      }
    }

    for (const row of PLATFORM_ROWS) {
      const platform = this.add.rectangle(
        GAME_WIDTH / 2,
        platformY(row),
        GAME_WIDTH,
        10,
        COLORS.platform
      );
      platform.setDepth(2);
    }

    this.add
      .rectangle(GAME_WIDTH / 2, platformY(PLATE_ROW), GAME_WIDTH * 0.92, 8, COLORS.plate)
      .setDepth(2);
  }

  private createIngredients(): void {
    for (const ingredient of this.ingredients) ingredient.destroy();
    this.ingredients = [];
    this.laneActive = LANES.map(() => []);
    this.laneStacks = LANES.map(() => []);
    this.laneDone = LANES.map(() => false);
    this.armed.clear();

    for (const lane of LANES) {
      BURGER_STACK.forEach((kind, index) => {
        const row = PLATFORM_ROWS[PLATFORM_ROWS.length - 1 - index];
        const left = lane.x0 * TILE + 2;
        const right = (lane.x1 + 1) * TILE - 2;
        const ingredient = new Ingredient(this, lane.id, left, right, row, kind);
        ingredient.setY(this.ingredientY(row, kind));
        ingredient.setDepth(5);
        this.ingredients.push(ingredient);
        this.laneActive[lane.id].push(ingredient);
      });
      this.laneActive[lane.id].sort((a, b) => a.row - b.row);
    }
  }

  private createEnemies(): void {
    const kinds: EnemyKind[] = ['hotdog', 'pickle', 'egg'];
    const starts = [colX(1), colX(9), colX(18)];
    this.enemies = kinds.map((kind, index) => {
      const enemy = new Enemy(this, kind, PLATFORM_ROWS[0], starts[index]);
      enemy.setDepth(6);
      return enemy;
    });
  }

  private createHud(): void {
    this.scoreText = this.add
      .text(16, 12, '', { fontSize: '18px', color: COLORS.hud, fontFamily: 'monospace' })
      .setDepth(10);
    this.pepperText = this.add
      .text(16, 38, '', { fontSize: '16px', color: '#ffd166', fontFamily: 'monospace' })
      .setDepth(10);
    this.livesText = this.add
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
    label.on('pointerup', () => this.exitGame());

    this.updateHud();
  }

  private createInput(): void {
    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
    this.pepperKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.exitGame());
  }

  private startBoard(): void {
    this.createIngredients();
    this.resetPositions();
    this.updateHud();
  }

  private resetPositions(): void {
    this.chef.row = PLATFORM_ROWS[PLATFORM_ROWS.length - 1];
    this.chef.setPosition(colX(10), entityY(this.chef.row));
    this.chef.setScale(1, 1);
    const starts = [colX(1), colX(9), colX(18)];
    this.enemies.forEach((enemy, index) => enemy.respawn(PLATFORM_ROWS[0], starts[index]));
  }

  private updateHud(): void {
    this.scoreText.setText(`PUNTOS ${this.score.toString().padStart(6, '0')}`);
    this.pepperText.setText(`PIMIENTA ${this.peppers}`);
    this.livesText.setText(`VIDAS ${Math.max(0, this.lives)}   NIVEL ${this.level}`);
  }

  private addScore(points: number): void {
    this.score += points;
    this.updateHud();
  }

  private checkTraversal(): void {
    for (const ingredient of this.ingredients) {
      if (!ingredient.isIdle) continue;

      if (this.chef.row !== ingredient.row) {
        this.armed.delete(ingredient);
        continue;
      }

      const center = (ingredient.left + ingredient.right) / 2;
      const inside = this.chef.x >= ingredient.left - 2 && this.chef.x <= ingredient.right + 2;
      if (!inside) {
        this.armed.delete(ingredient);
        continue;
      }

      let side = this.armed.get(ingredient);
      if (!side) {
        side = this.chef.x < center ? 'left' : 'right';
        this.armed.set(ingredient, side);
      }

      const reachedFarEnd =
        side === 'left' ? this.chef.x >= ingredient.right - 6 : this.chef.x <= ingredient.left + 6;
      if (reachedFarEnd) {
        this.armed.delete(ingredient);
        this.triggerIngredient(ingredient);
      }
    }
  }

  private triggerIngredient(ingredient: Ingredient): void {
    const active = this.laneActive[ingredient.laneId];
    const startIndex = active.indexOf(ingredient);
    if (startIndex < 0) return;

    const suffix = active.slice(startIndex);
    this.laneActive[ingredient.laneId] = active.slice(0, startIndex);
    suffix.sort((a, b) => b.row - a.row);

    const lane = LANES.find((item) => item.id === ingredient.laneId)!;
    const laneLeft = lane.x0 * TILE;
    const laneRight = (lane.x1 + 1) * TILE;

    suffix.forEach((item, index) => {
      item.state = 'falling';
      this.time.delayedCall(index * 110, () => this.fallIngredient(item, laneLeft, laneRight));
      this.addScore(SCORE.ingredient);
    });
  }

  private fallIngredient(ingredient: Ingredient, laneLeft: number, laneRight: number): void {
    const nextRow = this.nextPlatformRow(ingredient.row);
    this.squashEnemiesBetween(laneLeft, laneRight, ingredient.row, nextRow ?? PLATE_ROW);

    if (nextRow === null) {
      const stack = this.laneStacks[ingredient.laneId];
      const slot = stack.length;
      stack.push(ingredient);
      const targetY = platformY(PLATE_ROW) - 6 - slot * LANE_STACK_HEIGHT;
      this.tweens.add({
        targets: ingredient,
        y: targetY,
        duration: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          ingredient.state = 'stacked';
          this.checkBurger(ingredient.laneId);
        }
      });
      return;
    }

    ingredient.row = nextRow;
    this.tweens.add({
      targets: ingredient,
      y: this.ingredientY(nextRow, ingredient.kind),
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        ingredient.state = 'idle';
      }
    });
    this.laneActive[ingredient.laneId].push(ingredient);
    this.laneActive[ingredient.laneId].sort((a, b) => a.row - b.row);
  }

  private nextPlatformRow(row: number): number | null {
    const index = PLATFORM_ROWS.indexOf(row);
    if (index < 0 || index >= PLATFORM_ROWS.length - 1) return null;
    return PLATFORM_ROWS[index + 1];
  }

  private ingredientY(row: number, kind: Ingredient['kind']): number {
    return platformY(row) - INGREDIENT_HEIGHTS[kind] / 2 - 6;
  }

  private squashEnemiesBetween(left: number, right: number, fromRow: number, toRow: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const inLane = enemy.x >= left && enemy.x <= right;
      const inRange = enemy.row >= fromRow && enemy.row <= toRow;
      if (inLane && inRange) {
        enemy.squash();
        this.squashCombo += 1;
        this.addScore(SCORE.squashBase * this.squashCombo);
        this.time.delayedCall(2500, () => {
          const col = LADDER_COLS[Phaser.Math.Between(0, LADDER_COLS.length - 1)];
          enemy.respawn(PLATFORM_ROWS[0], colX(col));
        });
      }
    }
  }

  private checkBurger(laneId: number): void {
    if (this.laneDone[laneId]) return;
    if (this.laneStacks[laneId].length < BURGER_STACK.length) return;
    this.laneDone[laneId] = true;
    this.addScore(SCORE.burger);
    this.peppers += 1;
    this.updateHud();
    if (this.laneDone.every(Boolean)) this.winLevel();
  }

  private usePepper(): void {
    if (this.peppers <= 0) return;
    this.peppers -= 1;
    this.updateHud();

    const direction = this.chef.facing;
    const cloudX = this.chef.x + direction * 24;
    const cloudY = this.chef.y - 2;
    const cloud = this.add.circle(cloudX, cloudY, 13, 0xffffff, 0.85).setDepth(8);
    this.tweens.add({
      targets: cloud,
      alpha: 0,
      scale: 2,
      duration: 400,
      onComplete: () => cloud.destroy()
    });

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const inFront = Math.sign(enemy.x - this.chef.x) === direction;
      const nearby = Math.abs(enemy.x - cloudX) < 44 && Math.abs(enemy.y - this.chef.y) < 26;
      if (inFront && nearby) enemy.stun();
    }
  }

  private checkChefHit(): void {
    if (!this.running) return;
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.isStunned) continue;
      if (Math.abs(enemy.x - this.chef.x) < 16 && Math.abs(enemy.y - this.chef.y) < 18) {
        this.loseLife();
        return;
      }
    }
  }

  private loseLife(): void {
    this.lives -= 1;
    this.squashCombo = 0;
    this.updateHud();
    this.cameras.main.flash(180, 255, 60, 60);
    if (this.lives <= 0) {
      this.showOverlay('GAME OVER', 'Pulsa ENTER para reiniciar');
      this.running = false;
      return;
    }
    this.resetPositions();
  }

  private winLevel(): void {
    this.level += 1;
    this.showOverlay('NIVEL COMPLETADO', 'Pulsa ENTER para el siguiente nivel');
    this.running = false;
  }

  private onConfirm(): void {
    if (this.lives <= 0) {
      this.score = 0;
      this.lives = START_LIVES;
      this.peppers = START_PEPPERS;
      this.level = 1;
    }
    this.hideOverlay();
    this.startBoard();
    this.running = true;
  }

  private showOverlay(title: string, subtitle: string): void {
    this.hideOverlay();
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
    this.overlay = this.add.container(0, 0, [shade, titleText, subtitleText]).setDepth(20);
  }

  private hideOverlay(): void {
    this.overlay?.destroy();
    this.overlay = null;
  }

  private exitGame(): void {
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

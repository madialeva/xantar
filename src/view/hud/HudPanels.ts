import Phaser from 'phaser';
import type { RenderTier } from '../../config';
import type { SessionStats } from '../session/GameSession';
import { type Layout, type Rect } from '../layout/computeLayout';
import type { ArtFactory } from '../raster/ArtFactory';
import type { Palette } from '../art/palette';
import { hudText } from './textStyle';

const MARGIN = 8;
const PADDING = 10;
const RADIUS = 6;
const ICON_GAP = 6;
const LABEL_ALPHA = 0.7;
const COLUMN_WIDTH = { left: 62, right: 58 };

/** A label over a value, as shown in the side panels. */
interface Readout {
  readonly label: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
}

/** The translated labels of the side panels. */
export interface HudLabels {
  readonly score: string;
  readonly best: string;
  readonly level: string;
}

/** An icon followed by a number, as shown in the side panels. */
interface Counter {
  readonly icon: Phaser.GameObjects.Image;
  readonly value: Phaser.GameObjects.Text;
}

/**
 * The HUD in the side panels around the board: score, best score and level on the left; lives,
 * peppers and the pause button on the right. Repositions itself when the layout changes.
 */
export class HudPanels {
  readonly #palette: Palette;
  readonly #backgrounds: Phaser.GameObjects.Graphics;
  readonly #score: Readout;
  readonly #best: Readout;
  readonly #level: Readout;
  readonly #lives: Counter;
  readonly #peppers: Counter;
  readonly #pause: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    art: ArtFactory,
    palette: Palette,
    tier: RenderTier,
    labels: HudLabels,
    onPause: () => void
  ) {
    this.#palette = palette;
    this.#backgrounds = scene.add.graphics();
    const readout = (label: string): Readout => ({
      label: scene.add.text(0, 0, label, hudText(11, palette.hudText, tier)).setAlpha(LABEL_ALPHA),
      value: scene.add.text(0, 0, '', hudText(16, palette.hudText, tier))
    });
    const counter = (graphic: 'hud.life' | 'hud.pepper', color: string): Counter => ({
      icon: art.image(graphic).setOrigin(0, 0.5),
      value: scene.add.text(0, 0, '', hudText(16, color, tier)).setOrigin(0, 0.5)
    });
    this.#score = readout(labels.score);
    this.#best = readout(labels.best);
    this.#level = readout(labels.level);
    this.#lives = counter('hud.life', palette.hudText);
    this.#peppers = counter('hud.pepper', palette.hudAccent);
    this.#pause = art.image('hud.pause').setInteractive({ useHandCursor: true });
    this.#pause.on('pointerover', () => this.#pause.setAlpha(0.8));
    this.#pause.on('pointerout', () => this.#pause.setAlpha(1));
    this.#pause.on('pointerup', onPause);
  }

  setDepth(depth: number): this {
    for (const object of this.#objects()) object.setDepth(depth);
    return this;
  }

  layout({ leftPanel, rightPanel }: Layout): void {
    this.#backgrounds
      .clear()
      .fillStyle(Phaser.Display.Color.HexStringToColor(this.#palette.hudPanel).color, 1);
    for (const panel of [leftPanel, rightPanel]) {
      const inner = this.#inner(panel);
      this.#backgrounds.fillRoundedRect(inner.x, inner.y, inner.width, inner.height, RADIUS);
    }
    const left = this.#inner(leftPanel);
    const leftX = this.#columnX(left, COLUMN_WIDTH.left);
    this.#placeReadout(this.#score, leftX, left.y + PADDING);
    this.#placeReadout(this.#best, leftX, left.y + PADDING + 48);
    this.#placeReadout(this.#level, leftX, left.y + PADDING + 96);
    const right = this.#inner(rightPanel);
    const rightX = this.#columnX(right, COLUMN_WIDTH.right);
    this.#pause.setPosition(right.x + right.width / 2, right.y + PADDING + 16);
    this.#placeCounter(this.#lives, rightX, right.y + PADDING + 64);
    this.#placeCounter(this.#peppers, rightX, right.y + PADDING + 96);
  }

  update({ score, level, lives, peppers }: SessionStats, bestScore: number): void {
    this.#score.value.setText(score.toString().padStart(6, '0'));
    this.#best.value.setText(bestScore.toString().padStart(6, '0'));
    this.#level.value.setText(String(level));
    this.#lives.value.setText(`× ${Math.max(0, lives)}`);
    this.#peppers.value.setText(`× ${peppers}`);
  }

  #inner(panel: Rect): Rect {
    return {
      x: panel.x + MARGIN,
      y: panel.y + MARGIN,
      width: panel.width - 2 * MARGIN,
      height: panel.height - 2 * MARGIN
    };
  }

  #columnX(inner: Rect, column: number): number {
    return inner.x + Math.max(PADDING, (inner.width - column) / 2);
  }

  #placeReadout({ label, value }: Readout, x: number, y: number): void {
    label.setPosition(x, y);
    value.setPosition(x, y + 15);
  }

  #placeCounter({ icon, value }: Counter, x: number, y: number): void {
    icon.setPosition(x, y);
    value.setPosition(x + icon.displayWidth + ICON_GAP, y);
  }

  #objects(): (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth)[] {
    return [
      this.#backgrounds,
      this.#score.label,
      this.#score.value,
      this.#best.label,
      this.#best.value,
      this.#level.label,
      this.#level.value,
      this.#lives.icon,
      this.#lives.value,
      this.#peppers.icon,
      this.#peppers.value,
      this.#pause
    ];
  }
}

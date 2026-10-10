import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../../config';
import type { Palette } from '../theme/palette';
import { hudText } from './textStyle';

const SHADE_ALPHA = 0.72;

/** The end-of-level and game-over screens, drawn over the board only. */
export class OverlayView {
  readonly #scene: Phaser.Scene;
  readonly #palette: Palette;
  readonly #tier: RenderTier;
  #container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, palette: Palette, tier: RenderTier) {
    this.#scene = scene;
    this.#palette = palette;
    this.#tier = tier;
  }

  show(title: string, subtitle: string, depth: number): void {
    this.hide();
    const scene = this.#scene;
    const shade = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, SHADE_ALPHA)
      .setStrokeStyle(0);
    const titleText = scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 20,
        title,
        hudText(30, this.#palette.hudText, this.#tier)
      )
      .setOrigin(0.5);
    const subtitleText = scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 24,
        subtitle,
        hudText(16, this.#palette.hudAccent, this.#tier)
      )
      .setOrigin(0.5);
    this.#container = scene.add.container(0, 0, [shade, titleText, subtitleText]).setDepth(depth);
  }

  hide(): void {
    this.#container?.destroy();
    this.#container = null;
  }
}

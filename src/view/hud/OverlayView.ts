import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../../config';
import type { Palette } from '../art/palette';
import { hudText } from './textStyle';

const SHADE_ALPHA = 0.72;
const LINE_SPACING = 28;

/** Messages drawn over the board only: phase messages, game over and the pause backdrop. */
export class OverlayView {
  readonly #scene: Phaser.Scene;
  readonly #palette: Palette;
  readonly #tier: RenderTier;
  readonly #depth: number;
  #container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, palette: Palette, tier: RenderTier, depth: number) {
    this.#scene = scene;
    this.#palette = palette;
    this.#tier = tier;
    this.#depth = depth;
  }

  show(
    title: string,
    lines: readonly string[] = [],
    shade = SHADE_ALPHA,
    top = GAME_HEIGHT / 2 - 20
  ): void {
    this.hide();
    const scene = this.#scene;
    const backdrop = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, shade)
      .setStrokeStyle(0);
    const titleText = scene.add
      .text(GAME_WIDTH / 2, top, title, hudText(30, this.#palette.hudText, this.#tier))
      .setOrigin(0.5);
    const lineTexts = lines.map((line, index) =>
      scene.add
        .text(
          GAME_WIDTH / 2,
          top + 44 + index * LINE_SPACING,
          line,
          hudText(16, this.#palette.hudAccent, this.#tier)
        )
        .setOrigin(0.5)
    );
    this.#container = scene.add
      .container(0, 0, [backdrop, titleText, ...lineTexts])
      .setDepth(this.#depth);
  }

  hide(): void {
    this.#container?.destroy();
    this.#container = null;
  }
}

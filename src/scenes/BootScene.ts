import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../config';
import { followBoardCamera } from '../view/layout/boardCamera';
import { SvgRasterizer } from '../view/raster/SvgRasterizer';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';

export interface BootSceneDependencies {
  readonly themes: ThemeRegistry;
  readonly tier: RenderTier;
}

/**
 * First scene: rasterizes the art of every registered theme for the render tier and then
 * hands over to the title scene.
 */
export default class BootScene extends Phaser.Scene {
  readonly #themes: ThemeRegistry;
  readonly #tier: RenderTier;

  constructor({ themes, tier }: BootSceneDependencies) {
    super({ key: 'BootScene' });
    this.#themes = themes;
    this.#tier = tier;
  }

  create(): void {
    followBoardCamera(this, this.#tier);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CARGANDO…', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        resolution: this.#tier
      })
      .setOrigin(0.5);
    void this.#rasterize().then(() => this.scene.start('TapScene'));
  }

  async #rasterize(): Promise<void> {
    const rasterizer = new SvgRasterizer(this.textures, this.#tier);
    for (const id of this.#themes.ids) {
      await rasterizer.rasterizeTheme(this.#themes.resolve(id));
    }
  }
}

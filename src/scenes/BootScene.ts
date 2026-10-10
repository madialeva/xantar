import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../config';
import type { Localization } from '../i18n/Localization';
import { hudText } from '../view/hud/textStyle';
import { followBoardCamera } from '../view/layout/boardCamera';
import { SvgRasterizer } from '../view/raster/SvgRasterizer';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';

export interface BootSceneDependencies {
  readonly themes: ThemeRegistry;
  readonly tier: RenderTier;
  readonly localization: Localization;
}

/**
 * First scene: rasterizes the art of every registered theme for the render tier and then
 * hands over to the title scene.
 */
export default class BootScene extends Phaser.Scene {
  readonly #themes: ThemeRegistry;
  readonly #tier: RenderTier;
  readonly #localization: Localization;

  constructor({ themes, tier, localization }: BootSceneDependencies) {
    super({ key: 'BootScene' });
    this.#themes = themes;
    this.#tier = tier;
    this.#localization = localization;
  }

  create(): void {
    followBoardCamera(this, this.#tier);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        this.#localization.t('loading'),
        hudText(16, '#ffffff', this.#tier)
      )
      .setOrigin(0.5);
    void this.#rasterize().then(() => this.scene.start('TitleScene'));
  }

  async #rasterize(): Promise<void> {
    const rasterizer = new SvgRasterizer(this.textures, this.#tier);
    for (const id of this.#themes.ids) {
      await rasterizer.rasterizeTheme(this.#themes.resolve(id));
    }
  }
}

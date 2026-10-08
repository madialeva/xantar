import type Phaser from 'phaser';
import type { RenderTier } from '../../config';
import { GRAPHICS, type GraphicId, type GraphicSize, textureKey } from '../theme/graphics';

/**
 * Creates images of the graphics of one theme, scaled so that each one covers its logical
 * size whatever the render tier of its texture.
 */
export class ArtFactory {
  readonly #scene: Phaser.Scene;
  readonly #tier: RenderTier;
  readonly themeId: string;

  constructor(scene: Phaser.Scene, themeId: string, tier: RenderTier) {
    this.#scene = scene;
    this.themeId = themeId;
    this.#tier = tier;
  }

  get scale(): number {
    return 1 / this.#tier;
  }

  size(graphic: GraphicId): GraphicSize {
    return GRAPHICS[graphic];
  }

  image(graphic: GraphicId, x = 0, y = 0): Phaser.GameObjects.Image {
    return this.#scene.add.image(x, y, textureKey(this.themeId, graphic)).setScale(this.scale);
  }
}

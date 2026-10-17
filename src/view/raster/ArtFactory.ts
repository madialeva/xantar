import type Phaser from 'phaser';
import type { RenderTier } from '../../config';
import { GRAPHICS, type GraphicId, type GraphicSize } from '../theme/graphics';

/**
 * Creates images of the game's graphics, scaled so that each one covers its logical size
 * whatever the render tier of its texture. Each texture is keyed by its graphic id.
 */
export class ArtFactory {
  readonly #scene: Phaser.Scene;
  readonly #tier: RenderTier;

  constructor(scene: Phaser.Scene, tier: RenderTier) {
    this.#scene = scene;
    this.#tier = tier;
  }

  get scale(): number {
    return 1 / this.#tier;
  }

  size(graphic: GraphicId): GraphicSize {
    return GRAPHICS[graphic];
  }

  key(graphic: GraphicId): string {
    return graphic;
  }

  image(graphic: GraphicId, x = 0, y = 0): Phaser.GameObjects.Image {
    return this.#scene.add.image(x, y, this.key(graphic)).setScale(this.scale);
  }
}

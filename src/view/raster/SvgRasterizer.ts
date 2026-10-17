import type Phaser from 'phaser';
import type { RenderTier } from '../../config';
import { renderedArtUrl } from '../art/sources';
import { applyPalette, withSize } from '../theme/applyPalette';
import { GRAPHICS, GRAPHIC_IDS, type GraphicId, textureKey } from '../theme/graphics';
import type { ResolvedTheme } from '../theme/Theme';

const PLACEHOLDER_CELL = 4;

/**
 * Turns the SVG sources of a theme (or the rendered PNG that stands in for one) into Phaser
 * textures sized for the render tier. A source that cannot be drawn is replaced by a visible
 * placeholder and reported on the console.
 */
export class SvgRasterizer {
  readonly #textures: Phaser.Textures.TextureManager;
  readonly #tier: RenderTier;

  constructor(textures: Phaser.Textures.TextureManager, tier: RenderTier) {
    this.#textures = textures;
    this.#tier = tier;
  }

  async rasterizeTheme(theme: ResolvedTheme): Promise<void> {
    await Promise.all(GRAPHIC_IDS.map((graphic) => this.#rasterize(theme, graphic)));
  }

  async #rasterize(theme: ResolvedTheme, graphic: GraphicId): Promise<void> {
    const width = GRAPHICS[graphic].width * this.#tier;
    const height = GRAPHICS[graphic].height * this.#tier;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('A 2D canvas context is required to rasterize the art');
    try {
      const image = await this.#source(theme, graphic, width, height);
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Could not rasterize graphic "${graphic}" of theme "${theme.id}": ${reason}`);
      this.#drawPlaceholder(context, width, height);
    }
    const key = textureKey(theme.id, graphic);
    if (this.#textures.exists(key)) this.#textures.remove(key);
    this.#textures.addCanvas(key, canvas);
  }

  async #source(
    theme: ResolvedTheme,
    graphic: GraphicId,
    width: number,
    height: number
  ): Promise<HTMLImageElement> {
    const rendered = renderedArtUrl(theme.id, graphic);
    if (rendered !== undefined) return this.#decode(rendered, width, height);
    const svg = withSize(applyPalette(theme.art[graphic], theme.palette), width, height);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      return await this.#decode(url, width, height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async #decode(url: string, width: number, height: number): Promise<HTMLImageElement> {
    const image = new Image(width, height);
    image.src = url;
    await image.decode();
    return image;
  }

  #drawPlaceholder(context: CanvasRenderingContext2D, width: number, height: number): void {
    const cell = PLACEHOLDER_CELL * this.#tier;
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        context.fillStyle = (x / cell + y / cell) % 2 === 0 ? '#ff00ff' : '#000000';
        context.fillRect(x, y, cell, cell);
      }
    }
  }
}

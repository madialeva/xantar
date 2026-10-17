import type Phaser from 'phaser';
import type { RenderTier } from '../../config';
import { renderedArt, svgSources } from '../art/sources';
import { applyPalette, withSize } from '../art/applyPalette';
import { PALETTE } from '../art/palette';
import { GRAPHICS, GRAPHIC_IDS, type GraphicId } from '../art/graphics';

const PLACEHOLDER_CELL = 4;

/**
 * Turns every graphic of the catalogue, from its rendered PNG or its SVG source painted with
 * the palette, into a Phaser texture sized for the render tier and keyed by the graphic id. A
 * source that cannot be drawn is replaced by a visible placeholder and reported on the console.
 */
export class ArtRasterizer {
  readonly #textures: Phaser.Textures.TextureManager;
  readonly #tier: RenderTier;

  constructor(textures: Phaser.Textures.TextureManager, tier: RenderTier) {
    this.#textures = textures;
    this.#tier = tier;
  }

  async rasterizeAll(): Promise<void> {
    await Promise.all(GRAPHIC_IDS.map((graphic) => this.#rasterize(graphic)));
  }

  async #rasterize(graphic: GraphicId): Promise<void> {
    const width = GRAPHICS[graphic].width * this.#tier;
    const height = GRAPHICS[graphic].height * this.#tier;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('A 2D canvas context is required to rasterize the art');
    try {
      const image = await this.#source(graphic, width, height);
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Could not rasterize graphic "${graphic}": ${reason}`);
      this.#drawPlaceholder(context, width, height);
    }
    if (this.#textures.exists(graphic)) this.#textures.remove(graphic);
    this.#textures.addCanvas(graphic, canvas);
  }

  async #source(graphic: GraphicId, width: number, height: number): Promise<HTMLImageElement> {
    const rendered = renderedArt().get(graphic);
    if (rendered !== undefined) return this.#decode(rendered, width, height);
    const source = svgSources().get(graphic);
    if (source === undefined) throw new Error('The graphic has no source');
    const svg = withSize(applyPalette(source, PALETTE), width, height);
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

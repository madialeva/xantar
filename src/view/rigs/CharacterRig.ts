import Phaser from 'phaser';
import type { ArtFactory } from '../raster/ArtFactory';
import type { RigDefinition } from './RigDefinition';

/** Offsets from the base pose that an animation moves a part to. */
export interface PoseOffset {
  readonly dx?: number;
  readonly dy?: number;
  readonly angle?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
}

interface BasePose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/**
 * A character built from separate images, one per part of its rig. Knows the base pose of
 * every part so animations can be written as offsets from it and undone at once.
 */
export class CharacterRig extends Phaser.GameObjects.Container {
  readonly #parts = new Map<string, Phaser.GameObjects.Image>();
  readonly #base = new Map<string, BasePose>();
  readonly #textures = new Map<string, string>();
  readonly #frames = new Map<string, readonly string[]>();

  constructor(scene: Phaser.Scene, art: ArtFactory, definition: RigDefinition) {
    super(scene, 0, 0);
    for (const part of definition.parts) {
      const image = art
        .image(part.graphic, part.x, part.y)
        .setOrigin(part.originX ?? 0.5, part.originY ?? 0.5);
      this.#parts.set(part.name, image);
      this.#base.set(part.name, { x: part.x, y: part.y, scale: image.scaleX });
      this.#textures.set(part.name, art.key(part.graphic));
      if (part.frames)
        this.#frames.set(
          part.name,
          part.frames.map((frame) => art.key(frame))
        );
      this.add(image);
    }
  }

  get partImages(): readonly Phaser.GameObjects.Image[] {
    return [...this.#parts.values()];
  }

  has(name: string): boolean {
    return this.#parts.has(name);
  }

  frameCount(name: string): number {
    return this.#frames.get(name)?.length ?? 0;
  }

  /** Shows one of the part's frames; the index is clamped to the frames it has. */
  showFrame(name: string, index: number): void {
    const frames = this.#frames.get(name);
    const image = this.#parts.get(name);
    if (!frames || !image) return;
    image.setTexture(frames[Math.max(0, Math.min(frames.length - 1, index))]);
  }

  /** Tween properties that take a part from its base pose to the given offset. */
  target(name: string, offset: PoseOffset): { target: Phaser.GameObjects.Image; props: object } {
    const image = this.#parts.get(name);
    const base = this.#base.get(name);
    if (!image || !base) throw new Error(`The rig has no part "${name}"`);
    const props: Record<string, number> = {};
    if (offset.dx !== undefined) props.x = base.x + offset.dx;
    if (offset.dy !== undefined) props.y = base.y + offset.dy;
    if (offset.angle !== undefined) props.angle = offset.angle;
    if (offset.scaleX !== undefined) props.scaleX = base.scale * offset.scaleX;
    if (offset.scaleY !== undefined) props.scaleY = base.scale * offset.scaleY;
    return { target: image, props };
  }

  pose(name: string, offset: PoseOffset): void {
    const { target, props } = this.target(name, offset);
    Object.assign(target, props);
  }

  resetPose(): void {
    for (const [name, image] of this.#parts) {
      const base = this.#base.get(name);
      if (base) image.setPosition(base.x, base.y).setAngle(0).setScale(base.scale);
      const texture = this.#textures.get(name);
      if (texture !== undefined && image.texture.key !== texture) image.setTexture(texture);
    }
  }
}

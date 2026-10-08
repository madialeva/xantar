import Phaser from 'phaser';
import type { FilterKind } from './parseFilterTrial';

const FPS_REFRESH_MS = 500;

/**
 * Opt-in trial of Phaser 4 post-processing (glow, shadows, bloom) for the evaluation of the
 * is4 change: applies the filters chosen in the URL and shows the frame rate. It changes
 * nothing when the URL asks for no trial.
 */
export class FilterTrial {
  readonly #kinds: readonly FilterKind[];
  readonly active: boolean;

  constructor(kinds: readonly FilterKind[] | null) {
    this.#kinds = kinds ?? [];
    this.active = kinds !== null;
  }

  start(scene: Phaser.Scene, fpsAt: { readonly x: number; readonly y: number }): boolean {
    if (!this.active) return false;
    if (scene.sys.renderer.type !== Phaser.WEBGL) {
      console.warn('The filter trial needs the WebGL renderer; filters are not applied');
      return false;
    }
    if (this.#kinds.includes('bloom')) {
      scene.cameras.main.filters.external.addGlow(0xffffff, 1.2, 0, 1, false, 8, 6);
    }
    const fps = scene.add
      .text(fpsAt.x, fpsAt.y, '', { fontSize: '10px', color: '#9fe', resolution: 2 })
      .setDepth(100);
    const label = `filtros: ${this.#kinds.join(', ') || 'ninguno'}`;
    let nextRefresh = 0;
    scene.events.on(Phaser.Scenes.Events.UPDATE, (time: number) => {
      if (time < nextRefresh) return;
      nextRefresh = time + FPS_REFRESH_MS;
      fps.setText(`${label}\n${scene.game.loop.actualFps.toFixed(0)} fps`);
    });
    return true;
  }

  decorateCharacter(character: Phaser.GameObjects.Container): void {
    if (!this.#kinds.includes('shadow')) return;
    character.enableFilters().filters?.internal.addShadow(0, 0.6, 0.08, 1, 0x000000, 6, 0.6);
  }

  decorateIngredient(ingredient: Phaser.GameObjects.Container, color: number): void {
    if (!this.#kinds.includes('glow')) return;
    ingredient.enableFilters().filters?.internal.addGlow(color, 2, 0, 1, false, 8, 8);
  }
}

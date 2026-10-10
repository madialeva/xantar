import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../../config';

/**
 * Zooms the main camera of a scene to the render tier and keeps the board centred while the
 * game is resized. Calls `onResize` with the new logical width.
 */
export function followBoardCamera(
  scene: Phaser.Scene,
  tier: RenderTier,
  onResize: (logicalWidth: number) => void = () => undefined
): void {
  const camera = scene.cameras.main;
  const fit = (): void => {
    camera.setSize(scene.scale.width, scene.scale.height);
    camera.setZoom(tier).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    onResize(scene.scale.width / tier);
  };
  fit();
  scene.scale.on(Phaser.Scale.Events.RESIZE, fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, fit);
  });
}

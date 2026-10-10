import Phaser from 'phaser';

const BLOOM = { color: 0xffffff, outerStrength: 1.2, quality: 8, distance: 6 };

/**
 * Adds a soft glow over everything the main camera draws, in a single pass. Does nothing
 * when the renderer is not WebGL, where filters are not available.
 */
export function applyBloom(scene: Phaser.Scene): void {
  if (scene.sys.renderer.type !== Phaser.WEBGL) return;
  const { color, outerStrength, quality, distance } = BLOOM;
  scene.cameras.main.filters.external.addGlow(color, outerStrength, 0, 1, false, quality, distance);
}

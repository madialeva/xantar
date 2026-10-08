import type Phaser from 'phaser';
import type { RenderTier } from '../../config';

export const HUD_FONT = '"Trebuchet MS", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export const hudText = (
  size: number,
  color: string,
  tier: RenderTier
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: HUD_FONT,
  fontStyle: 'bold',
  fontSize: `${size}px`,
  color,
  resolution: tier
});

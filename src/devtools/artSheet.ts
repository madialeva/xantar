import Phaser from 'phaser';
import { RENDER_TIER } from '../config';
import ArtSheetScene, { SHEET_HEIGHT, SHEET_WIDTH } from './ArtSheetScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'sheet',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    width: SHEET_WIDTH * RENDER_TIER,
    height: SHEET_HEIGHT * RENDER_TIER
  },
  scene: [new ArtSheetScene({ tier: RENDER_TIER })]
});

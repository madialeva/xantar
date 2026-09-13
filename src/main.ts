import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import GameScene from './scenes/GameScene';
import TapScene from './scenes/TapScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#101418',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  loader: {
    imageLoadType: 'HTMLImageElement'
  },
  scene: [TapScene, GameScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => game.scale.refresh());

import Phaser from 'phaser';
import { RENDER_TIER } from './config';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import TapScene from './scenes/TapScene';
import { computeLayout } from './view/layout/computeLayout';
import { createThemeRegistry } from './view/themes';

const tier = RENDER_TIER;
const themes = createThemeRegistry();
const urlTheme = new URLSearchParams(window.location.search).get('theme');
const initial = computeLayout(window.innerWidth, window.innerHeight);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initial.width * tier,
    height: initial.height * tier
  },
  loader: {
    imageLoadType: 'HTMLImageElement'
  },
  scene: [
    new BootScene({ themes, tier }),
    new TapScene(tier),
    new GameScene({ themes, urlTheme, tier })
  ]
};

const game = new Phaser.Game(config);

let resizePending = false;
window.addEventListener('resize', () => {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resizePending = false;
    const layout = computeLayout(window.innerWidth, window.innerHeight);
    game.scale.setGameSize(layout.width * tier, layout.height * tier);
    game.scale.refresh();
  });
});

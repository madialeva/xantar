import Phaser from 'phaser';
import { RENDER_TIER } from './config';
import { detectLanguage } from './i18n/language';
import { Localization } from './i18n/Localization';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import HudScene from './scenes/HudScene';
import MenuScene from './scenes/MenuScene';
import TitleScene from './scenes/TitleScene';
import { AUTO_THEME } from './settings/PlayerSettings';
import { Settings } from './settings/Settings';
import { LocalStorageSettingsStore } from './settings/SettingsStore';
import { TitleMusic } from './view/audio/TitleMusic';
import { computeLayout } from './view/layout/computeLayout';
import { GameSession } from './view/session/GameSession';
import { createThemeRegistry } from './view/themes';

const browserStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const tier = RENDER_TIER;
const themes = createThemeRegistry();
const urlTheme = new URLSearchParams(window.location.search).get('theme');
const settings = new Settings(new LocalStorageSettingsStore(browserStorage()), {
  language: detectLanguage(navigator.languages),
  theme: AUTO_THEME,
  bestScore: 0
});
const localization = new Localization(settings.language);
document.documentElement.lang = localization.language;
localization.subscribe((language) => {
  document.documentElement.lang = language;
});
const session = new GameSession();
const music = new TitleMusic('music/tap-back.mp3');
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
    new BootScene({ themes, tier, localization }),
    new TitleScene({ tier, localization, music, themes }),
    new MenuScene({ tier, localization, settings, themes, music }),
    new GameScene({ themes, urlTheme, tier, session, settings }),
    new HudScene({ tier, localization, session, themes })
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

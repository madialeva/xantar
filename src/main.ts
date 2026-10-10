import Phaser from 'phaser';
import './styles.css';
import { RENDER_TIER } from './config';
import { detectLanguage } from './i18n/language';
import { Localization } from './i18n/Localization';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import HudScene from './scenes/HudScene';
import MenuScene from './scenes/MenuScene';
import TitleScene from './scenes/TitleScene';
import { defaultSettings } from './settings/PlayerSettings';
import { Settings } from './settings/Settings';
import { LocalStorageSettingsStore } from './settings/SettingsStore';
import { GameAudio } from './view/audio/GameAudio';
import { computeLayout } from './view/layout/computeLayout';
import { ActionInput } from './view/input/ActionInput';
import { GamepadSource } from './view/input/GamepadSource';
import { InputModality } from './view/input/InputModality';
import { TouchPad } from './view/input/TouchPad';
import { KeyboardSource } from './view/input/KeyboardSource';
import { loadKeyboardLayout } from './view/input/keyboardLayout';
import { createPlatform } from './view/platform/Platform';
import { ForcedLandscape, PORTRAIT_TOUCH_QUERY } from './view/platform/ForcedLandscape';
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
const settings = new Settings(
  new LocalStorageSettingsStore(browserStorage()),
  defaultSettings(detectLanguage(navigator.languages))
);
const localization = new Localization(settings.language);
document.documentElement.lang = localization.language;
localization.subscribe((language) => {
  document.documentElement.lang = language;
});
const session = new GameSession();
const audio = new GameAudio(settings.values, () => performance.now());
settings.subscribe((values) => audio.apply(values));
const platform = createPlatform(window);
const keyboard = new KeyboardSource(window, document, settings.keyBindings);
settings.subscribe((values) => keyboard.setBindings(values.keyBindings));
const gamepad = new GamepadSource(() => navigator.getGamepads?.() ?? []);
const touchPad = new TouchPad();
const modality = new InputModality(window);
const input = new ActionInput([keyboard, gamepad, touchPad]);
let keyLayout: ReadonlyMap<string, string> | null = null;
void loadKeyboardLayout(navigator).then((layout) => {
  keyLayout = layout;
});
const gameElement = document.getElementById('game')!;
const landscape = new ForcedLandscape(gameElement, window.matchMedia(PORTRAIT_TOUCH_QUERY), window);
const viewport = landscape.viewport();
const initial = computeLayout(viewport.width, viewport.height);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  parent: gameElement,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initial.width * tier,
    height: initial.height * tier
  },
  loader: {
    imageLoadType: 'HTMLImageElement'
  },
  input: {
    activePointers: 3
  },
  scene: [
    new BootScene({ themes, tier, localization, audio }),
    new TitleScene({ tier, localization, audio, themes, platform, input }),
    new MenuScene({
      tier,
      localization,
      settings,
      themes,
      audio,
      platform,
      input,
      keyboard,
      keyLayout: () => keyLayout
    }),
    new GameScene({
      themes,
      urlTheme,
      tier,
      session,
      settings,
      input,
      sounds: audio,
      interruptions: [(pause) => gamepad.onDisconnect(pause)]
    }),
    new HudScene({
      tier,
      localization,
      session,
      themes,
      input,
      touchPad,
      modality,
      sounds: audio.ui
    })
  ]
};

const game = new Phaser.Game(config);
landscape.attach(game);
game.events.on(Phaser.Core.Events.PRE_STEP, (time: number) => {
  input.update(time);
  if (input.justPressed('mute')) settings.setMuted(!settings.muted);
});

let resizePending = false;
window.addEventListener('resize', () => {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resizePending = false;
    landscape.apply();
    const { width, height } = landscape.viewport();
    const layout = computeLayout(width, height);
    game.scale.setGameSize(layout.width * tier, layout.height * tier);
    game.scale.refresh();
  });
});

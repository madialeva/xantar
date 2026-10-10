import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../config';
import type { Localization } from '../i18n/Localization';
import type { ActionReader } from '../input/actions';
import type { TitleMusic } from '../view/audio/TitleMusic';
import { hudText } from '../view/hud/textStyle';
import { followBoardCamera } from '../view/layout/boardCamera';
import { ArtFactory } from '../view/raster/ArtFactory';
import { CharacterRig } from '../view/rigs/CharacterRig';
import { RigAnimator } from '../view/rigs/RigAnimator';
import { RigMotion } from '../view/rigs/RigMotion';
import { chefRig } from '../view/rigs/rigs';
import { chefStates } from '../view/rigs/states';
import type { Platform } from '../view/platform/Platform';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';

export interface TitleSceneDependencies {
  readonly tier: RenderTier;
  readonly localization: Localization;
  readonly music: TitleMusic;
  readonly themes: ThemeRegistry;
  readonly platform: Platform;
  readonly input: ActionReader;
}

const CHEF_ZOOM = 3;
const BLINK_MS = 600;

/**
 * Title screen: waits for the first click, tap or key, which asks for fullscreen and starts
 * the music (browsers need a user gesture for both), then opens the main menu.
 */
export default class TitleScene extends Phaser.Scene {
  readonly #deps: TitleSceneDependencies;
  #leaving = false;

  constructor(deps: TitleSceneDependencies) {
    super({ key: 'TitleScene' });
    this.#deps = deps;
  }

  create(): void {
    const { tier, localization, themes } = this.#deps;
    const theme = themes.resolve(themes.defaultId);
    this.#leaving = false;
    this.cameras.main.setBackgroundColor(theme.palette.background);
    followBoardCamera(this, tier);
    this.add
      .text(
        GAME_WIDTH / 2,
        110,
        localization.t('game.title'),
        hudText(64, theme.palette.hudAccent, tier)
      )
      .setOrigin(0.5);
    const rig = new CharacterRig(this, new ArtFactory(this, theme.id, tier), chefRig);
    this.add.existing(rig.setPosition(GAME_WIDTH / 2, 250).setScale(CHEF_ZOOM));
    new RigAnimator(new RigMotion(rig, this.tweens), chefStates).show('walk');
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    const prompt = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 90,
        localization.t(isMobile ? 'title.startTouch' : 'title.startPointer'),
        hudText(20, theme.palette.hudText, tier)
      )
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: BLINK_MS, yoyo: true, repeat: -1 });
    this.input.once(Phaser.Input.Events.POINTER_UP, () => this.#start(isMobile));
    this.input.keyboard?.once('keydown', () => this.#start(isMobile));
  }

  override update(): void {
    const { input } = this.#deps;
    if (input.justPressed('confirm') || input.justPressed('pepper')) {
      this.#start(this.sys.game.device.os.android || this.sys.game.device.os.iOS);
    }
  }

  #start(isMobile: boolean): void {
    if (this.#leaving) return;
    this.#leaving = true;
    this.#deps.music.play();
    void this.#deps.platform.enterFullscreen(isMobile).finally(() => this.scene.start('MenuScene'));
  }
}

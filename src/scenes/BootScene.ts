import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../config';
import type { Localization } from '../i18n/Localization';
import { type GameAudio, TITLE_MUSIC } from '../view/audio/GameAudio';
import { phaserSoundSystem, registerSoundEffects } from '../view/audio/phaserSound';
import { hudText } from '../view/hud/textStyle';
import { followBoardCamera } from '../view/layout/boardCamera';
import { SvgRasterizer } from '../view/raster/SvgRasterizer';

export interface BootSceneDependencies {
  readonly tier: RenderTier;
  readonly localization: Localization;
  readonly audio: GameAudio;
}

/**
 * First scene: loads the music, synthesizes the sound effects, rasterizes the art for the
 * render tier and then hands over to the title scene.
 */
export default class BootScene extends Phaser.Scene {
  readonly #tier: RenderTier;
  readonly #localization: Localization;
  readonly #audio: GameAudio;

  constructor({ tier, localization, audio }: BootSceneDependencies) {
    super({ key: 'BootScene' });
    this.#tier = tier;
    this.#localization = localization;
    this.#audio = audio;
  }

  preload(): void {
    this.load.audio(TITLE_MUSIC, 'music/tap-back.mp3');
  }

  create(): void {
    followBoardCamera(this, this.#tier);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        this.#localization.t('loading'),
        hudText(16, '#ffffff', this.#tier)
      )
      .setOrigin(0.5);
    this.#audio.attach(phaserSoundSystem(this.sound), registerSoundEffects(this));
    void new SvgRasterizer(this.textures, this.#tier)
      .rasterizeAll()
      .then(() => this.scene.start('TitleScene'));
  }
}

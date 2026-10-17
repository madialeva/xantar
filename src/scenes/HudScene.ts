import Phaser from 'phaser';
import { GAME_WIDTH, type RenderTier } from '../config';
import type { Localization } from '../i18n/Localization';
import type { ActionReader } from '../input/actions';
import { HudPanels } from '../view/hud/HudPanels';
import { TouchControls } from '../view/hud/TouchControls';
import { OverlayView } from '../view/hud/OverlayView';
import type { InputModality } from '../view/input/InputModality';
import type { TouchPad } from '../view/input/TouchPad';
import { followBoardCamera } from '../view/layout/boardCamera';
import { layoutForWidth } from '../view/layout/computeLayout';
import { ArtFactory } from '../view/raster/ArtFactory';
import type { GameSession, SessionState } from '../view/session/GameSession';
import { PALETTE } from '../view/theme/palette';
import { MenuList } from '../view/ui/MenuList';
import type { UiSounds } from '../view/ui/UiSounds';

export interface HudSceneDependencies {
  readonly tier: RenderTier;
  readonly localization: Localization;
  readonly session: GameSession;
  readonly input: ActionReader;
  readonly touchPad: TouchPad;
  readonly modality: InputModality;
  readonly sounds: UiSounds;
}

const DEPTH = { panels: 10, touch: 11, overlay: 20, menu: 21 };
const SHADE = { ready: 0.25, levelClear: 0.5, gameOver: 0.72, pause: 0.6 };
const PAUSE_TOP = 150;

/**
 * Scene that runs alongside the board during a game: side panels, phase messages, the game
 * over screen and the pause menu. It only knows the game through the session.
 */
export default class HudScene extends Phaser.Scene {
  readonly #deps: HudSceneDependencies;
  #panels!: HudPanels;
  #overlay!: OverlayView;
  #pauseMenu: MenuList | null = null;
  #shown = '';

  constructor(deps: HudSceneDependencies) {
    super({ key: 'HudScene' });
    this.#deps = deps;
  }

  create(): void {
    const { tier, localization, session, touchPad, modality } = this.#deps;
    this.#shown = '';
    this.#pauseMenu = null;
    const palette = PALETTE;
    const art = new ArtFactory(this, tier);
    this.#panels = new HudPanels(
      this,
      art,
      palette,
      tier,
      {
        score: localization.t('hud.score'),
        best: localization.t('hud.best'),
        level: localization.t('hud.level')
      },
      () => session.request('pause')
    ).setDepth(DEPTH.panels);
    this.#overlay = new OverlayView(this, palette, tier, DEPTH.overlay);
    const touch = new TouchControls(this, art, touchPad)
      .setDepth(DEPTH.touch)
      .setVisible(modality.touch);
    const stopWatchingTouch = modality.onTouch(() => touch.setVisible(true));
    followBoardCamera(this, tier, (width) => {
      const layout = layoutForWidth(width);
      this.#panels.layout(layout);
      touch.layout(layout);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, this.#onPointer);
    const unsubscribe = session.onState((state) => this.#render(state));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      stopWatchingTouch();
      touchPad.release();
      this.input.off(Phaser.Input.Events.POINTER_UP, this.#onPointer);
    });
    this.#render(session.state);
  }

  override update(): void {
    const { input, session } = this.#deps;
    this.#pauseMenu?.update();
    const { paused, phase } = session.state;
    if (input.justPressed('pause')) {
      session.request(paused ? 'resume' : 'pause');
    } else if (phase === 'gameOver' && input.justPressed('confirm')) {
      session.request('quit');
    }
  }

  readonly #onPointer = (
    _pointer: Phaser.Input.Pointer,
    over: readonly Phaser.GameObjects.GameObject[]
  ): void => {
    const { session } = this.#deps;
    if (session.state.phase === 'gameOver' && over.length === 0) session.request('quit');
  };

  #render(state: SessionState): void {
    this.#panels.update(state.stats, state.bestScore);
    const key = `${state.paused}:${state.phase}:${state.newRecord}`;
    if (key === this.#shown) return;
    this.#shown = key;
    this.#pauseMenu?.destroy();
    this.#pauseMenu = null;
    if (state.paused) {
      this.#showPause();
      return;
    }
    const { localization } = this.#deps;
    const { stats } = state;
    switch (state.phase) {
      case 'ready':
        this.#overlay.show(
          localization.t('phase.ready'),
          [localization.t('phase.lives', { lives: stats.lives })],
          SHADE.ready
        );
        break;
      case 'levelClear':
        this.#overlay.show(
          localization.t('phase.levelClear'),
          [localization.t('phase.nextLevel', { level: stats.level })],
          SHADE.levelClear
        );
        break;
      case 'gameOver':
        this.#overlay.show(
          localization.t('gameOver.title'),
          [
            localization.t('gameOver.score', { score: stats.score }),
            ...(state.newRecord ? [localization.t('gameOver.newRecord')] : []),
            localization.t('gameOver.continue')
          ],
          SHADE.gameOver
        );
        break;
      case 'playing':
      case 'dying':
        this.#overlay.hide();
        break;
    }
  }

  #showPause(): void {
    const { localization, session, tier } = this.#deps;
    const palette = PALETTE;
    this.#overlay.show(localization.t('pause.title'), [], SHADE.pause, PAUSE_TOP);
    this.#pauseMenu = new MenuList(
      this,
      [
        { label: () => localization.t('pause.resume'), select: () => session.request('resume') },
        { label: () => localization.t('pause.quit'), select: () => session.request('quit') }
      ],
      {
        x: GAME_WIDTH / 2,
        y: PAUSE_TOP + 90,
        spacing: 44,
        size: 22,
        color: palette.hudText,
        accent: palette.hudAccent,
        depth: DEPTH.menu
      },
      { tier, input: this.#deps.input, sounds: this.#deps.sounds }
    );
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, type RenderTier } from '../config';
import type { Localization } from '../i18n/Localization';
import { HudPanels } from '../view/hud/HudPanels';
import { OverlayView } from '../view/hud/OverlayView';
import { followBoardCamera } from '../view/layout/boardCamera';
import { layoutForWidth } from '../view/layout/computeLayout';
import { ArtFactory } from '../view/raster/ArtFactory';
import type { GameSession, SessionState } from '../view/session/GameSession';
import type { ResolvedTheme } from '../view/theme/Theme';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';
import { MenuList } from '../view/ui/MenuList';

export interface HudSceneDependencies {
  readonly tier: RenderTier;
  readonly localization: Localization;
  readonly session: GameSession;
  readonly themes: ThemeRegistry;
}

export interface HudSceneData {
  readonly themeId: string;
}

const DEPTH = { panels: 10, overlay: 20, menu: 21 };
const SHADE = { ready: 0.25, levelClear: 0.5, gameOver: 0.72, pause: 0.6 };
const PAUSE_TOP = 150;

/**
 * Scene that runs alongside the board during a game: side panels, phase messages, the game
 * over screen and the pause menu. It only knows the game through the session.
 */
export default class HudScene extends Phaser.Scene {
  readonly #deps: HudSceneDependencies;
  #theme!: ResolvedTheme;
  #panels!: HudPanels;
  #overlay!: OverlayView;
  #pauseMenu: MenuList | null = null;
  #shown = '';

  constructor(deps: HudSceneDependencies) {
    super({ key: 'HudScene' });
    this.#deps = deps;
  }

  create(data: HudSceneData): void {
    const { tier, localization, session, themes } = this.#deps;
    this.#theme = themes.resolve(data.themeId);
    this.#shown = '';
    this.#pauseMenu = null;
    const { palette } = this.#theme;
    this.#panels = new HudPanels(
      this,
      new ArtFactory(this, this.#theme.id, tier),
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
    followBoardCamera(this, tier, (width) => this.#panels.layout(layoutForWidth(width)));
    this.input.keyboard?.on('keydown', this.#onKey);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.#onPointer);
    const unsubscribe = session.onState((state) => this.#render(state));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      this.input.keyboard?.off('keydown', this.#onKey);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.#onPointer);
    });
    this.#render(session.state);
  }

  readonly #onKey = (event: KeyboardEvent): void => {
    const { session } = this.#deps;
    const { paused, phase } = session.state;
    if (event.code === 'Escape' || event.code === 'KeyP') {
      session.request(paused ? 'resume' : 'pause');
    } else if (phase === 'gameOver' && ['Enter', 'NumpadEnter', 'Space'].includes(event.code)) {
      session.request('quit');
    }
  };

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
    const { palette } = this.#theme;
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
      tier
    );
  }
}

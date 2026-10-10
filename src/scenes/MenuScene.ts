import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../config';
import { LANGUAGES } from '../i18n/language';
import type { Localization } from '../i18n/Localization';
import { AUTO_THEME } from '../settings/PlayerSettings';
import type { Settings } from '../settings/Settings';
import type { TitleMusic } from '../view/audio/TitleMusic';
import { hudText } from '../view/hud/textStyle';
import { followBoardCamera } from '../view/layout/boardCamera';
import type { ResolvedTheme } from '../view/theme/Theme';
import type { ThemeRegistry } from '../view/theme/ThemeRegistry';
import { type MenuItem, MenuList } from '../view/ui/MenuList';

export interface MenuSceneDependencies {
  readonly tier: RenderTier;
  readonly localization: Localization;
  readonly settings: Settings;
  readonly themes: ThemeRegistry;
  readonly music: TitleMusic;
}

type Page = 'main' | 'options';

const cycle = <T>(values: readonly T[], current: T, direction: 1 | -1): T =>
  values[(values.indexOf(current) + direction + values.length) % values.length];

/**
 * Main menu (play, options and best score) and options page (language and theme), both
 * driven by keyboard or pointer. Options are applied and saved at once.
 */
export default class MenuScene extends Phaser.Scene {
  readonly #deps: MenuSceneDependencies;
  #page: Phaser.GameObjects.GameObject[] = [];
  #menu: MenuList | null = null;

  constructor(deps: MenuSceneDependencies) {
    super({ key: 'MenuScene' });
    this.#deps = deps;
  }

  create(): void {
    followBoardCamera(this, this.#deps.tier);
    this.#show('main');
  }

  #theme(): ResolvedTheme {
    const { themes, settings } = this.#deps;
    const id =
      settings.theme !== AUTO_THEME && themes.has(settings.theme)
        ? settings.theme
        : themes.defaultId;
    return themes.resolve(id);
  }

  #show(page: Page, selected = 0): void {
    this.#menu?.destroy();
    for (const object of this.#page) object.destroy();
    this.#page = [];
    const { tier, localization } = this.#deps;
    const { palette } = this.#theme();
    this.cameras.main.setBackgroundColor(palette.background);
    const text = (y: number, value: string, size: number, color: string): void => {
      this.#page.push(
        this.add.text(GAME_WIDTH / 2, y, value, hudText(size, color, tier)).setOrigin(0.5)
      );
    };
    const style = {
      x: GAME_WIDTH / 2,
      y: 230,
      spacing: 44,
      size: 24,
      color: palette.hudText,
      accent: palette.hudAccent,
      depth: 1,
      selected
    };
    if (page === 'main') {
      text(110, localization.t('game.title'), 64, palette.hudAccent);
      text(
        GAME_HEIGHT - 120,
        localization.t('menu.best', { score: this.#deps.settings.bestScore }),
        18,
        palette.hudText
      );
      text(GAME_HEIGHT - 50, localization.t('menu.hint'), 12, palette.hudText);
      this.#menu = new MenuList(this, this.#mainItems(), style, tier);
    } else {
      text(110, localization.t('options.title'), 40, palette.hudAccent);
      text(GAME_HEIGHT - 50, localization.t('options.hint'), 12, palette.hudText);
      this.#menu = new MenuList(this, this.#optionItems(), style, tier, () =>
        this.#show('main', 1)
      );
    }
  }

  #mainItems(): MenuItem[] {
    const { localization, music } = this.#deps;
    return [
      {
        label: () => localization.t('menu.play'),
        select: () => {
          music.stop();
          this.scene.start('GameScene');
        }
      },
      { label: () => localization.t('menu.options'), select: () => this.#show('options') }
    ];
  }

  #optionItems(): MenuItem[] {
    const { localization, settings, themes } = this.#deps;
    const themeIds = [AUTO_THEME, ...themes.ids];
    const currentTheme = (): string =>
      themeIds.includes(settings.theme) ? settings.theme : AUTO_THEME;
    return [
      {
        label: () => localization.t('options.language'),
        value: () => localization.t(`language.${localization.language}`),
        change: (direction) => {
          const language = cycle(LANGUAGES, localization.language, direction);
          settings.setLanguage(language);
          localization.setLanguage(language);
          this.#show('options', 0);
        }
      },
      {
        label: () => localization.t('options.theme'),
        value: () => {
          const id = currentTheme();
          return id === AUTO_THEME
            ? localization.t('theme.auto')
            : themes.resolve(id).name.toUpperCase();
        },
        change: (direction) => {
          settings.setTheme(cycle(themeIds, currentTheme(), direction));
          this.#show('options', 1);
        }
      },
      { label: () => localization.t('options.back'), select: () => this.#show('main', 1) }
    ];
  }
}

import type { Format } from '../format';
import type { Catalog } from '../Translator';

export const en: Catalog = {
  'game.title': 'XANTAR',
  loading: 'LOADING…',
  'title.startPointer': 'CLICK OR PRESS ANY KEY',
  'title.startTouch': 'TAP TO START',
  'menu.play': 'PLAY',
  'menu.options': 'OPTIONS',
  'menu.quit': 'QUIT',
  'menu.best': (p: { score: number }, f: Format) => `BEST  ${f.number(p.score)}`,
  'menu.hint': '↑ ↓ SELECT · ENTER CONFIRM',
  'options.title': 'OPTIONS',
  'options.language': 'LANGUAGE',
  'options.theme': 'THEME',
  'options.back': 'BACK',
  'options.hint': '← → CHANGE · ESC BACK',
  'language.es': 'ESPAÑOL',
  'language.en': 'ENGLISH',
  'theme.auto': 'AUTOMATIC',
  'hud.score': 'SCORE',
  'hud.best': 'BEST',
  'hud.level': 'LEVEL',
  'phase.ready': 'GET READY!',
  'phase.lives': (p: { lives: number }, f: Format) =>
    `${f.number(p.lives)} ${f.plural(p.lives, { one: 'LIFE', other: 'LIVES' })}`,
  'phase.levelClear': 'LEVEL CLEAR!',
  'phase.nextLevel': (p: { level: number }, f: Format) => `NEXT: LEVEL ${f.number(p.level)}`,
  'gameOver.title': 'GAME OVER',
  'gameOver.score': (p: { score: number }, f: Format) => `SCORE  ${f.number(p.score)}`,
  'gameOver.newRecord': 'NEW HIGH SCORE!',
  'gameOver.continue': 'PRESS ENTER OR TAP FOR THE MENU',
  'pause.title': 'PAUSED',
  'pause.resume': 'RESUME',
  'pause.quit': 'QUIT TO MENU'
};

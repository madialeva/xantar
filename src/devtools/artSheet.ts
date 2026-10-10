import Phaser from 'phaser';
import { RENDER_TIER } from '../config';
import { chooseTheme } from '../view/theme/chooseTheme';
import { createThemeRegistry } from '../view/themes';
import ArtSheetScene, { SHEET_HEIGHT, SHEET_WIDTH } from './ArtSheetScene';

const themes = createThemeRegistry();
const choice = chooseTheme(
  { urlTheme: new URLSearchParams(window.location.search).get('theme') },
  themes
);
for (const warning of choice.warnings) console.warn(warning);

const picker = document.querySelector<HTMLSelectElement>('#theme');
if (picker) {
  for (const id of themes.ids) picker.add(new Option(id, id, false, id === choice.id));
  picker.addEventListener('change', () => {
    window.location.search = `?theme=${picker.value}`;
  });
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'sheet',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    width: SHEET_WIDTH * RENDER_TIER,
    height: SHEET_HEIGHT * RENDER_TIER
  },
  scene: [new ArtSheetScene({ theme: themes.resolve(choice.id), tier: RENDER_TIER })]
});

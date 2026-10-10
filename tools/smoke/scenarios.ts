export interface SmokeRun {
  readonly name: string;
  readonly size: string;
  readonly query: string;
  readonly steps: string;
}

const TO_MENU = 'wait:2500,click,wait:1500';
const START = `${TO_MENU},key:Return,wait:2500`;
const SIZES = { '16x9': '1920x1080', '4x3': '1024x768', '19.5x9': '2340x1080' } as const;
const THEMES = ['classic', 'midnight'] as const;

/** Runs of the smoke test, by scenario name. `review` is the default. */
export const SCENARIOS: Readonly<Record<string, readonly SmokeRun[]>> = {
  review: THEMES.flatMap((theme) =>
    Object.entries(SIZES).map(([label, size]) => ({
      name: `${theme}-${label}`,
      size,
      query: `theme=${theme}`,
      steps: `${START},down:Right,wait:900,up:Right,wait:300,shot:game`
    }))
  ),
  quick: [{ name: 'classic-16x9', size: SIZES['16x9'], query: '', steps: `${START},shot:game` }],
  climb: [
    {
      name: 'climb',
      size: SIZES['16x9'],
      query: '',
      steps: `${START},down:Up,wait:500,shot:climbing,up:Up,wait:400,shot:holding`
    }
  ],
  'game-over': [
    {
      name: 'game-over',
      size: SIZES['16x9'],
      query: '',
      steps: `${START},wait:75000,shot:over,key:Return,wait:1000,shot:menu`
    }
  ],
  menu: [
    {
      name: 'menu',
      size: SIZES['16x9'],
      query: '',
      steps: `${TO_MENU},shot:title-to-menu,key:Down,key:Return,wait:500,shot:options,key:Right,wait:500,shot:options-other-language,key:Down,key:Right,wait:500,shot:options-theme,key:Escape,wait:500,shot:menu-after-options`
    }
  ],
  quit: [
    {
      name: 'quit',
      size: SIZES['16x9'],
      query: '',
      steps: `${TO_MENU},key:Escape,wait:400,shot:quit-selected,key:Return,wait:500,expectQuit`
    }
  ],
  pause: [
    {
      name: 'pause',
      size: SIZES['16x9'],
      query: '',
      steps: `${START},down:Right,wait:600,up:Right,key:Escape,wait:400,shot:paused,wait:3000,shot:still-paused,key:Escape,wait:400,shot:resumed,key:Escape,wait:300,key:Down,key:Return,wait:1000,shot:quit-to-menu`
    }
  ]
};

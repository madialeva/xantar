export interface SmokeRun {
  readonly name: string;
  readonly size: string;
  readonly query: string;
  readonly steps: string;
  /** Emulates a touch screen, so the game sees touches as on a phone. */
  readonly touch?: boolean;
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
  controls: [
    {
      name: 'controls',
      size: SIZES['16x9'],
      query: '',
      steps: `${TO_MENU},key:Down,key:Return,wait:300,${'key:Down,'.repeat(5)}key:Return,wait:400,shot:controls,key:Down,key:Down,key:Down,key:Down,key:Return,wait:300,shot:capturing,key:Return,wait:300,shot:reserved,key:X,wait:300,shot:pepper-on-x,key:Escape,wait:300,key:Escape,wait:300,key:Up,key:Return,wait:2500,key:X,wait:400,shot:pepper-thrown`
    }
  ],
  touch: [
    // Left panel 200 wide at 19.5:9 (pad 160, centre -100,382); 96 at 4:3 (pad 72, centre -48,426).
    { size: SIZES['19.5x9'], label: '19.5x9', pad: { x: -100, y: 382, reach: 50 }, button: 740 },
    { size: SIZES['4x3'], label: '4x3', pad: { x: -48, y: 426, reach: 24 }, button: 688 }
  ].map(({ size, label, pad, button }) => ({
    name: `touch-${label}`,
    size,
    query: '',
    touch: true,
    steps: [
      'wait:2500,touch:320:240,wait:1500,shot:menu,touch:320:230,wait:2500',
      `touchDown:1:${pad.x + pad.reach}:${pad.y},wait:900,shot:walking`,
      `touchDown:2:${button}:${pad.y},wait:300,shot:pepper`,
      `touchUp:2,touchDown:1:${pad.x}:${pad.y - pad.reach},wait:400,touchUp:1,wait:300,shot:released`
    ].join(',')
  })),
  rotate: [
    {
      name: 'rotate',
      size: '1170x540',
      query: '',
      touch: true,
      steps:
        'wait:2500,touch:320:240,wait:1500,touch:320:230,wait:2500,shot:landscape,' +
        'size:540x1170,wait:800,shot:portrait,size:1170x540,wait:800,shot:back-to-landscape'
    }
  ],
  audio: [
    {
      name: 'audio',
      size: SIZES['16x9'],
      query: '',
      steps: [
        `${TO_MENU},key:Down,key:Return,wait:300,key:Right,wait:300`,
        'key:Down,key:Down,key:Left,key:Left,key:Left,key:Down,key:Right,key:Down,key:Right',
        'wait:300,shot:options-en-muted,key:M,wait:300,shot:unmuted-by-key',
        'key:Up,key:Up,key:Up,key:Up,key:Right,wait:300,key:M,wait:300,shot:options-es',
        `reload,${TO_MENU},key:Down,key:Return,wait:300,shot:after-reload`
      ].join(',')
    }
  ],
  security: [
    {
      name: 'security',
      size: SIZES['16x9'],
      query: '',
      steps: `${TO_MENU},security,shot:still-in-game`
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

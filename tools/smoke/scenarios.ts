export interface SmokeRun {
  readonly name: string;
  readonly size: string;
  readonly query: string;
  readonly steps: string;
}

const START = 'wait:2500,click,wait:2000';
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
      steps: `${START},wait:60000,shot:over,key:Return,wait:800,shot:restart`
    }
  ]
};

export type Step =
  | { readonly kind: 'wait'; readonly ms: number }
  | { readonly kind: 'click' }
  | { readonly kind: 'key'; readonly key: string; readonly ms: number }
  | { readonly kind: 'down'; readonly key: string }
  | { readonly kind: 'up'; readonly key: string }
  | { readonly kind: 'shot'; readonly name: string }
  | { readonly kind: 'expectQuit' }
  | { readonly kind: 'security' }
  | { readonly kind: 'touch'; readonly x: number; readonly y: number }
  | { readonly kind: 'touchDown'; readonly id: number; readonly x: number; readonly y: number }
  | { readonly kind: 'touchUp'; readonly id: number }
  | { readonly kind: 'size'; readonly width: number; readonly height: number }
  | { readonly kind: 'reload' };

const DEFAULT_KEY_MS = 100;

const positive = (text: string | undefined, step: string): number => {
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid duration in step "${step}"`);
  return value;
};

const coordinate = (text: string | undefined, step: string): number => {
  const value = Number(text);
  if (text === undefined || text === '' || !Number.isFinite(value)) {
    throw new Error(`Invalid coordinate in step "${step}"`);
  }
  return value;
};

const required = (text: string | undefined, step: string): string => {
  if (!text) throw new Error(`Missing argument in step "${step}"`);
  return text;
};

/**
 * Reads a comma-separated list of steps such as
 * `wait:2500,click,down:Right,wait:900,up:Right,shot:game`. `expectQuit` checks that the
 * game asked the desktop app to close; `security` checks that the page cannot reach Node,
 * open windows or navigate away. Touch steps take board coordinates (logical units, the
 * board from 0 to 640; the left panel is negative): `touch:x:y` taps, `touchDown:id:x:y` puts
 * finger `id` down (or slides it) and `touchUp:id` lifts it. `size:WxH` resizes the window,
 * for example to turn a phone upright, and `reload` reloads the page (settings persist).
 */
export function parseSteps(text: string): readonly Step[] {
  return text
    .split(',')
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step): Step => {
      const [kind, first, second, third] = step.split(':');
      switch (kind) {
        case 'wait':
          return { kind, ms: positive(first, step) };
        case 'click':
          return { kind };
        case 'key':
          return {
            kind,
            key: required(first, step),
            ms: second === undefined ? DEFAULT_KEY_MS : positive(second, step)
          };
        case 'down':
        case 'up':
          return { kind, key: required(first, step) };
        case 'shot':
          return { kind, name: required(first, step) };
        case 'expectQuit':
        case 'security':
        case 'reload':
          return { kind };
        case 'touch':
          return { kind, x: coordinate(first, step), y: coordinate(second, step) };
        case 'touchDown':
          return {
            kind,
            id: positive(first, step),
            x: coordinate(second, step),
            y: coordinate(third, step)
          };
        case 'touchUp':
          return { kind, id: positive(first, step) };
        case 'size':
          return { kind, ...parseSize(required(first, step)) };
        default:
          throw new Error(`Unknown step "${step}"`);
      }
    });
}

export function parseSize(text: string): { readonly width: number; readonly height: number } {
  const match = /^(\d+)x(\d+)$/.exec(text);
  if (!match) throw new Error(`Invalid size "${text}" (expected WIDTHxHEIGHT)`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

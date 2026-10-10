export type Step =
  | { readonly kind: 'wait'; readonly ms: number }
  | { readonly kind: 'click' }
  | { readonly kind: 'key'; readonly key: string; readonly ms: number }
  | { readonly kind: 'down'; readonly key: string }
  | { readonly kind: 'up'; readonly key: string }
  | { readonly kind: 'shot'; readonly name: string }
  | { readonly kind: 'expectQuit' };

const DEFAULT_KEY_MS = 100;

const positive = (text: string | undefined, step: string): number => {
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid duration in step "${step}"`);
  return value;
};

const required = (text: string | undefined, step: string): string => {
  if (!text) throw new Error(`Missing argument in step "${step}"`);
  return text;
};

/**
 * Reads a comma-separated list of steps such as
 * `wait:2500,click,down:Right,wait:900,up:Right,shot:game`. `expectQuit` checks that the
 * game asked the desktop app to close.
 */
export function parseSteps(text: string): readonly Step[] {
  return text
    .split(',')
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step): Step => {
      const [kind, first, second] = step.split(':');
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
          return { kind };
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

export type FilterKind = 'glow' | 'shadow' | 'bloom';

const FILTER_KINDS: readonly FilterKind[] = ['glow', 'shadow', 'bloom'];

/**
 * Reads the filters to try from a `filters` URL value such as `glow,shadow`, `all` or `none`
 * (frame rate only). Without a value there is no trial.
 */
export function parseFilterTrial(value: string | null): readonly FilterKind[] | null {
  if (!value) return null;
  if (value === 'all') return FILTER_KINDS;
  return FILTER_KINDS.filter((kind) => value.split(',').includes(kind));
}

import type { GraphicId } from './graphics';
import type { Palette } from './palette';

/**
 * A visual skin as data: palette overrides, SVG sources for some graphics, by id, and
 * whether the game is drawn with bloom.
 */
export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly palette: Readonly<Partial<Record<string, string>>>;
  readonly art: Readonly<Partial<Record<string, string>>>;
  readonly bloom?: boolean;
}

/** A theme with every token and graphic filled in, falling back to the default theme. */
export interface ResolvedTheme {
  readonly id: string;
  readonly name: string;
  readonly palette: Palette;
  readonly art: Readonly<Record<GraphicId, string>>;
  readonly bloom: boolean;
}

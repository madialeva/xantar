import { THEME_ID_PATTERN } from '../../sim';
import { GRAPHIC_IDS, isGraphicId } from './graphics';
import { PALETTE_TOKENS, isColor, isPaletteToken } from './palette';
import type { ResolvedTheme, Theme } from './Theme';

/** Problems that make a theme unusable, as readable messages (empty when it is fine). */
export function themeProblems(theme: Theme, complete: boolean): string[] {
  const problems: string[] = [];
  if (!THEME_ID_PATTERN.test(theme.id)) problems.push(`invalid theme id "${theme.id}"`);
  for (const [token, color] of Object.entries(theme.palette)) {
    if (color === undefined) continue;
    if (!isPaletteToken(token)) problems.push(`unknown palette token "${token}"`);
    else if (!isColor(color)) problems.push(`invalid color for "${token}": ${color}`);
  }
  for (const id of Object.keys(theme.art)) {
    if (!isGraphicId(id)) problems.push(`unknown graphic "${id}"`);
  }
  if (complete) {
    for (const token of PALETTE_TOKENS) {
      if (theme.palette[token] === undefined) problems.push(`missing palette token "${token}"`);
    }
    for (const id of GRAPHIC_IDS) {
      if (theme.art[id] === undefined) problems.push(`missing graphic "${id}"`);
    }
  }
  return problems;
}

/**
 * The themes the game knows. The default theme must be complete; any other theme inherits
 * from it every token and graphic it leaves out.
 */
export class ThemeRegistry {
  readonly #themes = new Map<string, Theme>();
  readonly #fallback: ResolvedTheme;

  constructor(defaultTheme: Theme) {
    this.#check(defaultTheme, true);
    this.#themes.set(defaultTheme.id, defaultTheme);
    this.#fallback = defaultTheme as ResolvedTheme;
  }

  get defaultId(): string {
    return this.#fallback.id;
  }

  get ids(): readonly string[] {
    return [...this.#themes.keys()];
  }

  register(theme: Theme): this {
    if (this.#themes.has(theme.id)) throw new Error(`Theme "${theme.id}" is already registered`);
    this.#check(theme, false);
    this.#themes.set(theme.id, theme);
    return this;
  }

  has(id: string): boolean {
    return this.#themes.has(id);
  }

  resolve(id: string): ResolvedTheme {
    const theme = this.#themes.get(id);
    if (!theme) throw new Error(`Unknown theme "${id}"`);
    return {
      id: theme.id,
      name: theme.name,
      palette: { ...this.#fallback.palette, ...theme.palette } as ResolvedTheme['palette'],
      art: { ...this.#fallback.art, ...theme.art } as ResolvedTheme['art']
    };
  }

  #check(theme: Theme, complete: boolean): void {
    const problems = themeProblems(theme, complete);
    if (problems.length > 0) {
      throw new Error(`Theme "${theme.id}" is not valid: ${problems.join('; ')}`);
    }
  }
}

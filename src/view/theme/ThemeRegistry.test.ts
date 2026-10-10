import { describe, expect, it } from 'vitest';
import { completeTheme } from './testing';
import { ThemeRegistry } from './ThemeRegistry';

describe('ThemeRegistry', () => {
  it('resolves the default theme as it is', () => {
    const registry = new ThemeRegistry(completeTheme('classic'));
    const resolved = registry.resolve('classic');
    expect(resolved.palette.bun).toBe('#112233');
    expect(resolved.art['platform.left']).toBe('<svg id="platform.left"/>');
  });

  it('lets a palette-only theme keep every default graphic', () => {
    const registry = new ThemeRegistry(completeTheme('classic')).register({
      id: 'night',
      name: 'Night',
      palette: { bun: '#ffffff' },
      art: {}
    });
    const resolved = registry.resolve('night');
    expect(resolved.palette.bun).toBe('#ffffff');
    expect(resolved.palette.shadow).toBe('#112233');
    expect(resolved.art['chef.hat']).toBe('<svg id="chef.hat"/>');
  });

  it('replaces only the graphics a theme provides', () => {
    const registry = new ThemeRegistry(completeTheme('classic')).register({
      id: 'night',
      name: 'Night',
      palette: {},
      art: { 'platform.mid': '<svg id="night"/>' }
    });
    const resolved = registry.resolve('night');
    expect(resolved.art['platform.mid']).toBe('<svg id="night"/>');
    expect(resolved.art['platform.left']).toBe('<svg id="platform.left"/>');
  });

  it('turns bloom on only for the themes that ask for it', () => {
    const registry = new ThemeRegistry({ ...completeTheme('classic'), bloom: true }).register({
      id: 'night',
      name: 'Night',
      palette: {},
      art: {}
    });
    expect(registry.resolve('classic').bloom).toBe(true);
    expect(registry.resolve('night').bloom).toBe(false);
  });

  it('requires the default theme to be complete', () => {
    const { palette, art } = completeTheme();
    const partial = { ...palette, shadow: undefined };
    expect(() => new ThemeRegistry({ id: 'classic', name: 'C', palette: partial, art })).toThrow(
      /missing palette token "shadow"/
    );
  });

  it('rejects unknown graphics, unknown tokens and bad colors, naming the theme', () => {
    const registry = new ThemeRegistry(completeTheme('classic'));
    expect(() =>
      registry.register({ id: 'odd', name: 'Odd', palette: {}, art: { 'platform.top': '<svg/>' } })
    ).toThrow(/Theme "odd".*unknown graphic "platform.top"/);
    expect(() =>
      registry.register({ id: 'odd', name: 'Odd', palette: { gold: '#ffd700' }, art: {} })
    ).toThrow(/unknown palette token "gold"/);
    expect(() =>
      registry.register({ id: 'odd', name: 'Odd', palette: { bun: 'tan' }, art: {} })
    ).toThrow(/invalid color for "bun"/);
  });

  it('rejects a repeated or malformed id', () => {
    const registry = new ThemeRegistry(completeTheme('classic'));
    expect(() => registry.register({ ...completeTheme('classic') })).toThrow(/already registered/);
    expect(() => registry.register({ id: 'Night Mode', name: 'N', palette: {}, art: {} })).toThrow(
      /invalid theme id/
    );
  });

  it('lists its themes and refuses to resolve an unknown one', () => {
    const registry = new ThemeRegistry(completeTheme('classic')).register({
      id: 'night',
      name: 'Night',
      palette: {},
      art: {}
    });
    expect(registry.ids).toEqual(['classic', 'night']);
    expect(registry.defaultId).toBe('classic');
    expect(() => registry.resolve('day')).toThrow(/Unknown theme "day"/);
  });
});

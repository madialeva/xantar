import { describe, expect, it } from 'vitest';
import { createThemeRegistry } from '.';

describe('createThemeRegistry', () => {
  it('registers the classic and midnight themes, classic by default', () => {
    const registry = createThemeRegistry();
    expect(registry.ids).toEqual(['classic', 'midnight']);
    expect(registry.defaultId).toBe('classic');
  });

  it('gives midnight its own palette and platform while inheriting the rest', () => {
    const registry = createThemeRegistry();
    const classic = registry.resolve('classic');
    const midnight = registry.resolve('midnight');
    expect(midnight.palette.backdrop).not.toBe(classic.palette.backdrop);
    expect(midnight.art['platform.mid']).not.toBe(classic.art['platform.mid']);
    expect(midnight.art['chef.hat']).toBe(classic.art['chef.hat']);
    expect(midnight.palette.bun).toBe(classic.palette.bun);
  });
});

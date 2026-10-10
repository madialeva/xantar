import { describe, expect, it } from 'vitest';
import { createPlatform } from './Platform';

describe('createPlatform', () => {
  it('is a browser without the preload bridge', () => {
    for (const host of [{}, { xantar: { isDesktop: true, quit: () => undefined } }]) {
      const platform = createPlatform(host);
      expect(platform.isDesktop).toBe(false);
      expect(platform.quit).toBeNull();
    }
  });

  it('closes the app and goes native fullscreen through the bridge on the desktop', async () => {
    const calls: string[] = [];
    const platform = createPlatform({
      xantar: {
        isDesktop: true,
        quit: () => calls.push('quit'),
        setFullScreen: (on: boolean) => calls.push(`fullscreen:${on}`)
      }
    });
    expect(platform.isDesktop).toBe(true);
    await platform.enterFullscreen(false);
    platform.quit?.();
    expect(calls).toEqual(['fullscreen:true', 'quit']);
  });
});

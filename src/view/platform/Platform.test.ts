import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlatform, returnUrl } from './Platform';

const GAME = 'https://madialeva.github.io/js/xantar/index.html';

const HOME = 'https://madialeva.github.io/';

interface BrowserOptions {
  readonly historyLength?: number;
  readonly fullscreen?: boolean;
  readonly exit?: () => Promise<void>;
}

const browser = (referrer: string, calls: string[], options: BrowserOptions = {}): object => ({
  document: {
    referrer,
    fullscreenElement: options.fullscreen ? {} : null,
    exitFullscreen: () => {
      calls.push('exitFullscreen');
      return options.exit?.() ?? Promise.resolve();
    }
  },
  location: { href: GAME, assign: (url: string) => calls.push(`assign:${url}`) },
  history: { length: options.historyLength ?? 2, back: () => calls.push('back') },
  screen: { orientation: { unlock: () => calls.push('unlock') } }
});

describe('returnUrl', () => {
  it('is the referrer when it is another page of the same site', () => {
    for (const home of ['https://madialeva.github.io/', 'https://madialeva.github.io/index.html']) {
      expect(returnUrl(home, GAME)).toBe(home);
    }
  });

  it('is null without a referrer, from another origin or from the game itself', () => {
    for (const referrer of [
      '',
      'not a url',
      'https://example.com/',
      'http://madialeva.github.io/',
      'https://madialeva.github.io:8443/',
      `${GAME}?lang=en`,
      `${GAME}#menu`
    ]) {
      expect(returnUrl(referrer, GAME)).toBeNull();
    }
  });
});

describe('createPlatform', () => {
  it('is a browser without the preload bridge', () => {
    for (const host of [{}, { xantar: { isDesktop: true, quit: () => undefined } }]) {
      const platform = createPlatform(host);
      expect(platform.isDesktop).toBe(false);
      expect(platform.quit).toBeNull();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('goes back to the page of the same site that opened the game in a browser', async () => {
    const calls: string[] = [];
    createPlatform(browser(HOME, calls)).quit?.();
    await vi.waitFor(() => expect(calls).toEqual(['unlock', 'back']));
    calls.length = 0;
    createPlatform(browser(HOME, calls, { historyLength: 1 })).quit?.();
    await vi.waitFor(() => expect(calls).toEqual(['unlock', `assign:${HOME}`]));
  });

  it('leaves fullscreen and its orientation before going back', async () => {
    const calls: string[] = [];
    createPlatform(browser(HOME, calls, { fullscreen: true })).quit?.();
    await vi.waitFor(() => expect(calls).toEqual(['unlock', 'exitFullscreen', 'back']));
  });

  it('goes back after a second when leaving fullscreen never settles', async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const exit = (): Promise<void> => new Promise<void>(() => undefined);
    createPlatform(browser(HOME, calls, { fullscreen: true, exit })).quit?.();
    await vi.advanceTimersByTimeAsync(999);
    expect(calls).toEqual(['unlock', 'exitFullscreen']);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(['unlock', 'exitFullscreen', 'back']);
  });

  it('has nowhere to quit to in a browser opened directly or from another site', () => {
    for (const referrer of ['', 'https://example.com/']) {
      expect(createPlatform(browser(referrer, [])).quit).toBeNull();
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

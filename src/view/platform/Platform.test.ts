import { describe, expect, it } from 'vitest';
import { createPlatform, returnUrl } from './Platform';

const GAME = 'https://madialeva.github.io/js/xantar/index.html';

const browser = (referrer: string, historyLength: number, calls: string[]): object => ({
  document: { referrer },
  location: { href: GAME, assign: (url: string) => calls.push(`assign:${url}`) },
  history: { length: historyLength, back: () => calls.push('back') }
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

  it('goes back to the page of the same site that opened the game in a browser', () => {
    const calls: string[] = [];
    createPlatform(browser('https://madialeva.github.io/', 2, calls)).quit?.();
    createPlatform(browser('https://madialeva.github.io/', 1, calls)).quit?.();
    expect(calls).toEqual(['back', 'assign:https://madialeva.github.io/']);
  });

  it('has nowhere to quit to in a browser opened directly or from another site', () => {
    for (const referrer of ['', 'https://example.com/']) {
      expect(createPlatform(browser(referrer, 2, [])).quit).toBeNull();
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

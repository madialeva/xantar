import { describe, expect, it } from 'vitest';
import { desktopQuit } from './desktop';

describe('desktopQuit', () => {
  it('is null in a browser', () => {
    expect(desktopQuit({})).toBeNull();
    expect(desktopQuit({ xantar: { isDesktop: true } })).toBeNull();
  });

  it('closes the app through the preload bridge on the desktop', () => {
    let quits = 0;
    const quit = desktopQuit({ xantar: { isDesktop: true, quit: () => quits++ } });
    quit?.();
    expect(quits).toBe(1);
  });
});

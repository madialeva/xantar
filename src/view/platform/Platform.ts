import { enterFullscreen, exitFullscreen, type FullscreenHost } from '../ui/fullscreen';

/**
 * What the game can ask of the place it runs in, a browser tab or the desktop app
 * (Strategy): closing the app and going fullscreen.
 */
export interface Platform {
  readonly isDesktop: boolean;
  /**
   * Leaves the game: closes the desktop app, or in a browser goes back to the page of the same
   * site that opened the game. `null` when there is nowhere to go (a page cannot close its tab).
   */
  readonly quit: (() => void) | null;
  /** Asks for fullscreen; always resolves, also when it is refused or unavailable. */
  enterFullscreen(isMobile: boolean): Promise<void>;
}

/** What the Electron preload exposes to the game as `window.xantar`. */
interface DesktopBridge {
  readonly isDesktop: boolean;
  quit(): void;
  setFullScreen(on: boolean): void;
}

/** The parts of the browser `window` a web platform needs to leave the game. */
interface BrowserHost extends FullscreenHost {
  readonly document?: FullscreenHost['document'] & { readonly referrer: string };
  readonly location?: { readonly href: string; assign(url: string): void };
  readonly history?: { readonly length: number; back(): void };
}

const FULLSCREEN_WAIT_MS = 1000;

const isDesktopBridge = (value: unknown): value is DesktopBridge =>
  typeof value === 'object' &&
  value !== null &&
  (value as Partial<DesktopBridge>).isDesktop === true &&
  typeof (value as Partial<DesktopBridge>).quit === 'function' &&
  typeof (value as Partial<DesktopBridge>).setFullScreen === 'function';

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * The page the game can go back to: `referrer` when it is another page of the same origin as
 * `current` (query and hash aside), otherwise `null`.
 */
export function returnUrl(referrer: string, current: string): string | null {
  const from = parseUrl(referrer);
  const here = parseUrl(current);
  if (!from || !here || from.origin !== here.origin || from.pathname === here.pathname) {
    return null;
  }
  return from.href;
}

const settleWithin = (task: Promise<void>): Promise<void> =>
  Promise.race([task, new Promise<void>((resolve) => setTimeout(resolve, FULLSCREEN_WAIT_MS))]);

/**
 * Leaving a browser tab: out of fullscreen and its orientation, then back in the history when
 * there is one, or loading the page that opened the game (a tab opened from a link has none).
 */
const webQuit = (host: BrowserHost): (() => void) | null => {
  const { document, location, history } = host;
  if (!document || !location || !history) return null;
  const url = returnUrl(document.referrer, location.href);
  if (!url) return null;
  const goBack = (): void => {
    if (history.length > 1) history.back();
    else location.assign(url);
  };
  return () => void settleWithin(exitFullscreen(host)).then(goBack);
};

/**
 * A browser tab: the Fullscreen API, and leaving to the page that opened the game when there is
 * one. Some browsers never settle fullscreen requests, so they are not awaited for more than a
 * second.
 */
class WebPlatform implements Platform {
  readonly isDesktop = false;
  readonly quit: (() => void) | null;

  constructor(quit: (() => void) | null) {
    this.quit = quit;
  }

  enterFullscreen(isMobile: boolean): Promise<void> {
    return settleWithin(enterFullscreen(isMobile));
  }
}

/** The desktop app: native fullscreen and quitting through the preload bridge. */
class DesktopPlatform implements Platform {
  readonly isDesktop = true;
  readonly quit: () => void;
  readonly #bridge: DesktopBridge;

  constructor(bridge: DesktopBridge) {
    this.#bridge = bridge;
    this.quit = () => bridge.quit();
  }

  enterFullscreen(): Promise<void> {
    this.#bridge.setFullScreen(true);
    return Promise.resolve();
  }
}

/** The platform of `host` (the `window`): the desktop app when its preload bridge is present. */
export function createPlatform(host: object): Platform {
  const bridge = (host as { xantar?: unknown }).xantar;
  return isDesktopBridge(bridge)
    ? new DesktopPlatform(bridge)
    : new WebPlatform(webQuit(host as BrowserHost));
}

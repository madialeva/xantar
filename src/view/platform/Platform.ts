import { enterFullscreen } from '../ui/fullscreen';

/**
 * What the game can ask of the place it runs in, a browser tab or the desktop app
 * (Strategy): closing the app and going fullscreen.
 */
export interface Platform {
  readonly isDesktop: boolean;
  /** Closes the app, or `null` in a browser, where a page cannot close its tab. */
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

const FULLSCREEN_WAIT_MS = 1000;

const isDesktopBridge = (value: unknown): value is DesktopBridge =>
  typeof value === 'object' &&
  value !== null &&
  (value as Partial<DesktopBridge>).isDesktop === true &&
  typeof (value as Partial<DesktopBridge>).quit === 'function' &&
  typeof (value as Partial<DesktopBridge>).setFullScreen === 'function';

/**
 * A browser tab: the Fullscreen API. Some browsers never settle the request, so it is not
 * awaited for more than a second.
 */
class WebPlatform implements Platform {
  readonly isDesktop = false;
  readonly quit = null;

  enterFullscreen(isMobile: boolean): Promise<void> {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, FULLSCREEN_WAIT_MS));
    return Promise.race([enterFullscreen(isMobile), timeout]);
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
  return isDesktopBridge(bridge) ? new DesktopPlatform(bridge) : new WebPlatform();
}

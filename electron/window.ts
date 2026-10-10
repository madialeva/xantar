import { BrowserWindow, type WebContents } from 'electron';
import { siteOf } from './appPath';

export interface GameWindowOptions {
  /** Absolute path of the compiled preload script. */
  readonly preload: string;
  /** Scheme and host the page may navigate within (`app://xantar` or the Vite server). */
  readonly site: string;
  readonly width?: number;
  readonly height?: number;
  readonly useContentSize?: boolean;
  readonly partition?: string;
}

/** Keeps the page inside the game: no navigation elsewhere, no new windows or webviews. */
function confine(contents: WebContents, site: string): void {
  const stayInside = (event: { preventDefault(): void }, url: string): void => {
    if (siteOf(url) !== site) event.preventDefault();
  };
  contents.on('will-navigate', stayInside);
  contents.on('will-redirect', stayInside);
  contents.on('will-attach-webview', (event) => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false)
  );
  contents.session.setPermissionCheckHandler(() => false);
}

/**
 * Creates the hardened game window (sandboxed, isolated, confined to the game) with F11 to
 * toggle native fullscreen. The desktop app and the smoke test both use it.
 */
export function createGameWindow(options: GameWindowOptions): BrowserWindow {
  const window = new BrowserWindow({
    width: options.width ?? 1280,
    height: options.height ?? 720,
    useContentSize: options.useContentSize ?? false,
    minWidth: 640,
    minHeight: 360,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: options.preload,
      partition: options.partition,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false
    }
  });
  confine(window.webContents, options.site);
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11' && !input.isAutoRepeat) {
      event.preventDefault();
      window.setFullScreen(!window.isFullScreen());
    }
  });
  return window;
}

/** The game window that sent an IPC message, if it is a top-level page of the game site. */
export function senderWindow(contents: WebContents, site: string): BrowserWindow | null {
  const window = BrowserWindow.fromWebContents(contents);
  return window && siteOf(contents.getURL()) === site ? window : null;
}

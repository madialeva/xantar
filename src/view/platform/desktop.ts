/** What the Electron preload exposes to the game as `window.xantar`. */
interface DesktopBridge {
  readonly isDesktop: boolean;
  quit(): void;
}

const isDesktopBridge = (value: unknown): value is DesktopBridge =>
  typeof value === 'object' &&
  value !== null &&
  (value as Partial<DesktopBridge>).isDesktop === true &&
  typeof (value as Partial<DesktopBridge>).quit === 'function';

/** A function that closes the desktop app, or `null` in a browser, where a page cannot close. */
export function desktopQuit(host: object): (() => void) | null {
  const bridge = (host as { xantar?: unknown }).xantar;
  return isDesktopBridge(bridge) ? () => bridge.quit() : null;
}

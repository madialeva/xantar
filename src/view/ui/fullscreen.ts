type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
};

type KeyboardLockNavigator = Navigator & {
  keyboard?: { lock?: (keys: readonly string[]) => Promise<void> };
};

/**
 * Asks for fullscreen and, on phones, for landscape. Where the browser allows it, also locks
 * the Escape key so the game receives it (holding it still leaves fullscreen). Always
 * resolves: a refusal or an unsupported browser simply leaves the game windowed.
 */
export async function enterFullscreen(isMobile: boolean): Promise<void> {
  const element = document.documentElement as FullscreenElement;
  try {
    await (element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.());
  } catch {
    return;
  }
  try {
    await (navigator as KeyboardLockNavigator).keyboard?.lock?.(['Escape']);
  } catch {
    // Without the lock, Escape leaves fullscreen and the game pauses instead.
  }
  if (!isMobile) return;
  try {
    await (screen.orientation as LockableOrientation).lock?.('landscape');
  } catch {
    // Orientation lock is optional.
  }
}

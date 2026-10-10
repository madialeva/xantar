/** IPC channels from the game page to the main process. */
export const CHANNELS = {
  quit: 'app:quit',
  setFullScreen: 'window:set-fullscreen'
} as const;

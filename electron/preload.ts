import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from './channels';

contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform,
  quit: (): void => ipcRenderer.send(CHANNELS.quit),
  setFullScreen: (on: boolean): void => ipcRenderer.send(CHANNELS.setFullScreen, on === true)
});

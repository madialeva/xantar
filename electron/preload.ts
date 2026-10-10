import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform,
  quit: (): void => ipcRenderer.send('app:quit')
});

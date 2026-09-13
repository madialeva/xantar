import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('xantar', {
  isDesktop: true,
  platform: process.platform
});

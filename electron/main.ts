import { BrowserWindow, app, ipcMain, session } from 'electron';
import path from 'node:path';
import { APP_ORIGIN, APP_URL, siteOf } from './appPath';
import { registerAppScheme, serveApp } from './appProtocol';
import { CHANNELS } from './channels';
import { createGameWindow, senderWindow } from './window';

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const site = (devServerUrl && siteOf(devServerUrl)) || APP_ORIGIN;

registerAppScheme();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  ipcMain.on(CHANNELS.quit, (event) => {
    if (senderWindow(event.sender, site)) app.quit();
  });
  ipcMain.on(CHANNELS.setFullScreen, (event, on: unknown) => {
    if (typeof on === 'boolean') senderWindow(event.sender, site)?.setFullScreen(on);
  });

  const createWindow = (): void => {
    const window = createGameWindow({ preload: path.join(__dirname, 'preload.js'), site });
    if (devServerUrl) {
      void window.loadURL(devServerUrl);
      window.webContents.openDevTools({ mode: 'detach' });
    } else {
      void window.loadURL(APP_URL);
    }
  };

  void app.whenReady().then(() => {
    serveApp(path.join(__dirname, '../dist'), session.defaultSession);
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

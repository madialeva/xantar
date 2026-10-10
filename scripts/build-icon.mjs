// Renders build/icon.svg to build/icon.png (1024×1024) with a hidden Electron window, so
// electron-builder can derive the Windows, macOS and Linux icons. Run with `npm run icon`.
import { BrowserWindow, app } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SIZE = 1024;
const root = process.cwd();
const source = path.join(root, 'build', 'icon.svg');
const target = path.join(root, 'build', 'icon.png');

const render = `
  new Promise((resolve, reject) => {
    const image = new Image(${SIZE}, ${SIZE});
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = ${SIZE};
      canvas.height = ${SIZE};
      canvas.getContext('2d').drawImage(image, 0, 0, ${SIZE}, ${SIZE});
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('the SVG did not load'));
    image.src = window.svgSource;
  })`;

app.on('window-all-closed', () => undefined);

void app.whenReady().then(async () => {
  let code = 1;
  try {
    const svg = await readFile(source);
    const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    await window.loadURL('about:blank');
    await window.webContents.executeJavaScript(
      `window.svgSource = 'data:image/svg+xml;base64,${svg.toString('base64')}'; true`
    );
    const dataUrl = await window.webContents.executeJavaScript(render);
    await writeFile(target, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`Icon written to ${path.relative(root, target)}`);
    code = 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  app.exit(code);
});

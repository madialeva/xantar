import { BrowserWindow, app, ipcMain, session } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { APP_ORIGIN, APP_URL } from '../../electron/appPath';
import { registerAppScheme, serveApp } from '../../electron/appProtocol';
import { CHANNELS } from '../../electron/channels';
import { createGameWindow } from '../../electron/window';
import { SCENARIOS, type SmokeRun } from './scenarios';
import { type Step, parseSize, parseSteps } from './steps';

interface RunResult {
  readonly name: string;
  readonly problems: readonly string[];
}

const root = process.env.XANTAR_ROOT ?? process.cwd();
const outRoot = path.join(root, '.smoke');
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const quitRequests = new Set<number>();
const evalProbes = new Set<number>();

const OUTSIDE_URL = 'https://example.com/';

registerAppScheme();
ipcMain.on(CHANNELS.quit, (event) => quitRequests.add(event.sender.id));
ipcMain.on(CHANNELS.setFullScreen, () => undefined);

if (process.env.XANTAR_SMOKE_SOFTWARE_GL === '1') {
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}

function option(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function requestedRuns(args: readonly string[]): { scenario: string; runs: readonly SmokeRun[] } {
  const steps = option(args, 'steps');
  if (steps !== undefined) {
    return {
      scenario: 'custom',
      runs: [
        {
          name: option(args, 'name') ?? 'custom',
          size: option(args, 'size') ?? '1920x1080',
          query: option(args, 'query') ?? '',
          steps
        }
      ]
    };
  }
  const scenario = args.find((arg) => !arg.startsWith('--')) ?? 'review';
  const runs = SCENARIOS[scenario];
  if (!runs) {
    throw new Error(`Unknown scenario "${scenario}". Known: ${Object.keys(SCENARIOS).join(', ')}`);
  }
  return { scenario, runs };
}

const BOARD = { width: 640, height: 480 };

interface TouchPoint {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

const fingers = new Map<number, Map<number, TouchPoint>>();

/** Where a board coordinate falls in the window, from the canvas as the page lays it out. */
async function toWindow(window: BrowserWindow, x: number, y: number): Promise<TouchPoint> {
  const rect = (await window.webContents.executeJavaScript(
    `(() => { const r = document.querySelector('canvas').getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height }; })()`
  )) as { left: number; top: number; width: number; height: number };
  const scale = rect.height / BOARD.height;
  const panel = (rect.width / scale - BOARD.width) / 2;
  return { id: 0, x: rect.left + (x + panel) * scale, y: rect.top + y * scale };
}

/** Sends the fingers on the screen after a change, through the DevTools protocol. */
async function sendTouches(window: BrowserWindow, type: 'touchStart' | 'touchEnd'): Promise<void> {
  const points = [...(fingers.get(window.webContents.id)?.values() ?? [])];
  await window.webContents.debugger.sendCommand('Input.dispatchTouchEvent', {
    type: points.length === 0 ? 'touchEnd' : type,
    touchPoints: points
  });
}

async function touchDown(window: BrowserWindow, id: number, x: number, y: number): Promise<void> {
  const point = await toWindow(window, x, y);
  const active = fingers.get(window.webContents.id) ?? new Map<number, TouchPoint>();
  fingers.set(window.webContents.id, active);
  const type = active.has(id) ? 'touchMove' : 'touchStart';
  active.set(id, { ...point, id });
  await window.webContents.debugger.sendCommand('Input.dispatchTouchEvent', {
    type,
    touchPoints: [...active.values()]
  });
}

async function touchUp(window: BrowserWindow, id: number): Promise<void> {
  fingers.get(window.webContents.id)?.delete(id);
  await sendTouches(window, 'touchStart');
}

async function perform(
  window: BrowserWindow,
  step: Step,
  outDir: string,
  problems: string[]
): Promise<void> {
  const { webContents } = window;
  switch (step.kind) {
    case 'wait':
      await sleep(step.ms);
      return;
    case 'click': {
      const [width, height] = window.getContentSize();
      for (const type of ['mouseDown', 'mouseUp'] as const) {
        webContents.sendInputEvent({
          type,
          x: width / 2,
          y: height / 2,
          button: 'left',
          clickCount: 1
        });
      }
      return;
    }
    case 'key':
      webContents.sendInputEvent({ type: 'keyDown', keyCode: step.key });
      await sleep(step.ms);
      webContents.sendInputEvent({ type: 'keyUp', keyCode: step.key });
      return;
    case 'down':
      webContents.sendInputEvent({ type: 'keyDown', keyCode: step.key });
      return;
    case 'up':
      webContents.sendInputEvent({ type: 'keyUp', keyCode: step.key });
      return;
    case 'shot': {
      const image = await webContents.capturePage();
      await writeFile(path.join(outDir, `${step.name}.png`), image.toPNG());
      return;
    }
    case 'expectQuit':
      if (!quitRequests.has(webContents.id)) problems.push('the game did not ask to quit');
      return;
    case 'security':
      await checkConfinement(window, problems);
      return;
    case 'touch':
      await touchDown(window, 99, step.x, step.y);
      await sleep(60);
      await touchUp(window, 99);
      return;
    case 'touchDown':
      await touchDown(window, step.id, step.x, step.y);
      return;
    case 'touchUp':
      await touchUp(window, step.id);
      return;
    case 'size':
      window.setContentSize(step.width, step.height);
      return;
  }
}

interface PolicyIssue {
  readonly issue?: {
    readonly code?: string;
    readonly details?: {
      readonly contentSecurityPolicyIssueDetails?: {
        readonly violatedDirective?: string;
        readonly contentSecurityPolicyViolationType?: string;
        readonly blockedURL?: string;
      };
    };
  };
}

/**
 * Reports every Content Security Policy violation, through the DevTools protocol: Chromium
 * does not always log them to the console (for example, a caught `eval`).
 */
function watchPolicyViolations(window: BrowserWindow, problems: string[]): void {
  const { debugger: devtools } = window.webContents;
  devtools.attach('1.3');
  devtools.on('message', (_event, method, params) => {
    const { issue } = params as PolicyIssue;
    if (method !== 'Audits.issueAdded' || issue?.code !== 'ContentSecurityPolicyIssue') return;
    const details = issue.details?.contentSecurityPolicyIssueDetails;
    const probed = evalProbes.has(window.webContents.id);
    if (probed && details?.contentSecurityPolicyViolationType === 'kEvalViolation') return;
    problems.push(
      `content security policy: ${details?.violatedDirective ?? '?'} blocked ${details?.blockedURL ?? 'inline code'}`
    );
  });
  // Not awaited: before the first navigation the command only settles once a page exists,
  // and enabling also reports the issues found so far.
  devtools.sendCommand('Audits.enable').catch((error: unknown) => {
    problems.push(`cannot watch the content security policy: ${String(error)}`);
  });
}

/** Checks that the page has no Node, cannot open windows and cannot leave the game. */
async function checkConfinement(window: BrowserWindow, problems: string[]): Promise<void> {
  const { webContents } = window;
  const windows = BrowserWindow.getAllWindows().length;
  evalProbes.add(webContents.id);
  const reach = (await webContents.executeJavaScript(
    `[typeof require, typeof process, typeof window.open('${OUTSIDE_URL}'),
      (() => { try { return String(eval('1')); } catch { return 'blocked'; } })()]`
  )) as string[];
  if (reach[0] !== 'undefined') problems.push('the page can use require');
  if (reach[1] !== 'undefined') problems.push('the page can use process');
  if (reach[3] !== 'blocked') problems.push('the page can use eval (no Content Security Policy)');
  await webContents.executeJavaScript(`window.location.href = '${OUTSIDE_URL}'; true`);
  await sleep(1000);
  if (BrowserWindow.getAllWindows().length !== windows) problems.push('the page opened a window');
  if (!webContents.getURL().startsWith(APP_ORIGIN)) {
    problems.push(`the page navigated to ${webContents.getURL()}`);
  }
}

async function play(run: SmokeRun, outDir: string): Promise<RunResult> {
  await mkdir(outDir, { recursive: true });
  const { width, height } = parseSize(run.size);
  const steps = parseSteps(run.steps);
  const log: string[] = [];
  const problems: string[] = [];
  const partition = `smoke-${run.name}-${Date.now()}`;
  serveApp(path.join(root, 'dist'), session.fromPartition(partition));
  const window = createGameWindow({
    preload: path.join(root, 'dist-electron', 'preload.js'),
    site: APP_ORIGIN,
    width,
    height,
    useContentSize: true,
    partition
  });
  window.webContents.on('console-message', (event) => {
    log.push(`[${event.level}] ${event.message}`);
    if (event.level === 'error') problems.push(`console error: ${event.message}`);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    problems.push(`renderer gone: ${details.reason}`);
  });
  watchPolicyViolations(window, problems);
  if (run.touch) {
    void window.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });
  }
  await window.loadURL(run.query ? `${APP_URL}?${run.query}` : APP_URL);
  for (const step of steps) await perform(window, step, outDir, problems);
  await writeFile(path.join(outDir, 'console.log'), `${log.join('\n')}\n`);
  window.destroy();
  return { name: run.name, problems };
}

async function main(): Promise<number> {
  const { scenario, runs } = requestedRuns(process.argv.slice(2));
  const results: RunResult[] = [];
  for (const run of runs) {
    const outDir = path.join(outRoot, scenario, run.name);
    const result = await play(run, outDir);
    results.push(result);
    const status = result.problems.length === 0 ? 'ok' : 'FAILED';
    console.log(`${status}  ${run.name}  ->  ${path.relative(root, outDir)}`);
    for (const problem of result.problems) console.log(`      ${problem}`);
  }
  return results.some((result) => result.problems.length > 0) ? 1 : 0;
}

app.on('window-all-closed', () => undefined);

void app.whenReady().then(async () => {
  let code = 1;
  try {
    code = await main();
  } catch (error) {
    console.log(`FAILED  ${error instanceof Error ? error.message : String(error)}`);
  }
  app.exit(code);
});

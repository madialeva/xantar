import { BrowserWindow, app } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SCENARIOS, type SmokeRun } from './scenarios';
import { type Step, parseSize, parseSteps } from './steps';

interface RunResult {
  readonly name: string;
  readonly problems: readonly string[];
}

const root = process.env.XANTAR_ROOT ?? process.cwd();
const outRoot = path.join(root, '.smoke');
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

async function perform(window: BrowserWindow, step: Step, outDir: string): Promise<void> {
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
  }
}

async function play(run: SmokeRun, outDir: string): Promise<RunResult> {
  await mkdir(outDir, { recursive: true });
  const { width, height } = parseSize(run.size);
  const steps = parseSteps(run.steps);
  const log: string[] = [];
  const problems: string[] = [];
  const window = new BrowserWindow({
    width,
    height,
    useContentSize: true,
    show: true,
    backgroundColor: '#000000',
    webPreferences: { partition: `smoke-${run.name}-${Date.now()}` }
  });
  window.webContents.on('console-message', (event) => {
    log.push(`[${event.level}] ${event.message}`);
    if (event.level === 'error') problems.push(`console error: ${event.message}`);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    problems.push(`renderer gone: ${details.reason}`);
  });
  await window.loadFile(path.join(root, 'dist', 'index.html'), { search: run.query });
  for (const step of steps) await perform(window, step, outDir);
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

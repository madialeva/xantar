import { build } from 'esbuild';
import electron from 'electron';
import { spawn, spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';

const outfile = '.smoke/smoke-main.cjs';

try {
  await access('dist/index.html');
} catch {
  console.error('dist/ is missing: run "npm run build" first (or use "npm run smoke").');
  process.exit(1);
}

await build({
  entryPoints: ['tools/smoke/main.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  logLevel: 'warning'
});

const args = process.argv.slice(2);
const visible = args.includes('--visible');
const headless =
  !visible &&
  process.platform === 'linux' &&
  spawnSync('which', ['xvfb-run'], { stdio: 'ignore' }).status === 0;

const env = { ...process.env, XANTAR_ROOT: process.cwd() };
delete env.ELECTRON_RUN_AS_NODE;
if (headless) env.XANTAR_SMOKE_SOFTWARE_GL = '1';

const electronArgs = [outfile, ...args.filter((arg) => arg !== '--visible')];
const [command, commandArgs] = headless
  ? ['xvfb-run', ['-a', '-s', '-screen 0 3840x2160x24', electron, ...electronArgs]]
  : [electron, electronArgs];

const chromiumNoise = /^\[\d+:\d+\//;
const child = spawn(command, commandArgs, { env, stdio: ['ignore', 'pipe', 'ignore'] });
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  for (const line of chunk.split('\n')) {
    if (line && !chromiumNoise.test(line)) console.log(line);
  }
});
child.on('exit', (code) => process.exit(code ?? 1));

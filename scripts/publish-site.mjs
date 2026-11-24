import { spawnSync } from 'node:child_process';
import { access, cp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const web = resolve(root, process.env.XANTAR_WEB_DIR ?? '../web');
const target = join(web, 'public', 'js', 'xantar');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const run = (command, args, cwd) =>
  spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    .status === 0;

try {
  await access(join(web, 'deploy.sh'));
  await access(join(web, 'astro.config.mjs'));
} catch {
  fail(
    `${web} is not the source of the personal site (deploy.sh and astro.config.mjs are missing). Set XANTAR_WEB_DIR to its folder.`
  );
}

if (!run('npm', ['run', 'build'], root))
  fail('The build failed: the personal site was not changed.');

await rm(target, { recursive: true, force: true });
await cp(join(root, 'dist'), target, { recursive: true });
console.log(`\nCopied dist/ to ${target}`);

if (!run('bash', ['deploy.sh'], web))
  fail(`deploy.sh failed in ${web}: the public site was not published.`);

console.log(`
Xantar is in ${target} and in js/xantar/ of the public site. Follow the steps above: check it
locally (entrar → Juegos → Xantar, play, Quit), then commit and push both repositories of the site. GitHub Pages
serves the public one from the root of main: https://madialeva.github.io/js/xantar/`);

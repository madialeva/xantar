import { spawnSync } from 'node:child_process';
import { access, cp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = resolve(root, process.env.XANTAR_SITE_DIR ?? '../madialeva.github.io');
const target = join(site, 'src', 'js', 'xantar');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const run = (command, args, cwd) =>
  spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    .status === 0;

try {
  await access(join(site, 'deploy.sh'));
  await access(join(site, 'src', 'index.html'));
} catch {
  fail(
    `${site} is not the personal site (deploy.sh and src/index.html are missing). Set XANTAR_SITE_DIR to its folder.`
  );
}

if (!run('npm', ['run', 'build'], root))
  fail('The build failed: the personal site was not changed.');

await rm(target, { recursive: true, force: true });
await cp(join(root, 'dist'), target, { recursive: true });
console.log(`\nCopied dist/ to ${target}`);

if (!run('bash', ['deploy.sh'], site)) fail('deploy.sh failed in the personal site.');

console.log(`
Published to ${join(site, 'docs', 'js', 'xantar')}. Next steps in ${site}:
  1. python3 -m http.server -d docs   (check http://localhost:8000: GAME, play, Quit)
  2. git add -A && git commit
  3. git push   (GitHub Pages publishes https://madialeva.github.io/js/xantar/)`);

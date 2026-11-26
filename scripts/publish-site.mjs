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

// The site is published by its own CI (a manual run of its workflow on main), never from here
if (!run('npm', ['run', 'check'], web))
  fail(`
The quality checks of the personal site failed with the new build in ${target}.
The site is not validated and nothing has been published. Fix it, or undo the copy with:
  git -C "${web}" restore --source=HEAD --staged --worktree public/js/xantar
  git -C "${web}" clean -fd public/js/xantar`);

console.log(`
Xantar is in ${target} and the personal site passes its quality checks.
Nothing has been published yet. Next steps:
  1. Commit and push the site sources:
       git -C "${web}" add public/js/xantar
       git -C "${web}" commit -m "Update Xantar"
       git -C "${web}" push
  2. Wait for the CI of madialeva/web to verify the push: gh run watch --repo madialeva/web
  3. Publish (also on GitHub with "Run workflow"): gh workflow run ci.yml --repo madialeva/web --ref main
  4. Follow the publication, which also checks production: gh run watch --repo madialeva/web
Then play it at https://madialeva.com/js/xantar/ (entrar → Juegos → Xantar → Quit).`);

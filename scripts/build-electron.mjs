import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

const outdir = 'dist-electron';

await mkdir(outdir, { recursive: true });

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  minify: false,
  sourcemap: false
};

await Promise.all([
  build({ ...common, entryPoints: ['electron/main.ts'], outfile: `${outdir}/main.js` }),
  build({ ...common, entryPoints: ['electron/preload.ts'], outfile: `${outdir}/preload.js` })
]);

await writeFile(`${outdir}/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2));

console.log(`Electron compilado en ${outdir}/`);

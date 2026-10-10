import { readFile } from 'node:fs/promises';
import { expectedVersion } from './branchVersion.ts';

const refs = {
  refName: process.env.GITHUB_REF_NAME ?? '',
  baseRef: process.env.GITHUB_BASE_REF ?? ''
};
const expected = expectedVersion(refs);
const ref = refs.baseRef || refs.refName;

if (expected === null) {
  console.log(`No version check for "${ref || '(no ref)'}".`);
} else {
  const manifest = JSON.parse(await readFile('package.json', 'utf8')) as { version?: unknown };
  if (manifest.version !== expected) {
    console.error(
      `package.json has version ${String(manifest.version)} but "${ref}" expects ${expected}.`
    );
    process.exit(1);
  }
  console.log(`package.json version ${expected} matches "${ref}".`);
}

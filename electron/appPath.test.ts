import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAppPath, siteOf } from './appPath';

const root = path.resolve('/opt/xantar/dist');

describe('resolveAppPath', () => {
  it('maps app URLs to files under the root', () => {
    expect(resolveAppPath('app://xantar/index.html', root)).toBe(path.join(root, 'index.html'));
    expect(resolveAppPath('app://xantar/music/tap-back.mp3', root)).toBe(
      path.join(root, 'music', 'tap-back.mp3')
    );
    expect(resolveAppPath('app://xantar/assets/a%20b.js?v=1#x', root)).toBe(
      path.join(root, 'assets', 'a b.js')
    );
  });

  it('serves index.html for the root path', () => {
    expect(resolveAppPath('app://xantar/', root)).toBe(path.join(root, 'index.html'));
    expect(resolveAppPath('app://xantar', root)).toBe(path.join(root, 'index.html'));
  });

  it('rejects paths that leave the root', () => {
    expect(resolveAppPath('app://xantar/../secret.txt', root)).toBe(path.join(root, 'secret.txt'));
    expect(resolveAppPath('app://xantar/%2e%2e/secret.txt', root)).toBe(
      path.join(root, 'secret.txt')
    );
    expect(resolveAppPath('app://xantar/..%2F..%2Fetc%2Fpasswd', root)).toBeNull();
    expect(resolveAppPath('app://xantar/assets%2F..%2F..%2Fsecret', root)).toBeNull();
    expect(resolveAppPath('app://xantar/%2Fetc%2Fpasswd', root)).toBe(
      path.join(root, 'etc', 'passwd')
    );
  });

  it('rejects other schemes, hosts and malformed paths', () => {
    expect(resolveAppPath('file:///etc/passwd', root)).toBeNull();
    expect(resolveAppPath('app://other/index.html', root)).toBeNull();
    expect(resolveAppPath('app://xantar/%E0%A4%A', root)).toBeNull();
    expect(resolveAppPath('app://xantar/a%00b', root)).toBeNull();
    expect(resolveAppPath('not a url', root)).toBeNull();
  });
});

describe('siteOf', () => {
  it('keeps the scheme and host, also for custom schemes', () => {
    expect(siteOf('app://xantar/index.html?theme=midnight')).toBe('app://xantar');
    expect(siteOf('http://localhost:5173/src/main.ts')).toBe('http://localhost:5173');
    expect(siteOf('https://example.com/')).toBe('https://example.com');
    expect(siteOf('nonsense')).toBeNull();
  });
});

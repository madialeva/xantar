import path from 'node:path';

export const APP_SCHEME = 'app';
export const APP_HOST = 'xantar';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
export const APP_URL = `${APP_ORIGIN}/index.html`;

const parse = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/**
 * The file under `root` that an `app://xantar/...` URL names, or `null` when the URL is not
 * of the app or its path leaves `root` (for example with `..` or an encoded separator).
 */
export function resolveAppPath(url: string, root: string): string | null {
  const parsed = parse(url);
  if (!parsed || parsed.protocol !== `${APP_SCHEME}:` || parsed.host !== APP_HOST) return null;
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  const relative = pathname === '/' || pathname === '' ? 'index.html' : `.${pathname}`;
  const base = path.resolve(root);
  const resolved = path.resolve(base, relative);
  const inside = path.relative(base, resolved);
  if (inside === '' || inside.startsWith('..') || path.isAbsolute(inside)) return null;
  return resolved;
}

/**
 * The scheme and host of a URL (`app://xantar`, `http://localhost:5173`). Unlike
 * `URL.origin`, it is not `null` for custom schemes.
 */
export function siteOf(url: string): string | null {
  const parsed = parse(url);
  return parsed ? `${parsed.protocol}//${parsed.host}` : null;
}

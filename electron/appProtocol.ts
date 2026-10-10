import { type Session, net, protocol } from 'electron';
import { pathToFileURL } from 'node:url';
import { APP_SCHEME, resolveAppPath } from './appPath';

/** Declares `app://` as a standard, secure scheme. Must run before the app is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }
  ]);
}

const notFound = (): Response => new Response('Not found', { status: 404 });

/** Serves the files of the compiled game under `root` through `app://` in a session. */
export function serveApp(root: string, session: Session): void {
  session.protocol.handle(APP_SCHEME, async (request) => {
    const file = resolveAppPath(request.url, root);
    if (!file) return notFound();
    try {
      return await net.fetch(pathToFileURL(file).toString());
    } catch {
      return notFound();
    }
  });
}

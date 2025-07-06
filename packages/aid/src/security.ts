import { AidError } from './parser.js';

/**
 * Enforce the cross-origin redirect rule (§3 Redirect Handling).
 * Performs a HEAD request with manual redirect handling. If the first
 * response is a 301/302/307/308 to a different origin the promise rejects
 * with `AidError('ERR_SECURITY')`.
 *
 * @param uri   Remote HTTPS URI from the AID record
 * @param timeout  Request timeout in ms (default 5000)
 */
export async function enforceRedirectPolicy(uri: string, timeout = 5000): Promise<void> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(uri, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    });

    const redirectStatuses = new Set([301, 302, 307, 308]);
    if (redirectStatuses.has(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new AidError('ERR_SECURITY', 'Redirect without Location header');
      }
      const target = new URL(location, uri);
      const source = new URL(uri);
      const sameOrigin =
        target.protocol === source.protocol &&
        target.hostname === source.hostname &&
        (target.port || defaultPort(target.protocol)) ===
          (source.port || defaultPort(source.protocol));

      if (!sameOrigin) {
        throw new AidError(
          'ERR_SECURITY',
          `Cross-origin redirect detected from ${source.origin} to ${target.origin}`,
        );
      }
    }
  } finally {
    clearTimeout(id);
  }
}

function defaultPort(protocol: string): string {
  if (protocol === 'https:') {
    return '443';
  }
  if (protocol === 'http:') {
    return '80';
  }
  return '';
}

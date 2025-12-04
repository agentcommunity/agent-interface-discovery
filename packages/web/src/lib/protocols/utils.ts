/**
 * Safely extract host from URI, handling non-URL schemes
 */
export function safeHostFromUri(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri.split('/')[0] || uri;
  }
}

/**
 * Check if a URI scheme is local (npx:, docker:, pip:, etc.)
 */
export function isLocalScheme(uri: string): boolean {
  return /^(npx|docker|pip|local):/i.test(uri);
}

/**
 * Check if a URI scheme is HTTPS/WSS
 */
export function isSecureScheme(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'https:' || url.protocol === 'wss:';
  } catch {
    return false;
  }
}

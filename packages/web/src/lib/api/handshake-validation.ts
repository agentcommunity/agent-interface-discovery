import { isLocalScheme } from '@/lib/protocols';
import type { ProtocolToken } from '@/lib/protocols';

export interface AuthCredentials {
  bearer?: string;
  basic?: string;
  apikey?: string;
}

export interface HandshakeRequestBody {
  uri: string;
  proto?: ProtocolToken;
  auth?: AuthCredentials;
  authHint?: string;
}

export type AuthType =
  | 'local_cli'
  | 'pat'
  | 'oauth2_device'
  | 'oauth2_code'
  | 'compliant'
  | 'generic';

export type ParseResult =
  | { ok: true; value: HandshakeRequestBody }
  | { ok: false; error: { success: false; error: string } };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export const parseHandshakeRequestBody = (payload: unknown): ParseResult => {
  if (!isObject(payload)) {
    return { ok: false, error: { success: false, error: 'Missing or invalid body' } };
  }

  const uri = toOptionalString(payload.uri);
  if (!uri) {
    return { ok: false, error: { success: false, error: 'Missing or invalid URI' } };
  }

  const auth = isObject(payload.auth)
    ? {
        bearer: toOptionalString(payload.auth.bearer),
        basic: toOptionalString(payload.auth.basic),
        apikey: toOptionalString(payload.auth.apikey),
      }
    : undefined;

  return {
    ok: true,
    value: {
      uri,
      proto: toOptionalString(payload.proto) as ProtocolToken | undefined,
      auth,
      authHint: toOptionalString(payload.authHint),
    },
  };
};

export const authTypeFromHint = (
  uri: string,
  authHint?: string,
  compliantAuth = false,
): AuthType => {
  if (isLocalScheme(uri)) {
    return 'local_cli';
  }
  if (authHint === 'pat') {
    return 'pat';
  }
  if (authHint === 'oauth2_device') {
    return 'oauth2_device';
  }
  if (authHint === 'oauth2_code') {
    return 'oauth2_code';
  }
  return compliantAuth ? 'compliant' : 'generic';
};

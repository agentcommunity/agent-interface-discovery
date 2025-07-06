import {
  type AidRecord,
  type RawAidRecord,
  type ErrorCode,
  SPEC_VERSION,
  PROTOCOL_TOKENS,
  AUTH_TOKENS,
  ERROR_MESSAGES,
  ERROR_CODES,
  LOCAL_URI_SCHEMES,
} from './constants.js';

/**
 * Custom error class for AID parsing and validation errors
 */
export class AidError extends Error {
  public readonly code: number;
  public readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message?: string) {
    super(message || ERROR_MESSAGES[errorCode]);
    this.name = 'AidError';
    this.code = ERROR_CODES[errorCode];
    this.errorCode = errorCode;
  }
}

/**
 * Parse a TXT record string into key-value pairs
 *
 * @param txtRecord - The TXT record string (semicolon-delimited key=value pairs)
 * @returns Raw parsed record object
 */
export function parseRawRecord(txtRecord: string): RawAidRecord {
  const record: RawAidRecord = {};

  // Split by semicolon and process each pair
  const pairs = txtRecord
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean);

  for (const pair of pairs) {
    const equalIndex = pair.indexOf('=');
    if (equalIndex === -1) {
      throw new AidError('ERR_INVALID_TXT', `Invalid key-value pair: ${pair}`);
    }

    const key = pair.slice(0, equalIndex).trim().toLowerCase();
    const value = pair.slice(equalIndex + 1).trim();

    if (!key || !value) {
      throw new AidError('ERR_INVALID_TXT', `Empty key or value in pair: ${pair}`);
    }

    // Handle known keys (case-insensitive)
    switch (key) {
      case 'v':
        record.v = value;
        break;
      case 'uri':
        record.uri = value;
        break;
      case 'proto':
        record.proto = value;
        break;
      case 'p':
        record.p = value;
        break;
      case 'auth':
        record.auth = value;
        break;
      case 'desc':
        record.desc = value;
        break;
      default:
        // Ignore unknown keys for forward compatibility
        break;
    }
  }

  return record;
}

/**
 * Validate a raw AID record and return a properly typed record
 *
 * @param rawRecord - The raw parsed record
 * @returns Validated AID record
 * @throws AidError if validation fails
 */
export function validateRecord(rawRecord: RawAidRecord): AidRecord {
  // Check required fields
  if (!rawRecord.v) {
    throw new AidError('ERR_INVALID_TXT', 'Missing required field: v');
  }

  if (!rawRecord.uri) {
    throw new AidError('ERR_INVALID_TXT', 'Missing required field: uri');
  }

  // Check protocol field (either 'proto' or 'p', but not both)
  if (rawRecord.proto && rawRecord.p) {
    throw new AidError('ERR_INVALID_TXT', 'Cannot specify both "proto" and "p" fields');
  }

  if (!rawRecord.proto && !rawRecord.p) {
    throw new AidError('ERR_INVALID_TXT', 'Missing required field: proto (or p)');
  }

  // Validate version
  if (rawRecord.v !== SPEC_VERSION) {
    throw new AidError(
      'ERR_INVALID_TXT',
      `Unsupported version: ${rawRecord.v}. Expected: ${SPEC_VERSION}`,
    );
  }

  // Get protocol value (prefer 'proto' over 'p')
  const protoValue = rawRecord.proto || rawRecord.p;
  if (!protoValue) {
    throw new AidError('ERR_INVALID_TXT', 'Missing protocol value');
  }

  // Validate protocol token
  if (!(protoValue in PROTOCOL_TOKENS)) {
    throw new AidError('ERR_UNSUPPORTED_PROTO', `Unsupported protocol: ${protoValue}`);
  }

  // Validate auth token if present
  if (rawRecord.auth && !(rawRecord.auth in AUTH_TOKENS)) {
    throw new AidError('ERR_INVALID_TXT', `Invalid auth token: ${rawRecord.auth}`);
  }

  // Validate description length (≤ 60 UTF-8 bytes)
  if (rawRecord.desc && new TextEncoder().encode(rawRecord.desc).length > 60) {
    throw new AidError('ERR_INVALID_TXT', 'Description field must be ≤ 60 UTF-8 bytes');
  }

  // URI validation based on protocol type
  if (protoValue === 'local') {
    // Local protocols MUST use a supported local scheme
    if (!isValidLocalUri(rawRecord.uri)) {
      throw new AidError(
        'ERR_INVALID_TXT',
        `Invalid URI scheme for local protocol. Must be one of: ${LOCAL_URI_SCHEMES.join(', ')}`,
      );
    }
  } else {
    // Remote protocols MUST use https://
    if (!rawRecord.uri.startsWith('https://')) {
      throw new AidError(
        'ERR_INVALID_TXT',
        `Invalid URI scheme for remote protocol '${protoValue}'. MUST be 'https:'.`,
      );
    }
    // And it must be a valid URL
    try {
      new URL(rawRecord.uri);
    } catch {
      throw new AidError('ERR_INVALID_TXT', `Invalid URI format: ${rawRecord.uri}`);
    }
  }

  // Return validated record
  return {
    v: rawRecord.v as 'aid1',
    uri: rawRecord.uri,
    proto: protoValue as keyof typeof PROTOCOL_TOKENS,
    ...(rawRecord.auth && { auth: rawRecord.auth as keyof typeof AUTH_TOKENS }),
    ...(rawRecord.desc && { desc: rawRecord.desc }),
  };
}

/**
 * Parse and validate a TXT record string
 *
 * @param txtRecord - The TXT record string
 * @returns Validated AID record
 * @throws AidError if parsing or validation fails
 */
export function parse(txtRecord: string): AidRecord {
  const rawRecord = parseRawRecord(txtRecord);
  return validateRecord(rawRecord);
}

/**
 * Check if a protocol token is valid
 *
 * @param token - The protocol token to check
 * @returns True if the token is valid
 */
export function isValidProto(token: string): boolean {
  return token in PROTOCOL_TOKENS;
}

/**
 * Validate URI for local protocol
 *
 * @param uri - The URI to validate for local protocol
 * @returns True if the URI scheme is allowed for local protocol
 */
function isValidLocalUri(uri: string): boolean {
  // Parse URI scheme manually since URL constructor doesn't support custom schemes
  const colonIndex = uri.indexOf(':');
  if (colonIndex === -1) {
    return false;
  }

  const scheme = uri.slice(0, colonIndex);
  return (LOCAL_URI_SCHEMES as readonly string[]).includes(scheme);
}

/**
 * Static validation methods for AidRecord
 */
export const AidRecordValidator = {
  /**
   * Validate a raw object as an AID record
   *
   * @param obj - Object to validate
   * @returns Validated AID record
   * @throws AidError if validation fails
   */
  validate: (obj: unknown): AidRecord => {
    if (typeof obj !== 'object' || obj === null) {
      throw new AidError('ERR_INVALID_TXT', 'Record must be an object');
    }

    return validateRecord(obj as RawAidRecord);
  },

  /**
   * Parse a TXT record string into an AID record
   *
   * @param txtRecord - The TXT record string
   * @returns Validated AID record
   * @throws AidError if parsing fails
   */
  parse: (txtRecord: string): AidRecord => {
    return parse(txtRecord);
  },
};

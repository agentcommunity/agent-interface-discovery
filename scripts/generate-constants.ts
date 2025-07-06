#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import path from 'node:path';
import { parse } from 'yaml';

/**
 * Code generation script for AID protocol constants
 *
 * This script reads protocol/constants.yml and generates TypeScript constants
 * for the @agentcommunity/aid package. It produces deterministic output by
 * sorting keys alphabetically to ensure stable git diffs.
 */

interface ErrorCode {
  code: number;
  description?: string;
  message?: string;
}

interface AidRecord {
  required: string[];
  optional: string[];
  aliases: Record<string, string>;
}

interface DnsConfig {
  subdomain: string;
  ttlRecommendation: {
    min: number;
    max: number;
  };
}

interface ProtocolConstants {
  schemaVersion: string;
  specVersion: string;
  protocolTokens: Record<string, string>;
  authTokens: Record<string, string>;
  errorCodes: Record<string, ErrorCode>;
  aidRecord: AidRecord;
  localUriSchemes: string[];
  dns: DnsConfig;
}

const GENERATED_WARNING = `/**
 * GENERATED FILE - DO NOT EDIT
 * 
 * This file is auto-generated from protocol/constants.yml by scripts/generate-constants.ts
 * To make changes, edit the YAML file and run: pnpm gen
 */`;

function generateTypeScriptConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  return `${GENERATED_WARNING}

// Specification version
export const SPEC_VERSION = '${constants.specVersion}' as const;

// Protocol tokens
${sortedProtocolTokens
  .map((token) => `export const PROTO_${token.toUpperCase()} = '${token}' as const;`)
  .join('\n')}

export const PROTOCOL_TOKENS = {
${sortedProtocolTokens.map((token) => `  ${token}: '${token}',`).join('\n')}
} as const;

export type ProtocolToken = keyof typeof PROTOCOL_TOKENS;

// Authentication tokens
${sortedAuthTokens
  .map((token) => `export const AUTH_${token.toUpperCase()} = '${token}' as const;`)
  .join('\n')}

export const AUTH_TOKENS = {
${sortedAuthTokens.map((token) => `  ${token}: '${token}',`).join('\n')}
} as const;

export type AuthToken = keyof typeof AUTH_TOKENS;

// Error codes
${sortedErrorCodes
  .map(
    (errorName) => `export const ${errorName} = ${constants.errorCodes[errorName].code} as const;`,
  )
  .join('\n')}

export const ERROR_CODES = {
${sortedErrorCodes
  .map((errorName) => `  ${errorName}: ${constants.errorCodes[errorName].code},`)
  .join('\n')}
} as const;

export const ERROR_MESSAGES = {
${sortedErrorCodes
  .map(
    (errorName) =>
      `  ${errorName}: '${constants.errorCodes[errorName].description ?? constants.errorCodes[errorName].message ?? ''}',`,
  )
  .join('\n')}
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// AID Record structure
export interface AidRecord {
  /** Version - must be "${constants.specVersion}" */
  v: "${constants.specVersion}";
  /** Absolute https:// URL or package URI */
  uri: string;
  /** Protocol token */
  proto: ProtocolToken;
  /** Authentication hint token (optional) */
  auth?: AuthToken;
  /** Human-readable description ≤ 60 UTF-8 bytes (optional) */
  desc?: string;
}

// Alternative record format with 'p' alias
export interface AidRecordWithAlias {
  /** Version - must be "${constants.specVersion}" */
  v: "${constants.specVersion}";
  /** Absolute https:// URL or package URI */
  uri: string;
  /** Protocol token (shorthand alias) */
  p: ProtocolToken;
  /** Authentication hint token (optional) */
  auth?: AuthToken;
  /** Human-readable description ≤ 60 UTF-8 bytes (optional) */
  desc?: string;
}

// Raw parsed record (before validation)
export interface RawAidRecord {
  v?: string;
  uri?: string;
  proto?: string;
  p?: string;
  auth?: string;
  desc?: string;
}

// DNS configuration
export const DNS_SUBDOMAIN = '${constants.dns.subdomain}' as const;
export const DNS_TTL_MIN = ${constants.dns.ttlRecommendation.min} as const;
export const DNS_TTL_MAX = ${constants.dns.ttlRecommendation.max} as const;

// Local URI schemes
export const LOCAL_URI_SCHEMES = [
${constants.localUriSchemes.map((scheme) => `  '${scheme}',`).join('\n')}
] as const;

export type LocalUriScheme = typeof LOCAL_URI_SCHEMES[number];

// Validation helpers
export const REQUIRED_FIELDS = [
${constants.aidRecord.required.map((field) => `  '${field}',`).join('\n')}
] as const;

export const OPTIONAL_FIELDS = [
${constants.aidRecord.optional.map((field) => `  '${field}',`).join('\n')}
] as const;

export const FIELD_ALIASES = {
${Object.entries(constants.aidRecord.aliases)
  .map(([alias, field]) => `  '${alias}': '${field}',`)
  .join('\n')}
} as const;
`;
}

function main() {
  try {
    // Read and parse YAML file
    const yamlPath = path.resolve(process.cwd(), 'protocol/constants.yml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    const constants = parse(yamlContent) as ProtocolConstants;

    // Generate TypeScript constants
    const tsContent = generateTypeScriptConstants(constants);

    // Write to the aid package constants file
    const outputPath = path.resolve(process.cwd(), 'packages/aid/src/constants.ts');
    writeFileSync(outputPath, tsContent);

    console.log('✅ Generated constants.ts from protocol/constants.yml');
    console.log(`   Output: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate constants:', error);
    process.exit(1);
  }
}

// Execute when run as a standalone script (tsx / node)
main();

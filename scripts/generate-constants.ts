#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'node:path';
import { parse } from 'yaml';
import prettier from 'prettier';
import { execSync } from 'child_process';

/**
 * Code generation script for AID protocol constants
 *
 * This script reads protocol/constants.yml and generates constants for all
 * supported languages: TypeScript, Python, and Go. It produces deterministic
 * output by sorting keys alphabetically to ensure stable git diffs.
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
  .map(([alias, field]) => `  ${alias}: '${field}',`)
  .join('\n')}
} as const;
`;
}

function generatePythonConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  const pythonWarning = `"""
GENERATED FILE - DO NOT EDIT

This file is auto-generated from protocol/constants.yml by scripts/generate-constants.ts
To make changes, edit the YAML file and run: pnpm gen
"""`;

  // Helper to escape quotes inside a Python string literal
  const escapePy = (str: string) => str.replace(/"/g, '\\"');

  return `${pythonWarning}
from __future__ import annotations

from typing import Final, Dict, List

# ---------------------------------------------------------------------------
# Version
# ---------------------------------------------------------------------------

SPEC_VERSION: Final[str] = "${constants.specVersion}"

# ---------------------------------------------------------------------------
# Protocol tokens
# ---------------------------------------------------------------------------
${sortedProtocolTokens
  .map((token) => `PROTO_${token.toUpperCase()}: Final[str] = "${token}"`)
  .join('\n')}

PROTOCOL_TOKENS: Final[Dict[str, str]] = {
${sortedProtocolTokens.map((token) => `    "${token}": "${token}",`).join('\n')}
}

# ---------------------------------------------------------------------------
# Auth tokens
# ---------------------------------------------------------------------------
${sortedAuthTokens
  .map((token) => `AUTH_${token.toUpperCase()}: Final[str] = "${token}"`)
  .join('\n')}

AUTH_TOKENS: Final[Dict[str, str]] = {
${sortedAuthTokens.map((token) => `    "${token}": "${token}",`).join('\n')}
}

# ---------------------------------------------------------------------------
# Error codes & messages
# ---------------------------------------------------------------------------
${sortedErrorCodes
  .map(
    (errorName) => `
${errorName}: Final[int] = ${constants.errorCodes[errorName].code}`,
  )
  .join('')}

ERROR_CODES: Final[Dict[str, int]] = {
${sortedErrorCodes.map((errorName) => `    "${errorName}": ${errorName},`).join('\n')}
}

ERROR_MESSAGES: Final[Dict[str, str]] = {
${sortedErrorCodes
  .map(
    (errorName) =>
      `    "${errorName}": "${escapePy(
        constants.errorCodes[errorName].description ??
          constants.errorCodes[errorName].message ??
          '',
      )}",`,
  )
  .join('\n')}
}

# ---------------------------------------------------------------------------
# Other spec constants
# ---------------------------------------------------------------------------

DNS_SUBDOMAIN: Final[str] = "${constants.dns.subdomain}"
DNS_TTL_MIN: Final[int] = ${constants.dns.ttlRecommendation.min}
DNS_TTL_MAX: Final[int] = ${constants.dns.ttlRecommendation.max}

LOCAL_URI_SCHEMES: Final[List[str]] = [
${constants.localUriSchemes.map((scheme) => `    "${scheme}",`).join('\n')}
]
`;
}

function generateGoConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  const goWarning = `// Code generated by scripts/generate-constants.ts; DO NOT EDIT.`;

  const toPascalCase = (s: string) =>
    s
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');

  return `${goWarning}

package aid

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

const SpecVersion = "${constants.specVersion}"

// ---------------------------------------------------------------------------
// Protocol tokens
// ---------------------------------------------------------------------------
const (
${sortedProtocolTokens
  .map((token) => `\t${toPascalCase(`PROTO_${token}`)} = "${token}"`)
  .join('\n')}
)

// ProtocolTokens maps protocol names to their string representation
var ProtocolTokens = map[string]string{
${sortedProtocolTokens.map((token) => `\t"${token}": "${token}",`).join('\n')}
}

// ---------------------------------------------------------------------------
// Auth tokens
// ---------------------------------------------------------------------------
const (
${sortedAuthTokens.map((token) => `\t${toPascalCase(`AUTH_${token}`)} = "${token}"`).join('\n')}
)

// AuthTokens maps auth token names to their string representation
var AuthTokens = map[string]string{
${sortedAuthTokens.map((token) => `\t"${token}": "${token}",`).join('\n')}
}

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
const (
${sortedErrorCodes
  .map((errorName) => `\t${toPascalCase(errorName)} = ${constants.errorCodes[errorName].code}`)
  .join('\n')}
)

// ErrorMessages maps error codes to their human-readable descriptions
var ErrorMessages = map[int]string{
${sortedErrorCodes
  .map(
    (errorName) =>
      `\t${toPascalCase(errorName)}: "${
        constants.errorCodes[errorName].description ?? constants.errorCodes[errorName].message ?? ''
      }",`,
  )
  .join('\n')}
}

// ---------------------------------------------------------------------------
// Other spec constants
// ---------------------------------------------------------------------------

const DnsSubdomain = "${constants.dns.subdomain}"
const DnsTtlMin = ${constants.dns.ttlRecommendation.min}
const DnsTtlMax = ${constants.dns.ttlRecommendation.max}

// LocalURISchemes contains the allowed URI schemes for local protocol
var LocalUriSchemes = []string{
${constants.localUriSchemes.map((scheme) => `\t"${scheme}",`).join('\n')}
}
`;
}

// -----------------------
// Rust generator (aid-rs)
// -----------------------
function generateRustConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  return (
    `// GENERATED FILE - DO NOT EDIT\n\n` +
    `// Auto-generated from protocol/constants.yml by scripts/generate-constants.ts\n` +
    `// Run 'pnpm gen' to regenerate.\n\n` +
    `pub const SPEC_VERSION: &str = "${constants.specVersion}";\n\n` +
    `// Protocol tokens\n` +
    sortedProtocolTokens
      .map((t) => `pub const PROTO_${t.toUpperCase()}: &str = "${t}";`)
      .join('\n') +
    `\n\n` +
    `// Auth tokens\n` +
    sortedAuthTokens.map((t) => `pub const AUTH_${t.toUpperCase()}: &str = "${t}";`).join('\n') +
    `\n\n` +
    `// Error codes\n` +
    sortedErrorCodes
      .map((e) => `pub const ${e}: u16 = ${constants.errorCodes[e].code};`)
      .join('\n') +
    `\n\n` +
    `pub const DNS_SUBDOMAIN: &str = "${constants.dns.subdomain}";\n` +
    `pub const DNS_TTL_MIN: u32 = ${constants.dns.ttlRecommendation.min};\n` +
    `pub const DNS_TTL_MAX: u32 = ${constants.dns.ttlRecommendation.max};\n\n` +
    `pub const LOCAL_URI_SCHEMES: &[&str] = &[${constants.localUriSchemes
      .map((s) => `"${s}"`)
      .join(', ')}];\n`
  );
}

// ---------------------------
// .NET generator (aid-dotnet)
// ---------------------------
function generateDotnetConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  return (
    `// <auto-generated>\n// GENERATED FILE - DO NOT EDIT\n// </auto-generated>\n\n` +
    `namespace AidDiscovery {\n` +
    `  public static class Constants {\n` +
    `    public const string SpecVersion = "${constants.specVersion}";\n` +
    sortedProtocolTokens
      .map((t) => `    public const string PROTO_${t.toUpperCase()} = "${t}";`)
      .join('\n') +
    `\n` +
    sortedAuthTokens
      .map((t) => `    public const string AUTH_${t.toUpperCase()} = "${t}";`)
      .join('\n') +
    `\n` +
    sortedErrorCodes
      .map((e) => `    public const int ${e} = ${constants.errorCodes[e].code};`)
      .join('\n') +
    `\n` +
    `    public const string DnsSubdomain = "${constants.dns.subdomain}";\n` +
    `    public const int DnsTtlMin = ${constants.dns.ttlRecommendation.min};\n` +
    `    public const int DnsTtlMax = ${constants.dns.ttlRecommendation.max};\n` +
    `    public static readonly string[] LocalUriSchemes = new string[] { ${constants.localUriSchemes
      .map((s) => `"${s}"`)
      .join(', ')} };\n` +
    `  }\n}`
  );
}

// ------------------------
// Java generator (aid-java)
// ------------------------
function generateJavaConstants(constants: ProtocolConstants): string {
  const sortedProtocolTokens = Object.keys(constants.protocolTokens).sort();
  const sortedAuthTokens = Object.keys(constants.authTokens).sort();
  const sortedErrorCodes = Object.keys(constants.errorCodes).sort();

  return (
    `// GENERATED FILE - DO NOT EDIT\n` +
    `package org.agentcommunity.aid;\n\n` +
    `public final class Constants {\n` +
    `  private Constants() {}\n` +
    `  public static final String SPEC_VERSION = "${constants.specVersion}";\n` +
    sortedProtocolTokens
      .map((t) => `  public static final String PROTO_${t.toUpperCase()} = "${t}";`)
      .join('\n') +
    `\n` +
    sortedAuthTokens
      .map((t) => `  public static final String AUTH_${t.toUpperCase()} = "${t}";`)
      .join('\n') +
    `\n` +
    sortedErrorCodes
      .map((e) => `  public static final int ${e} = ${constants.errorCodes[e].code};`)
      .join('\n') +
    `\n` +
    `  public static final String DNS_SUBDOMAIN = "${constants.dns.subdomain}";\n` +
    `  public static final int DNS_TTL_MIN = ${constants.dns.ttlRecommendation.min};\n` +
    `  public static final int DNS_TTL_MAX = ${constants.dns.ttlRecommendation.max};\n` +
    `  public static final String[] LOCAL_URI_SCHEMES = new String[] {${constants.localUriSchemes
      .map((s) => `"${s}"`)
      .join(', ')} };\n` +
    `}`
  );
}

// --- Top-level script execution ---

try {
  // Read and parse YAML file
  const yamlPath = path.resolve(process.cwd(), 'protocol/constants.yml');
  const yamlContent = readFileSync(yamlPath, 'utf8');
  const constants = parse(yamlContent) as ProtocolConstants;

  // Generate TypeScript constants
  const tsContent = generateTypeScriptConstants(constants);

  // Write to the aid package constants file (formatted with Prettier)
  const tsOutputPath = path.resolve(process.cwd(), 'packages/aid/src/constants.ts');

  // Use project's prettier configuration for consistency
  const prettierOptions = await prettier.resolveConfig(process.cwd());
  const tsFormatted = await prettier.format(tsContent, {
    // Use project's prettier config with explicit fallbacks
    semi: prettierOptions?.semi ?? true,
    singleQuote: prettierOptions?.singleQuote ?? true,
    trailingComma: (prettierOptions?.trailingComma as 'all' | 'es5' | 'none') ?? 'all',
    printWidth: prettierOptions?.printWidth ?? 100,
    parser: 'typescript',
  });

  writeFileSync(tsOutputPath, tsFormatted);

  console.log('✅ Generated constants.ts from protocol/constants.yml');
  console.log(`   Output: ${tsOutputPath}`);

  // Generate Python constants
  const pyContent = generatePythonConstants(constants);
  const pyOutputPath = path.resolve(process.cwd(), 'packages/aid-py/aid_py/constants.py');

  writeFileSync(pyOutputPath, pyContent);
  console.log('✅ Generated constants.py from protocol/constants.yml');
  console.log(`   Output: ${pyOutputPath}`);

  // Generate Go constants
  const goContent = generateGoConstants(constants);
  const goOutputPath = path.resolve(process.cwd(), 'packages/aid-go/constants_gen.go');

  writeFileSync(goOutputPath, goContent);

  // Format Go code using gofmt
  try {
    execSync(`gofmt -w "${goOutputPath}"`, { stdio: 'pipe' });
    console.log('✅ Generated constants_gen.go from protocol/constants.yml');
    console.log(`   Output: ${goOutputPath}`);
  } catch (gofmtError) {
    console.warn('⚠️  Generated Go constants but gofmt failed:', gofmtError);
    console.log('✅ Generated constants_gen.go from protocol/constants.yml (unformatted)');
    console.log(`   Output: ${goOutputPath}`);
  }

  // Generate Rust constants (if crate path exists)
  try {
    const rsDir = path.resolve(process.cwd(), 'packages/aid-rs/src');
    if (existsSync(rsDir)) {
      const rsContent = generateRustConstants(constants);
      const rsOutputPath = path.resolve(rsDir, 'constants_gen.rs');
      writeFileSync(rsOutputPath, rsContent);
      try {
        execSync(`rustfmt "${rsOutputPath}"`, { stdio: 'pipe' });
      } catch {
        // ignore formatter errors in environments without rustfmt
      }
      console.log('✅ Generated constants_gen.rs from protocol/constants.yml');
      console.log(`   Output: ${rsOutputPath}`);
    } else {
      console.warn('ℹ️ Skipped Rust generation (packages/aid-rs not present).');
    }
  } catch (e) {
    console.warn('ℹ️ Skipped Rust generation due to error.', e);
  }

  // Generate .NET constants (if project path exists)
  try {
    const csDir = path.resolve(process.cwd(), 'packages/aid-dotnet/src');
    if (existsSync(csDir)) {
      const csContent = generateDotnetConstants(constants);
      const csOutputPath = path.resolve(csDir, 'Constants.g.cs');
      writeFileSync(csOutputPath, csContent);
      console.log('✅ Generated Constants.g.cs from protocol/constants.yml');
      console.log(`   Output: ${csOutputPath}`);
    } else {
      console.warn('ℹ️ Skipped .NET generation (packages/aid-dotnet not present).');
    }
  } catch (e) {
    console.warn('ℹ️ Skipped .NET generation due to error.', e);
  }

  // Generate Java constants (if package path exists)
  try {
    const javaDir = path.resolve(
      process.cwd(),
      'packages/aid-java/src/main/java/org/agentcommunity/aid',
    );
    if (existsSync(javaDir)) {
      const javaContent = generateJavaConstants(constants);
      const javaOutputPath = path.resolve(javaDir, 'Constants.java');
      // Ensure directory exists in case path partially exists
      mkdirSync(javaDir, { recursive: true });
      writeFileSync(javaOutputPath, javaContent);
      console.log('✅ Generated Constants.java from protocol/constants.yml');
      console.log(`   Output: ${javaOutputPath}`);
    } else {
      console.warn('ℹ️ Skipped Java generation (packages/aid-java not present).');
    }
  } catch (e) {
    console.warn('ℹ️ Skipped Java generation due to error.', e);
  }
} catch (error) {
  console.error('❌ Failed to generate constants:', error);
  process.exit(1);
}

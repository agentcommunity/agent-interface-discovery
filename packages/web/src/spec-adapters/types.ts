// Canonical, UI/engine-facing types that remain stable even as the spec evolves.

export interface CanonicalRecord {
  uri: string;
  proto: string;
  host: string;
  port: number;
  desc?: string;
  auth?: unknown;
  extra?: Record<string, unknown>;
}

export interface CanonicalCapability {
  id: string;
  type: 'tool' | 'resource';
  name?: string;
  description?: string;
  extra?: Record<string, unknown>;
}

export interface CanonicalHandshake {
  protocolVersion: string;
  serverInfo: { name: string; version: string };
  capabilities: CanonicalCapability[];
  extra?: Record<string, unknown>;
}

export interface CanonicalError {
  code?: string | number;
  message: string;
  details?: unknown;
}

export interface SpecAdapter {
  normalizeRecord: (raw: unknown) => CanonicalRecord | null;
  normalizeHandshake: (raw: unknown) => CanonicalHandshake | null;
  normalizeError: (raw: unknown) => CanonicalError;
}

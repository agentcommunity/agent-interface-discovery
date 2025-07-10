import type { ReactNode } from 'react';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';
export type { DiscoveryResult } from '@/hooks/use-discovery';
export type { HandshakeResult } from '@/hooks/use-connection';

// Defines the two tools our agent can call
export type ToolId = 'discovery' | 'connection';

// A type to hold the results of all tool calls for context
export interface ToolResults {
  discovery?: DiscoveryResult;
  connection?: HandshakeResult;
}

// Defines a single step in our conversation script
export type ScriptStep =
  | {
      type: 'narrative';
      content: (results: ToolResults, domain: string) => string;
    }
  | { type: 'tool_call'; toolId: ToolId };

// The main interface defining the structure of a tool manifest
export interface ToolManifest {
  id: string;
  label: string;
  icon: ReactNode | string;
  /**
   * Legacy script field. Will be removed once all manifests adopt the simplified
   * narrative string structure. Marked optional to ease migration.
   */
  script?: ScriptStep[];
  mockDiscoveryResult?: (domain: string) => DiscoveryResult;
  mockHandshakeResult?: (domain: string) => HandshakeResult;
}

// ---------------------------------------------------------------------------
// New, simplified manifest shape (demo-only)
// ---------------------------------------------------------------------------

export interface ScenarioManifest {
  id: string;
  label: string;
  icon: string;
  narrative1: string;
  narrative2?: string;
  narrative3?: string;
  discovery?: unknown;
  handshake?: unknown;
  /** When true, use live datasource instead of mock even though scenario exists. */
  live?: boolean;
}

// Enhanced capabilities interface for better tool descriptions
export interface EnhancedCapability {
  id: string;
  type: 'tool' | 'resource';
  name?: string;
  description?: string;
}

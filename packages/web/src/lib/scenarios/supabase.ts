import type { ScenarioManifest } from '@/lib/tool-manifest-types';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';

const discoveryFail: DiscoveryResult = {
  ok: false,
  error: new Error('No _agent TXT record found.'),
};

const handshakeSkip: HandshakeResult = {
  ok: false,
  error: new Error('Connection not attempted - discovery failed.'),
};

export const supabaseScenario: ScenarioManifest = {
  id: 'supabase',
  label: 'Supabase',
  icon: '⚡',
  narrative1:
    "I'm checking {domain} to see if there's a Supabase agent available for database operations…",
  narrative2: 'Discovery failed: **{error}**',
  discovery: discoveryFail,
  handshake: handshakeSkip,
};

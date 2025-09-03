// Re-export scenario manifests under the legacy name expected by existing code.
import type { ScenarioManifest } from './tool-manifest-types';

export const toolManifests: Record<string, ScenarioManifest> = {
  'example.com': {
    id: 'default-live',
    label: 'Live discovery',
    icon: '🛰️',
    narrative1: 'Starting discovery for {domain}…',
    narrative2: 'Found agent: {desc} ({protocol}) at {uri}',
    narrative3: 'Handshake complete. {capCount} capabilities available.',
    live: true,
  },
};

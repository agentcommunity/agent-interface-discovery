// Re-export scenario manifests under the legacy name expected by existing code.
import { scenarios } from './scenarios';
import type { ScenarioManifest } from './tool-manifest-types';

export const toolManifests: Record<string, ScenarioManifest> = scenarios;

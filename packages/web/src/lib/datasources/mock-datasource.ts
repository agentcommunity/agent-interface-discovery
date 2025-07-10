import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';
import { toolManifests } from '@/lib/tool-manifest-data';
import type { ScenarioManifest } from '@/lib/tool-manifest-types';
import type { Datasource } from './types';

/**
 * Mock datasource reads from tool manifests to provide deterministic responses
 * without performing any real network operations.  Useful for Storybook demos
 * and local development.
 */
export class MockDatasource implements Datasource {
  constructor(private readonly domain: string) {}

  private get manifest(): ScenarioManifest {
    return toolManifests[this.domain] || toolManifests['default-failure'];
  }

  discover(_domain: string): Promise<DiscoveryResult> {
    const manifest = this.manifest;
    if (typeof manifest.discovery === 'function') {
      return Promise.resolve(
        (manifest.discovery as (domain: string) => DiscoveryResult)(this.domain),
      );
    }
    return Promise.resolve(manifest.discovery as DiscoveryResult);
  }

  handshake(uri: string): Promise<HandshakeResult> {
    const manifest = this.manifest;
    if (typeof manifest.handshake === 'function') {
      return Promise.resolve((manifest.handshake as (uri: string) => HandshakeResult)(uri));
    }
    return Promise.resolve(manifest.handshake as HandshakeResult);
  }
}

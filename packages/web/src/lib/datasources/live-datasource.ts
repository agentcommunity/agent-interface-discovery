import { discover } from '@agentcommunity/aid/browser';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult, HandshakeSuccessData } from '@/hooks/use-connection';
import type { Datasource } from './types';

/**
 * Concrete datasource that executes real network operations.
 */
export class LiveDatasource implements Datasource {
  async discover(domain: string): Promise<DiscoveryResult> {
    const startTime = Date.now();
    try {
      const libResult = await discover(domain);
      const lookupTime = Date.now() - startTime;

      const resultUri = new URL(libResult.record.uri);
      const reconstructedTxt = Object.entries(libResult.record)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');

      const ok: DiscoveryResult = {
        ok: true,
        value: {
          record: {
            ...libResult.record,
            host: resultUri.hostname,
            port: resultUri.port ? Number.parseInt(resultUri.port, 10) : 443,
          },
          metadata: {
            dnsQuery: libResult.queryName,
            lookupTime,
            recordType: 'TXT',
            source: 'DNS-over-HTTPS',
            txtRecord: reconstructedTxt,
          },
        },
      };

      return ok;
    } catch (error_) {
      const error: Error = error_ instanceof Error ? error_ : new Error('Unknown discovery error');
      const fail: DiscoveryResult = { ok: false, error };
      return fail;
    }
  }

  async handshake(
    uri: string,
    { authBearer }: { authBearer?: string } = {},
  ): Promise<HandshakeResult> {
    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, ...(authBearer ? { auth: { bearer: authBearer } } : {}) }),
      });

      const json = (await response.json()) as unknown;
      const raw = json as {
        success: boolean;
        needsAuth?: boolean;
        compliantAuth?: boolean;
        metadataUri?: string;
        metadata?: unknown;
        data?: HandshakeSuccessData;
        error?: string;
      };

      if (raw.success && raw.data) {
        return { ok: true, value: raw.data };
      }

      if (raw.needsAuth) {
        const connectionModule = await import('@/hooks/use-connection');
        return {
          ok: false,
          error: new connectionModule.AuthRequiredError(
            'Authentication required',
            raw.compliantAuth,
            raw.metadataUri,
            raw.metadata,
          ),
        } as HandshakeResult;
      }

      return { ok: false, error: new Error(raw.error || 'Handshake failed') };
    } catch (error_) {
      const error: Error = error_ instanceof Error ? error_ : new Error('Network request failed');
      return { ok: false, error };
    }
  }
}

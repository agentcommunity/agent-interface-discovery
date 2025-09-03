import tls from 'node:tls';
import { URL } from 'node:url';

export interface TlsInspection {
  host: string;
  sni: string;
  issuer: string | null;
  san: string[] | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
}

export async function inspectTls(uri: string, timeoutMs = 5000): Promise<TlsInspection> {
  const u = new URL(uri);
  const host = u.hostname;
  const port = u.port ? Number(u.port) : 443;

  return await new Promise<TlsInspection>((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        timeout: timeoutMs,
        rejectUnauthorized: true,
      },
      () => {
        const peer = socket.getPeerCertificate(true) as unknown as {
          issuer?: { CN?: string; commonName?: string };
          subjectaltname?: string;
          valid_from?: string;
          valid_to?: string;
        };
        const issuer = peer?.issuer?.CN || peer?.issuer?.commonName || null;
        const san: string[] | null =
          typeof peer?.subjectaltname === 'string'
            ? peer.subjectaltname
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : null;
        const validFrom = peer?.valid_from ? new Date(peer.valid_from).toISOString() : null;
        const validTo = peer?.valid_to ? new Date(peer.valid_to).toISOString() : null;
        let daysRemaining: number | null = null;
        if (validTo) {
          const ms = new Date(validTo).getTime() - Date.now();
          daysRemaining = Math.floor(ms / (24 * 3600 * 1000));
        }
        resolve({ host, sni: host, issuer, san, validFrom, validTo, daysRemaining });
        socket.end();
      },
    );
    socket.on('error', (err) => reject(err));
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('TLS timeout'));
    });
  });
}

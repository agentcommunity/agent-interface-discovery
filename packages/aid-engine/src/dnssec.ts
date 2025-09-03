export interface DnssecProbeResult {
  present: boolean;
  method: 'RRSIG';
  proof: unknown | null;
}

interface DoHResponse {
  Status: number;
  Answer?: Array<{ name: string; type: number; TTL: number; data: string }>;
}

export async function probeDnssecRrsigTxt(
  name: string,
  doh = 'https://cloudflare-dns.com/dns-query',
  timeoutMs = 5000,
): Promise<DnssecProbeResult> {
  const url = new URL(doh);
  url.searchParams.set('name', name);
  url.searchParams.set('type', 'RRSIG');

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    if (!res.ok) return { present: false, method: 'RRSIG', proof: null };
    const json = (await res.json()) as DoHResponse;
    const answers = json.Answer ?? [];
    const hasRrsig = answers.some((a) => a.type === 46);
    return { present: hasRrsig, method: 'RRSIG', proof: hasRrsig ? answers : null };
  } catch {
    return { present: false, method: 'RRSIG', proof: null };
  } finally {
    clearTimeout(id);
  }
}

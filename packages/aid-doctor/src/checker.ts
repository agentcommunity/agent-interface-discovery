import { AidError, enforceRedirectPolicy } from '@agentcommunity/aid';
import type { DoctorReport, CheckOptions, ProbeAttempt } from './types';
import { runBaseDiscovery } from './dns';
import { inspectTls } from './tls_inspect';
import { probeDnssecRrsigTxt } from './dnssec';
import { loadCache, saveCache } from './cache';

function initReport(domain: string, protocol?: string): DoctorReport {
  return {
    domain,
    queried: {
      strategy: 'base-first',
      hint: { proto: protocol, source: 'cli', present: Boolean(protocol) },
      attempts: [],
      wellKnown: {
        attempted: false,
        used: false,
        url: null,
        httpStatus: null,
        contentType: null,
        byteLength: null,
        status: null,
        snippet: null,
      },
    },
    record: { raw: null, parsed: null, valid: false, warnings: [], errors: [] },
    dnssec: { present: false, method: 'RRSIG', proof: null },
    tls: {
      checked: false,
      valid: null,
      host: null,
      sni: null,
      issuer: null,
      san: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      redirectBlocked: null,
    },
    pka: {
      present: false,
      attempted: false,
      verified: null,
      kid: null,
      alg: null,
      createdSkewSec: null,
      covered: null,
    },
    downgrade: { checked: false, previous: null, status: null },
    exitCode: 1,
  };
}

export async function runCheck(domain: string, opts: CheckOptions): Promise<DoctorReport> {
  const report = initReport(domain, opts.protocol);
  const dnsRes = await runBaseDiscovery(domain, {
    protocol: opts.protocol,
    timeoutMs: opts.timeoutMs,
    allowFallback: opts.allowFallback,
    wellKnownTimeoutMs: opts.wellKnownTimeoutMs,
  });

  // Record attempt for base name (we can't easily get the exact attempted names from the SDK in one call)
  // We at least capture the final query target below when successful.

  if (!dnsRes.ok) {
    // Failure path from SDK; map exit code
    const err = dnsRes.error as AidError;
    report.exitCode = err.code;
    report.record.errors.push({ code: err.errorCode, message: err.message });
    return report;
  }

  const value = dnsRes.value!;
  const queryName = value.queryName;
  const attempt: ProbeAttempt = {
    name: queryName,
    type: 'TXT',
    result: 'NOERROR',
    ttl: value.ttl,
  };
  report.queried.attempts.push(attempt);

  // Fill record
  const record = value.record;
  report.record.parsed = record;
  report.record.valid = true;
  report.record.raw = (() => {
    // For DNS, we don't receive raw concatenated string from SDK; synthesize minimal
    // to enable byte warnings based on a canonicalized render.
    const parts: string[] = ['v=aid1'];
    if (record.uri) parts.push(`u=${record.uri}`);
    if (record.proto) parts.push(`p=${record.proto}`);
    if (record.auth) parts.push(`a=${record.auth}`);
    if (record.desc) parts.push(`s=${record.desc}`);
    if (record.docs) parts.push(`d=${record.docs}`);
    if (record.dep) parts.push(`e=${record.dep}`);
    if (record.pka) parts.push(`k=${record.pka}`);
    if (record.kid) parts.push(`i=${record.kid}`);
    return parts.join(';');
  })();

  // Byte length warning
  const byteLen = new TextEncoder().encode(report.record.raw).length;
  if (byteLen > 255) {
    report.record.warnings.push({
      code: 'BYTE_LIMIT',
      message: `Record is ${byteLen} bytes (should be ≤ 255). Consider aliases and shortening desc`,
    });
  }

  // TLS redirect policy (minimal for M1; full TLS module to be added M2)
  const skipSecurity =
    typeof process !== 'undefined' && process.env && process.env.AID_SKIP_SECURITY === '1';
  if (!skipSecurity && record.proto !== 'local' && record.proto !== 'zeroconf') {
    try {
      await enforceRedirectPolicy(record.uri, opts.timeoutMs);
      const tlsInfo = await inspectTls(record.uri, opts.timeoutMs);
      report.tls.checked = true;
      report.tls.valid = true;
      report.tls.host = tlsInfo.host;
      report.tls.sni = tlsInfo.sni;
      report.tls.issuer = tlsInfo.issuer;
      report.tls.san = tlsInfo.san;
      report.tls.validFrom = tlsInfo.validFrom;
      report.tls.validTo = tlsInfo.validTo;
      report.tls.daysRemaining = tlsInfo.daysRemaining;
    } catch (e) {
      const err = e as AidError;
      report.tls.checked = true;
      report.tls.valid = false;
      report.record.errors.push({ code: err.errorCode ?? 'ERR_SECURITY', message: err.message });
      report.exitCode = err.code ?? 1003;
      return report;
    }
  }

  // DNSSEC presence probe (best-effort)
  try {
    const r = await probeDnssecRrsigTxt(value.queryName);
    report.dnssec.present = r.present;
    report.dnssec.proof = r.proof;
  } catch {
    // ignore
  }

  // PKA presence (handshake can be enabled in future if exported by SDK)
  if (record.pka && record.kid) {
    report.pka.present = true;
    report.pka.kid = record.kid;
    report.pka.alg = 'ed25519';
    report.pka.verified = null;
  }

  // Success
  // Downgrade cache logic
  try {
    const cache = await loadCache();
    const prev = cache[domain];
    report.downgrade.checked = true;
    if (prev) {
      report.downgrade.previous = { pka: prev.pka, kid: prev.kid };
      const nowPka = record.pka ?? null;
      const nowKid = record.kid ?? null;
      if (prev.pka && !nowPka) {
        report.downgrade.status = 'downgrade';
        report.record.warnings.push({
          code: 'DOWNGRADE',
          message: 'Security downgrade detected: pka removed',
        });
      } else if (prev.pka && nowPka && prev.pka !== nowPka) {
        report.downgrade.status = 'downgrade';
        report.record.warnings.push({
          code: 'DOWNGRADE',
          message: 'Security downgrade detected: pka changed',
        });
      } else if (prev.kid && nowKid && prev.kid !== nowKid) {
        report.downgrade.status = 'downgrade';
        report.record.warnings.push({
          code: 'DOWNGRADE',
          message: 'Security downgrade detected: kid changed',
        });
      } else {
        report.downgrade.status = 'no_change';
      }
    } else {
      report.downgrade.status = 'first_seen';
    }
    // Save current
    cache[domain] = {
      lastSeen: new Date().toISOString(),
      pka: record.pka ?? null,
      kid: record.kid ?? null,
    };
    await saveCache(cache);
  } catch {
    // ignore cache errors
  }

  report.exitCode = 0;
  return report;
}

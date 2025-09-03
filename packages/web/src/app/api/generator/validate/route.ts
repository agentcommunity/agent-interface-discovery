import { NextResponse } from 'next/server'
import { buildTxtRecordVariant } from '@agentcommunity/aid-engine'
import type { AuthToken } from '@agentcommunity/aid'

export const runtime = 'nodejs'

interface Body {
  domain: string
  uri: string
  proto: string
  auth: string
  desc: string
  docs?: string
  dep?: string
  pka?: string
  kid?: string
  useAliases?: boolean
}

export async function POST(request: Request) {
  const parsed = (await request.json()) as Partial<Body>
  const data = normalize(parsed)
  const errors: Array<{ code: string; message: string }> = []
  const warnings: Array<{ code: string; message: string }> = []

  // Basic field checks
  if (!data.domain || !isValidDomain(data.domain)) errors.push({ code: 'ERR_DOMAIN', message: 'Invalid domain' })
  if (!data.uri) errors.push({ code: 'ERR_URI', message: 'URI is required' })
  if (!data.proto) errors.push({ code: 'ERR_PROTO', message: 'Protocol is required' })

  const descBytes = new TextEncoder().encode(data.desc || '').length
  if (descBytes > 60) errors.push({ code: 'ERR_DESC_BYTES', message: 'Description exceeds 60 bytes' })

  if (data.docs && !data.docs.startsWith('https://')) errors.push({ code: 'ERR_DOCS_HTTPS', message: 'Docs must use https://' })
  if (data.dep && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(data.dep)) errors.push({ code: 'ERR_DEP_ISO', message: 'Dep must be ISO 8601 UTC Z' })
  if (data.pka && !data.kid) errors.push({ code: 'ERR_KID_REQUIRED', message: 'Key ID (rotation) is required when PKA is present' })
  if (data.kid && !/^[a-z0-9]{1,6}$/.test(data.kid)) errors.push({ code: 'ERR_KID_FORMAT', message: 'Key ID must be 1–6 chars [a-z0-9]' })

  // Validate and narrow auth to valid tokens
  const validAuthTokens = ['apikey', 'basic', 'custom', 'mtls', 'none', 'oauth2_code', 'oauth2_device', 'pat', ''] as const
  const authValue = validAuthTokens.includes(data.auth as AuthToken | '') ? data.auth as AuthToken | '' : ''

  // Build TXT using engine (aliases preferred if smaller)
  const engineData = {
    domain: data.domain,
    uri: data.uri,
    // Narrow proto to the engine type
    proto: data.proto as 'mcp' | 'a2a' | 'openapi' | 'grpc' | 'graphql' | 'websocket' | 'local' | 'zeroconf',
    auth: authValue,
    desc: data.desc || '',
    docs: data.docs || undefined,
    dep: data.dep || undefined,
    pka: data.pka || undefined,
    kid: data.kid || undefined,
  }
  const fullTxt = buildTxtRecordVariant(engineData, false)
  const aliasTxt = buildTxtRecordVariant(engineData, true)
  const txt = data.useAliases ? aliasTxt : fullTxt
  const txtBytes = new TextEncoder().encode(txt).length
  const fullBytes = new TextEncoder().encode(fullTxt).length
  const aliasBytes = new TextEncoder().encode(aliasTxt).length
  if (txtBytes > 255) warnings.push({ code: 'WARN_TXT_BYTES', message: 'TXT record exceeds 255 bytes' })

  // Optionally run a quick engine discovery sanity (domain only)
  // This checks proto/URI scheme indirectly once the record is published; skip heavy network here.

  const response = {
    success: errors.length === 0,
    txt,
    json: {
      v: 'aid1',
      u: data.uri || undefined,
      p: data.proto || undefined,
      a: data.auth || undefined,
      s: data.desc || undefined,
      d: data.docs || undefined,
      e: data.dep || undefined,
      k: data.pka || undefined,
      i: data.kid || undefined,
    },
    bytes: { txt: txtBytes, desc: descBytes },
    errors,
    warnings,
    suggestAliases: aliasBytes <= fullBytes,
  }

  return NextResponse.json(response)
}

function normalize(b: Partial<Body>): Body {
  return {
    domain: (b.domain || '').trim(),
    uri: (b.uri || '').trim(),
    proto: (b.proto || '').trim(),
    auth: (b.auth || '').trim(),
    desc: b.desc || '',
    docs: (b.docs || '').trim() || undefined,
    dep: (b.dep || '').trim() || undefined,
    pka: (b.pka || '').trim() || undefined,
    kid: (b.kid || '').trim() || undefined,
    useAliases: Boolean(b.useAliases),
  }
}

function isValidDomain(domain: string): boolean {
  try {
    // Force hostname parse
    const url = new URL(`https://${domain}`)
    if (!url.hostname || url.hostname.includes('..')) return false
    // Basic label rules
    return url.hostname.split('.').every((label) => label.length > 0 && label.length <= 63)
  } catch {
    return false
  }
}



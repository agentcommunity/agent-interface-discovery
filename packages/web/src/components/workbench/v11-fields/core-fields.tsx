'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'

export interface CoreFieldsProps {
  proto: string
  auth: string
  uri: string
  domain: string
  onChange: (patch: Partial<{ proto: string; auth: string; uri: string; domain: string }>) => void
}

const PROTOCOLS = ['mcp', 'a2a', 'ucp', 'openapi', 'grpc', 'graphql', 'websocket', 'local', 'zeroconf']

export function CoreFields({ proto, auth, uri, domain, onChange }: CoreFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Protocol</label>
        <ToggleGroup
          type="single"
          className="mt-2 flex flex-wrap gap-2"
          value={proto}
          onValueChange={(v) => onChange({ proto: v })}
        >
          {PROTOCOLS.map((p) => (
            <ToggleGroupItem key={p} value={p} className="text-left capitalize">
              {p.toUpperCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Authentication</label>
        <ToggleGroup
          type="single"
          className="mt-2 flex flex-wrap gap-2"
          value={auth}
          onValueChange={(v) => onChange({ auth: v })}
        >
          {['', 'pat', 'apikey', 'basic', 'oauth2_device', 'oauth2_code', 'mtls', 'custom'].map((a) => (
            <ToggleGroupItem key={a || 'none'} value={a} className="capitalize">
              {a || 'none'}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">URI</label>
        <Input value={uri} onChange={(e) => onChange({ uri: e.target.value })} placeholder="https://…" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Domain</label>
        <Input value={domain} onChange={(e) => onChange({ domain: e.target.value })} placeholder="example.com" />
      </div>
    </div>
  )
}



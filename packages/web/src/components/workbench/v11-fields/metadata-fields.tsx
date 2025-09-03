'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DepPicker } from '@/components/ui/dep-picker'

export interface MetadataFieldsProps {
  desc: string
  docs?: string
  dep?: string
  descBytes: number
  onChange: (patch: Partial<{ desc: string; docs?: string; dep?: string }>) => void
}

export function MetadataFields({ desc, docs, dep, descBytes, onChange }: MetadataFieldsProps) {
  const tooLong = descBytes > 60
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Description
          <span className={`ml-2 text-xs ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>{descBytes}/60 bytes</span>
        </label>
        <Textarea value={desc} onChange={(e) => onChange({ desc: e.target.value })} placeholder="Short description" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Docs URL</label>
          <Input value={docs || ''} onChange={(e) => onChange({ docs: e.target.value })} placeholder="https://docs.example.com/agent" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Deprecation (UTC)</label>
          <DepPicker value={dep} onChange={(iso) => onChange({ dep: iso })} />
        </div>
      </div>
    </div>
  )
}



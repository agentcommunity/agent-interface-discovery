import { describe, it, expect } from 'vitest'

function toIso(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}T00:00:00Z`
}

describe('DepPicker ISO', () => {
  it('formats to midnight UTC', () => {
    const d = new Date(Date.UTC(2026, 0, 1, 15, 30))
    const result = toIso(d)
    expect(result).toBe('2026-01-01T00:00:00Z')
  })
})



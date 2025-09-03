"use client"

import { useState, useCallback } from 'react'

export type PkaStatus = 'idle' | 'checking' | 'valid' | 'invalid'

export function usePkaVerification() {
  const [status, setStatus] = useState<PkaStatus>('idle')
  const [reason, setReason] = useState<string | null>(null)

  const check = useCallback((pka: string) => {
    setStatus('checking')
    const res = verifyPkaLocal(pka)
    if (res.valid) {
      setReason(null)
      setStatus('valid')
    } else {
      setReason(res.reason || 'Invalid PKA key')
      setStatus('invalid')
    }
  }, [])

  return { status, reason, check } as const
}

function verifyPkaLocal(pka: string): { valid: boolean; reason?: string } {
  if (!pka || pka[0] !== 'z') return { valid: false, reason: 'Missing z multibase prefix' }
  const s = pka.slice(1)
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  for (const c of s) if (!ALPHABET.includes(c)) return { valid: false, reason: 'Invalid base58 character' }
  const approx = Math.floor((s.length * Math.log(58)) / Math.log(256))
  if (approx !== 32 && approx !== 33) return { valid: false, reason: 'Unexpected key length' }
  return { valid: true }
}

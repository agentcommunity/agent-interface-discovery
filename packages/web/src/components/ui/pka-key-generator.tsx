import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy } from 'lucide-react'

export interface PkaKeyGeneratorProps {
  onPublicKey?: (pka: string) => void
}

export function PkaKeyGenerator({ onPublicKey }: PkaKeyGeneratorProps) {
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'invalid'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setStatus('generating')
    setError(null)
    try {
      const kp = (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as CryptoKeyPair
      const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey))
      const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey))
      const pka = 'z' + base58btcEncode(rawPub)
      const pem =
        '-----BEGIN PRIVATE KEY-----\n' +
        b64(pkcs8) +
        '\n-----END PRIVATE KEY-----\n'
      setPublicKey(pka)
      setPrivateKey(pem)
      setStatus('ready')
      onPublicKey?.(pka)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate keys')
      setStatus('idle')
    }
  }

  function handleValidate(): void {
    const r = verifyPkaLocal(publicKey)
    setStatus(r.valid ? 'ready' : 'invalid')
    if (!r.valid) setError(r.reason || 'Invalid PKA key')
  }

  const copyPublic = () => { void navigator.clipboard.writeText(publicKey) }
  const copyPrivate = () => { void navigator.clipboard.writeText(privateKey) }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">PKA Key Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={status === 'generating'}>
            {status === 'generating' ? 'Generating…' : 'Generate Key Pair'}
          </Button>
          <Button variant="secondary" onClick={handleValidate} disabled={!publicKey}>
            Validate Public Key
          </Button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Public Key (multibase z…)</label>
          <div className="flex gap-2">
            <Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
            <Button variant="outline" onClick={copyPublic} disabled={!publicKey}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Private Key (PEM)</label>
          <div className="flex gap-2">
            <Input value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
            <Button variant="outline" onClick={copyPrivate} disabled={!privateKey}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {status === 'invalid' && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

function b64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function base58btcEncode(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++
  const size = Math.ceil((bytes.length * Math.log(256)) / Math.log(58)) + 1
  const b = new Uint8Array(size)
  let length = 0
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i]
    let j = size - 1
    while (carry !== 0 || j >= size - length) {
      carry += 256 * b[j]
      b[j] = carry % 58
      carry = Math.floor(carry / 58)
      j--
    }
    length = size - 1 - j
  }
  let it = size - length
  while (it < size && b[it] === 0) it++
  let out = '1'.repeat(zeros)
  for (let i = it; i < size; i++) out += ALPHABET[b[i]]
  return out
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

import { ShieldCheck, ShieldAlert } from 'lucide-react'

export interface TlsInspectorProps {
  valid: boolean | null
  daysRemaining: number | null
}

export function TlsInspector({ valid, daysRemaining }: TlsInspectorProps) {
  if (valid === null) return null
  const isWarn = typeof daysRemaining === 'number' && daysRemaining >= 0 && daysRemaining < 21
  return (
    <div className="flex items-center gap-2 text-xs">
      {valid ? (
        <span className={isWarn ? 'text-amber-700' : 'text-emerald-700'}>
          {isWarn ? (
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> TLS expiring soon ({daysRemaining}d)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> TLS valid
            </span>
          )}
        </span>
      ) : (
        <span className="text-red-700 inline-flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> TLS invalid
        </span>
      )}
    </div>
  )
}



import { cn } from '@/lib/utils'

export interface SecurityBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}

const variants: Record<SecurityBadgeProps['variant'], string> = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
}

export function SecurityBadge({ variant, children }: SecurityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}

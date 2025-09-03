export function tlsVariant(valid: boolean | null, daysRemaining: number | null):
  | 'success'
  | 'warning'
  | 'error'
  | 'info' {
  if (valid === null) return 'info'
  if (valid === false) return 'error'
  if (typeof daysRemaining === 'number' && daysRemaining >= 0 && daysRemaining < 21) return 'warning'
  return 'success'
}

export function pkaVariant(
  present?: boolean,
  verified?: boolean | null,
): 'success' | 'warning' | 'info' {
  if (verified === true) return 'success'
  if (present) return 'warning'
  return 'info'
}



export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Type guard that narrows a Result to the success variant.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard that narrows a Result to the error variant.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

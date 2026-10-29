/**
 * Stability helpers for the composer trigger.
 *
 * Root cause they address: after `select()` the host reloads the catalog
 * (`selecting`/`loading` -> `ready`). While the reload is in flight
 * `currentChoice()` can transiently miss, and the trigger fell back to the
 * raw model id for a frame — visible label flashing (name -> id -> name).
 * Holding the last good display value across transient statuses removes the
 * flash without freezing genuine updates: once the snapshot is settled an
 * unresolvable model honestly shows the raw id/fallback and the stale
 * memory is forgotten.
 */

export type DirectoryStatus = 'idle' | 'loading' | 'selecting' | 'ready' | 'error'

/** True when no select/reload is in flight — displayed values are final. */
export function isSettledStatus(status: DirectoryStatus): boolean {
  return status === 'ready' || status === 'error'
}

export interface HeldValue<T> {
  /** Value to display this render (undefined = nothing good to show). */
  value: T | undefined
  /** Value to remember for the next render. */
  last: T | null
}

/**
 * Hold the last good display value across transient directory states.
 *
 * - `resolved` — value derived from the current render (`undefined` = unresolvable now).
 * - `last` — last good value from a previous render (`null` = none yet).
 * - `settled` — snapshot status is final (see `isSettledStatus`).
 */
export function holdLastGood<T>(resolved: T | undefined, last: T | null, settled: boolean): HeldValue<T> {
  if (resolved !== undefined) return { value: resolved, last: resolved }
  if (!settled && last !== null) return { value: last, last }
  return { value: undefined, last: null }
}

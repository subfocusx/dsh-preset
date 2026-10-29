import { describe, expect, it } from 'vitest'
import { holdLastGood, isSettledStatus } from '../src/client/trigger-stability.ts'

/**
 * Regression test for the composer trigger flicker.
 *
 * Root cause: after `select()` the host reloads the catalog
 * (`selecting`/`loading` -> `ready`). While the reload is in flight
 * `currentChoice()` can transiently miss, and the trigger fell back to the
 * raw model id for a frame — visible flashing (name -> id -> name).
 */
describe('isSettledStatus', () => {
  it('treats ready and error as settled', () => {
    expect(isSettledStatus('ready')).toBe(true)
    expect(isSettledStatus('error')).toBe(true)
  })

  it('treats idle, loading and selecting as transient', () => {
    expect(isSettledStatus('idle')).toBe(false)
    expect(isSettledStatus('loading')).toBe(false)
    expect(isSettledStatus('selecting')).toBe(false)
  })
})

describe('holdLastGood', () => {
  it('passes a resolved value through and remembers it', () => {
    expect(holdLastGood('Beam', null, true)).toEqual({ value: 'Beam', last: 'Beam' })
    expect(holdLastGood('Beam', 'Old', false)).toEqual({ value: 'Beam', last: 'Beam' })
  })

  it('holds the last good label while the snapshot is transient', () => {
    // The exact flicker frame: catalog reloading, model temporarily
    // unresolvable — the trigger must keep showing the old display name,
    // never flash the raw id fallback.
    expect(holdLastGood<string>(undefined, 'DeepSeek Reasoner', false)).toEqual({
      value: 'DeepSeek Reasoner',
      last: 'DeepSeek Reasoner',
    })
  })

  it('shows nothing good on the first transient paint without history', () => {
    expect(holdLastGood<string>(undefined, null, false)).toEqual({ value: undefined, last: null })
  })

  it('forgets stale history once settled and honestly unresolved', () => {
    // Model genuinely removed from the catalog: show the raw id fallback
    // (value undefined lets the caller do that) and do not cling forever.
    expect(holdLastGood<string>(undefined, 'Ghost', true)).toEqual({ value: undefined, last: null })
  })

  it('holds opaque view objects (effort pill) the same way', () => {
    const view = { options: [{ id: 'high', name: 'High' }], value: 'high' }
    const held = holdLastGood<typeof view>(undefined, view, false)
    expect(held.value).toBe(view)
    expect(held.last).toBe(view)
  })
})

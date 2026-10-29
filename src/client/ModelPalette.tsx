import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { choiceKey, currentChoice, flattenChoices, pushRecent, rankChoices, toggleFavorite } from './model.ts'
import { formatTokenCount, REASONING_LEVELS } from './model-config.ts'
import { ProviderIcon } from './ProviderIcon.tsx'
import { providerMeta } from './provider-catalog.ts'
import { ensureSelectionCompatibility, ensureSelectionReasoning, isSameSelection as isSameLiveSelection, mayNeedReasoningCompatibility } from './selection-compatibility.ts'
import { holdLastGood, isSettledStatus } from './trigger-stability.ts'
import type { ModelChoice, PaletteProps, Selection } from './types.ts'

const FAVORITES_KEY = 'dsa-preset:favorites:v1'
const RECENTS_KEY = 'dsa-preset:recents:v1'
/** Per-model effort memory: choiceKey -> reasoningEffort ('' = provider default). */
const EFFORTS_KEY = 'dsa-preset:efforts:v1'
type ModelPaletteView = 'models'

interface ModelBadges {
  context?: number
  output?: number
  image: boolean
  free: boolean
}

// Session-level capacity index filled once from the live catalog; failures stay silent.
let badgeIndex: Map<string, Map<string, ModelBadges>> | null = null
let badgePromise: Promise<Map<string, Map<string, ModelBadges>>> | null = null

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function buildBadgeIndex(value: unknown): Map<string, Map<string, ModelBadges>> {
  const index = new Map<string, Map<string, ModelBadges>>()
  if (!isRecordValue(value) || !Array.isArray(value.groups)) return index
  for (const group of value.groups) {
    if (!isRecordValue(group) || typeof group.id !== 'string' || !Array.isArray(group.models)) continue
    const inner = new Map<string, ModelBadges>()
    for (const model of group.models) {
      if (!isRecordValue(model) || typeof model.id !== 'string' || model.id === '') continue
      inner.set(model.id, {
        context: typeof model.contextWindow === 'number' && Number.isFinite(model.contextWindow) ? model.contextWindow : undefined,
        output: typeof model.maxTokens === 'number' && Number.isFinite(model.maxTokens) ? model.maxTokens : undefined,
        image: Array.isArray(model.input) && model.input.includes('image'),
        free: model.id.toLocaleLowerCase().endsWith(':free'),
      })
    }
    index.set(group.id, inner)
  }
  return index
}

function loadBadgeIndex(api: PaletteProps['api']): Promise<Map<string, Map<string, ModelBadges>>> {
  if (badgeIndex !== null) return Promise.resolve(badgeIndex)
  if (badgePromise === null) {
    badgePromise = api.llm.models({}).then(response => {
      const index = response.result.ok ? buildBadgeIndex(response.result.value) : new Map()
      badgeIndex = index
      return index
    }).catch(() => {
      badgePromise = null
      return new Map()
    })
  }
  return badgePromise
}

function readStoredList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch (error) {
    console.warn(`[dsa-preset] ignored invalid ${key}`, error)
    return []
  }
}

function writeStoredList(key: string, values: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch (error) {
    console.warn(`[dsa-preset] failed to persist ${key}`, error)
  }
}

function useStoredList(key: string): [string[], (next: string[]) => void] {
  const [values, setValues] = useState<string[]>(() => readStoredList(key))
  const update = (next: string[]) => {
    setValues(next)
    writeStoredList(key, next)
  }
  return [values, update]
}

function readStoredRecord(key: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    )
  } catch (error) {
    console.warn(`[dsa-preset] ignored invalid ${key}`, error)
    return {}
  }
}

function writeStoredRecord(key: string, values: Readonly<Record<string, string>>): void {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch (error) {
    console.warn(`[dsa-preset] failed to persist ${key}`, error)
  }
}

function useStoredRecord(key: string): [Record<string, string>, (next: Record<string, string>) => void] {
  const [values, setValues] = useState<Record<string, string>>(() => readStoredRecord(key))
  const update = (next: Record<string, string>) => {
    setValues(next)
    writeStoredRecord(key, next)
  }
  return [values, update]
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface EffortSelectProps {
  value: string
  options: ReadonlyArray<{ id: string; name: string }>
  defaultLabel: string
  label: string
  disabled: boolean
  /** Compact single-row seat variant rendered next to the composer trigger. */
  compact?: boolean
  onChange: (value: string) => void
}

/**
 * Codex-style discrete reasoning-effort slider. Stops come from the current
 * model's declared efforts only, prefixed by the provider default.
 */
function EffortSelect({ value, options, defaultLabel, label, disabled, compact = false, onChange }: EffortSelectProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  // Unconditional: keeps hook order stable across compact/non-compact use.
  const compactActiveName = value === '' ? defaultLabel : (options.find(option => option.id === value)?.name ?? value)
  const { innerRef: effortInnerRef, width: effortWidth } = useAnimatedWidth(compactActiveName, 20)
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])
  if (compact) {
    const activeName = compactActiveName
    const items: Array<{ id: string; name: string }> = [{ id: '', name: defaultLabel }, ...options]
    return (
      <div ref={menuRef} className={`dsa-effort-select is-compact${disabled ? ' is-busy' : ''}${menuOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="dsa-effort-button"
          style={effortWidth === null ? undefined : { width: effortWidth }}
          disabled={disabled}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          title={`${label}: ${activeName}`}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className="dsa-effort-inner" ref={effortInnerRef}>
            <span className="dsa-effort-bolt" aria-hidden="true">⚡</span>
            <span className="dsa-effort-value">{activeName}</span>
            <span className="dsa-effort-caret" aria-hidden="true">▾</span>
          </span>
        </button>
        {menuOpen && !disabled && (
          <ul className="dsa-effort-menu" role="listbox" aria-label={label}>
            {items.map(item => (
              <li key={item.id === '' ? '__default' : item.id} role="option" aria-selected={item.id === value}>
                <button
                  type="button"
                  className={`dsa-effort-item${item.id === value ? ' is-active' : ''}`}
                  onClick={() => { setMenuOpen(false); if (item.id !== value) onChange(item.id) }}
                >
                  <span className="dsa-effort-item-name">{item.name}</span>
                  {item.id === value && <span className="dsa-effort-check" aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  return (
    <label className={`dsa-effort-select${disabled ? ' is-busy' : ''}`}>
      <span className="dsa-effort-select-label">{label}</span>
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={event => onChange(event.currentTarget.value)}
      >
        <option value="">{defaultLabel}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  )
}

/**
 * Smooth pill-width animation for the composer seats.
 *
 * Mechanism it addresses: every model/effort switch changes the seat's
 * content width, and the instant width jump shifts the neighbouring host
 * composer elements (visible as flicker/jerk of the black buttons).
 * The pill stays content-sized — no reserved gap — but the width travels
 * to the new value over ~0.18s (see `transition: width` on the seats),
 * so neighbours glide instead of jumping.
 *
 * The inner content is measured with `scrollWidth` (immune to the
 * button's own explicit width); `contentKey` must change whenever the
 * visible content changes.
 */
function useAnimatedWidth(contentKey: string, horizontalPadding: number) {
  const innerRef = useRef<HTMLSpanElement | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = innerRef.current
    if (el === null) return
    const next = Math.ceil(el.scrollWidth) + horizontalPadding
    setWidth(prev => (prev === next ? prev : next))
  }, [contentKey, horizontalPadding])
  return { innerRef, width }
}

export function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }: PaletteProps) {
  const snapshot = useSyncExternalStore(directory.subscribe, directory.getSnapshot, directory.getSnapshot)
  const choices = useMemo(() => flattenChoices(snapshot.groups), [snapshot.groups])
  const current = currentChoice(choices, snapshot.current)
  const [open, setOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const quickRef = useRef<HTMLDivElement>(null)
  // Last good trigger display values — held across transient snapshot
  // states so the trigger never flashes raw ids mid-reload (see
  // trigger-stability.ts). Writes below are idempotent per value.
  const lastLabelRef = useRef<string | null>(null)
  const lastProviderRef = useRef<string | null>(null)
  const lastEffortRef = useRef<{ options: ReadonlyArray<{ id: string; name: string }>; value: string } | null>(null)
  const [query, setQuery] = useState('')
  const [providerId, setProviderId] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<'all' | 'favorites' | 'recents'>('all')
  const [cursor, setCursor] = useState(0)
  const [favorites, setFavorites] = useStoredList(FAVORITES_KEY)
  const [recents, setRecents] = useStoredList(RECENTS_KEY)
  const [effortMap, setEffortMap] = useStoredRecord(EFFORTS_KEY)
  const [appliedKey, setAppliedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [effortBusy, setEffortBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([])

  const providers = useMemo(() => {
    const currentProvider = snapshot.current?.provider
    return [...snapshot.groups].sort((left, right) => {
      if (left.id === currentProvider) return -1
      if (right.id === currentProvider) return 1
      return left.name.localeCompare(right.name)
    })
  }, [snapshot.groups, snapshot.current?.provider])

  const results = useMemo(() => rankChoices(choices, {
    query,
    providerId,
    favorites,
    recents,
    current: snapshot.current,
    quickFilter,
  }), [choices, query, providerId, favorites, recents, snapshot.current, quickFilter])

  const favoriteChoices = useMemo(
    () => choices.filter(choice => favorites.includes(choice.key)),
    [choices, favorites],
  )
  const quickChoices = useMemo(
    () => favoriteChoices.length > 0
      ? favoriteChoices
      : choices.filter(choice => recents.includes(choice.key)).slice(0, 6),
    [favoriteChoices, choices, recents],
  )

  useEffect(() => {
    if (!quickOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (quickRef.current !== null && !quickRef.current.contains(event.target as Node)) setQuickOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuickOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [quickOpen])

  /** Build the selection for a choice, restoring the remembered per-model effort. */
  const selectionWithSavedEffort = (choice: ModelChoice): Selection => {
    const savedEffort = effortMap[choice.key]
    const fallbackEffort = choice.selection.reasoningEffort
    const wantedEffort = savedEffort !== undefined ? savedEffort : (fallbackEffort ?? '')
    return {
      provider: choice.provider.id,
      model: choice.model.id,
      ...(wantedEffort === '' ? {} : { reasoningEffort: wantedEffort }),
    }
  }

  /** Fast path for the quick preset menu: apply + close the small menu only. */
  const applyQuick = async (choice: ModelChoice) => {
    // Close the menu synchronously first so it never lingers (and never
    // re-renders) while the async select + host snapshot update run.
    setQuickOpen(false)
    const wanted = selectionWithSavedEffort(choice)
    // No-op guard: every select() appends a session event and rewrites the
    // default-model config, making the host re-render its panels (blink).
    if (isSameSelection(wanted)) {
      setRecents(pushRecent(recents, choice.key))
      return
    }
    if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) {
      try {
        const repaired = await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)
        if (repaired.length > 0) load()
      } catch (cause) {
        setError(t('palette.compatRepairFailed', { message: messageOf(cause) }))
        return
      }
    }
    const outcome = await select(wanted)
    if (outcome === undefined || outcome.ok !== true) {
      const reason = outcome?.error?.message ?? ''
      setError(reason === '' ? t('palette.selectFailed') : t('palette.selectFailedReason', { message: reason }))
      return
    }
    setRecents(pushRecent(recents, choice.key))
  }

  /**
   * No-op guard shared by every select path: an identical selection still
   * appends a session event and rewrites the default-model config on the
   * host, which re-renders host panels (visible blink) for zero effect.
   * The native seat has no such early-out — its Directory.select always
   * calls sessions.selectModel — so this guard makes the plugin strictly
   * quieter than native on identical clicks. On a real switch both paths
   * call the identical host RPC and blink the same.
   * Logic lives in isSameSelection (unit-tested); this only binds live state.
   */
  const isSameSelection = (selection: Selection): boolean =>
    isSameLiveSelection(snapshot.current, selection)

  const toggleQuick = (): void => {
    if (!available || locked) return
    if (open) return
    setError(null)
    // The directory is already subscribed via useSyncExternalStore: only
    // refresh when we have nothing yet, otherwise every open would churn the
    // store and re-render the whole palette.
    if (snapshot.groups.length === 0) load()
    setQuickOpen(value => !value)
  }

  const favoriteCount = useMemo(() => choices.filter(choice => favorites.includes(choice.key)).length, [choices, favorites])
  const recentCount = useMemo(() => choices.filter(choice => recents.includes(choice.key)).length, [choices, recents])

  const show = useCallback((): boolean => {
    if (!available || locked) return false
    setOpen(true)
    setQuery('')
    setProviderId(null)
    setQuickFilter('all')
    setCursor(0)
    setError(null)
    if (snapshot.groups.length === 0) load()
    return true
  }, [available, load, locked, snapshot.groups.length])

  const close = () => {
    setOpen(false)
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCursor((value) => Math.min(value + 1, Math.max(0, results.length - 1)))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursor((value) => Math.max(0, value - 1))
        return
      }
      if (event.key === 'Enter' && results[cursor] !== undefined && !isTypingTarget(event.target)) {
        event.preventDefault()
        void choose(results[cursor])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, locked, available, results, cursor])

  useEffect(() => {
    setCursor(0)
  }, [query, providerId])

  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, results.length - 1)))
  }, [results.length])

  useEffect(() => {
    rowRefs.current[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const choose = async (choice: ModelChoice) => {
    const wanted = selectionWithSavedEffort(choice)
    // No-op guard: identical selection still churns the host (session
    // event + config rewrite → panel blink) for zero effect.
    if (isSameSelection(wanted)) {
      setRecents(pushRecent(recents, choice.key))
      setAppliedKey(choice.key)
      return
    }
    if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) {
      try {
        const repaired = await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)
        if (repaired.length > 0) load()
      } catch (cause) {
        setError(t('palette.compatRepairFailed', { message: messageOf(cause) }))
        return
      }
    }
    // Prefer the effort remembered for this exact model over the catalog default,
    // so switching models no longer resets a tuned effort to provider default.
    const outcome = await select(wanted)
    if (outcome === undefined || outcome.ok !== true) {
      const reason = outcome?.error?.message ?? ''
      setError(reason === '' ? t('palette.selectFailed') : t('palette.selectFailedReason', { message: reason }))
      return
    }
    setRecents(pushRecent(recents, choice.key))
    // Keep the palette open on purpose: the user tunes effort per model and moves
    // to the next row. Explicit close via ✕, overlay click or Escape.
    setAppliedKey(choice.key)
  }

  const chooseEffort = async (value: string) => {
    if (snapshot.current === null) return
    // No-op guard: re-selecting the live effort still appends a session
    // event and rewrites the config on the host (panel blink, zero effect).
    if ((snapshot.current.reasoningEffort ?? '') === (value ?? '')) return
    setEffortBusy(true)
    setError(null)
    try {
      const alreadyOffered = current?.model.reasoning?.efforts.some(effort => effort.id === value) === true
      if (value !== '' && !alreadyOffered) {
        const changed = await ensureSelectionReasoning(api, snapshot.current.provider, snapshot.current.model)
        if (changed) load()
      }
      const selection: Selection = {
        provider: snapshot.current.provider,
        model: snapshot.current.model,
        ...(value === '' ? {} : { reasoningEffort: value }),
      }
      if (isSameSelection(selection)) {
        setEffortBusy(false)
        return
      }
      const outcome = await select(selection)
      if (outcome === undefined || outcome.ok !== true) {
        const reason = outcome?.error?.message ?? ''
        setError(reason === '' ? t('palette.selectFailed') : t('palette.selectFailedReason', { message: reason }))
        return
      }
      // Remember per model: '' keeps the key with empty value = explicit provider default.
      const key = choiceKey(snapshot.current.provider, snapshot.current.model)
      setEffortMap({ ...effortMap, [key]: value })
    } catch (cause) {
      setError(t('palette.reasoningEnableFailed', { message: messageOf(cause) }))
    } finally {
      setEffortBusy(false)
    }
  }

  const settled = isSettledStatus(snapshot.status)
  const heldLabel = holdLastGood(current?.model.name, lastLabelRef.current, settled)
  lastLabelRef.current = heldLabel.last
  const currentLabel = heldLabel.value ?? snapshot.current?.model ?? t('trigger.fallback')
  const heldProvider = holdLastGood(current?.provider.name, lastProviderRef.current, settled)
  lastProviderRef.current = heldProvider.last
  const providerLabel = heldProvider.value ?? snapshot.current?.provider
  // Animated (not reserved) seat width: content-sized, glides on switches.
  const { innerRef: triggerInnerRef, width: triggerWidth } = useAnimatedWidth(
    `${currentLabel} | ${providerLabel ?? ''}`,
    16, // .dsa-trigger horizontal padding 0 8px
  )
  const currentReasoning = current?.model.reasoning
  const currentKey = snapshot.current === null ? null : choiceKey(snapshot.current.provider, snapshot.current.model)
  const currentEffort = snapshot.current?.reasoningEffort
    ?? (currentKey === null ? undefined : effortMap[currentKey])
    ?? currentReasoning?.defaultEffort
    ?? ''
  // Stops follow the current model's declared efforts only, in canonical order —
  // a model without xhigh never shows an xhigh stop, and a non-reasoning model
  // shows no effort control at all.
  const reasoningOptions = (() => {
    const base = (currentReasoning?.efforts ?? [])
      .filter(effort => effort.id !== '')
      .slice()
      .sort((left, right) => {
        const leftIndex = REASONING_LEVELS.indexOf(left.id as (typeof REASONING_LEVELS)[number])
        const rightIndex = REASONING_LEVELS.indexOf(right.id as (typeof REASONING_LEVELS)[number])
        return (leftIndex < 0 ? REASONING_LEVELS.length : leftIndex) - (rightIndex < 0 ? REASONING_LEVELS.length : rightIndex)
      })
    if (currentReasoning === undefined) return base
    let next = base
    // NB: no synthetic 'default' here on purpose — the empty option ("Provider
    // default", value "") already means "omit the param". Injecting an extra
    // 'default' produced two near-identical rows in the dropdown.
    // 'off' stays synthetic: it is the only explicit "disable reasoning" signal.
    if (!next.some(effort => effort.id === 'off')) {
      next = [...next, { id: 'off', name: t('palette.reasoningOff') }]
    }
    return next
  })()
  const heldEffort = holdLastGood(
    current === undefined ? undefined : { options: reasoningOptions, value: currentEffort },
    lastEffortRef.current,
    settled,
  )
  lastEffortRef.current = heldEffort.last
  const displayOptions = heldEffort.value?.options ?? reasoningOptions
  const displayEffort = heldEffort.value?.value ?? currentEffort
  const hasEffortControl = snapshot.current !== null && displayOptions.length > 0
  const [badges, setBadges] = useState<Map<string, Map<string, ModelBadges>>>(new Map())
  useEffect(() => {
    if (badgeIndex !== null) {
      setBadges(badgeIndex)
      return
    }
    let cancelled = false
    void loadBadgeIndex(api).then(index => { if (!cancelled) setBadges(index) })
    return () => { cancelled = true }
  }, [api])

  return (
    <div className="dsa-launcher" ref={quickRef}>
      <button
        type="button"
        className="dsa-trigger"
        style={triggerWidth === null ? undefined : { width: triggerWidth }}
        disabled={locked || !available}
        onClick={toggleQuick}
        onContextMenu={event => { event.preventDefault(); setQuickOpen(false); show() }}
        title={`${currentLabel}${providerLabel === undefined ? '' : ` · ${providerLabel}`}`}
        aria-label={t('trigger.aria')}
        aria-haspopup="menu"
        aria-expanded={quickOpen}
      >
        <span className="dsa-trigger-inner" ref={triggerInnerRef}>
          <span className="dsa-trigger-icon" aria-hidden="true">⌘</span>
          <span className="dsa-trigger-model">{currentLabel}</span>
          {snapshot.current !== null && (
            <span className="dsa-trigger-provider" title={providerLabel}>
              <ProviderIcon id={providerMeta(snapshot.current.provider).icon} size={12} colored />
            </span>
          )}
        </span>
      </button>
      {quickOpen && !open && (
        <div className="dsa-quick" role="menu" aria-label={t('palette.quickPresets')}>
          {quickChoices.length === 0 && (
            <div className="dsa-quick-empty">{t('palette.quickEmpty')}</div>
          )}
          {quickChoices.map(choice => {
            const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id
            const saved = effortMap[choice.key]
            return (
              <button
                key={choice.key}
                type="button"
                role="menuitem"
                className={`dsa-quick-item${isCurrent ? ' is-active' : ''}`}
                onClick={() => void applyQuick(choice)}
              >
                <span className="dsa-quick-main">
                  <span className="dsa-quick-name">{choice.model.name}</span>
                  <span className="dsa-quick-sub">
                    <span className="dsa-result-provider" title={choice.provider.name}>
                      <ProviderIcon id={providerMeta(choice.provider.id).icon} size={12} colored />
                    </span>
                    <span>{choice.model.id}</span>
                    {saved !== undefined && saved !== '' && <span> · ⚡{saved}</span>}
                  </span>
                </span>
                {isCurrent && <span className="dsa-quick-check" aria-hidden="true">✓</span>}
              </button>
            )
          })}
          <button type="button" className="dsa-quick-all" onClick={() => { setQuickOpen(false); show() }}>
            {t('palette.quickAll')}
          </button>
        </div>
      )}

      {!locked && available && (
        <span
          className="dsa-effort-slot"
          aria-hidden={!hasEffortControl}
          style={hasEffortControl ? undefined : { visibility: 'hidden', pointerEvents: 'none' }}
        >
          <EffortSelect
            compact
            value={displayEffort}
            options={displayOptions}
            defaultLabel={t('palette.providerDefault')}
            label={t('palette.effort')}
            disabled={effortBusy || !hasEffortControl}
            onChange={value => void chooseEffort(value)}
          />
        </span>
      )}

      {open && createPortal(
        <div className="dsa-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close()
        }}>
          <section className="dsa-dialog" role="dialog" aria-modal="true" aria-label={t('palette.title')}>
            <header className="dsa-header">
              <div>
                <h2>{t('palette.title')}</h2>
                <p>{`${choices.length} ${t('palette.models')}`}</p>
              </div>
              <button type="button" className="dsa-close" onClick={close} aria-label={t('palette.close')}>×</button>
            </header>

            <div className="dsa-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && results[cursor] !== undefined) {
                    event.preventDefault()
                    void choose(results[cursor])
                  }
                }}
                placeholder={t('palette.search')}
                aria-label={t('palette.search')}
              />
              {query !== '' && <button type="button" onClick={() => setQuery('')} aria-label={t('palette.clear')}>×</button>}
            </div>

            {(snapshot.error !== null || error !== null) && (
              <div className="dsa-error">
                <span>{error ?? snapshot.error}</span>
                <button type="button" onClick={load}>{t('palette.retry')}</button>
              </div>
            )}

            <div className="dsa-body">
              <nav className="dsa-providers" aria-label={t('palette.providers')}>
                <div className="dsa-provider-divider" />
                <button
                  type="button"
                  className={providerId === null && quickFilter === 'all' ? 'is-active' : ''}
                  onClick={() => { setProviderId(null); setQuickFilter('all') }}>
                  <span>{t('palette.allModels')}</span><small>{choices.length}</small>
                </button>
                <button
                  type="button"
                  className={providerId === null && quickFilter === 'favorites' ? 'is-active' : ''}
                  onClick={() => { setProviderId(null); setQuickFilter('favorites') }}>
                  <span>{t('palette.favorites')}</span><small>{favoriteCount}</small>
                </button>
                <button
                  type="button"
                  className={providerId === null && quickFilter === 'recents' ? 'is-active' : ''}
                  onClick={() => { setProviderId(null); setQuickFilter('recents') }}>
                  <span>{t('palette.recents')}</span><small>{recentCount}</small>
                </button>
                <div className="dsa-provider-divider" />
                <div className="dsa-provider-group-label">{t('palette.configuredProviders')}</div>
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={providerId === provider.id ? 'is-active' : ''}
                    onClick={() => { setProviderId(provider.id); setQuickFilter('all') }}
                    title={`${provider.name} · ${provider.id}`}
                  >
                    <span className="dsa-rail-icon"><ProviderIcon id={providerMeta(provider.id).icon} size={14} colored /></span>
                    <span>{provider.name}</span><small>{provider.models.length}</small>
                  </button>
                ))}
              </nav>

              <main className="dsa-results">
                {snapshot.status === 'loading' && results.length === 0 && <div className="dsa-empty">{t('palette.loading')}</div>}
                {snapshot.status !== 'loading' && results.length === 0 && <div className="dsa-empty">{t('palette.empty')}</div>}
                {results.map((choice, index) => {
                  const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id
                  const isFavorite = favorites.includes(choice.key)
                  const isRecent = recents.includes(choice.key)
                  return (
                    <div
                      key={choice.key}
                      className={`dsa-result${index === cursor ? ' is-cursor' : ''}${isCurrent ? ' is-current' : ''}`}
                      onMouseEnter={() => setCursor(index)}
                    >
                      <button
                        ref={(node) => { rowRefs.current[index] = node }}
                        type="button"
                        className="dsa-result-select"
                        onClick={() => void choose(choice)}
                      >
                        <span className="dsa-result-main">
                          <span className="dsa-result-title">
                            {choice.model.name}
                            {(() => {
                              const badge = badges.get(choice.provider.id)?.get(choice.model.id)
                              if (badge === undefined) return null
                              return (
                                <span className="dsa-result-badges">
                                  {badge.free && <em className="is-free">free</em>}
                                  {badge.image && <em title="vision">👁</em>}
                                  {badge.context !== undefined && <em>{formatTokenCount(badge.context)}</em>}
                                  {badge.output !== undefined && <em>↩{formatTokenCount(badge.output)}</em>}
                                </span>
                              )
                            })()}
                            {isCurrent && <em>{t('palette.current')}</em>}
                            {isRecent && !isCurrent && <em>{t('palette.recent')}</em>}
                            {effortMap[choice.key] !== undefined && effortMap[choice.key] !== '' && (
                              <em className="is-effort" title={effortMap[choice.key]}>⚡{effortMap[choice.key]}</em>
                            )}
                            {appliedKey === choice.key && !isCurrent && (
                              <em className="is-applied">✓</em>
                            )}
                          </span>
                          <span className="dsa-result-meta">
                            <span className="dsa-result-provider" title={choice.provider.name}>
                              <ProviderIcon id={providerMeta(choice.provider.id).icon} size={14} colored />
                            </span>
                            <span>{choice.model.id}</span>
                          </span>
                          {choice.model.description !== undefined && <span className="dsa-result-description">{choice.model.description}</span>}
                        </span>
                        {choice.model.reasoning !== undefined && <span className="dsa-reasoning">R</span>}
                      </button>
                      <button
                        type="button"
                        className={`dsa-star${isFavorite ? ' is-favorite' : ''}`}
                        title={t(isFavorite ? 'favorite.remove' : 'favorite.add')}
                        aria-label={t(isFavorite ? 'favorite.remove' : 'favorite.add')}
                        onClick={() => setFavorites(toggleFavorite(favorites, choice.key))}
                      >★</button>
                    </div>
                  )
                })}
              </main>
            </div>

            <footer className="dsa-footer">
              <div className="dsa-current">
                <span>{t('palette.current')}</span>
                <strong>{currentLabel}</strong>
                {snapshot.current?.provider !== undefined && (
                  <ProviderIcon id={providerMeta(snapshot.current.provider).icon} size={14} colored />
                )}
                {providerLabel !== undefined && <small>{providerLabel}</small>}
              </div>
              {hasEffortControl && (
                <EffortSelect
                  value={displayEffort}
                  options={displayOptions}
                  defaultLabel={t('palette.providerDefault')}
                  label={t('palette.effort')}
                  disabled={effortBusy}
                  onChange={value => void chooseEffort(value)}
                />
              )}
              {snapshot.failures.length > 0 && <span className="dsa-failures" title={snapshot.failures.map((item) => `${item.name}: ${item.message}`).join('\n')}>{t('palette.failures')} ({snapshot.failures.length})</span>}
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}

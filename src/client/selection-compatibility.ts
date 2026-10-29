import { ensureModelReasoning, providerProfiles, repairProviderCompatibility } from './model-config.ts'
import type { PaletteApi } from './remote-compat.ts'
import type { CurrentSelection, Selection } from './types.ts'

const SETTINGS_NAMESPACE = 'llm-pi-ai'

/** Whether a catalog choice may need DeepSeek replay compatibility on a custom route. */
export function mayNeedReasoningCompatibility(
  providerId: string,
  modelId: string,
  modelName: string,
): boolean {
  if (providerId === 'deepseek') return false
  return `${modelId} ${modelName}`.toLocaleLowerCase().includes('deepseek')
}

/**
 * Repair the selected user-configured model before DSH switches to it.
 * Static or inherited routes remain untouched.
 */
export async function ensureSelectionCompatibility(
  api: Pick<PaletteApi, 'settings'>,
  providerId: string,
  modelId: string,
): Promise<string[]> {
  const described = await api.settings.describe({})
  if (!described.result.ok) throw new Error(described.result.error.message)
  const namespace = described.result.value.namespaces.find(candidate => candidate.ns === SETTINGS_NAMESPACE)
  if (namespace === undefined) return []
  const profiles = providerProfiles(namespace.user ?? namespace.value)
  const profile = profiles[providerId]
  if (profile === undefined) return []
  const repaired = repairProviderCompatibility(profile, modelId)
  if (!repaired.changed) return []
  const mutation = await api.settings.mutate({
    ns: SETTINGS_NAMESPACE,
    ops: [{ op: 'set', path: ['providers', providerId], value: repaired.profile }],
    expectedRevision: namespace.revision,
  })
  if (!mutation.result.ok) throw new Error(mutation.result.error.message)
  return repaired.repairedModels
}

/**
 * Whether a wanted selection is identical to the live one. Every select()
 * appends a session event and rewrites the default-model config on the host,
 * which re-renders host panels — so identical selections must be skipped
 * by every select path (quick menu, list, effort). Pure for unit testing.
 */
export function isSameSelection(
  live: CurrentSelection | null | undefined,
  wanted: Selection,
): boolean {
  if (live === null || live === undefined) return false
  if (live.provider !== wanted.provider || live.model !== wanted.model) return false
  return (live.reasoningEffort ?? '') === (wanted.reasoningEffort ?? '')
}

/** Ensure a selected model exposes every DSH reasoning level before submitting that level. */
export async function ensureSelectionReasoning(
  api: Pick<PaletteApi, 'settings'>,
  providerId: string,
  modelId: string,
): Promise<boolean> {
  const described = await api.settings.describe({})
  if (!described.result.ok) throw new Error(described.result.error.message)
  const namespace = described.result.value.namespaces.find(candidate => candidate.ns === SETTINGS_NAMESPACE)
  if (namespace === undefined) throw new Error('The llm-pi-ai settings namespace is not loaded')
  const userProfiles = providerProfiles(namespace.user)
  const effectiveProfiles = providerProfiles(namespace.value)
  const profile = userProfiles[providerId] ?? effectiveProfiles[providerId]
  if (profile === undefined) throw new Error(`Provider ${providerId} is not configurable through llm-pi-ai`)
  const updated = ensureModelReasoning(providerId, profile, modelId)
  if (!updated.changed) return false
  const mutation = await api.settings.mutate({
    ns: SETTINGS_NAMESPACE,
    ops: [{ op: 'set', path: ['providers', providerId], value: updated.profile }],
    expectedRevision: namespace.revision,
  })
  if (!mutation.result.ok) throw new Error(mutation.result.error.message)
  return true
}

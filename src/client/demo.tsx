import React from 'react'
import { createRoot } from 'react-dom/client'
import { ModelPalette } from './ModelPalette.tsx'
import './style.css'
import type { CatalogGroup, CatalogModel } from './types.ts'

interface DemoSnapshot {
  current: { provider: string; model: string; reasoningEffort?: string } | null
  groups: CatalogGroup[]
  failures: { id: string; name: string; message: string }[]
  status: 'idle' | 'loading' | 'selecting' | 'ready' | 'error'
  error: string | null
}

class MockDirectoryStore {
  private listeners = new Set<() => void>()
  private snapshot: DemoSnapshot

  constructor() {
    const models: CatalogModel[] = [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        reasoning: {
          defaultEffort: 'medium',
          efforts: [
            { id: 'low', name: 'Low' },
            { id: 'medium', name: 'Medium' },
            { id: 'high', name: 'High' },
          ],
        },
      },
    ]
    const groups: CatalogGroup[] = [{ id: 'deepseek', name: 'DeepSeek', models }]
    this.snapshot = {
      current: { provider: 'deepseek', model: 'deepseek-reasoner', reasoningEffort: '' },
      groups,
      failures: [],
      status: 'ready',
      error: null,
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): DemoSnapshot => {
    return this.snapshot
  }

  load = (): void => {
    // no-op for demo
  }

  /** Mimics the host: selecting -> transient reload -> ready. */
  select = (selection: { provider: string; model: string; reasoningEffort?: string }): void => {
    this.snapshot = { ...this.snapshot, status: 'selecting' }
    this.emit()
    window.setTimeout(() => {
      this.snapshot = {
        ...this.snapshot,
        status: 'loading',
        current: { provider: selection.provider, model: selection.model, reasoningEffort: selection.reasoningEffort ?? '' },
      }
      this.emit()
      window.setTimeout(() => {
        this.snapshot = { ...this.snapshot, status: 'ready' }
        this.emit()
      }, 60)
    }, 60)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

const directory = new MockDirectoryStore()

const mockApi = {
  settings: {
    describe: async () => ({ result: { ok: true, value: { schema: { type: 'object', properties: {} }, value: {} } } }),
    mutate: async () => ({ result: { ok: true, value: {} } }),
  },
  credentials: {
    describe: async () => ({ result: { ok: true, value: { credentials: {} } } }),
    set: async () => ({ result: { ok: true, value: undefined } }),
  },
  llm: {
    discoverModels: async () => ({ result: { ok: true, value: { models: [] } } }),
    models: async () => ({
      result: {
        ok: true,
        value: {
          groups: directory.getSnapshot().groups.map(group => ({
            id: group.id,
            models: group.models.map(model => ({
              id: model.id,
              contextWindow: 128000,
              maxTokens: 8192,
              input: ['text'],
            })),
          })),
        },
      },
    }),
  },
}

const t = (key: string): string => key

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <ModelPalette
    locked={false}
    available={true}
    directory={directory as never}
    load={() => directory.load()}
    select={async selection => {
      directory.select(selection as { provider: string; model: string; reasoningEffort?: string })
      return { ok: true }
    }}
    api={mockApi as never}
    isLoopback={true}
    t={t}
  />,
)
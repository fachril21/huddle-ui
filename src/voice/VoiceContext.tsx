import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { VoiceEngine, VoiceSnapshot } from './engine'

const VoiceContext = createContext<VoiceEngine | null>(null)

export function VoiceProvider({ engine, children }: { engine: VoiceEngine; children: ReactNode }) {
  return <VoiceContext.Provider value={engine}>{children}</VoiceContext.Provider>
}

export function useVoiceEngine(): VoiceEngine {
  const engine = useContext(VoiceContext)
  if (!engine) throw new Error('VoiceProvider is missing')
  return engine
}

/** Membership-level view of the engine (who is lit, who is dominant). Changes a few times per second at most. */
export function useVoiceSnapshot(): VoiceSnapshot {
  const engine = useVoiceEngine()
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot)
}

/** Ref callback that lets the engine write CSS variables straight onto a tile element. */
export function useTileRegistration(id: string) {
  const engine = useVoiceEngine()
  return useCallback(
    (el: HTMLElement | null) => {
      engine.register(id, el)
      return () => engine.register(id, null)
    },
    [engine, id],
  )
}

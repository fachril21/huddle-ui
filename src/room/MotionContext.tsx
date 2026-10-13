import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { FxTier } from '../state/types'

interface FxValue {
  readonly fx: FxTier
  /** True when motion should be static: OS setting, demo simulation, or the "Mati" tier */
  readonly reduced: boolean
}

const FxContext = createContext<FxValue>({ fx: 'full', reduced: false })

const QUERY = '(prefers-reduced-motion: reduce)'

interface MotionProviderProps {
  fx: FxTier
  /** Demo Director switch that pretends the OS asked for reduced motion */
  simulateReduced: boolean
  children: ReactNode
}

export function MotionProvider({ fx, simulateReduced, children }: MotionProviderProps) {
  const [system, setSystem] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setSystem(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const value = useMemo<FxValue>(() => ({ fx, reduced: system || simulateReduced || fx === 'off' }), [fx, system, simulateReduced])
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>
}

export function useFx(): FxValue {
  return useContext(FxContext)
}

import { useFx } from './MotionContext'

/** True when motion should be static (OS preference, demo simulation, or the "Mati" effects tier). */
export function useReducedMotion(): boolean {
  return useFx().reduced
}

import { SELF_ID } from '../../state/types'
import type { ChatMessage } from '../../state/types'

export const MAX_BUBBLES = 3

/** Messages that should pop up as a bubble: from someone else, public or private to the user. */
export function incomingMessages(messages: readonly ChatMessage[], afterId: number): ChatMessage[] {
  return messages.filter((m) => m.id > afterId && m.fromId !== SELF_ID && (m.toId === null || m.toId === SELF_ID))
}

/** Append new bubbles and keep only the newest MAX_BUBBLES. */
export function pushBubbles<T>(current: readonly T[], added: readonly T[]): T[] {
  return [...current, ...added].slice(-MAX_BUBBLES)
}

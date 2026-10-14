import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../../state/types'
import { incomingMessages, MAX_BUBBLES, pushBubbles } from './bubbleQueue'

const msg = (id: number, fromId: string, toId: string | null = null): ChatMessage => ({ id, fromId, toId, text: `pesan ${id}`, at: id })

describe('incomingMessages', () => {
  it('keeps only messages newer than the last seen id', () => {
    expect(incomingMessages([msg(1, 'raka'), msg(2, 'bima')], 1).map((m) => m.id)).toEqual([2])
  })

  it('drops own messages and private messages to other people', () => {
    const list = [msg(1, 'anda'), msg(2, 'raka', 'bima'), msg(3, 'raka', 'anda'), msg(4, 'dewi')]
    expect(incomingMessages(list, 0).map((m) => m.id)).toEqual([3, 4])
  })
})

describe('pushBubbles', () => {
  it('keeps the newest bubbles within the limit', () => {
    const result = pushBubbles([1, 2, 3], [4, 5])
    expect(result).toEqual([3, 4, 5])
    expect(result).toHaveLength(MAX_BUBBLES)
  })

  it('does not mutate the current list', () => {
    const current = [1]
    pushBubbles(current, [2])
    expect(current).toEqual([1])
  })
})

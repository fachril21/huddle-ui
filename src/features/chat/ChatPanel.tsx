import { Lock, SendHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SELF_ID } from '../../state/types'
import type { ChatState, Participant } from '../../state/types'
import { activeMention, applyMention, formatChatTime } from './chatTime'
import styles from './ChatPanel.module.css'

interface ChatPanelProps {
  chat: ChatState
  participants: readonly Participant[]
  onSend: (text: string, toId: string | null) => void
}

const MENTION_LIMIT = 5

/** Public and private messages, @mention suggestions, and a typing indicator (PRD 8.8). */
export function ChatPanel({ chat, participants, onSend }: ChatPanelProps) {
  const [text, setText] = useState('')
  const [toId, setToId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? 'Peserta'
  const paletteOf = (id: string) => participants.find((p) => p.id === id)?.palette ?? 'borealis'

  const mention = activeMention(text)
  const suggestions = useMemo(
    () => (mention === null ? [] : participants.filter((p) => p.id !== SELF_ID && p.name.toLowerCase().startsWith(mention.toLowerCase())).slice(0, MENTION_LIMIT)),
    [mention, participants],
  )

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages.length, chat.typingId])

  // messages the user may see: public, or private to/from them
  const visible = chat.messages.filter((m) => m.toId === null || m.toId === SELF_ID || m.fromId === SELF_ID)

  const send = () => {
    if (!text.trim()) return
    onSend(text, toId)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        setText(applyMention(text, suggestions[highlight % suggestions.length].name))
        return
      }
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        setText((t) => t.replace(/@[\p{L}]*$/u, ''))
        return
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.chat}>
      <ol ref={listRef} className={styles.list} aria-label="Pesan chat">
        {visible.map((m) => {
          const mine = m.fromId === SELF_ID
          const mentionsMe = !mine && m.text.includes('@Anda')
          return (
            <li key={m.id} className={styles.msg} data-mine={mine} data-private={m.toId !== null} data-palette={paletteOf(m.fromId)}>
              <div className={styles.meta}>
                {!mine && <i className={styles.dot} aria-hidden="true" />}
                <b>{mine ? 'Anda' : nameOf(m.fromId)}</b>
                <time>{formatChatTime(m.at)}</time>
                {m.toId !== null && (
                  <span className={styles.private}>
                    <Lock size={11} strokeWidth={2} aria-hidden="true" />
                    Pribadi{mine ? ` ke ${nameOf(m.toId)}` : ' untuk Anda'}
                  </span>
                )}
              </div>
              <p className={styles.bubble} data-mention={mentionsMe}>
                {m.text}
              </p>
            </li>
          )
        })}
        {chat.typingId && chat.typingId !== SELF_ID && (
          <li className={styles.typing} aria-live="polite">
            <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
            {nameOf(chat.typingId)} sedang mengetik
          </li>
        )}
      </ol>

      <div className={styles.composer}>
        {suggestions.length > 0 && (
          <ul className={styles.mentions} role="listbox" aria-label="Sebut peserta">
            {suggestions.map((p, i) => (
              <li key={p.id} role="option" aria-selected={i === highlight % suggestions.length} data-palette={p.palette}>
                <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => setText(applyMention(text, p.name))}>
                  <i className={styles.dot} aria-hidden="true" />
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className={styles.to}>
          <span>Kirim ke</span>
          <select value={toId ?? ''} onChange={(e) => setToId(e.target.value || null)}>
            <option value="">Semua orang</option>
            {participants.filter((p) => p.id !== SELF_ID).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (pribadi)
              </option>
            ))}
          </select>
        </label>
        <div className={styles.row}>
          <input
            value={text}
            maxLength={500}
            placeholder={toId ? `Pesan pribadi ke ${nameOf(toId)}` : 'Tulis pesan, ketik @ untuk menyebut'}
            aria-label="Tulis pesan"
            onChange={(e) => {
              setText(e.target.value)
              setHighlight(0)
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className={styles.send} aria-label="Kirim pesan" disabled={!text.trim()} onClick={send}>
            <SendHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

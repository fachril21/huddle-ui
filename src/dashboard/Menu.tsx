import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { Sheet } from '../mobile/Sheet'
import { useViewport } from '../mobile/useViewport'
import styles from './Menu.module.css'

export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly keyHint?: string
  readonly tone?: 'danger' | 'primary'
  readonly onSelect: () => void
}

interface TriggerProps {
  readonly ref: (el: HTMLButtonElement | null) => void
  readonly id: string
  readonly 'aria-haspopup': 'menu'
  readonly 'aria-expanded': boolean
  readonly 'aria-controls': string | undefined
  readonly onClick: () => void
  readonly onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void
}

interface MenuProps {
  items: readonly MenuItem[]
  trigger: (props: TriggerProps, open: boolean) => ReactNode
  align?: 'start' | 'end'
  width?: number
  /** Called when the menu opens or closes, so a parent can raise the row that owns it */
  onOpenChange?: (open: boolean) => void
  /** Phone only: the sheet's title, and what to show above the choices */
  title?: string
  sheetHeader?: ReactNode
  /** Fill the width of the parent instead of the trigger */
  block?: boolean
}

const ESTIMATED_ITEM_PX = 56

/** A button-triggered menu with arrow-key roving focus. Opens below, flips above when the viewport is short. */
export function Menu({ items, trigger, align = 'start', width = 300, onOpenChange, title = 'Pilih aksi', sheetHeader, block }: MenuProps) {
  const asSheet = useViewport().sizeClass === 'phone'
  const [open, setOpen] = useState(false)
  const [flip, setFlip] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const triggerEl = useRef<HTMLButtonElement | null>(null)
  const itemEls = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()
  const menuId = `${uid}-menu`

  const set = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  useLayoutEffect(() => {
    if (!open || !triggerEl.current) return
    const rect = triggerEl.current.getBoundingClientRect()
    setFlip(window.innerHeight - rect.bottom < items.length * ESTIMATED_ITEM_PX + 24 && rect.top > window.innerHeight - rect.bottom)
  }, [open, items.length])

  useEffect(() => {
    if (open && !asSheet) itemEls.current[0]?.focus()
  }, [open, asSheet])

  useEffect(() => {
    if (!open || asSheet) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) set(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set only wraps state setters
  }, [open, asSheet])

  const focusItem = (index: number) => itemEls.current[(index + items.length) % items.length]?.focus()

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const current = itemEls.current.findIndex((el) => el === document.activeElement)
    if (e.key === 'ArrowDown') focusItem(current + 1)
    else if (e.key === 'ArrowUp') focusItem(current - 1)
    else if (e.key === 'Home') focusItem(0)
    else if (e.key === 'End') focusItem(items.length - 1)
    else if (e.key === 'Escape') {
      set(false)
      triggerEl.current?.focus()
    } else if (e.key === 'Tab') set(false)
    else return
    if (e.key !== 'Tab') e.preventDefault()
  }

  const props: TriggerProps = {
    ref: (el) => {
      triggerEl.current = el
    },
    id: `${uid}-trigger`,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: () => set(!open),
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' && !open) {
        e.preventDefault()
        set(true)
      }
    },
  }

  return (
    <div ref={root} className={styles.root} data-block={block || undefined}>
      {trigger(props, open)}
      {open && asSheet && (
        <Sheet
          title={title}
          onClose={() => {
            set(false)
            triggerEl.current?.focus()
          }}
        >
          {sheetHeader}
          <div className={styles.sheetList} role="menu" aria-label={title}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={styles.sheetItem}
                data-tone={item.tone}
                onClick={() => {
                  set(false)
                  item.onSelect()
                }}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.text}>
                  <span className={styles.label}>{item.label}</span>
                  {item.description && <span className={styles.desc}>{item.description}</span>}
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {open && !asSheet && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={props.id}
          className={`glass-2 ${styles.menu}`}
          data-align={align}
          data-flip={flip || undefined}
          style={{ width }}
          onKeyDown={onMenuKey}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemEls.current[i] = el
              }}
              type="button"
              role="menuitem"
              className={styles.item}
              data-tone={item.tone}
              onClick={() => {
                set(false)
                item.onSelect()
              }}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span className={styles.text}>
                <span className={styles.label}>{item.label}</span>
                {item.description && <span className={styles.desc}>{item.description}</span>}
              </span>
              {item.keyHint && (
                <kbd className="keycap" aria-hidden="true">
                  {item.keyHint}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

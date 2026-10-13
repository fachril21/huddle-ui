import { useCallback, useState } from 'react'

const KEY = 'huddle.soundboard.favorites'

function read(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

/** Favorites live per device in localStorage (Design.md 12.3); storage can be blocked, so every access is guarded. */
export function useFavoriteSounds() {
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(read)

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        window.localStorage.setItem(KEY, JSON.stringify([...next]))
      } catch {
        /* storage unavailable: favorites last for this session only */
      }
      return next
    })
  }, [])

  return { favorites, toggle }
}

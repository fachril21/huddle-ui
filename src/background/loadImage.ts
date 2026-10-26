import { useEffect, useState } from 'react'

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Gambar tidak bisa dimuat: ${src}`))
    image.src = src
  })
}

/** The first source that loads. Rejects only when none of them do. */
export async function loadFirstImage(sources: readonly string[]): Promise<HTMLImageElement> {
  for (const src of sources) {
    try {
      return await load(src)
    } catch {
      // try the next one
    }
  }
  throw new Error('Tidak ada gambar yang bisa dimuat')
}

/** The address of the first source that loads, or null while looking or when none do. Used where an `<img>` would not fall back by itself. */
export function useWorkingSource(sources: readonly string[]): string | null {
  const key = sources.join('|')
  const [found, setFound] = useState<{ key: string; src: string | null }>({ key, src: null })

  useEffect(() => {
    let cancelled = false
    const list = key === '' ? [] : key.split('|')
    void loadFirstImage(list)
      .then((image) => !cancelled && setFound({ key, src: image.src }))
      .catch(() => !cancelled && setFound({ key, src: null }))
    return () => {
      cancelled = true
    }
  }, [key])

  return found.key === key ? found.src : null
}

import { useCallback, useEffect, useState } from 'react'
import { clearCustomBlob, loadCustomBlob, prepareUpload, saveCustomBlob, UploadError } from './customStore'
import type { UploadProblem } from './uploadRules'

export interface CustomBackground {
  /** The stored picture as a local address, or null while loading and when there is none */
  readonly url: string | null
  /** False until the store has been looked at once, so a saved choice is not dropped too early */
  readonly ready: boolean
  readonly busy: boolean
  readonly problem: UploadProblem | null
  upload: (file: File) => Promise<boolean>
  remove: () => Promise<void>
}

/** The one picture the person uploaded, kept on this device. */
export function useCustomBackground(): CustomBackground {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<UploadProblem | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadCustomBlob().then((stored) => {
      if (cancelled) return
      setBlob(stored)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const made = URL.createObjectURL(blob)
    setUrl(made)
    return () => URL.revokeObjectURL(made)
  }, [blob])

  const upload = useCallback(async (file: File) => {
    setBusy(true)
    setProblem(null)
    try {
      const prepared = await prepareUpload(file)
      await saveCustomBlob(prepared)
      setBlob(prepared)
      return true
    } catch (error) {
      setProblem(error instanceof UploadError ? error.problem : 'unreadable')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const remove = useCallback(async () => {
    setProblem(null)
    await clearCustomBlob()
    setBlob(null)
  }, [])

  return { url, ready, busy, problem, upload, remove }
}

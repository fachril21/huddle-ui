import { MAX_UPLOAD_WIDTH, checkUpload, fitWidth } from './uploadRules'
import type { UploadProblem } from './uploadRules'

const DB_NAME = 'huddle.background'
const STORE = 'custom'
const KEY = 'image'
const OUTPUT_TYPE = 'image/webp'
const OUTPUT_QUALITY = 0.9

/** Used when the browser will not let us keep files (private windows): the picture then lasts until the page closes. */
let memory: Blob | null = null

export class UploadError extends Error {
  readonly problem: UploadProblem
  constructor(problem: UploadProblem) {
    super(problem)
    this.problem = problem
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB tidak tersedia'))
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB gagal dibuka'))
  })
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB gagal'))
    })
  } finally {
    db.close()
  }
}

export async function loadCustomBlob(): Promise<Blob | null> {
  try {
    const stored = await run<unknown>('readonly', (store) => store.get(KEY))
    return stored instanceof Blob ? stored : memory
  } catch {
    return memory
  }
}

export async function saveCustomBlob(blob: Blob): Promise<void> {
  memory = blob
  try {
    await run('readwrite', (store) => store.put(blob, KEY))
  } catch {
    // kept in memory for this session only
  }
}

export async function clearCustomBlob(): Promise<void> {
  memory = null
  try {
    await run('readwrite', (store) => store.delete(KEY))
  } catch {
    // nothing stored, nothing to clear
  }
}

/** Checks a chosen file, then shrinks it to what a video background needs. Throws an UploadError with the reason. */
export async function prepareUpload(file: File): Promise<Blob> {
  const problem = checkUpload(file)
  if (problem) throw new UploadError(problem)

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new UploadError('unreadable')
  }
  try {
    const { width, height } = fitWidth(bitmap.width, bitmap.height, MAX_UPLOAD_WIDTH)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new UploadError('unreadable')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY))
    if (!blob) throw new UploadError('unreadable')
    return blob
  } finally {
    bitmap.close()
  }
}

import memoize from 'memoizee'

import { pathParse, serializePath } from 'svg-path-parse'

import { useEffect, useRef, useState, useLayoutEffect } from 'react'

import { LaTeXSVGData, InlineBaselineMetrics } from './types'

export const range = (n: number): number[] => Array.from(Array(n).keys())

/* global fetch */

export const hashString = function (str: string): number {
  let hash = 0
  let i: number
  let chr: number
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const queryParameters = (obj: { [key: string]: string }): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

const cacheBust = '8'
const LATEX_FETCH_MAX_RETRIES = 1
const LATEX_FETCH_RETRY_BASE_MS = 200
const LATEX_FETCH_RETRY_JITTER_MS = 150

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const retryDelayMs = (attempt: number): number =>
  LATEX_FETCH_RETRY_BASE_MS * Math.max(1, attempt) +
  Math.floor(Math.random() * LATEX_FETCH_RETRY_JITTER_MS)

/**
 * A failure that retrying cannot fix: a LaTeX compilation error, or any HTTP
 * error response that is not a queue timeout. Previously these were thrown from
 * inside the same `try` as the fetch, so the outer `catch` retried them like a
 * transient failure -- doubling the compile load of every broken expression.
 */
class NonRetryableLaTeXError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NonRetryableLaTeXError'
  }
}
type LaTeXFetchPayload = {
  svg: string
  inlineBaselineMetrics?: InlineBaselineMetrics
}

/* ------------------------------------------------------------------ *
 * Client-side request batching
 *
 * Every <Morph> fetches independently, so a slide fired N parallel GETs and the
 * browser's ~6-connections-per-host limit capped how much the server could
 * batch. Expressions requested within BATCH_WINDOW_MS of each other are sent as
 * a single POST /latex/batch instead, which removes that ceiling: the server
 * compiles the whole slide in one LaTeX run.
 *
 * Servers without /latex/batch (the original server-concmath.ts) are detected on
 * first use and the client permanently reverts to per-expression GETs, so this
 * is safe to ship against either server.
 * ------------------------------------------------------------------ */

const BATCH_WINDOW_MS = 12
const BATCH_MAX_ITEMS = 48

type BatchWaiter = {
  tex: string
  resolve: (p: LaTeXFetchPayload) => void
  reject: (e: any) => void
}

/** null = not probed yet, true/false = server's answer, sticky for the session. */
let batchSupported: boolean | null = null
let batchQueue: BatchWaiter[] = []
let batchTimer: ReturnType<typeof setTimeout> | null = null

const scheduleBatchFlush = (): void => {
  if (batchTimer) return
  batchTimer = setTimeout(() => {
    batchTimer = null
    void flushBatch()
  }, BATCH_WINDOW_MS)
}

const flushBatch = async (): Promise<void> => {
  if (batchQueue.length === 0) return
  const group = batchQueue.splice(0, BATCH_MAX_ITEMS)
  if (batchQueue.length > 0) scheduleBatchFlush()

  // A single expression is not worth a POST.
  if (group.length === 1) {
    void singleFetchInto(group[0])
    return
  }

  const meta = LaTeX.getUseBaselineMetadataEnvelope() ? '1' : '0'
  try {
    const result = await fetch(`${LaTeX.getHost()}/latex/batch`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tex: group.map((g) => g.tex),
        preamble: LaTeX.getPreamble(),
        meta
      })
    })
    if (!result.ok) throw new Error(`batch endpoint returned ${result.status}`)
    const payload = await result.json()
    if (!payload || !Array.isArray(payload.results) || payload.results.length !== group.length) {
      throw new Error('batch endpoint returned an unexpected payload')
    }
    batchSupported = true
    group.forEach((g, i) => {
      const r = payload.results[i]
      if (r && typeof r.svg === 'string') {
        g.resolve({ svg: r.svg, inlineBaselineMetrics: r.metrics || undefined })
      } else {
        g.reject(new Error(r?.error || `Could not compile '${g.tex}'`))
      }
    })
  } catch (e) {
    // Either the server has no /latex/batch, or the batch itself failed.
    // Stop using it and serve this group the old way so nothing is lost.
    if (batchSupported === null) {
      batchSupported = false
      console.info(
        '%cLaTeX: server has no /latex/batch, using per-expression requests',
        'color: #6A6A6A'
      )
    }
    group.forEach((g) => void singleFetchInto(g))
  }
}

const singleFetchInto = (w: BatchWaiter): Promise<void> =>
  LaTeX.fetchSVGPayloadSingle(w.tex).then(w.resolve, w.reject)

export const LaTeX = {
  _preamble: ``,
  _host: `http://${typeof window !== 'undefined' ? window.location.hostname : 'example.com'
    }:3001`,
  // Default ON. The decks enable this from a mount effect, which runs *after*
  // the first render, so the earliest <Morph> fetches could go out at meta=0 and
  // then be re-fetched at meta=1 once the flag flipped (the flip bumps
  // _cacheGeneration, invalidating the client memo). The old server also keyed
  // its cache on `meta`, so those first expressions were compiled twice.
  // Defaulting to true removes the race structurally: no request is ever
  // issued at meta=0, and the decks' setLaTeXBaselineMetadataMode(true) becomes
  // a no-op that cannot bump the cache generation.
  _useBaselineMetadataEnvelope: true,
  _cacheGeneration: 0,
  getHost: (): string => LaTeX._host,
  setHost: (h: string): void => {
    LaTeX._host = h
  },
  getUseBaselineMetadataEnvelope: (): boolean => LaTeX._useBaselineMetadataEnvelope,
  setUseBaselineMetadataEnvelope: (enabled: boolean): void => {
    if (LaTeX._useBaselineMetadataEnvelope !== enabled) {
      LaTeX._cacheGeneration += 1
    }
    LaTeX._useBaselineMetadataEnvelope = enabled
  },
  getPreamble: (): string => LaTeX._preamble,
  setPreamble: (p: string): void => {
    LaTeX._preamble = normalizeLaTeXPreamble(p)
  },
  /** The original per-expression GET. Still the fallback path. */
  fetchSVGPayloadSingle: async (tex: string): Promise<LaTeXFetchPayload> => {
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= LATEX_FETCH_MAX_RETRIES; attempt++) {
      try {
        const result = await fetch(
          `${LaTeX.getHost()}/latex?${queryParameters({
            cachebust: cacheBust,
            tex: tex,
            preamble: LaTeX.getPreamble(),
            meta: LaTeX.getUseBaselineMetadataEnvelope() ? '1' : '0'
          })}`,
          { mode: 'cors' }
        )

        if (result.ok) {
          const contentType = result.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const payload = await result.json()
            if (!payload || typeof payload.svg !== 'string') {
              throw new Error('LaTeX server returned invalid metadata payload.')
            }
            return {
              svg: payload.svg,
              inlineBaselineMetrics: payload.metrics || undefined
            }
          }
          return {
            svg: await result.text()
          }
        }

        let error: any = null
        try {
          error = await result.json()
        } catch {
          error = { message: await result.text() }
        }

        const canRetry =
          result.status === 503 && error?.name === 'QueueTimeout'
        if (canRetry && attempt < LATEX_FETCH_MAX_RETRIES) {
          await sleep(retryDelayMs(attempt + 1))
          continue
        }

        if (error?.name === 'CompilationError') {
          throw new NonRetryableLaTeXError(
            `Could not compile '${error.tex}': ${error.latexErrors.join('\n')}`
          )
        }
        throw new NonRetryableLaTeXError(
          error?.message || `LaTeX request failed (${result.status})`
        )
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        lastError = e instanceof NonRetryableLaTeXError ? e : new Error(message)
        // Only transport-level failures are worth another attempt; a compile
        // error will fail identically no matter how many times we ask.
        if (e instanceof NonRetryableLaTeXError) {
          break
        }
        if (attempt < LATEX_FETCH_MAX_RETRIES) {
          await sleep(retryDelayMs(attempt + 1))
          continue
        }
        break
      }
    }

    throw lastError || new Error('LaTeX request failed.')
  },
  /**
   * Front door. Coalesces concurrent callers into one POST /latex/batch when the
   * server supports it, otherwise behaves exactly like the original GET path.
   */
  fetchSVGPayload: (tex: string): Promise<LaTeXFetchPayload> => {
    if (batchSupported === false) return LaTeX.fetchSVGPayloadSingle(tex)
    return new Promise<LaTeXFetchPayload>((resolve, reject) => {
      batchQueue.push({ tex, resolve, reject })
      if (batchQueue.length >= BATCH_MAX_ITEMS) {
        if (batchTimer) {
          clearTimeout(batchTimer)
          batchTimer = null
        }
        void flushBatch()
      } else {
        scheduleBatchFlush()
      }
    })
  },
  fetchSVG: async (tex: string): Promise<string> => {
    const payload = await LaTeX.fetchSVGPayload(tex)
    return payload.svg
  }
}

function normalizeLaTeXPreamble(preamble: string) {
  return preamble
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n')
}

function elementToPath(child: SVGElement, transform = ''): string | null {
  if (!child.ownerSVGElement) {
    throw new Error('Found a child without ownerSVGElement')
  }
  const svg: SVGSVGElement = child.ownerSVGElement
  if (child.tagName === 'use') {
    const offsetX = parseFloat(child.getAttribute('x') || '0')
    const offsetY = parseFloat(child.getAttribute('y') || '0')

    const id = child.getAttribute('xlink:href')
    if (!id) {
      throw new Error('Found a use tag without an id.')
    }

    const element: SVGElement | null = svg.querySelector(id)
    if (!element) {
      console.error(
        'I found a use tag with id',
        id,
        child,
        "but I didn't find a definition in the svg: ",
        svg
      )
      return null
    }
    if (element.tagName === 'path') {
      const path = element.getAttribute('d')
      if (!path) {
        return null
      }
      const { err, segments, type } = pathParse(path).relNormalize({
        transform: `translate(${offsetX}, ${offsetY}) ${transform}`.trim()
      })

      const newPath = serializePath({ err, segments: segments, type })

      return newPath
    } else if (element.tagName === 'use') {
      const tr = element.getAttribute('transform') || ''
      return elementToPath(
        element,
        `translate(${offsetX}, ${offsetY}) ${transform} ${tr}`.trim()
      )
    } else {
      console.error('Unrecognized use of element', element)
      return null
    }
  }

  if (child.tagName === 'rect') {
    const x = +child.getAttribute('x')!
    const y = +child.getAttribute('y')!
    const width = +child.getAttribute('width')!
    const height = +child.getAttribute('height')!

    const pathData =
      'M' + x + ' ' + y + 'H' + (x + width) + 'V' + (y + height) + 'H' + x + 'z'
    return pathData
  }
  // TODO polyline or something like that
  console.error('Unrecognized:', child)
  return null
}

function groupIdFromElement(element: SVGElement): string {
  const fill = element.getAttribute('fill')
  if (!fill) {
    return 'g0'
  }
  return 'g' + fill.slice(1)
}

function svgToGroupedPaths(svg: SVGSVGElement) {
  const byGroupId: { [key: string]: string } = {}

  for (const child of Array.from(svg.getElementById('page1').children)) {
    const tr = child.getAttribute('transform') || ''
    const id = groupIdFromElement(child as SVGElement)
    let path: string | null
    if (child.tagName === 'g') {
      path = Array.from(child.children)
        .map((subchild) => elementToPath(subchild as SVGElement, tr as string))
        .filter(Boolean)
        .join(' ')
    } else {
      path = elementToPath(child as SVGElement, tr as string)
    }
    if (!path) continue

    if (!byGroupId[id]) {
      byGroupId[id] = ''
    }
    byGroupId[id] += path
  }

  return byGroupId
}

function colorHash(str: string): string {
  str = String(str)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let colour = ''
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colour += ('00' + value.toString(16)).substr(-2).toUpperCase()
  }
  return colour
}

/* ------------------------------------------------------------------ *
 * Persistent SVG cache (IndexedDB)
 *
 * The in-memory memo dies with the page, so every reload recompiled the whole
 * deck. This stores the *parsed* result so a reload costs neither a network
 * round trip nor a re-parse.
 *
 * Every operation degrades to a no-op: IndexedDB is unavailable in some private
 * windows and can throw on open, so a failure here must never stop a slide from
 * rendering. Entries carry a schema tag and an age limit, and the key includes
 * the host and preamble, so changing server or profile cannot serve stale
 * geometry.
 * ------------------------------------------------------------------ */

const IDB_NAME = 'immersion-latex'
const IDB_STORE = 'svg'
/** Bump to invalidate every persisted entry (e.g. if LaTeXSVGData changes). */
const IDB_SCHEMA = 'v1'
const IDB_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

type PersistedEntry = { schema: string; storedAt: number; data: LaTeXSVGData }

let idbPromise: Promise<IDBDatabase | null> | null = null

const openIdb = (): Promise<IDBDatabase | null> => {
  if (idbPromise) return idbPromise
  idbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return idbPromise
}

/** Stable across reloads: deliberately excludes the in-session cache generation. */
const persistKey = (tex: string): string =>
  `${IDB_SCHEMA}|${LaTeX.getHost()}|${LaTeX.getPreamble()}|${
    LaTeX.getUseBaselineMetadataEnvelope() ? 'm1' : 'm0'
  }|${tex}`

const idbGet = async (key: string): Promise<LaTeXSVGData | null> => {
  try {
    const db = await openIdb()
    if (!db) return null
    return await new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly')
        const req = tx.objectStore(IDB_STORE).get(key)
        req.onsuccess = () => {
          const v = req.result as PersistedEntry | undefined
          if (!v || v.schema !== IDB_SCHEMA) return resolve(null)
          if (Date.now() - v.storedAt > IDB_MAX_AGE_MS) return resolve(null)
          resolve(v.data)
        }
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

const idbPut = async (key: string, data: LaTeXSVGData): Promise<void> => {
  try {
    const db = await openIdb()
    if (!db) return
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite')
        const entry: PersistedEntry = { schema: IDB_SCHEMA, storedAt: Date.now(), data }
        tx.objectStore(IDB_STORE).put(entry, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
        tx.onabort = () => resolve()
      } catch {
        resolve()
      }
    })
  } catch {
    /* persistence is best-effort */
  }
}

/** Drop everything persisted. Exposed for debugging and for rollback. */
export const clearPersistedLaTeXCache = async (): Promise<void> => {
  try {
    const db = await openIdb()
    if (!db) return
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch {
    /* ignore */
  }
}

/**
 * Cached compile. This rejects on failure rather than resolving to `null`, and
 * is memoized with `promise: true` so memoizee evicts the entry when the
 * promise rejects. Previously a failure resolved to `null`, which memoizee
 * cached *permanently*: one aborted or failed request meant that expression
 * stayed blank for the lifetime of the page, even after the server recovered.
 * `fetchLaTeXSvg` below restores the `null`-on-failure contract for callers.
 */
const fetchLaTeXSvgUncached = memoize(
  async (tex: string): Promise<LaTeXSVGData> => {
    /* console.log('compiling', tex) */
    tex = tex.replace(/\\g(\d)/g, (_, p1) => `\\g{${colorHash(p1)}}`)
    tex = tex.replace(/\\g\{(.*?)\}/g, (_, p1) => `\\g{${colorHash(p1)}}`)

    // console.log('COMPILING', tex)
    // A previous session may already have this expression parsed.
    const persistedKey = persistKey(tex)
    const persisted = await idbGet(persistedKey)
    if (persisted) return persisted

    let text: string
    let inlineBaselineMetrics: InlineBaselineMetrics | undefined
    const payload = await LaTeX.fetchSVGPayload(tex)
    text = payload.svg
    inlineBaselineMetrics = payload.inlineBaselineMetrics

    const ele = document.createElement('div')
    ele.innerHTML = text

    const svg = ele.querySelector('svg')

    if (!svg) {
      throw new Error(`Could not find SVG in compiled LaTeX ${tex}`)
    }

    const groups = svgToGroupedPaths(svg)

    const width = svg.getAttribute('width')
    const height = svg.getAttribute('height')
    const viewBox = svg.getAttribute('viewBox')
    if (!width || !height || !viewBox) {
      throw new Error('Compiled LaTeX SVG has no height or width or viewBox')
    }
    const parsed: LaTeXSVGData = {
      groups,
      width: parseFloat(width.replace('pt', '')),
      height: parseFloat(height.replace('pt', '')),
      viewBox: viewBox.split(' ').map((s) => parseFloat(s)),
      inlineBaselineMetrics
    }
    // Fire-and-forget: never make rendering wait on persistence.
    void idbPut(persistedKey, parsed)
    return parsed
  },
  {
    // `promise: true` makes memoizee drop the cache entry if the promise
    // rejects, so a transient failure is retried on the next render instead of
    // being remembered forever.
    promise: true,
    normalizer: (args) =>
      `${LaTeX._cacheGeneration}|${LaTeX.getHost()}|${LaTeX.getPreamble()}|${LaTeX.getUseBaselineMetadataEnvelope() ? 'm1' : 'm0'}|${args[0]}`
  }
)

/**
 * Public API, unchanged for callers: resolves to `null` when an expression
 * cannot be produced, so `lib/morph.ts` renders nothing rather than throwing.
 * The difference from before is that the failure is no longer cached.
 */
export const fetchLaTeXSvg = async (
  tex: string
): Promise<LaTeXSVGData | null> => {
  try {
    return await fetchLaTeXSvgUncached(tex)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`%cLaTeXError: ${message}`, 'color: #AD1457')
    return null
  }
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((t: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error)
    }
  }
  return [storedValue, setValue] as const
}

export const isBrowser = typeof window !== 'undefined'
export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

export const setLaTeXBaselineMetadataMode = (enabled: boolean): void => {
  LaTeX.setUseBaselineMetadataEnvelope(enabled)
}

export const getLaTeXBaselineMetadataMode = (): boolean =>
  LaTeX.getUseBaselineMetadataEnvelope()

import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef
} from 'react'

import { getSlidesInfo, SlidesInfo } from './staticAnalysis'

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useParams,
  generatePath,
  useRouteMatch,
  useHistory
} from 'react-router-dom'

import { CitationProvider } from './Citations'
import AnimationEditor from './AnimationEditor'
import { LaTeX, fetchLaTeXSvg, useIsomorphicLayoutEffect } from './utils'

type PresentationRenderFunction = (arg: {
  slideIndex: number
  stepIndex: number
  slidesInfo: SlidesInfo
  slides: React.ReactChild[]
}) => React.ReactNode

export type StepAndSlide = {
  slideIndex: number
  stepIndex: number
  setSlideAndStep?: (slideIndex: number, stepIndex: number) => void
}

type EmbedRenderFunc = (arg: {
  slideIndex: number
  stepIndex: number
  slidesInfo: SlidesInfo
  presentation: React.ReactElement
  next: (skip: boolean) => void
  prev: (skip: boolean) => void
}) => React.ReactElement

export type PresentationProps = {
  children: React.ReactNode
  bibUrl?: string
  compileHost?: string
  preamble?: string
  embed?: boolean
  embedOptions?: {
    stepIndex: number
    slideIndex: number
    render: EmbedRenderFunc
  }
}

export type RenderFunc = {
  render: PresentationRenderFunction
}

export type Mode = {
  mode: 'embed' | 'edit' | 'presenter' | 'fullscreen'
}

/* global localStorage */
export function RenderPresentation({
  ...props
}: PresentationProps & RenderFunc): React.ReactElement {
  if (props.embed) {
    return <PresentationEmbedWrapper {...props} />
  }

  return (
    <Router>
      <Switch>
        <Route exact path='/storage'>
          <Storage />
        </Route>

        <Route path='/presenter/:slideIndex?/:stepIndex?'>
          <PresentationRouteWrapper {...props} mode='presenter' />
        </Route>
        <Route path='/fullscreen/:slideIndex?/:stepIndex?'>
          <PresentationRouteWrapper {...props} mode='fullscreen' />
        </Route>
        <Route path='/overview'>
          <PresentationOverview {...props} />
        </Route>
        <Route path='/:slideIndex?/:stepIndex?' exact={false}>
          <PresentationRouteWrapper {...props} mode='edit' />
        </Route>
      </Switch>
    </Router>
  )
}

function PresentationEmbedWrapper({
  ...props
}: PresentationProps & RenderFunc) {
  const [slideIndex, setSlideIndex] = useState(props?.embedOptions?.slideIndex)
  const [stepIndex, setStepIndex] = useState(props?.embedOptions?.slideIndex)

  return (
    <PresentationUI
      {...props}
      mode='embed'
      stepIndex={stepIndex || 0}
      slideIndex={slideIndex || 0}
      setSlideAndStep={(slide, step) => {
        setSlideIndex(slide)
        setStepIndex(step)
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Shared pointer.
//
// Presenter mode shows the live slide in a pane that is smaller than the window
// and sits beside the notes and the clock, while the audience window shows the
// same slide at a different size - and possibly at a different zoom. So nothing
// useful can be sent in pixels. What travels over the socket is the position as
// a FRACTION of the slide box (0..1 on each axis), measured against the .slide
// element. The receiving window multiplies by its own .slide rect, which makes
// it correct at any pane size, window size or zoom level.
//
// Both presenter and fullscreen broadcast, and both draw the dot, so pointing
// works in whichever window the mouse happens to be in. Over the slide the dot
// REPLACES the native cursor (cursor: none on the slide box), so there is one
// pointer on screen rather than two. Edit mode is excluded: it needs a real
// cursor for the animation editor beside the slide.
// ---------------------------------------------------------------------------

type PointerPos = { x: number; y: number }

// Transport.
//
// The websocket server may be a long way off - over an SSH tunnel to a compute
// node, in the setup this deck is presented from - and a pointer update that
// goes out to it and back pays two tunnel traversals per mouse move. Measured
// on the node itself the socket is 2ms, but that number does not include the
// tunnel, and the tunnel is the whole cost.
//
// Two windows of the same deck are the same origin in the same browser, so
// they also have BroadcastChannel, which never leaves the machine: 0.7ms
// median, measured side by side with the socket. So updates go out over both.
// BroadcastChannel wins whenever the peer is in this browser; the socket is
// what reaches a window in a different browser or on a different machine.
//
// Sending twice means the same update can arrive twice, and the slower copy
// carries a stale position - which would drag the dot backwards. Each window
// stamps its messages with an id and a counter, and a receiver drops anything
// not newer than what it has already applied from that sender.
const POINTER_CHANNEL = 'immersion:pointer'
const SELF_ID = Math.random().toString(36).slice(2)
let pointerSeq = 0
const lastAppliedSeq = new Map<string, number>()

const makeChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === 'undefined') return null
  try {
    return new BroadcastChannel(POINTER_CHANNEL)
  } catch {
    return null
  }
}

// Returns false when the message is a duplicate or out of order.
const acceptPointerMessage = (msg: {
  src?: string
  seq?: number
}): boolean => {
  if (msg.src === SELF_ID) return false
  // A peer running an older build sends no counter; take it as it comes.
  if (typeof msg.src !== 'string' || typeof msg.seq !== 'number') return true
  const seen = lastAppliedSeq.get(msg.src)
  if (seen !== undefined && msg.seq <= seen) return false
  lastAppliedSeq.set(msg.src, msg.seq)
  return true
}

// 'local' is this window's own mouse, 'remote' is the other window's, arriving
// over the socket. The dot shows the local position when there is one, because
// a cursor replacement that waits for a socket round trip feels broken.
type PointerSource = 'local' | 'remote'

// The socket lives in PresentationRouteWrapper but the dot is drawn in
// PresentationUI, so instead of threading a prop through the render function
// the two talk through this tiny store.
let pointerSubscribers: Array<
  (p: PointerPos | null, source: PointerSource) => void
> = []
const publishPointer = (
  p: PointerPos | null,
  source: PointerSource = 'remote'
) => pointerSubscribers.forEach((f) => f(p, source))

// The live slide, which is not simply the first .slide in the DOM:
//   fullscreen renders three (previous, current, next) and the first is the
//     outgoing transition ghost - scaled up and at opacity 0;
//   presenter renders two (the live pane and the half-size next-step preview)
//     and there the first one IS the live pane.
// Picking the most visible, earliest element satisfies both.
const liveSlideEl = (): HTMLElement | null => {
  const all = Array.from(document.querySelectorAll('.slide')) as HTMLElement[]
  if (!all.length) return null
  let best = all[0]
  let bestOpacity = -1
  for (const el of all) {
    const o = parseFloat(getComputedStyle(el).opacity || '1')
    if (o > bestOpacity + 1e-3) {
      best = el
      bestOpacity = o
    }
  }
  return best
}

function useSlidePointer(
  ws: WebSocket,
  bc: BroadcastChannel | null,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return
    let last: PointerPos | null = null
    let lastSentAt = 0

    const send = (payload: object) => {
      const stamped = { ...payload, src: SELF_ID, seq: ++pointerSeq }
      // In-browser first, so a peer here never waits on the network.
      try {
        if (bc) bc.postMessage(stamped)
      } catch (e) {
        /* channel closed; the socket still carries it */
      }
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(stamped))
      } catch (e) {
        /* socket not up; nothing to do */
      }
    }

    const onMove = (e: MouseEvent) => {
      const el = liveSlideEl()
      if (!el) return
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        // Outside the slide: hide it rather than clamping to an edge. The
        // native cursor is only hidden over the slide box, so leaving the
        // slide hands the pointer back to the browser.
        if (last) {
          last = null
          publishPointer(null, 'local')
          send({ type: 'pointer', hidden: true })
        }
        return
      }
      last = { x, y }
      // Draw in this window straight away. Only the other window waits for
      // the transport.
      publishPointer(last, 'local')
      // Send from the handler rather than from a requestAnimationFrame. The
      // browser already coalesces mousemove to one event per displayed frame,
      // so this does not increase the message rate - but deferring to the next
      // frame added up to a frame of delay before the update even left. The
      // floor is a guard against platforms that deliver moves faster.
      const t = performance.now()
      if (t - lastSentAt >= 4) {
        lastSentAt = t
        send({ type: 'pointer', x, y })
      }
    }

    const onLeave = () => {
      if (!last) return
      last = null
      publishPointer(null, 'local')
      send({ type: 'pointer', hidden: true })
    }

    window.addEventListener('mousemove', onMove)
    // mouseleave on the document fires when the cursor leaves the viewport.
    // mouseout on the window would also fire on every element boundary inside
    // the slide - over each SVG path - blinking the dot off for a frame.
    // blur covers leaving by alt-tab, where no mouse event fires at all and
    // the dot would otherwise stay painted in the other window.
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
      onLeave()
    }
  }, [ws, bc, enabled])
}

function SlidePointer(): React.ReactElement | null {
  const dot = useRef<HTMLDivElement | null>(null)
  const rect = useRef<DOMRect | null>(null)
  const local = useRef<PointerPos | null>(null)
  const remote = useRef<PointerPos | null>(null)
  const shown = useRef(false)
  const [visible, setVisible] = useState(false)

  // One dot per window. The local mouse wins while it is over the slide, so
  // moving the mouse here never shows two dots or lags behind itself.
  const latest = () => local.current || remote.current

  // Measuring the slide on every pointer message forces a layout each time,
  // which is most of what made this stutter. The slide box only moves on a
  // resize or a zoom, so cache it and refresh it rarely.
  const measure = () => {
    const el = liveSlideEl()
    rect.current = el ? el.getBoundingClientRect() : null
  }

  const paint = () => {
    const r = rect.current
    const p = latest()
    const node = dot.current
    if (!node || !r || !p) return
    // translate3d is composited on the GPU: no layout, no paint of anything
    // else on the page. Writing left/top instead would relayout every frame.
    node.style.transform =
      `translate3d(${r.left + p.x * r.width}px, ${r.top + p.y * r.height}px, 0)`
  }

  useEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    // A zoom moves and resizes the slide box without firing a resize.
    window.addEventListener(ZOOM_EVENT, onResize)
    // Cheap safety net for zoom changes and layout shifts we do not observe.
    const id = window.setInterval(measure, 1000)

    const onPointer = (p: PointerPos | null, source: PointerSource) => {
      if (source === 'local') local.current = p
      else remote.current = p
      if (!latest()) {
        shown.current = false
        setVisible(false)
        return
      }
      if (!shown.current) measure()
      shown.current = true
      setVisible(true)
      // Write the transform now rather than from a requestAnimationFrame.
      // Setting transform does not force layout - the compositor picks it up
      // at the next frame either way - but a message arriving just after a
      // frame callback had already run used to wait out a whole extra frame.
      paint()
    }
    pointerSubscribers.push(onPointer)
    return () => {
      pointerSubscribers = pointerSubscribers.filter((f) => f !== onPointer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(ZOOM_EVENT, onResize)
      window.clearInterval(id)
    }
  }, [])

  // Position the first frame as soon as the node exists, so it does not
  // appear at the origin before the first paint.
  useEffect(() => {
    if (visible) paint()
  }, [visible])

  if (!visible) return null
  return (
    <div
      ref={dot}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 10,
        height: 10,
        marginLeft: -5,
        marginTop: -5,
        borderRadius: '50%',
        background: 'rgba(220, 38, 38, 0.9)',
        boxShadow: '0 0 8px 3px rgba(220, 38, 38, 0.3)',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform'
      }}
    />
  )
}


function PresentationRouteWrapper({
  ...props
}: PresentationProps & RenderFunc & Mode): React.ReactElement {
  const match = useRouteMatch()
  const history = useHistory()


  const setSlideAndStep = (
    slideIndex: number,
    stepIndex: number,
    notify = true
  ) => {
    history.push(generatePath(match.path, { slideIndex, stepIndex }))
    if (notify) {
      /* bc.postMessage({ slideIndex, stepIndex }) */
      try {
        ws.send(JSON.stringify({ slideIndex, stepIndex }))
      } catch (e) {
        console.log('Could not send message to ', ws)
      }
    }
  }

  const ws = useMemo(
    () => {
      const socket = new WebSocket(`ws://${window.location.hostname}:3003`);
      socket.binaryType = "blob";
      return socket;
    },
    []
  )

  const bc = useMemo(makeChannel, [])
  useEffect(() => () => bc?.close(), [bc])

  // Mirror the pointer between the presenter and audience windows, in both
  // directions. Edit and embed modes keep an ordinary cursor.
  useSlidePointer(
    ws,
    bc,
    props.mode === 'presenter' || props.mode === 'fullscreen'
  )

  if (bc) {
    bc.onmessage = (event: MessageEvent) => {
      const msg = event.data
      if (!msg || msg.type !== 'pointer') return
      if (!acceptPointerMessage(msg)) return
      publishPointer(msg.hidden ? null : { x: msg.x, y: msg.y })
    }
  }
  /* const bc = useMemo(() => new BroadcastChannel('presentation'), []) */

  /* bc.onmessage = useCallback((event) => { */
  /*   setSlideAndStep(event.data.slideIndex, event.data.stepIndex, false) */
  /* }, []) */

  // ws.onmessage = (message) => {
  //   try {
  //     const { slideIndex, stepIndex } = JSON.parse(message.data)
  //     setSlideAndStep(slideIndex, stepIndex, false)
  //   } catch (e) {
  //     console.log('Could not parse', message.data, e)
  //   }
  // }
  ws.onmessage = async (event) => {
    try {
      let data = event.data;

      // If it's a Blob, convert to text first
      if (data instanceof Blob) {
        data = await data.text();
      }

      // Now parse as JSON
      const msg = JSON.parse(data);

      // Pointer updates are not navigation. Without this branch they would
      // call setSlideAndStep(undefined, undefined) and break the sync.
      if (msg && msg.type === 'pointer') {
        // Dropped if BroadcastChannel already delivered this update, or a
        // newer one: the socket copy is the slower of the two.
        if (acceptPointerMessage(msg)) {
          publishPointer(msg.hidden ? null : { x: msg.x, y: msg.y });
        }
        return;
      }

      const { slideIndex, stepIndex } = msg;
      setSlideAndStep(slideIndex, stepIndex, false);
    } catch (e) {
      console.error("Could not parse!", event.data, e);
    }
  }

  const {
    slideIndex: slideIndexString = '0',
    stepIndex: stepIndexString = '0'
  } = useParams<RouteParams>()
  const slideIndex = parseInt(slideIndexString)
  const stepIndex = parseInt(stepIndexString)

  return (
    <PresentationUI
      {...props}
      stepIndex={stepIndex}
      slideIndex={slideIndex}
      setSlideAndStep={setSlideAndStep}
    />
  )
}

export const PresentationContext = React.createContext<PresentationContextInterface | null>(
  null
)

export function useIsCurrentlyVisible(stepValue: any, steps: any[]) {
  const context = useContext(PresentationContext)

  if (!context) return false

  const { slideIndex, i, stepIndex } = context

  const isSlideVisible = i === slideIndex
  const isStepVisible = steps[stepIndex] === stepValue

  return isSlideVisible && isStepVisible
}

export interface PresentationContextInterface {
  slideIndex: number
  stepIndex: number
  i: number
  slidesInfo: SlidesInfo
  setTransitions: (arg: any) => void
  transition: Transition
}

type RouteParams = { slideIndex: string; stepIndex: string }

type Transition = {
  before?: React.CSSProperties
  after?: React.CSSProperties
}

export type Transitions = {
  [key: number]: Transition
}

type PresenterTimerState = {
  isRunning: boolean
  startEpochMs: number | null
  accumulatedMs: number
}

const PRESENTER_TIMER_STORAGE_KEY = 'immersion:presentation:presenter-timer'

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

const formatWallClock = (nowMs: number): string => {
  return new Date(nowMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStoredTimerState = (): PresenterTimerState => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { isRunning: false, startEpochMs: null, accumulatedMs: 0 }
  }
  try {
    const raw = localStorage.getItem(PRESENTER_TIMER_STORAGE_KEY)
    if (!raw) {
      return { isRunning: false, startEpochMs: null, accumulatedMs: 0 }
    }
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.isRunning === 'boolean' &&
      (typeof parsed?.startEpochMs === 'number' || parsed?.startEpochMs === null) &&
      typeof parsed?.accumulatedMs === 'number'
    ) {
      return parsed as PresenterTimerState
    }
  } catch (_e) {
    // ignore malformed persisted state and fall back to defaults
  }
  return { isRunning: false, startEpochMs: null, accumulatedMs: 0 }
}

function usePresenterTimer() {
  const [timerState, setTimerState] = useState<PresenterTimerState>(getStoredTimerState)
  const [nowMs, setNowMs] = useState<number>(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(PRESENTER_TIMER_STORAGE_KEY, JSON.stringify(timerState))
      } catch (_e) {
        // ignore storage failures
      }
    }
  }, [timerState])

  const reset = useCallback(() => {
    setTimerState({ isRunning: false, startEpochMs: null, accumulatedMs: 0 })
  }, [])

  const toggle = useCallback(() => {
    setTimerState((s) => {
      if (s.isRunning && s.startEpochMs != null) {
        return {
          isRunning: false,
          startEpochMs: null,
          accumulatedMs: s.accumulatedMs + (Date.now() - s.startEpochMs)
        }
      }
      return { ...s, isRunning: true, startEpochMs: Date.now() }
    })
  }, [])

  const elapsedMs =
    timerState.accumulatedMs +
    (timerState.isRunning && timerState.startEpochMs != null
      ? nowMs - timerState.startEpochMs
      : 0)

  return {
    isRunning: timerState.isRunning,
    elapsedLabel: formatDuration(elapsedMs),
    wallClockLabel: formatWallClock(nowMs),
    toggle,
    reset
  }
}

/* ------------------------------------------------------------------ *
 * Per-window zoom
 *
 * The presentation renders at a fixed 1200x900 and has no scaling of its own,
 * so the only way to resize it was the browser's own zoom. Chrome stores that
 * per *origin*, not per window, so zooming one window silently re-zoomed every
 * other window on the same origin -- which looked like the websocket syncing
 * scale, even though the socket only ever carries {slideIndex, stepIndex}.
 *
 * This is an in-app zoom instead. It is deliberately window-local:
 *   - it lives in component state and is never sent over the websocket,
 *   - it is persisted in sessionStorage, which is per browser tab/window, so a
 *     reload keeps this window's zoom without ever pushing it onto the peer
 *     (localStorage would be shared across windows and would re-couple them).
 *
 * Ctrl/Cmd +  zoom in,  Ctrl/Cmd -  zoom out,  Ctrl/Cmd 0  reset.
 * preventDefault() suppresses the browser's own per-origin zoom, which is the
 * behaviour being replaced.
 * ------------------------------------------------------------------ */

const ZOOM_STORAGE_KEY = 'immersion:presentation:zoom'
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_FACTOR = 1.1

const clampZoom = (z: number): number =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))

// The pointer caches the slide's rect, so it has to be told when the zoom
// moves it. A zoom change fires no resize event, and waiting for the dot's
// one-second safety net leaves it measuring against the old box.
const ZOOM_EVENT = 'immersion:zoom'

const readStoredZoom = (): number => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return 1
  }
  try {
    const raw = sessionStorage.getItem(ZOOM_STORAGE_KEY)
    if (!raw) return 1
    const parsed = parseFloat(raw)
    return Number.isFinite(parsed) && parsed > 0 ? clampZoom(parsed) : 1
  } catch {
    return 1
  }
}

function useWindowLocalZoom(enabled: boolean): number {
  const [zoom, setZoom] = useState<number>(readStoredZoom)

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.setItem(ZOOM_STORAGE_KEY, String(zoom))
    } catch {
      /* private windows can refuse storage; zoom still works in-memory */
    }
    window.dispatchEvent(new Event(ZOOM_EVENT))
  }, [zoom])

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom((z) => clampZoom(z * ZOOM_FACTOR))
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom((z) => clampZoom(z / ZOOM_FACTOR))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
      }
    }
    // Ctrl/Cmd + wheel, and trackpad pinch, which Chrome also delivers as a
    // wheel event with ctrlKey set. These were the gestures that still reached
    // the browser's own per-origin zoom and so moved both windows at once.
    // The listener must be non-passive or preventDefault is ignored.
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      // Scale by distance rather than per notch: a trackpad pinch arrives as
      // many small deltas and stepping by a fixed factor each time overshoots.
      // The coefficient puts one mouse notch (deltaY about 120) near the 1.1x
      // the browser itself uses, and the clamp stops a single coarse event -
      // some mice send 240 or more - from jumping most of the zoom range.
      const factor = Math.min(
        1.25,
        Math.max(0.8, Math.exp(-e.deltaY * 0.0008))
      )
      setZoom((z) => clampZoom(z * factor))
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [enabled])

  return zoom
}

function PresentationUI({
  children,
  render,
  bibUrl,
  preamble = '',
  compileHost = '',
  mode,
  embedOptions,
  setSlideAndStep = () => { },
  slideIndex,
  stepIndex
}: PresentationProps & RenderFunc & StepAndSlide & Mode) {
  const reactSlides = React.Children.toArray(children) as React.ReactElement[]
  const { slidesInfo, citationMap } = useMemo(
    () => getSlidesInfo(reactSlides),
    [children]
  )

  // TODO: this is used multiple times.
  // Extract this.
  useIsomorphicLayoutEffect(() => {
    LaTeX.setPreamble(preamble)
    if (compileHost) {
      console.log('setting host to', compileHost)
      LaTeX.setHost(compileHost)
    }
  }, [])

  const [transitions, setTransitions] = useState<Transitions>({})
  const presenterTimer = usePresenterTimer()
  const togglePresenterTimer = presenterTimer.toggle
  const resetPresenterTimer = presenterTimer.reset

  const getNext = (slideIndex: number, stepIndex: number): [number, number] => {
    if (stepIndex < slidesInfo[slideIndex].steps.length - 1) {
      return [slideIndex, stepIndex + 1]
    }
    if (slideIndex < slidesInfo.length - 1) {
      return [slideIndex + 1, 0]
    }
    return [slideIndex, stepIndex]
  }

  const getPrev = (slideIndex: number, stepIndex: number): [number, number] => {
    if (stepIndex > 0) {
      return [slideIndex, stepIndex - 1]
    }
    if (slideIndex > 0) {
      return [slideIndex - 1, slidesInfo[slideIndex - 1].steps.length - 1]
    }
    return [slideIndex, stepIndex]
  }

  const prev = useCallback(
    (dontStepButGoToPrevSlide: boolean) => {
      if (dontStepButGoToPrevSlide) {
        if (slideIndex > 0) {
          setSlideAndStep(slideIndex - 1, 0)
        }
        return
      }
      setSlideAndStep(...getPrev(slideIndex, stepIndex))
    },
    [slideIndex, stepIndex, setSlideAndStep]
  )

  const next = useCallback(
    (dontStepButGoToNextSlide: boolean) => {
      if (dontStepButGoToNextSlide) {
        if (slideIndex < slidesInfo.length - 1) {
          setSlideAndStep(slideIndex + 1, 0)
        }
      } else {
        setSlideAndStep(...getNext(slideIndex, stepIndex))
      }
    },
    [slideIndex, stepIndex, setSlideAndStep]
  )

  // Window-local: never sent over the websocket, never shared between windows.
  const zoom = useWindowLocalZoom(
    mode === 'fullscreen' || mode === 'presenter'
  )

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (!isTyping && mode === 'presenter' && e.key === ' ') {
        e.preventDefault()
        togglePresenterTimer()
        return
      }
      if (!isTyping && mode === 'presenter' && e.key === 'Backspace' && e.shiftKey) {
        e.preventDefault()
        resetPresenterTimer()
        return
      }

      if (e.key === 'ArrowDown') {
        next(true)
      }
      if (e.key === 'ArrowUp') {
        prev(true)
      }

      if (e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        next(false)
      } else if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        prev(false)
      }
    },
    [next, prev, stepIndex, slideIndex, mode, togglePresenterTimer, resetPresenterTimer]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [handleKey])

  // User supplied slideIndex that is too big, go to last slide/step
  if (slideIndex >= slidesInfo.length) {
    setSlideAndStep(
      slidesInfo.length - 1,
      slidesInfo[slidesInfo.length - 1].steps.length - 1
    )
    return null
  }

  // User supplied stepIndex that is to big, go to last step.
  if (stepIndex >= slidesInfo[slideIndex].steps.length) {
    setSlideAndStep(slideIndex, slidesInfo[slideIndex].steps.length - 1)
    return null
  }

  if (mode === 'presenter') {
    const slides = [
      [slideIndex, stepIndex],
      getNext(slideIndex, stepIndex)
    ].map(([slideIndex, stepIndex], index) =>
      render({
        slideIndex,
        stepIndex,
        slidesInfo,
        slides: [
          <PresentationContext.Provider
            key={index}
            value={{
              i: slideIndex,
              slideIndex,
              slidesInfo,
              stepIndex,
              setTransitions: () => undefined,
              transition: {
                after: { transform: '' },
                before: { transform: '' }
              }
            }}
          >
            {reactSlides[slideIndex]}
          </PresentationContext.Provider>
        ]
      })
    )

    return (
      <div className='flex'>
        <SlidePointer />
        <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
          {/* The zoom transform must stay off the ancestor that holds
              <SlidePointer />: a transformed element becomes the containing
              block for position: fixed descendants, which would rescale the
              dot and measure it against the wrong box. */}
          <div
            className='flex justify-around'
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.12s ease-out'
            }}
          >
            <div className='flex flex-col'>
              {/* The dot stands in for the cursor over the live pane only;
                  the next-step preview and the notes keep a real one. */}
              <div style={{ cursor: 'none' }}>{slides[0]}</div>
              <div className='text-lg'>
                <Clock
                  wallClockLabel={presenterTimer.wallClockLabel}
                  elapsedLabel={presenterTimer.elapsedLabel}
                  isRunning={presenterTimer.isRunning}
                  onToggle={presenterTimer.toggle}
                  onReset={presenterTimer.reset}
                />
              </div>
            </div>
            <div className='flex flex-col'>
              <div
                style={{
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  marginBottom: -450
                }}
              >
                {slides[1]}
              </div>
              <div>{slidesInfo[slideIndex].presenterNotes}</div>
            </div>
          </div>
        </CitationProvider>
      </div>
    )
  }

  const wrappedSlides = reactSlides.map((slide, i) => {
    return (
      <PresentationContext.Provider
        key={i}
        value={{
          i,
          slideIndex,
          slidesInfo: slidesInfo,
          stepIndex:
            i === slideIndex
              ? stepIndex
              : i < slideIndex && slidesInfo[i].steps.length
                ? slidesInfo[i].steps.length - 1
                : 0,
          setTransitions,
          transition: transitions[i]
        }}
      >
        {slide}
      </PresentationContext.Provider>
    )
  })

  const threeSlides = wrappedSlides.slice(
    Math.max(0, slideIndex - 1),
    Math.min(wrappedSlides.length, slideIndex + 2)
  )

  if (mode === 'fullscreen') {
    return (
      <div className='flex justify-center items-center bg-white h-screen'>
        <SlidePointer />
        <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.12s ease-out',
              // The dot stands in for the cursor over the slide box; the
              // letterbox margins around it keep a real one.
              cursor: 'none'
            }}
          >
            {render({
              slideIndex,
              stepIndex,
              slidesInfo,
              slides: threeSlides
            })}
          </div>
        </CitationProvider>
      </div>
    )
  }

  if (mode === 'embed') {
    if (!embedOptions?.render) {
      return <div>Specify embed render function</div>
    }
    return embedOptions.render({
      next,
      prev,
      slideIndex,
      slidesInfo,
      stepIndex,
      presentation: (
        <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
          {render({
            slideIndex,
            stepIndex,
            slidesInfo,
            slides: threeSlides
          })}
        </CitationProvider>
      )
    })
  }

  return (
    <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
      <div className='flex h-screen bg-gray-100 items-center pl-2'>
        {render({
          slideIndex,
          stepIndex,
          slidesInfo,
          slides: threeSlides
        })}
        <Tabs>
          <Tab label='Presenter notes'>
            {slidesInfo[slideIndex].presenterNotes ? (
              <div className='text-sm p-2'>
                {slidesInfo[slideIndex].presenterNotes}
              </div>
            ) : (
              <div className='text-gray-500 text-sm m-2 text-center'>
                no presenter notes
              </div>
            )}
          </Tab>
          <Tab label='Animation editor'>
            {slidesInfo[slideIndex].animations.length ? (
              <AnimationEditor animations={slidesInfo[slideIndex].animations} />
            ) : (
              <div className='text-gray-500 text-sm m-2 text-center'>
                no animations
              </div>
            )}
          </Tab>
        </Tabs>
      </div>
    </CitationProvider>
  )
}

function Tabs({ children }: { children: React.ReactNode }) {
  return (
    <div className='text-gray-800 w-full h-screen overflow-y-scroll ml-2'>
      {children}
    </div>
  )
}

function Tab({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  const [show, setShow] = useState(true)
  if (!children) return null
  return (
    <div className='w-full'>
      <div
        className='p-1 px-2 font-bold cursor-pointer sticky top-0 z-50'
        onClick={() => setShow((s) => !s)}
      >
        {label}
      </div>
      {show && <div>{children}</div>}
    </div>
  )
}

function Clock({
  wallClockLabel,
  elapsedLabel,
  isRunning,
  onToggle,
  onReset
}: {
  wallClockLabel: string
  elapsedLabel: string
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
}): React.ReactElement {
  return (
    <div className='flex items-center justify-center gap-3 p-2'>
      <div className='text-base text-gray-700'>{wallClockLabel}</div>
      <div className='font-mono text-xl font-semibold'>{elapsedLabel}</div>
      <button
        type='button'
        onClick={onToggle}
        className='px-2 py-1 text-sm rounded border border-gray-400 bg-white hover:bg-gray-50'
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>
      <button
        type='button'
        onClick={onReset}
        className='px-2 py-1 text-sm rounded border border-gray-400 bg-white hover:bg-gray-50'
      >
        Reset
      </button>
      <div className='text-xs text-gray-500'>Space: start/pause · Shift+Backspace: reset</div>
    </div>
  )
}

function PresentationOverview({
  children,
  render,
  bibUrl,
  preamble = '',
  compileHost
}: PresentationProps & RenderFunc): React.ReactElement {
  useIsomorphicLayoutEffect(() => {
    LaTeX.setPreamble(preamble)
    if (compileHost) {
      LaTeX.setHost(compileHost)
    }
  }, [preamble])

  const reactSlides = React.Children.toArray(children) as React.ReactElement[]

  const { slidesInfo, citationMap } = useMemo(
    () => getSlidesInfo(reactSlides),
    [children]
  )

  return (
    <div>
      <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
        {slidesInfo.flatMap((info, slideIndex) => {
          return info.steps.map((_step: any, stepIndex) => {
            return (
              <div key={`${slideIndex}-${stepIndex}`}>
                {render({
                  slidesInfo,
                  slideIndex,
                  stepIndex,
                  slides: [
                    <PresentationContext.Provider
                      key={slideIndex}
                      value={{
                        slidesInfo,
                        stepIndex,
                        slideIndex,
                        i: slideIndex,
                        setTransitions: () => null,
                        transition: {
                          before: {},
                          after: {}
                        }
                      }}
                    >
                      {reactSlides[slideIndex]}
                    </PresentationContext.Provider>
                  ]
                })}
              </div>
            )
          })
        })}
      </CitationProvider>
    </div>
  )
}

type SlideProps = {
  render: SlideRenderFunction
  steps?: any[]
  children: React.ReactNode | ((step: any) => React.ReactNode)
}

type SlideRenderFunction = (arg: {
  slidesInfo: SlidesInfo
  children: React.ReactNode
  slideIndex: number
  i: number
  style: React.CSSProperties
}) => React.ReactElement

const hasSteps = (node: any): node is (step: any) => React.ReactNode =>
  node.call

// Add timeline ={{ ... }} shorthand
export function RenderSlide({
  children,
  steps = [],
  render
}: SlideProps): React.ReactElement {
  const TIMING = 0.5
  const { stepIndex = 0, i = 0, slideIndex = 0, transition, slidesInfo = [] } =
    useContext(PresentationContext) || {}

  const [style, setStyle] = useState<React.CSSProperties>({
    transition: `${TIMING}s transform, ${TIMING}s opacity`,
    transform: 'scale(1) translate3d(0px, 0px, 0px)',
    opacity: 0
  })

  const updateStyle = (style: React.CSSProperties) =>
    setStyle((s) => ({ ...s, ...style }))

  // delay rendering
  // const [shouldRender, setRender] = useState(false)
  // useEffect(() => {
  //   setTimeout(() => setRender(true), 500)
  // }, [])

  useEffect(() => {
    const {
      after = {
        transform: `translate3d(-100%, 0px, 0px)`,
        opacity: 0,
        zIndex: 0
      },
      before = {
        transform: `translate3d(100%, 0px, 0px)`,
        opacity: 0,
        zIndex: 0
      }
    } = transition || {}

    if (i > slideIndex) {
      updateStyle({ ...before })
    }
    if (i < slideIndex) {
      updateStyle({ ...after })
    }
    if (i === slideIndex) {
      updateStyle({
        zIndex: 10,
        opacity: 1,
        transform: `scale(1) translate3d(0px,0px,0px)`
      })
    }
  }, [slideIndex, i, transition])

  // if (shouldRender) {
  const content =
    children && (hasSteps(children) ? children(steps[stepIndex]) : children)
  return render({ slidesInfo, children: content, i, slideIndex, style })
  // }
  // return render({info, content: <div />, i, slideIndex, style});
}

function Storage(): React.ReactElement {
  return (
    <pre
      style={{
        whiteSpace: 'break-spaces'
      }}
    >
      {localStorage.animationGroups}
    </pre>
  )
}

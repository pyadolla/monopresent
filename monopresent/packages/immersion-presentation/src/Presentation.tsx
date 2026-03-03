import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo
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
      const { slideIndex, stepIndex } = JSON.parse(data);
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
        <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
          <div className='flex justify-around'>
            <div className='flex flex-col'>
              <div>{slides[0]}</div>
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
        <CitationProvider citationMap={citationMap} bibUrl={bibUrl}>
          {render({
            slideIndex,
            stepIndex,
            slidesInfo,
            slides: threeSlides
          })}
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

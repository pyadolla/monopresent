import React, { useEffect, useRef } from 'react'

import memoize from 'memoizee'

import { animate } from './lib/morph'

import gsap from 'gsap'
import MorphSVGPlugin from './gsap/MorphSVGPlugin'
import DrawSVGPlugin from './gsap/DrawSVGPlugin'

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin)

/* global fetch */

const parseNum = (value?: string | null, fallback = 0): number => {
  const n = parseFloat(value || '')
  return isNaN(n) ? fallback : n
}

const centerLatexGroup = (group: SVGGElement): void => {
  const targetX = parseNum(group.dataset.targetX)
  const targetY = parseNum(group.dataset.targetY)
  const textAnchor = group.dataset.textAnchor || 'start'
  const dominantBaseline = group.dataset.dominantBaseline || 'alphabetic'
  const scale = parseNum(group.dataset.scale, 1)

  const bbox = group.getBBox()
  if (![bbox.x, bbox.y, bbox.width, bbox.height].every((n) => isFinite(n))) {
    return
  }

  const anchorX =
    textAnchor === 'middle'
      ? bbox.x + bbox.width / 2
      : textAnchor === 'end'
      ? bbox.x + bbox.width
      : bbox.x

  const anchorY =
    dominantBaseline === 'middle' || dominantBaseline === 'central'
      ? bbox.y + bbox.height / 2
      : bbox.y + bbox.height

  group.setAttribute(
    'transform',
    `translate(${targetX - scale * anchorX} ${targetY - scale * anchorY}) scale(${scale})`
  )
}

const replaceText = async (textEle: SVGGraphicsElement): Promise<void> => {
  const text = textEle.textContent
  if (!text) return
  const matrix = textEle.getScreenCTM()
  if (!matrix) return

  const isTspan = textEle.tagName.toLowerCase() === 'tspan'
  const parentText = isTspan ? textEle.parentElement : null

  const getAttr = (name: string): string | null =>
    textEle.getAttribute(name) || parentText?.getAttribute(name) || null

  const textAnchor = getAttr('text-anchor') || 'start'
  const dominantBaseline = getAttr('dominant-baseline') || 'alphabetic'
  const originalBbox = textEle.getBBox()
  const FONT_SCALING_FACTOR = 2.5
  const scale = FONT_SCALING_FACTOR * (1 / Math.abs(matrix.a || 1))

  const fallbackX =
    textAnchor === 'middle'
      ? originalBbox.x + originalBbox.width / 2
      : textAnchor === 'end'
      ? originalBbox.x + originalBbox.width
      : originalBbox.x
  const fallbackY =
    dominantBaseline === 'middle' || dominantBaseline === 'central'
      ? originalBbox.y + originalBbox.height / 2
      : originalBbox.y + originalBbox.height

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.id = textEle.id
  group.dataset.targetX = String(parseNum(getAttr('x'), fallbackX))
  group.dataset.targetY = String(parseNum(getAttr('y'), fallbackY))
  group.dataset.textAnchor = textAnchor
  group.dataset.dominantBaseline = dominantBaseline
  group.dataset.scale = String(scale)

  // Replace the <text> with a group that we can center based on rendered path bounds.
  textEle.parentNode!.replaceChild(group, textEle)

  await animate(group, text, true, 0)
  centerLatexGroup(group)
}

const TIMING = 0.1

// make awaitable?
function update(
  wrapper: HTMLDivElement,
  step: any,
  replaceImediately: boolean
) {
  for (const key in step) {
    if (step[key] === null || step[key] === undefined) {
      continue
    }
    if (key.startsWith('text:')) {
      const id = key.replace(/^text:/, '')
      const textGroup = wrapper.querySelector(`#${id}`) as SVGGElement
      if (textGroup) {
        if (replaceImediately) {
          // remove the placeholder of the text
          textGroup.innerHTML = ''
        }
        // TODO: use that animation groups database!
        animate(
          textGroup,
          step[key] || '',
          replaceImediately,
          0.3,
          () => undefined,
          () => centerLatexGroup(textGroup)
        ).then(() => centerLatexGroup(textGroup))
      }
    } else {
      const ele = wrapper.querySelector(`#${key}`) as SVGElement
      const { css = {}, ...rest } = step[key]
      if (ele) {
        for (const key in css) {
          ele.style[key as any] = (css as { [index: string]: any })[key]
        }

        if (replaceImediately) {
          gsap.set(ele, { ...rest })
        } else {
          console.log('timing is ', rest.seconds, TIMING)
          gsap.to(ele, {
            duration: rest.seconds || TIMING,
            ...rest
          })
        }
      }
    }
  }
}

// Cache the images
// const memoizedFetch = memoize(
//   (src: string): Promise<string> => fetch(src).then((r) => r.text())
// )
const memoizedFetch = (src: string): Promise<string> => fetch(src).then((r) => r.text())

export type AnimateSVGStep = {
  css?: React.CSSProperties
  [key: string]: any
}

type AnimateSVGProps = {
  src: string
  step: AnimateSVGStep
  width: string | number
  height: string | number
  style: React.CSSProperties
  className: string
}

function AnimateSVG({
  src,
  step = {},
  width = '100%',
  height = 'auto',
  style = {},
  className = ''
}: AnimateSVGProps): React.ReactElement {
  const element = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    ; (async () => {
      // Load the svg
      const text = await memoizedFetch(src.startsWith('/') ? src : '/' + src)
      const div = element.current
      if (!div) return

      // (1)
      div.innerHTML = text
      div.querySelector('svg')!.style.opacity = '0'
      div.querySelector('svg')!.style.width = width as string
      div.querySelector('svg')!.style.height = height as string

      // Replace text
      await Promise.all(
        Array.from(div.querySelectorAll('text')).map(async (textEle) => {
          if (
            textEle.matches('.dont-replace *') ||
            textEle.matches('.ignore-latex *')
          ) {
            return
          }

          // Replace the whole <text> node (including tspans) as one label, so
          // positioning uses parent text anchors and does not drift vertically.
          await replaceText(textEle as SVGGraphicsElement)
        })
      )

      // Set the correct opacity, ... of the elements
      if (element.current) {
        update(element.current, step, true)
      }

      // Fade in the picture
      div.querySelector('svg')!.style.transition = '0.3s opacity'
      div.querySelector('svg')!.style.opacity = '1'
    })()
  }, [element.current])

  // When the step changes, animate the new opacities
  useEffect(() => {
    if (!element.current) return

    update(element.current, step, false)
  }, [step, element])

  return <div style={style} className={className} ref={element} />
}

export default AnimateSVG

'use client'

import { useEffect, useRef } from 'react'

/** Animate the existing section so navigation never remounts its form controls. */
export function useSectionMotion(sectionKey: string, position: number) {
  const ref = useRef<HTMLElement>(null)
  const previousPosition = useRef(position)

  useEffect(() => {
    const element = ref.current
    const direction = position < previousPosition.current ? -1 : 1
    previousPosition.current = position
    if (!element || typeof element.animate !== 'function') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px)').matches
    let animation: Animation | undefined
    if (!reducedMotion.matches) {
      const angle = (compact ? 1.5 : 3) * direction
      animation = element.animate([
        { transform: `perspective(1400px) translate3d(${direction * 10}px, 8px, -12px) rotateY(${angle}deg)`, opacity: 0.78 },
        { transform: 'perspective(1400px) translate3d(0, 0, 0) rotateY(0deg)', opacity: 1 },
      ], { duration: compact ? 320 : 440, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    }
    const stopForReducedMotion = () => { if (reducedMotion.matches) animation?.cancel() }
    reducedMotion.addEventListener('change', stopForReducedMotion)
    return () => {
      reducedMotion.removeEventListener('change', stopForReducedMotion)
      animation?.cancel()
    }
  }, [sectionKey, position])

  return ref
}
